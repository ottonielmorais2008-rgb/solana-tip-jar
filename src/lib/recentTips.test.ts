import { describe, expect, it } from 'vitest'
import { extractIncomingTips } from './recentTips.ts'

const recipient = 'Recipient1111111111111111111111111111111111'
const sender = 'Sender11111111111111111111111111111111111111'

function transfer(source: string, destination: string, lamports: number | string) {
  return {
    program: 'system',
    parsed: { type: 'transfer', info: { source, destination, lamports } },
  }
}

describe('extractIncomingTips', () => {
  it('keeps incoming transfers, memos, and newest-first order', () => {
    const tips = extractIncomingTips(recipient, [
      {
        blockTime: 10,
        transaction: {
          signatures: ['older'],
          message: { instructions: [transfer(sender, recipient, '25000000')] },
        },
        meta: { err: null },
      },
      null,
      {
        blockTime: 20,
        transaction: {
          signatures: ['newer'],
          message: {
            instructions: [
              transfer(sender, recipient, 1000),
              { program: 'spl-memo', parsed: 'thanks' },
              transfer('Other11111111111111111111111111111111111111', recipient, 5),
            ],
          },
        },
        meta: {
          err: null,
          innerInstructions: [{ instructions: [{ program: 'spl-memo', parsed: { info: { memo: 'inner' } } }] }],
        },
      },
    ])

    expect(tips.map((tip) => tip.signature)).toEqual(['newer', 'older'])
    expect(tips[0]).toMatchObject({
      lamports: 1005,
      from: sender,
      memo: 'thanks',
      blockTime: 20,
    })
  })

  it('ignores failed, outgoing, and unrelated transactions', () => {
    const tips = extractIncomingTips(recipient, [
      {
        blockTime: 1,
        transaction: {
          signatures: ['failed'],
          message: { instructions: [transfer(sender, recipient, 10)] },
        },
        meta: { err: { InstructionError: [0, 'Custom'] } },
      },
      {
        blockTime: 2,
        transaction: {
          signatures: ['outgoing'],
          message: { instructions: [transfer(recipient, sender, 10), { program: 'spl-memo', parsed: 'nope' }] },
        },
        meta: { err: null },
      },
      {
        transaction: { signatures: [''], message: { instructions: [] } },
        meta: { err: null },
      },
    ])
    expect(tips).toEqual([])
  })

  it('reads a string memo stored on parsed.info', () => {
    const tips = extractIncomingTips(recipient, [
      {
        blockTime: null,
        transaction: {
          signatures: ['memo-info'],
          message: {
            instructions: [transfer(sender, recipient, 2), { program: 'spl-memo', parsed: { info: '  cheers  ' } }],
          },
        },
        meta: null,
      },
    ])
    expect(tips).toEqual([
      {
        signature: 'memo-info',
        lamports: 2,
        from: sender,
        memo: 'cheers',
        blockTime: null,
      },
    ])
  })
})
