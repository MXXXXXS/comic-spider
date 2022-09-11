import * as puppeteer from "puppeteer"
import * as path from "path"
import Events from "events"
import fetch, { Headers } from "node-fetch"
import { createWriteStream } from "fs"
import { ensureDirSync } from "fs-extra"

enum ImageDownloadStates {
  waiting,
  downloading,
  ok,
  error,
}

export abstract class Spider extends Events {
  url = ""
  headers: [string, string][] = [
    ["DNT", "1"],
    [
      "User-Agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36",
    ],
  ]
  proxy = ""
  private imageUrlDic: Record<
    string,
    {
      state: ImageDownloadStates
      url: string
    }
  > = {}

  constructor({
    url,
    headers = [],
    proxy = "",
  }: {
    url: string
    headers?: [string, string][]
    proxy?: ""
  }) {
    super()
    this.url = url
    this.proxy = proxy
    this.headers.push(["Referer", new URL(url).href], ...headers)
  }

  abstract getImageUrls(page: puppeteer.Page): Promise<string[]>

  abstract getNextPageUrl(page: puppeteer.Page): Promise<string>

  abstract getImageSavePath(imgUrl: string): string

  private async openBrowser() {
    const browser = await puppeteer.launch({
      headless: true,
      defaultViewport: {
        width: 1280,
        height: 800,
      },
      env: {
        HTTP_PROXY: this.proxy,
        HTTPS_PROXY: this.proxy,
      },
    })
    const page = await browser.newPage()
    return page
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

  async run(pageCounts: number) {
    let nextPageUrl = this.url
    this.on("imgUrls", (imgUrls: string[]) => {
      imgUrls.forEach((imgUrl) => {
        this.downloadImg(imgUrl)
      })
    })
    const page = await this.openBrowser()
    while (pageCounts--) {
      await page.goto(nextPageUrl)
      const imgUrls = await this.saveImageUrls(page)
      this.emit("imgUrls", imgUrls)
      nextPageUrl = await this.getNextPageUrl(page)
    }
  }
}