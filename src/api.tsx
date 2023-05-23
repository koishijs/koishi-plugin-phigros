import type { SongRecord, LevelRecord, SongInfo } from './types'
import { createDecipheriv } from 'crypto'
import { fromBuffer, Entry } from 'yauzl'
import type { Quester, Context } from 'koishi'

const levels = {
  EZ: 1 << 0,
  HD: 1 << 1,
  IN: 1 << 2,
  AT: 1 << 3,
}

const iName = /[ .,&/?|\\~`<>:;'"\[\]{}+=*@#$%^&()-]/g
const iArtist = /[ .,&/?|\\~`<>:;'"\[\]{}+=*@#$%^&()]/g

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

  async record(token: string) {
    const save = await this.http.get('https://phigrosserver.pigeongames.cn/1.1/classes/_GameSave', {
      headers: {
        Accept: 'application/json',
        'X-LC-Session': token
      },
    })

    const buf = await this.http.get<Uint8Array>(save.results[0].gameFile.url, {
      responseType: 'arraybuffer'
    })

    return Array.from(parse(await decrypt(buf)))
  }

  async nickname(token: string) {
    const { nickname } = await this.http.get('https://phigrosserver.pigeongames.cn/1.1/users/me', {
      headers: {
        Accept: 'application/json',
        'X-LC-Session': token
      },
    })

    return nickname
  }

  async songsInfo(): Promise<Omit<SongInfo, 'id'>[]> {
    const data = await this.http.get('https://ghproxy.com/https://raw.githubusercontent.com/ssmzhn/Phigros/main/Phigros.json')

    return Object.values<any>(data).map((song) => {
      Object.values<any>(song.chart).forEach((value) => {
        value.level = +value.level
        value.difficulty = +value.difficulty
        value.combo = +value.combo
      })

      return {
        name: song.song,
        artist: song.composer,
        chart: song.chart,
        illustration: song.illustration_big,
        thumbnail: song.illustration,
        illustrator: song.illustrator,
      }
    })
  }
}

export function* parse(buf: Buffer): Generator<[string, SongRecord]> {
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

export function rankingImage(level: LevelRecord) {
  const { score, fullCombo } = level
  if (score === 1000000) return 'https://i0.hdslb.com/bfs/article/518c7cf11cb9a7e74d7618d393160405bc478ca8.png'
  if (fullCombo) return 'https://i0.hdslb.com/bfs/article/f7fa4f64cca7c06ffb117f2ef1d1fec7238dd507.png'
  if (score >= 960000) return 'https://i0.hdslb.com/bfs/article/834eb1335ec5ecd45f067f14f5684d3f87dc2b52.png'
  if (score >= 920000) return 'https://i0.hdslb.com/bfs/article/23a1d94b01bff6a3b5dacb6c9d7f53d304ddf53c.png'
  if (score >= 880000) return 'https://i0.hdslb.com/bfs/article/fe7ad7bc5b8c9c551cdf169a456c564567322c68.png'
  if (score >= 820000) return 'https://i0.hdslb.com/bfs/article/b4ad6f705581a3bf1100d1f3b2537df8027430d2.png'
  if (score >= 700000) return 'https://i0.hdslb.com/bfs/article/bcc641799180ac1172abe6155ba7e9605ecbbf06.png'
  return 'https://i0.hdslb.com/bfs/article/4cb5fe98c9d036bf07931e4645931526d3cbcc93.png'
}

export function getSongInternalName(name: string, artist: string) {
  return `${name.replace(iName, '')}.${artist.replace(iArtist, '')}`
}

export function renderScore(record: SongRecord, info: SongInfo) {
  return <html>
    <header>
      <link href="https://fonts.cdnfonts.com/css/saira" rel="stylesheet" />
    </header>
    <main>
      <div id="column" class="parallelogram-column">
        <div class="no-unskew">
          <div id="cover"></div>
          <span id="name">Rrhar'il</span>
          <span id="artist">Team Grimoire</span>
        </div>
        <div id="level-container" class="no-unskew">
          {Object.entries(record).map(([level, record]) => {
            return <div class="level no-unskew">
              <div class="difficulty no-unskew">
                <div class={level + ' no-unskew'}>
                  <div>{level}</div>
                  <div class="diff">{info.chart[level].level}</div>
                </div>
              </div>
              <div class="score">{record.score}</div>
              <div class="acc">{record.accuracy.toFixed(2)}%</div>
              <img src={rankingImage(record)} />
            </div>
          })}
        </div>
      </div>
    </main>

    <style>{String.raw`
    :root {
      --shadow: 0 0 10px #666
    }

    body {
      width: 1200px; !important
    }

    main {
      width: 1200px;
      margin: 0;
      background-color: black;
      display: flex;
      justify-content: center;
      backdrop-filter: blur(20px);
      background-image: url('${info.thumbnail}');
      background-repeat: no-repeat;
      background-size: cover;
      font-family: 'Saira', sans-serif;
    }

    main::before{
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      backdrop-filter: blur(10px);
    }

    .parallelogram-column {
      transform: skew(-20deg);
      overflow: visible;
    }

    .parallelogram-column>*:not(.no-unskew) {
      transform: skew(20deg);
    }

    .no-unskew>*:not(.no-unskew) {
      transform: skew(20deg);
    }

    .level {
      margin: 10px 10px;
      background-color: #00000066;
      width: 396px;
      height: 50px;
      overflow: visible;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: var(--shadow);
    }

    .level>img {
      height: 100px;
    }

    .difficulty {
      margin-left: 10px;
      height: 60px;
      width: 70px;
      background-color: #FFF;
      display: flex;
      align-items: center;
    }

    .difficulty>* {
      box-shadow: var(--shadow);
      margin-left: 5px;
      height: 56px;
      width: 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      color: white;
      padding-top: 8px;
      line-height: 20px;
    }

    .diff {
      font-size: 30px;
    }

    .score {
      margin: 0 10px 0 20px;
      font-size: 30px;
      color: #FFF;
    }

    .acc {
      position: relative;
      top: 10px;
      font-size: 10px;
      color: #FFF;
    }

    .EZ {
      background-color: #51af44;
    }

    .HD {
      background-color: #3173b3;
    }

    .IN {
      background-color: #be2d23;
    }

    .AT {
      background-color: #383838;
    }

    .SP {
      background-color: #2c3e50;
    }

    #level-container {
      width: 1000px;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
    }

    #column {
      padding: 100px 0;
      position: relative;
      z-index: 1;
    }

    #cover {
      position: relative;
      width: 1000px;
      clip-path: polygon(18.8% 0, 100% 0, calc(100% - 18.8%) 100%, 0 100%);
      height: 527px;
      background-blend-mode: color;
      background-size: cover;
      background: url('${info.illustration}'), linear-gradient(transparent 80%, #000a);
      background-size: cover;
    }

    #name {
      position: absolute;
      top: 570px;
      left: 115px;
      font-size: 30px;
      color: #FFFFFFDD;
    }

    #artist {
      position: absolute;
      top: 580px;
      right: 120px;
      font-size: 25px;
      color: #FFFFFFDD;
    }
    `}</style>
  </html>
}
