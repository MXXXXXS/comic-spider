import * as puppeteer from "puppeteer"
import * as path from "path"
import * as HttpProxyAgent from "http-proxy-agent"
import Events from "events"
import fetch, { Headers } from "node-fetch"
import { createWriteStream } from "fs"
import { ensureDirSync } from "fs-extra"
import { wait } from "./utils"

enum ImageDownloadStates {
  waiting,
  downloading,
  ok,
  error,
}

export interface SpiderArgs {
  indexUrl: string
  headers?: [string, string][]
  proxy?: string
  throttle?: number
  throttleRandom?: number
  headless?: boolean
  pageParallelCounts?: number
  chapterRange?: [number, number]
}

export abstract class Spider extends Events {
  indexUrl = ""
  headers: [string, string][] = [
    ["DNT", "1"],
    [
      "User-Agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36",
    ],
  ]
  proxy = ""
  throttle = 0
  throttleRandom = 0
  headless = true
  pageParallelCounts = 3
  chapterRange = [0, 1]
  private browser?: puppeteer.Browser
  private imageUrlDic: Record<
    string,
    {
      state: ImageDownloadStates
      url: string
    }
  > = {}

  constructor({
    indexUrl,
    headers = [],
    proxy = "",
    throttle = 1000,
    throttleRandom = 0,
    headless = true,
    pageParallelCounts = 3,
    chapterRange,
  }: SpiderArgs) {
    super()
    this.indexUrl = indexUrl
    this.proxy = proxy
    this.throttle = throttle
    this.throttleRandom = throttleRandom
    this.headless = headless
    this.pageParallelCounts = pageParallelCounts
    this.chapterRange = chapterRange || this.chapterRange
    this.headers.push(["Referer", new URL(indexUrl).href], ...headers)
  }

  abstract getChapterEntries(indexPage: puppeteer.Page): Promise<string[]>

  abstract getChapterPageCounts(page: puppeteer.Page): Promise<number>

  abstract getImageUrls(page: puppeteer.Page): Promise<string[]>

  abstract getNextPageUrl(page: puppeteer.Page): Promise<string>

  abstract getImageSavePath(imgUrl: string): string

  private async openBrowser() {
    const browser = await puppeteer.launch({
      headless: this.headless,
      defaultViewport: {
        width: 1280,
        height: 800,
      },
      args: [`--proxy-server=${this.proxy}`],
    })
    return browser
  }

  private async saveImageUrls(page: puppeteer.Page) {
    const imageUrls = await this.getImageUrls(page)
    imageUrls.forEach((imgUrl) => {
      this.imageUrlDic[imgUrl] = {
        state: ImageDownloadStates.waiting,
        url: imgUrl,
      }
    })
    return imageUrls
  }

  private async downloadImg(imgUrl: string) {
    if (this.imageUrlDic[imgUrl].state === ImageDownloadStates.waiting) {
      this.imageUrlDic[imgUrl].state = ImageDownloadStates.downloading
      const res = await fetch(imgUrl, {
        headers: new Headers(this.headers),
        agent: new HttpProxyAgent(this.proxy),
      })
      const imageSavePath = this.getImageSavePath(imgUrl)
      ensureDirSync(path.dirname(imageSavePath))
      const saveImgFile = createWriteStream(imageSavePath)
      if (!res.body) {
        this.imageUrlDic[imgUrl].state = ImageDownloadStates.error
        return
      }
      res.body.on("error", () => {
        this.imageUrlDic[imgUrl].state = ImageDownloadStates.error
      })
      res.body.on("end", () => {
        this.imageUrlDic[imgUrl].state = ImageDownloadStates.ok
      })
      res.body?.pipe(saveImgFile)
    }
  }

  private async fetchChapter(nextPageUrl: string) {
    if (!this.browser) throw "No browser"
    const page = await this.browser.newPage()
    await page.goto(nextPageUrl)
    let pageCounts = await this.getChapterPageCounts(page)
    while (pageCounts--) {
      const imgUrls = await this.saveImageUrls(page)
      this.emit("imgUrls", imgUrls)
      nextPageUrl = await this.getNextPageUrl(page)
      await page.goto(nextPageUrl)
      await wait(this.throttle + this.throttleRandom * Math.random())
    }
  }

  async run() {
    this.browser = await this.openBrowser()
    const indexPage = await this.browser.newPage()
    await indexPage.goto(this.indexUrl)
    const chapterEntries = (await this.getChapterEntries(indexPage)).slice(
      ...this.chapterRange
    )
    this.on("imgUrls", (imgUrls: string[]) => {
      imgUrls.forEach((imgUrl) => {
        this.downloadImg(imgUrl)
      })
    })
    for (
      let index = 0;
      index < chapterEntries.length;
      index += this.pageParallelCounts
    ) {
      const entries = chapterEntries.slice(
        index,
        index + this.pageParallelCounts
      )
      await Promise.all(
        entries.map((chapterEntry) => this.fetchChapter(chapterEntry))
      )
    }
    process.exit(0)
  }
}
