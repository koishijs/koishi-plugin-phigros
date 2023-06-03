export type SongRecord = [string, LevelRecord][]

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

export interface SongInfo {
  id: string
  name: string
  artist: string
  chart: { [key: string]: Chart }
  illustration: string
  illustrator: string
  thumbnail: string
}

export interface RKSInfo {
  level: string
  record: LevelRecord
  song: SongInfo
  rks: number
}

export interface ACL {
  [key: string]: {
    write: boolean
    read: boolean
  }
}

export interface SaveSummary {
  saveVersion: number
  gameVersion: number
  avatar: string
  rks: number
  challengeMode: {
    rank: 'rainbow' | 'gold' | 'red' | 'blue' | 'green'
    level: number
  }
  record: {
    [key: string]: {
      cleared: number
      fullCombo: number
      allPerfect: number
    }
  }

}

export interface Save {
  results: {
    ACL: ACL
    createdAt: string
    gameFile: {
      ACL: ACL
      __type: 'File'
      bucket: string
      className: '_File'
      createdAt: string
      key: string
      metaData: {
        _checksum: string
        prefix: 'gamesaves'
        size: number
      }
      mime_type: 'application/octet-stream'
      name: '.save'
      objectId: string
      provider: 'qiniu'
      updatedAt: string
      url: string
    }
    modifiedAt: {
      __type: 'Date'
      iso: string
    }
    name: 'save'
    objectId: string
    summary: string
    updatedAt: string
    user: {
      __type: 'Pointer'
      className: '_User'
      objectId: string
    }
  }[]
}
