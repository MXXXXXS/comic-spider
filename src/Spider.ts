import * as puppeteer from "puppeteer-core"
import * as path from "path"
import { HttpProxyAgent } from "http-proxy-agent"
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
  tocPageUrl: string
  browserExecutablePath: string
  headers?: [string, string][]
  proxy?: string
  throttle?: number
  throttleRandom?: number
  headless?: boolean
  pageParallelCounts?: number
  chapterRange?: [number, number]
}

export interface ImageInfo {
  state: ImageDownloadStates
  url: string
  pageIndex: number
}

export abstract class Spider extends Events {
  tocPageUrl = ""
  browserExecutablePath =
    "C:/Program Files/Google/Chrome/Application/chrome.exe"
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
  private imageInfoMap: Record<string, ImageInfo> = {}

  constructor({
    tocPageUrl,
    browserExecutablePath,
    headers = [],
    proxy = "",
    throttle = 1000,
    throttleRandom = 0,
    headless = true,
    pageParallelCounts = 3,
    chapterRange,
  }: SpiderArgs) {
    super()
    this.tocPageUrl = tocPageUrl
    this.browserExecutablePath = browserExecutablePath
    this.proxy = proxy
    this.throttle = throttle
    this.throttleRandom = throttleRandom
    this.headless = headless
    this.pageParallelCounts = pageParallelCounts
    this.chapterRange = chapterRange || this.chapterRange
    this.headers.push(["Referer", new URL(tocPageUrl).href], ...headers)
  }

  abstract getChapterEntries(indexPage: puppeteer.Page): Promise<string[]>

  abstract getChapterPageCounts(page: puppeteer.Page): Promise<number>

  abstract getImageUrls(page: puppeteer.Page): Promise<string[]>

  abstract getNextPageUrl(page: puppeteer.Page): Promise<string | undefined>

  abstract getImageSavePath(imageInfo: ImageInfo): string

  private async openBrowser() {
    const browser = await puppeteer.launch({
      executablePath: this.browserExecutablePath,
      headless: this.headless,
      defaultViewport: {
        width: 1280,
        height: 800,
      },
      args: [`--proxy-server=${this.proxy}`],
    })
    return browser
  }

  private async saveImageUrls(page: puppeteer.Page, pageIndex: number) {
    const imageUrls = await this.getImageUrls(page)
    return imageUrls.map((imgUrl): ImageInfo => {
      const imageInfo = {
        state: ImageDownloadStates.waiting,
        url: imgUrl,
        pageIndex,
      }
      this.imageInfoMap[imgUrl] = imageInfo
      return imageInfo
    })
  }

  private async downloadImg(imageInfo: ImageInfo) {
    if (
      this.imageInfoMap[imageInfo.url].state === ImageDownloadStates.waiting
    ) {
      this.imageInfoMap[imageInfo.url].state = ImageDownloadStates.downloading
      const res = await fetch(imageInfo.url, {
        headers: new Headers(this.headers),
        agent: this.proxy ? new HttpProxyAgent(this.proxy) : undefined,
      })
      const imageSavePath = this.getImageSavePath(imageInfo)
      ensureDirSync(path.dirname(imageSavePath))
      const saveImgFile = createWriteStream(imageSavePath)
      if (!res.body) {
        this.imageInfoMap[imageInfo.url].state = ImageDownloadStates.error
        return
      }
      res.body.on("error", () => {
        this.imageInfoMap[imageInfo.url].state = ImageDownloadStates.error
      })
      res.body.on("end", () => {
        this.imageInfoMap[imageInfo.url].state = ImageDownloadStates.ok
      })
      res.body?.pipe(saveImgFile)
    }
  }

  private async fetchChapter(chapterEntry: string) {
    if (!this.browser) throw "No browser"
    const page = await this.browser.newPage()
    await page.goto(chapterEntry)
    const pageCounts = await this.getChapterPageCounts(page)
    let currentPageIndex = 0
    while (currentPageIndex < pageCounts) {
      const imageInfoList = await this.saveImageUrls(page, currentPageIndex + 1)
      this.emit("imageInfoList", imageInfoList)
      const nextPageUrl = await this.getNextPageUrl(page)
      if (nextPageUrl) {
        await page.goto(nextPageUrl)
      }
      await wait(this.throttle + this.throttleRandom * Math.random())
      currentPageIndex++
    }
    page.close()
  }

  async run() {
    this.browser = await this.openBrowser()
    const indexPage = await this.browser.newPage()
    await indexPage.goto(this.tocPageUrl)
    const chapterEntries = (await this.getChapterEntries(indexPage)).slice(
      this.chapterRange[0] - 1,
      this.chapterRange[1]
    )
    this.on("imageInfoList", (imageInfoList: ImageInfo[]) => {
      imageInfoList.forEach((imageInfo) => {
        this.downloadImg(imageInfo)
      })
    })
    for (let index = 0; index < chapterEntries.length; ) {
      const entries = chapterEntries.slice(
        index,
        index + Math.min(this.pageParallelCounts, chapterEntries.length - index)
      )
      await Promise.all(
        entries.map((chapterEntry) => this.fetchChapter(chapterEntry))
      )

      if (index + this.pageParallelCounts > chapterEntries.length - 1) {
        index += 1
      } else {
        index += this.pageParallelCounts
      }
    }
    process.exit(0)
  }
}
