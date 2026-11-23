import assert from 'node:assert/strict'
import childProcess from 'node:child_process'
import { test } from 'node:test'
import { apply } from '../index.js'

const root = { header: {} }
const child = { header: { origin: 'subagent' } }
const rootTurn = { type: 'turn/end', data: { reason: { kind: 'completed' } } }
const questions = 'user-questions/request'
const approval = 'approval/request'

function activate(t, { platform = 'darwin', electron = '44.7.0' } = {}) {
  const originals = [
    [process, 'platform', Object.getOwnPropertyDescriptor(process, 'platform')],
    [process.versions, 'electron', Object.getOwnPropertyDescriptor(process.versions, 'electron')],
  ]
  Object.defineProperty(process, 'platform', { value: platform })
  Object.defineProperty(process.versions, 'electron', { value: electron || undefined, configurable: true })
  t.after(() => {
    for (const [object, key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(object, key, descriptor)
      else delete object[key]
    }
  })
  const played = []
  t.mock.method(childProcess, 'execFile', (file, args, { timeout }, done) => {
    assert.equal(file, '/usr/bin/afplay')
    assert.equal(timeout, 5000)
    const player = { sound: args[0], done, kill: t.mock.fn() }
    played.push(player)
    return player
  })
  const listeners = new Map()
  const cleanups = []
  apply({
    effect(setup) { cleanups.push(setup()) },
    on(event, handler, options) {
      assert.equal(options.global, true)
      if (event !== 'session/event') assert.equal(options.prepend, true)
      listeners.set(event, handler)
    },
  })
  return { listeners, played, dispose: () => cleanups.forEach(cleanup => cleanup()) }
}

test('only activates on macOS Electron', t => {
  assert.equal(activate(t, { platform: 'win32' }).listeners.size, 0)
})

test('ordinary macOS Node stays silent', t => {
  assert.equal(activate(t, { electron: '' }).listeners.size, 0)
})

test('plays Glass on top-level completion and coalesces concurrent playback', t => {
  const { listeners, played } = activate(t)
  const emit = listeners.get('session/event')
  emit(child, rootTurn)
  emit(root, { type: 'assistant/message' })
  for (const kind of ['aborted', 'error', 'interrupted', 'forked', 'max-tokens']) {
    emit(root, { type: 'turn/end', data: { reason: { kind } } })
  }
  assert.equal(played.length, 0)
  emit(root, rootTurn)
  emit(root, rootTurn)
  assert.deepEqual(played.map(player => player.sound), ['/System/Library/Sounds/Glass.aiff'])
  played[0].done(null)
  emit(root, rootTurn)
  assert.equal(played.length, 2)
})

test('plays Ping for pending questions and approvals and forwards their results', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const { listeners, played } = activate(t)
  for (const event of [questions, approval]) {
    const response = Promise.withResolvers()
    const result = listeners.get(event)({}, () => response.promise)
    const previousCount = played.length
    t.mock.timers.tick(249)
    assert.equal(played.length, previousCount)
    t.mock.timers.tick(1)
    assert.equal(played.length, previousCount + 1)
    assert.equal(played.at(-1).sound, '/System/Library/Sounds/Ping.aiff')
    played.at(-1).done(null)
    const reply = { result: event }
    response.resolve(reply)
    assert.equal(await result, reply)
  }
})

test('quickly settled and aborted requests stay silent, and unload cancels pending audio', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const { listeners, played, dispose } = activate(t)
  const ask = listeners.get(questions)
  assert.equal(await ask({}, async () => 'settled'), 'settled')
  const error = new Error('no answerer')
  await assert.rejects(ask({}, async () => { throw error }), { message: error.message })
  const response = Promise.withResolvers()
  const controller = new AbortController()
  const cancelled = ask({ signal: controller.signal }, () => response.promise)
  controller.abort()
  t.mock.timers.tick(250)
  assert.equal(played.length, 0)

  const pending = ask({}, () => response.promise)
  listeners.get('session/event')(root, rootTurn)
  dispose()
  t.mock.timers.tick(250)
  assert.equal(played.length, 1)
  assert.equal(played[0].kill.mock.callCount(), 1)
  response.resolve('finished')
  assert.deepEqual(await Promise.all([pending, cancelled]), ['finished', 'finished'])
})
