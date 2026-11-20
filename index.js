import childProcess from 'node:child_process'

const SOUNDS = {
  completed: '/System/Library/Sounds/Glass.aiff',
  attention: '/System/Library/Sounds/Ping.aiff',
}
const ATTENTION_DELAY_MS = 250

export function apply(ctx) {
  if (process.platform !== 'darwin' || !process.versions.electron) return

  const timers = new Set()
  const players = new Map()
  let warned = false

  function play(kind) {
    if (players.has(kind)) return
    const player = childProcess.execFile('/usr/bin/afplay', [SOUNDS[kind]], { timeout: 5000 }, (error) => {
      players.delete(kind)
      if (error && !error.killed && !warned) {
        warned = true
        console.warn('[dsh-session-sounds] Could not play a macOS alert:', error.message)
      }
    })
    players.set(kind, player)
  }

  async function onAttention(request, next) {
    // Automatically resolved or unroutable requests usually settle before this fires.
    const timer = setTimeout(() => {
      timers.delete(timer)
      if (!request.signal?.aborted) play('attention')
    }, ATTENTION_DELAY_MS)
    timers.add(timer)
    try {
      return await next()
    } finally {
      clearTimeout(timer)
      timers.delete(timer)
    }
  }

  ctx.effect(() => () => {
    for (const timer of timers) clearTimeout(timer)
    timers.clear()
    for (const player of players.values()) player.kill()
    players.clear()
  }, 'session sounds: native playback')

  ctx.on('session/event', (session, event) => {
    if (event.type === 'turn/end' && event.data.reason.kind === 'completed'
      && session.header.origin !== 'subagent') {
      play('completed')
    }
  }, { global: true })

  ctx.on('user-questions/request', onAttention, { global: true, prepend: true })
  ctx.on('approval/request', onAttention, { global: true, prepend: true })
}
