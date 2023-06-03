import type { RKSInfo, SongInfo, SongRecord, LevelRecord } from "./types"

function rankingImage(level: LevelRecord) {
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

export function renderB19(
  playerName: string,
  rks: number,
  phi: RKSInfo,
  b19: RKSInfo[],
  challangeRank: string,
  challangeLevel: number,
) {
  return <html>
    <head>
      <style>{`

@import url('https://fonts.googleapis.com/css?family=Saira');
@import url('https://fonts.googleapis.com/css?family=Noto+Sans+JP');
@import url('https://fonts.googleapis.com/css?family=Noto+Sans+SC');

:root {
  --trans-black: #0006;
  --trans-white: #FFFD
}

body {
  margin: 0;
  font-family: 'Saira', 'Noto Sans SC', 'Noto Sans JP', sans-serif;
}

.songs {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  width: 100%;
  justify-content: center;
}

.block {
  color: var(--trans-white);
  background-color: var(--trans-black);
  border-right: 4px solid var(--trans-white);
  box-shadow: 0 0 20px black;
}

.shadow {
  text-shadow: 0 0 15px #00d2ff;
}

.parallelogram {
  transform: skew(-20deg);
  overflow: visible;
}

.parallelogram>*:not(.no-unskew) {
  transform: skew(20deg);
}

.no-unskew>*:not(.no-unskew) {
  transform: skew(20deg);
}

.rank {
  position: relative;
  width: 50px;
  line-height: 20px;
  height: 20px;
  text-align: center;
  overflow: visible;
  z-index: 1;
}

.rank::before {
  content: "";
  position: absolute;
  inset: 0px;
  z-index: -1;
  filter: blur(10px);
}

.rank-rainbow {
  border-left: 3px solid #00d2ff;
  border-right: 3px solid #ff2f00;
  background: linear-gradient(to right, #00d2ff33, #00ff0033, #ff2f0033);
}

.rank-rainbow::before {
  background: linear-gradient(to right, #00d2ff90, #00ff0090, #ff2f0090);
}

.rank-gold {
  border-left: 3px solid #ffd700;
  border-right: 3px solid #ffd700;
  background: #ffd70033;
}

.rank-gold::before {
  background: #ffd70077;
}

.rank-red {
  border-left: 3px solid #ff4500;
  border-right: 3px solid #ff4500;
  background: #ff450033;
}

.rank-red::before {
  background: #ff450077;
}

.rank-blue {
  border-left: 3px solid #00f2ff;
  border-right: 3px solid #00f2ff;
  background: #00f2ff33;
}

.rank-blue::before {
  background: #00f2ff77;
}

.rank-green {
  border-left: 3px solid #22cc00;
  border-right: 3px solid #22cc00;
  background: #22cc0033;
}

.rank-green::before {
  background: #22cc0077;
}

.order {
  height: 20px;
  width: 27px;
  background-color: var(--trans-white);
  line-height: 20px;
  text-align: center;
  align-self: flex-start;
  box-shadow: 0 0 30px black;
}

.record {
  height: 80px;
  width: 200px;
  position: relative;
  display: grid;
  grid-template:
    "ranking score" 40px
    "ranking acc" 40px
    / 80px 1fr;
}

.ranking {
  grid-area: ranking;
  height: 100%;
}

.score {
  font-size: 25px;
  border-bottom: solid 1px #fff;
}

.level {
  font-size: 12px;
}

.song {
  position: relative;
  display: flex;
  align-items: center;
  margin: 10px;
}


.difficulty {
  position: absolute;
  bottom: -5px;
  left: 180px;
  height: 36px;
  z-index: 1;
  background-color: white;
  display: flex;
  justify-content: center;
  overflow: visible;
  align-items: center;
}

.difficulty>* {
  box-shadow: var(--shadow);
  height: 40px;
  margin: 0 2px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  color: white;
  line-height: 10px;
}


.illustration {
  overflow: hidden;
  position: relative;
  box-shadow: 0 0 30px black;
}

.name {
  position: absolute;
  bottom: 0;
  left: 10px;
  color: var(--trans-white);
  text-shadow: 0 0 5px #fff6;
  font-size: min(1em, calc(140px));
}

.rks {
  position: absolute;
  bottom: -5px;
  left: 166px;
  height: 36px;
  z-index: 1;
  background-color: white;
  display: flex;
  justify-content: center;
  overflow: visible;
  align-items: center;
}

.rks>* {
  box-shadow: var(--shadow);
  height: 40px;
  margin: 0 2px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  color: white;
  line-height: 10px;
}

.diff {
  margin: 0 5px;
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

.illus {
  width: 200px;
  height: 105px;
  background-blend-mode: color;
  transform: scale(1.19) skew(20deg) !important;
}

#header-title {
  padding: 20px;
  font-size: 20px;
  font-weight: bold;
  display: grid;
  align-items: center;
  grid-template:
    "icon name" 37.5px
    "icon desc" 37.5px
    / 100px 1fr;
}

#header-container {
  margin: 40px 0;
  display: flex;
  align-items: center
}

#header-title>img {
  grid-area: icon;
  height: 100%;
  align-items: center;
  border-radius: 20px;
  box-shadow: 0 0 15px #00d2ff99;
}

#header-title>span {
  grid-area: name;
  text-align: center;
  font-size: 32px;
}

#header-title>p {
  grid-area: desc;
}

#header-player-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

#player-name {
  font-size: 30px;
  margin: 5px 30px;
  line-height: 30px;
  max-width: 300px;
}

#total-rks {
  width: 100px;
  height: 20px;
  line-height: 20px;
  background-color: var(--trans-white);
  text-align: center;
  color: #000;
  margin: 5px 0;
}

#main {
  width: 1200px;
  max-height: 1620px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-image: url('${phi.song.thumbnail}');
  background-repeat: no-repeat;
  background-size: cover;
  z-index: 0;
  overflow: hidden;
  padding-bottom: 20px;
}

#main::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 1620px;
  backdrop-filter: blur(20px);
}

#main>* {
  z-index: 1;
}
    `}</style>
    </head>
    <div id="main">
      <div id="header-container" class="parallelogram">
        <div id="header-title" class="para-decorate no-unskew block shadow">
          <img src="https://img.moegirl.org.cn/common/a/ab/Phigros_Icon_3.0.0.png" />
          <span>Phigros</span>
          <p>Ranking Score 成绩图</p>
        </div>
        <div id="header-player-info" class="para-decorate no-unskew block">
          <div id="player-name" class="shadow">{playerName}</div>
          {/* TODO: rank render */}
          <div class={`rank rank-${challangeRank} no-unskew`}>
            <div>{challangeLevel}</div>
          </div>
          <div id="total-rks" class="no-unskew">
            <div>{rks.toFixed(2)}</div>
          </div>
        </div>
      </div>
      <div class="songs">{renderSong('φ', phi)}</div>
      <div class="songs">
        {b19.map((r, i) => renderSong(i + 1, r))}
      </div>
    </div>
  </html>
}

function renderSong(order: string | number, rks: RKSInfo) {
  return <div class="song parallelogram">
    <div class="order no-unskew">
      <div>{order}</div>
    </div>

    <div class="illustration no-unskew">
      <div class="illus" style={`background: url('${rks.song.thumbnail}'), linear-gradient(transparent 60%, #000a 90%); background-size: cover;`}>&nbsp;</div>
      <div class="name">{rks.song.name}</div>
    </div>

    <div class="difficulty no-unskew">
      <div class={`${rks.level} no-unskew`}>
        <div class="level">{rks.level}</div>
        <div class="diff">{rks.song.chart[rks.level].difficulty.toFixed(2)}</div>
      </div>
    </div>

    <div class="block record no-unskew">

      <img class="ranking" src={rankingImage(rks.record)} />
      <div class="score no-unskew">
        <div>{rks.record.score}</div>
      </div>
      <div class="acc">&nbsp;{rks.record.accuracy.toFixed(2)}%</div>
      <div class="rks no-unskew">
        <div class={`${rks.level} no-unskew`}>
          <div class="level">rks</div>
          <div class="diff">{rks.rks.toFixed(2)}</div>
        </div>
      </div>
    </div>
  </div>
}

export function renderScore(record: SongRecord, info: SongInfo) {
  return <html>
    <head>


      <style>{`
    @import url('https://fonts.googleapis.com/css?family=Saira');
    @import url('https://fonts.googleapis.com/css?family=Noto+Sans+JP');
    @import url('https://fonts.googleapis.com/css?family=Noto+Sans+SC');

    :root {
      --shadow: 0 0 10px #666
    }

    body {
      width: 600px !important;
    }

    main {
      width: 600px;
      margin: 0;
      background-color: black;
      display: flex;
      justify-content: center;
      background-image: url('${info.thumbnail}');
      background-repeat: no-repeat;
      background-size: cover;
      font-family: 'Saira', 'Noto Sans SC', 'Noto Sans JP', sans-serif;
    }

    main::before{
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      backdrop-filter: blur(20px);
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
      margin: 5px 5px;
      background-color: #00000066;
      width: 198px;
      height: 25px;
      overflow: visible;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: var(--shadow);
    }

    .level>img {
      height: 50px;
    }

    .difficulty {
      height: 30px;
      width: 35px;
      background-color: #FFF;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .difficulty>* {
      box-shadow: var(--shadow);
      height: 28px;
      width: 30px;
      display: flex;
      flex-direction: column;
      align-items: center;
      color: white;
      padding-top: 4px;
      line-height: 10px;
    }

    .diff {
      font-size: 15px;
    }

    .level-name {
      font-size: 12px;
      line-height: 14px;
      transform: skew(20deg) scale(0.75) !important;
    }

    .score {
      font-size: 15px;
      color: #FFF;
    }

    .acc {
      position: relative;
      top: 5px;
      font-size: 12px;
      max-width: 30px;
      transform: skew(20deg) scale(0.75) !important;
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
      width: 500px;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
    }

    #column {
      padding: 50px 0;
      position: relative;
      z-index: 1;
    }

    #info {
      position: relative;
      z-index: 3;
    }

    #cover {
      width: 500px;
      clip-path: polygon(18.8% 0, 100% 0, calc(100% - 18.8%) 100%, 0 100%);
      height: 263.5px;
      background-blend-mode: color;
      background-size: cover;
      background: url('${info.illustration}'), linear-gradient(transparent 80%, #000a);
      background-size: cover;
    }

    #name {
      position: absolute;
      top: 236.5px;
      left: -28px;
      font-size: 15px;
      color: #FFFFFFDD;
    }

    #artist {
      position: absolute;
      top: 241.5px;
      right: 150px;
      font-size: 12.5px;
      color: #FFFFFFDD;
    }
    `}</style>
    </head>
    <main>
      <div id="column" class="parallelogram-column">
        <div class="no-unskew">
          <div id="info">
            <span id="name">{info.name}</span>
            <span id="artist">{info.artist}</span>
          </div>
          <div id="cover">&nbsp;</div>
        </div>
        <div id="level-container" class="no-unskew">
          {record.map(([level, record]) => {
            return <div class="level no-unskew">
              <div class="difficulty no-unskew">
                <div class={level + ' no-unskew'}>
                  <div class="level-name">{level}</div>
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
  </html>
}
