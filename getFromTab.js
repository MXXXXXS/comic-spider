const https = require('https')
const fs = require('fs')
const path = require('path')
const tab = require('./tab.js')

const link = tab.link
const pics = tab.pics
const saveDir = path.join(__dirname, 'huiye')

go()

async function go() {
  let dirStart = 134
  for (const key in pics) {
    if (pics.hasOwnProperty(key)) {
      const picArr = pics[key];
      for (let i = 0; i < picArr.length - 1; i++) {  //最后一张图往往是字幕组的图, 忽略
        const pic = picArr[i];
        await getImg(key, pic, i, dirStart)
      }
      dirStart++
    }
  }
}

function getImg(chapter, page, i, dirStart) {
  const link = new URL(path.join(tab.link, chapter, page))
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
        const dir = dirStart.toString()
        if (!fs.existsSync(path.join(saveDir, dir)))
          fs.mkdirSync(path.join(saveDir, dir))
        res.pipe(fs.createWriteStream(path.join(saveDir, dir, i.toString() + '.jpg')))
        res.on('end', () => {
          setTimeout(() => resolve(true), 100 + Math.random() * 300)
        })
      } else {
        console.log(res.statusCode)
        reject(false)
      }
    })
    req.end()
  })
    .catch(e => {
      // console.error(e)
      console.log('Something wrong: ' + e)
    })
}