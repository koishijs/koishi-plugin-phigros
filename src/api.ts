import type { SongRecord, LevelRecord, SongInfo, RKSInfo, Save, SaveSummary } from './types'
import { createDecipheriv } from 'crypto'
import { fromBuffer, Entry } from 'yauzl'
import type { Quester, Context } from 'koishi'

const levels = {
  EZ: 1 << 0,
  HD: 1 << 1,
  IN: 1 << 2,
  AT: 1 << 3,
}

const challengeModeRank = [null, 'green', 'blue', 'red', 'gold', 'rainbow'] as const

// Invalid character pattern
const icp = /[^a-zA-Z0-9\u2E80-\u2FDF\u3040-\u318F\u31A0-\u31BF\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FFF\uA960-\uA97F\uAC00-\uD7FF]/ug

const key = Uint8Array.from([-24, -106, -102, -46, -91, 64, 37, -101, -105, -111, -112, -117, -120, -26, -65, 3, 30, 109, 33, -107, 110, -6, -42, -118, 80, -35, 85, -42, 122, -80, -110, 75])
const iv = Uint8Array.from([42, 79, -16, -118, -56, 13, 99, 7, 0, 87, -59, -107, 24, -56, 50, 83])

export const tokenPattern = /[a-z0-9]{25}/
export class API {
  http: Quester
  constructor(ctx: Context) {
    this.http = ctx.http.extend({
      headers: {
        'X-LC-Id': 'rAK3FfdieFob2Nn8Am',
        'X-LC-Key': 'Qr9AEqtuoSVS3zeD6iVbM4ZC0AtkJcQ89tywVyi0',
        'User-Agent': 'LeanCloud-CSharp-SDK/1.0.3',
      }
    })
  }

  save(token: string): Promise<Save> {
    return this.http.get('https://rak3ffdi.cloud.tds1.tapapis.cn/1.1/classes/_GameSave', {
      headers: {
        Accept: 'application/json',
        'X-LC-Session': token
      },
    })
  }

  async summary(token: string): Promise<SaveSummary> {
    const save = await this.save(token)

    let pos = 0
    const buf = Buffer.from(save.results[0].summary, 'base64')

    const saveVersion = buf.readUInt8(pos)
    const challengeMode = buf.readInt16LE(pos += 1)
    const challengeModeScore = challengeMode % 100
    const rks = buf.readFloatLE(pos += 2)
    const gameVersion = buf.readUint8(pos += 4)
    const avatarLength = buf.readUInt8(pos += 1)
    const avatar = buf.subarray(pos += 1, pos += avatarLength).toString('utf-8')

    return {
      gameVersion,
      saveVersion,
      avatar,
      rks,
      challengeMode: {
        rank: challengeModeRank[(challengeMode - challengeModeScore) / 100],
        level: challengeModeScore,
      },
      record: {
        EZ: {
          cleared: buf.readInt16LE(pos),
          fullCombo: buf.readInt16LE(pos += 2),
          allPerfect: buf.readInt16LE(pos += 2),
        },
        HD: {
          cleared: buf.readInt16LE(pos += 2),
          fullCombo: buf.readInt16LE(pos += 2),
          allPerfect: buf.readInt16LE(pos += 2),
        },
        IN: {
          cleared: buf.readInt16LE(pos += 2),
          fullCombo: buf.readInt16LE(pos += 2),
          allPerfect: buf.readInt16LE(pos += 2),
        },
        AT: {
          cleared: buf.readInt16LE(pos += 2),
          fullCombo: buf.readInt16LE(pos += 2),
          allPerfect: buf.readInt16LE(pos += 2),
        },
      },
    }

  }

  async record(token: string) {
    const save = await this.save(token)

    const buf = await this.http.get<Uint8Array>(save.results[0].gameFile.url, {
      responseType: 'arraybuffer'
    })

    return Array.from(parse(await decrypt(buf)))
  }

  async nickname(token: string) {
    const { nickname } = await this.http.get('https://rak3ffdi.cloud.tds1.tapapis.cn/1.1/users/me', {
      headers: {
        Accept: 'application/json',
        'X-LC-Session': token
      },
    })

    return nickname
  }

  songsInfo(): Promise<SongInfo[]> {
    return this.http.get('https://ghproxy.com/https://raw.githubusercontent.com/koishijs/koishi-plugin-phigros/main/data/songs.json')
  }
}

export function* parse(buf: Buffer): Generator<[string, SongRecord]> {
  let pos = +(buf.readUint8(0) << 24 >> 24 < 0) + 1
  while (pos < buf.length) {
    const nameLength = buf.readUint8(pos)
    const name = buf.subarray(++pos, pos + nameLength - 2).toString('utf-8')
    pos += nameLength

    const scoreLength = buf.readUint8(pos)
    const score = buf.subarray(++pos, pos + scoreLength)
    pos += scoreLength

    const hasScore = score.readUint8(0)
    const fullCombo = score.readUint8(1)
    let scorePos = 2

    const record: SongRecord = []

    for (const [name, digit] of Object.entries(levels)) {
      if ((hasScore & digit) === digit) {
        record.push([name, {
          score: score.readInt32LE(scorePos),
          accuracy: score.readFloatLE(scorePos += 4),
          fullCombo: (fullCombo & digit) === digit,
        }])
        scorePos += 4
      }
    }

    yield [name, record]
  }
}

export function decrypt(save: ArrayBuffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    fromBuffer(Buffer.from(save), (e, zip) => {
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

export function getSongInternalName(name: string, artist: string) {
  return `${name.replace(icp, '').replace('-', '')}.${artist.replace(icp, '')}`
}

export function songRKS(record: SongRecord, song: SongInfo): RKSInfo[] {
  return record.map(([level, record]) => {
    let rks: number
    if (record.accuracy < 70) rks = 0
    else rks = Math.pow((record.accuracy - 55) / 45, 2) * song.chart[level].difficulty
    return { level, record, song, rks }
  })
}

export function best(record: [SongRecord, SongInfo][], n?: number) {
  const rks = record
    .map((r) => songRKS(r[0], r[1]))
    .flat()
    .sort((a, b) => b.rks - a.rks)

  return n ? rks.slice(0, n) : rks
}

export function rks(record: [SongRecord, SongInfo][]): {
  bestPhi: RKSInfo,
  b19: RKSInfo[],
  rks: number,
} {
  const rks = best(record)
  const bestPhi = rks
    .filter(r => r.record.accuracy === 100)
    .reduce((p, c) => p.rks <= c.rks ? c : p)

  const b19 = rks.slice(0, 19)
  const temp = [bestPhi, ...b19]
  const total = temp.reduce((p, c) => p + c.rks, 0) / temp.length

  return { b19, bestPhi, rks: total }
}
