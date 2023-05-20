export type Levels = 'easy' | 'hard' | 'insane' | 'another'

export type SongRecord<L extends string = Levels> = {
  [key in L]?: LevelRecord
}

export interface LevelRecord {
  score: number
  accuracy: number
  fullCombo: boolean
}
