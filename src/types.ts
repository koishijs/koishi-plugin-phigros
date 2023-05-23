export type Levels = 'EZ' | 'HD' | 'IN' | 'AT'

export type SongRecord<L extends string = Levels> = {
  [key in L]?: LevelRecord
}

export interface LevelRecord {
  score: number
  accuracy: number
  fullCombo: boolean
}

export interface Chart {
  level: number
  difficulty: number
  combo: number
  charter: string
}

export type SongInfo<L extends string = Levels> = {
  id: number
  name: string
  artist: string
  chart: { [key in L]?: Chart }
  illustration: string
  illustrator: string
  thumbnail: string
}
