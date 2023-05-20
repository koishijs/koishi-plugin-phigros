import { Context, Schema, h } from 'koishi'
import { parseSave, levelsMap, ranking } from './api'

declare module 'koishi' {
  interface User {
    phiToken: string
  }
}

export interface Config { }

export const name = 'phigros'
export const using = ['database']
export const Config: Schema<Config> = Schema.object({})

const tokenPattern = /[a-z0-9]{25}/

export function apply(ctx: Context) {
  const http = ctx.http.extend({
    headers: {
      'X-LC-Id': 'rAK3FfdieFob2Nn8Am',
      'X-LC-Key': 'Qr9AEqtuoSVS3zeD6iVbM4ZC0AtkJcQ89tywVyi0',
      'User-Agent': 'LeanCloud-CSharp-SDK/1.0.3',
    }
  })

  ctx.i18n.define('zh', require('./locales/zh-CN'))

  ctx.database.extend('user', {
    phiToken: {
      type: 'char',
      length: 25,
    }
  })

  ctx.command('phigros.unbind')
    .shortcut('unbind', { i18n: true })
    .userFields(['phiToken'])
    .action(({ session }) => {
      session.user.phiToken = undefined
      return session.text('.success')
    })

    ctx.command('phigros.bind <token:string>', { checkArgCount: true })
    .shortcut('bind', { i18n: true, fuzzy: true })
    .userFields(['phiToken'])
    .action(({ session }, token) => {
      if (!tokenPattern.exec(token)) return session.text('.invalid')
      session.user.phiToken = token
      session.prompt()
      return session.text('.success')
    })

  ctx.command('phigros.score <name:text>', { checkArgCount: true })
    .shortcut('score', { i18n: true, fuzzy: true })
    .userFields(['phiToken'])
    .action(async ({ session }, name) => {
      if (!session.user.phiToken) return session.text('.no-token')
      const save = await http.get('https://phigrosserver.pigeongames.cn/1.1/classes/_GameSave', {
        headers: {
          Accept: 'application/json',
          'X-LC-Session': session.user.phiToken
        },
      })

      const pattern = new RegExp(name.replace(/[ .]/g, ''), 'iu')
      const buf = await http.get<Uint8Array>(save.results[0].gameFile.url, {
        responseType: 'arraybuffer'
      })
      const records = await parseSave(buf)

      const song = Object.keys(records).find(v => pattern.exec(v))
      const record = records[song]

      if (!record) return session.text('.no-record')

      return [
        h.text(song),
        ...Object.entries(record).map(([name, level]) => {
          return h('p', session.text('.level-score', [
            levelsMap[name],
            ranking(level),
            level.score,
            level.accuracy.toFixed(2)
          ]))
        })
      ]
    })
}
