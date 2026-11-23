import childProcess from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-session'
import type { ApprovalRequestEvent } from '@deepseek-ai/dsh-user-approval/types'
import type { AskUserQuestionRequestEvent } from '@deepseek-ai/dsh-user-questions/types'

const SOUNDS = {
  completed: '/System/Library/Sounds/Glass.aiff',
  attention: '/System/Library/Sounds/Ping.aiff',
}
const ATTENTION_DELAY_MS = 250

export function apply(ctx: Context): void {
  if (process.platform !== 'darwin' || !process.versions.electron) return

  const timers = new Set<ReturnType<typeof setTimeout>>()
  const players = new Map<keyof typeof SOUNDS, ChildProcess>()
  let warned = false

  function play(kind: keyof typeof SOUNDS) {
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

  async function onAttention<T>(
    request: ApprovalRequestEvent | AskUserQuestionRequestEvent,
    next: () => Promise<T>,
  ): Promise<T> {
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
