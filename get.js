const https = require('https')
const fs = require('fs')
const path = require('path')
const cfg = require('./config.js')

const link = cfg.link
const range = cfg.range
const saveDir = path.join(__dirname, 'yuekan')
const [chapterPosition, pagePosition] = link.match(/\[(\d)\]/g)

go()

async function go() {
  let chapter = range[0]
  let imgNum = range[1]
  let lastChapter = range[2]
  for (; chapter <= lastChapter; chapter++) {
    let ok= false
    //章节间无效图片数字
    while(!ok) {
      ok = await getImg(chapter, imgNum)
      imgNum++
    }
    while(ok) {
      ok = await getImg(chapter, imgNum)
      imgNum++
    }
  }
}

function getImg(chapter, page) {
  let linkUrl = cfg.link.replace(chapterPosition, chapter)
  linkUrl = linkUrl.replace(pagePosition, page)
  const link = new URL(linkUrl)
  return new Promise((resolve, reject) => {

    const req = https.request({
      host: link.host,
      path: link.pathname
    })
    req.setHeader('DNT', "1")
    req.setHeader('Referer', 'https://www.manhuadui.com')
    req.setHeader('User-Agent', "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36")
    req.on('error', e => {
      console.error(e)
      reject(false)
    })
    req.on('response', res => {
      if (res.statusCode === 200) {
        if (!fs.existsSync(path.join(saveDir, chapter.toString())))
          fs.mkdirSync(path.join(saveDir, chapter.toString()))
        res.pipe(fs.createWriteStream(path.join(saveDir, chapter.toString(), page.toString() + '.jpg')))
        res.on('end', () => {
          setTimeout(() => resolve(true), 100 + Math.random() * 200)
        })
      } else {
        // console.log(res.statusCode)
        reject(false)
      }
    })
    req.end()
  })
    .catch(e => {
      // console.error(e)
      console.log('Next chapter: ' + chapter)
    })
}