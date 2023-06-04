import { Context, Schema, Session, SessionError, deduplicate, h } from 'koishi'
import { API, tokenPattern, rks } from './api'
import { SongInfo } from './types'
import { renderB19, renderScore } from './renderer'

declare module 'koishi' {
  interface User {
    phiToken: string
  }

  interface Tables {
    phigros_alias_v3: {
      id: number
      alias: string
      songId: string
    }
  }
}

export interface Config {
  shortcut: boolean
}

export const name = 'phigros'
export const using = ['database', 'puppeteer']
export const Config: Schema<Config> = Schema.object({
  shortcut: Schema.boolean().default(true).description('是否允许通过 shortcut 触发指令')
})

export function apply(ctx: Context, config: Config) {
  const api = new API(ctx)
  const querySong = async (alias: string, session: Session): Promise<SongInfo> => {
    const matchs = await ctx.database.get('phigros_alias_v3', { alias: { $regex: alias.toLowerCase() } })
      .then(a => deduplicate(a.map(a => a.songId)))
    const songs = await api.songsInfo()
      .then(i => i.filter(s => matchs.includes(s.id)))

    if (!songs?.length) throw new SessionError('.no-song')
    if (songs.length === 1) return songs[0]
    else {
      await session.send(
        h('message', { forward: true }, [
          h('message', [h.i18n('.select-song-prompt')]),
          ...songs.map((s, i) => h('message', [`${i + 1}. ${s.name} 「${s.artist}」`])),
        ]))
      const index = +await session.prompt()
      if (!index) throw new SessionError('.cancel')
      return songs[index - 1]
    }

  }

  const setAilas = async (alias: string, songId: string) => {
    const query = { alias: alias.toLowerCase(), songId }
    const [exist] = await ctx.database.get('phigros_alias_v3', query)
    if (!exist) await ctx.database.create('phigros_alias_v3', query)
  }

  ctx.i18n.define('zh', require('./locales/zh-CN'))

  ctx.database.extend('user', {
    phiToken: {
      type: 'char',
      length: 25,
    }
  })

  ctx.database.extend('phigros_alias_v3', {
    id: 'unsigned',
    alias: 'string',
    songId: {
      nullable: false,
      type: 'string',
    },
  })

  ctx.on('ready', async () => {
    const songsInfo = await api.songsInfo()
    await Promise.all(songsInfo.map(i =>
      Promise.all([
        setAilas(i.name.toLowerCase(), i.id),
        setAilas(i.artist.toLowerCase(), i.id),
      ])
    ))
  })

  const unbind = ctx.command('phigros.unbind')
    .userFields(['phiToken'])
    .action(({ session }) => {
      if (!session.user.phiToken) return session.text('.no-token')
      session.user.phiToken = undefined
      return session.text('.success')
    })

  const bind = ctx.command('phigros.bind <token:string>', { checkArgCount: true })
    .userFields(['phiToken'])
    .action(({ session }, token) => {
      if (!tokenPattern.exec(token)) return session.text('.invalid')
      session.user.phiToken = token
      return session.text('.success')
    })

  const alias = ctx.command('phigros.alias <name:text>', { checkArgCount: true })
    .action(async ({ session }, name) => {
      const song = await querySong(name, session)

      await session.send(session.text('.alias-prompt'))
      const alias = await session.prompt()
      if (!alias) return session.text('.cancel')
      await setAilas(alias, song.id)

      return session.text('.success', [song.name, alias])
    })

  const listAlias = ctx.command('phigros.list-alias <name:text>')
    .action(async ({ session }, name) => {
      const song = await querySong(name, session)
      const alias = await ctx.database.get('phigros_alias_v3', { songId: song.id })
      return h('', [
        h.i18n('.alias', [song.name]),
        ...alias.map(a => h('p', [a.alias]))
      ])
    })

  const score = ctx.command('phigros.score <name:text>', { checkArgCount: true })
    .userFields(['phiToken'])
    .action(async ({ session }, name) => {
      if (!session.user.phiToken) return session.text('.no-token')

      const song = await querySong(name, session)
      const save = await api.record(session.user.phiToken)
      const record = save.find(([k]) => k == song.id)

      if (!record) return session.text('.no-record')

      await session.send(session.text('.rendering'))
      return renderScore(record[1], song)
    })

  const b19 = ctx.command('phigros.b19')
    .userFields(['phiToken'])
    .action(async ({ session }) => {
      if (!session.user.phiToken) return session.text('.no-token')

      const save = await api.record(session.user.phiToken)
      const { challengeMode } = await api.summary(session.user.phiToken)

      const songs = await api.songsInfo()

      const rksInfo = rks(save.map(r => {
        const a = songs.find(s => s.id === r[0])
        return [r[1], a]
      }))

      const playerName = await api.nickname(session.user.phiToken)

      await session.send(session.text('.rendering'))
      return renderB19(
        playerName,
        rksInfo.rks,
        rksInfo.bestPhi,
        rksInfo.b19,
        challengeMode.rank, challengeMode.level
      )
    })

  if (config.shortcut) {
    unbind.shortcut('unbind', { i18n: true })
    bind.shortcut('bind', { i18n: true, fuzzy: true })
    alias.shortcut('alias', { i18n: true, fuzzy: true })
    listAlias.shortcut('list-alias', { i18n: true, fuzzy: true })
    score.shortcut('score', { i18n: true, fuzzy: true })
    b19.shortcut('b19', { i18n: true })
  }
}
