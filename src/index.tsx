import { Context, Schema, h } from 'koishi'
import { API, renderScore, tokenPattern, getSongInternalName as getIName } from './api'
import { SongInfo } from './types'
import { dedupe } from './utils'

declare module 'koishi' {
  interface User {
    phiToken: string
  }

  interface Tables {
    phigros_songs: SongInfo
    phigros_alias: {
      id: number
      alias: string
      songId: number
    }
  }
}

export interface Config { }

export const name = 'phigros'
export const using = ['database', 'puppeteer']
export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  const api = new API(ctx)
  const querySong = async (alias: string): Promise<SongInfo[]> => {
    const matchs = await ctx.database.get('phigros_alias', { alias: { $regex: alias.toLowerCase() } })
    const songs = dedupe(matchs, s => s.songId)
    return Promise.all(songs.map(async m => {
      const [song] = await ctx.database.get('phigros_songs', { id: m.songId })
      return song
    }))
  }

  const setAilas = async (alias: string, songId: number) => {
    if (ctx.database.get('phigros_alias', { alias: alias.toLowerCase(), songId }))
      return ctx.database.create('phigros_alias', { alias: alias.toLowerCase(), songId })
  }

  ctx.i18n.define('zh', require('./locales/zh-CN'))

  ctx.database.extend('user', {
    phiToken: {
      type: 'char',
      length: 25,
    }
  })

  ctx.database.extend('phigros_songs', {
    id: 'unsigned',
    chart: 'json',
    artist: 'string',
    illustration: 'string',
    illustrator: 'string',
    name: 'string',
    thumbnail: 'string',
  })

  ctx.database.extend('phigros_alias', {
    id: 'unsigned',
    alias: 'string',
    songId: {
      nullable: false,
      type: 'unsigned',
    },
  }, {
    foreign: {
      songId: ['phigros_songs', 'id']
    },
  })

  ctx.on('ready', async () => {
    const songsInfo = await api.songsInfo()
    await Promise.all(songsInfo.map(async i => {
      const [song] = await ctx.database.get('phigros_songs', { name: i.name, artist: i.artist })
      if (song) return await ctx.database.set('phigros_songs', { id: song.id }, i)
      await ctx.database.create('phigros_songs', i)
      const [{ id }] = await ctx.database.get('phigros_songs', { name: i.name, artist: i.artist })
      await Promise.all([
        setAilas(i.name.toLowerCase(), id),
        setAilas(getIName(i.name, i.artist), id),
        setAilas(i.artist.toLowerCase(), id),
      ])
    }))
  })

  ctx.command('phigros.unbind')
    .shortcut('unbind', { i18n: true })
    .userFields(['phiToken'])
    .action(({ session }) => {
      if (!session.user.phiToken) return session.text('.no-token')
      session.user.phiToken = undefined
      return session.text('.success')
    })

  ctx.command('phigros.bind <token:string>', { checkArgCount: true })
    .shortcut('bind', { i18n: true, fuzzy: true })
    .userFields(['phiToken'])
    .action(({ session }, token) => {
      if (!tokenPattern.exec(token)) return session.text('.invalid')
      session.user.phiToken = token
      return session.text('.success')
    })

  ctx.command('phigros.alias <name:text>', { checkArgCount: true })
    .shortcut('alias', { i18n: true, fuzzy: true })
    .action(async ({ session }, name) => {
      const songs = await querySong(name)
      let song: SongInfo
      if (!songs?.length) return session.text('.no-song')
      if (songs.length === 1) song = songs[0]
      else {
        await session.send(<message forward>
          <message>
            <i18n path=".select-song-prompt" />
          </message>
          {songs.map((v, i) => <message>{`${i + 1}. ${v.name} ${v.artist}`}</message>)}
        </message>)
        const index = +await session.prompt()
        if (!index) return session.text('.cancel')
        song = songs[index - 1]
      }


      await session.send(session.text('.alias-prompt'))
      const alias = await session.prompt()

      if (!alias) return session.text('.cancel')

      await setAilas(alias, song.id)

      return session.text('.success', [song.name, alias])
    })

  ctx.command('phigros.score <name:text>', { checkArgCount: true })
    .shortcut('score', { i18n: true, fuzzy: true })
    .userFields(['phiToken'])
    .action(async ({ session }, name) => {
      if (!session.user.phiToken) return session.text('.no-token')

      const songs = await querySong(name)
      let song: SongInfo
      if (!songs?.length) return session.text('.no-song')
      if (songs.length === 1) song = songs[0]
      else {
        await session.send(<message forward>
          <message>
            {session.text('.select-song-prompt')}
          </message>
          {songs.map((v, i) => <message>{i + 1}. {v.name} {v.artist}</message>)}
        </message>)
        const index = +await session.prompt()
        if (!index) return session.text('.cancel')
        song = songs[index - 1]
      }

      const save = await api.record(session.user.phiToken)
      const iName = getIName(song.name, song.artist).toLocaleLowerCase()
      const record = save.find(([k]) => k.toLocaleLowerCase() === iName) ??
        save.find(([k]) => k.toLocaleLowerCase().includes(iName))

      if (!record) return session.text('.no-record')

      await session.send(session.text('.rendering'))
      return renderScore(record[1], song)
    })
}
