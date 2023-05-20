import type { SongRecord, LevelRecord } from './types'
import { createDecipheriv } from 'crypto'
import { fromBuffer, Entry } from 'yauzl'

const levels = {
  easy: 1 << 0,
  hard: 1 << 1,
  insane: 1 << 2,
  another: 1 << 3,
}

const key = Uint8Array.from([-24, -106, -102, -46, -91, 64, 37, -101, -105, -111, -112, -117, -120, -26, -65, 3, 30, 109, 33, -107, 110, -6, -42, -118, 80, -35, 85, -42, 122, -80, -110, 75])
const iv = Uint8Array.from([42, 79, -16, -118, -56, 13, 99, 7, 0, 87, -59, -107, 24, -56, 50, 83])

export const levelsMap = {
  esay: 'EZ',
  hard: 'HD',
  insane: 'IN',
  another: 'AT',
}

export function ranking(level: LevelRecord) {
  const { score, fullCombo } = level
  if (score === 1000000) return 'φ'
  if (fullCombo) return '蓝V'
  if (score >= 960000) return 'V'
  if (score >= 920000) return 'S'
  if (score >= 880000) return 'A'
  if (score >= 820000) return 'B'
  if (score >= 700000) return 'C'
  return 'F'
}

export function* parseRecord(buf: Buffer): Generator<[string, SongRecord]> {
  let pos = +(buf.at(0) << 24 >> 24 < 0) + 1
  while (pos < buf.length) {
    const nameLength = buf.at(pos)
    const name = buf.subarray(++pos, pos + nameLength - 2).toString('utf-8')
    pos += nameLength

    const scoreLength = buf.at(pos)
    const score = buf.subarray(++pos, pos + scoreLength)
    pos += scoreLength

    const hasScore = score.at(0)
    const fullCombo = score.at(1)
    let scorePos = 2

    const record: SongRecord = {}

    for (const [name, digit] of Object.entries(levels)) {
      if ((hasScore & digit) === digit) {
        record[name] = {
          score: score.readInt32LE(scorePos),
          accuracy: score.readFloatLE(scorePos += 4),
          fullCombo: (fullCombo & digit) === digit,
        }
        scorePos += 4
      }
    }

    yield [name, record]
  }
}

export function decryptSave(save: ArrayBuffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    fromBuffer(Buffer.from(save), {}, (e, zip) => {
      if (e) return reject(e)

      zip.on('error', reject)
      zip.on('entry', (entry: Entry) => {
        if (entry.fileName === 'gameRecord') {
          zip.openReadStream(entry, (e, stream) => {
            if (e) return reject(e)

            const bufs = []
            stream.on('data', chunk => bufs.push(chunk))
            stream.on('end', () => {
              const buf = Buffer.concat(bufs)
              const cipher = createDecipheriv('aes-256-cbc', key, iv)
              resolve(Buffer.concat([cipher.update(buf.subarray(1, buf.length)), cipher.final()]))
              zip.close()
            })
            stream.on('error', reject)

          })
        }
      })
    })
  })
}

export async function parseSave(save: ArrayBuffer): Promise<Record<string, SongRecord>> {
  return Object.fromEntries(parseRecord(await decryptSave(save)))
}
