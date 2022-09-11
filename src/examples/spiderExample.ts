import { Page } from "puppeteer"
import { Spider } from "src/Spider"

export class SpiderExample extends Spider implements Spider {
  imageSelector = ""
  nextPageAnchorSelector = ""

  constructor(args: { url: string }) {
    super(args)
  }

  async getNextPageUrl(page: Page): Promise<string> {
    const nextPageUrl = await page.$eval(
      this.nextPageAnchorSelector,
      (aEl) => (aEl as HTMLAnchorElement).href || ""
    )
    return nextPageUrl
  }

  async getImageUrls(page: Page): Promise<string[]> {
    const imgUrl = await page.$eval(
      this.imageSelector,
      (imgEl) => (imgEl as HTMLImageElement).src || ""
    )
    return [imgUrl]
  }

  getImageSavePath(imgUrl: string): string {
    return ""
  }
}

const spider = new SpiderExample({
  url: "",
})

const pageCounts = 2

spider.run(pageCounts).catch((err) => {
  console.error(err)
})
