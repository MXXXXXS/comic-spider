import * as https from 'https'
import * as fs from 'fs'
import * as path from 'path'
import * as LINKS from './links.json'

const saveDir = '来自深渊'

async function go() {
  queue: for (let i = 0; i < LINKS.length; i++) {
    const { url, chapter, links } = LINKS[i];
    const saveImgDir = path.join(saveDir, chapter)
    if (!fs.existsSync(saveImgDir)) {
      fs.mkdirSync(saveImgDir, {
        recursive: true
      })
    }
    for (let j = 0; j < links.length; j++) {
      const result = await new Promise((resolve, reject) => {
        const link = links[j]
        const req = https.request(link)
        req.setHeader('DNT', "1")
        req.setHeader('Referer', url)
        req.setHeader('User-Agent', "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36")
        req.on('error', e => {
          console.error(e)
          reject(false)
        })
        req.on('response', res => {
          if (res.statusCode === 200) {
            res.pipe(fs.createWriteStream(path.join(saveImgDir, j.toString() + '.jpg')))
            res.on('end', () => {
              console.log('已下载: ' + chapter + j.toString())
              //减速, 防被封
              setTimeout(() => resolve(true), 200 + Math.random() * 300)
            })
          } else {
            console.log(res.statusCode)
            reject(false)
          }
        })
        req.end()
      })
      if (!result)
        break queue
    }
  }
}

go()