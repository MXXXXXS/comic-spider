const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://www.manhuafen.com/comic/1481/127401.html?p=4');
  const imgSel = '#images > img'
  const imageHref = await page.evaluate((sel) => {
    return document.querySelector(sel).getAttribute('src');
  }, imgSel)

  console.log(imageHref)
  await browser.close();
})()