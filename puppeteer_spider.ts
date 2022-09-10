import * as puppeteer from 'puppeteer';
import * as fs from 'fs'
import * as url from 'url'

const site = 'https://www.manhuafen.com'
const siteBase = 'https://www.manhuafen.com/comic/3803/'
// const imgURLBase = 'https://img01.eshanyao.com/images/comic/64/'

const range: [number, number, string] = [261462, 54, '.html']

  ; (async () => {
    const browser = await puppeteer.launch({
      headless: true,
      defaultViewport: {
        width: 1280,
        height: 800
      },
      executablePath: 'node_modules/puppeteer/.local-chromium/win64-722234/chrome-win/chrome.exe'
    });

    async function getImageLinks(url: string, pageNum: number) {
      const page = await browser.newPage();
      await page.goto(url);
      const chapter = await page.evaluate(() => document.querySelector('.head_title > h2').textContent).catch(err => { })
      // const imgLinks = (await page.evaluate(() => chapterImages).catch(err => { }) as string[]).map(name => imgURLBase + String(pageNum) + '/' + name)
      const imgLinks = (await page.evaluate(() => chapterImages).catch(err => { }) as string[])
      const next = site + (await page.evaluate(() => document.querySelector('.next > a').getAttribute('href')).catch(err => { }) as string) || ""
      await page.close()
      return { imgLinks, next, chapter }
    }
    //设定起始页, 并作为下一页的变量
    let nextPage = siteBase + String(range[0]) + range[2]
    fs.writeFileSync('links.json', '[\n', {
      encoding: 'utf8',
    })
    for (let i = 0; i < range[1]; i++) {
      const pageNum = parseInt(url.parse(nextPage).pathname.split('/').slice(-1)[0])
      const result = await getImageLinks(nextPage, pageNum).catch(err => {
        browser.close()
        console.error(err)
      })
      if (result) {
        fs.writeFileSync('links.json', JSON.stringify({
          url: nextPage,
          chapter: result.chapter,
          links: result.imgLinks
        }, null, 2) + (i !== range[1] - 1 ? ',\n' : ''), {
          encoding: 'utf8',
          flag: 'a'
        })
        console.log('已解析: ' + nextPage)
        nextPage = result.next
      } else {
        break
      }
    }
    fs.writeFileSync('links.json', ']', {
      encoding: 'utf8',
      flag: 'a'
    })
    await browser.close();
  })();