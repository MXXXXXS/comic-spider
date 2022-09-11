import { join } from "path"
import { Page } from "puppeteer"
import { Spider, SpiderArgs } from "src/Spider"

export class SpiderExample extends Spider implements Spider {
  imageSelector = ""
  nextPageAnchorSelector = ""
  imageSaveDir = "src/app/imageSaveDir"

  constructor(args: SpiderArgs) {
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
    const pathParts = imgUrl.split("/")
    const [dir, imgName] = pathParts.slice(-2).map((p) => decodeURI(p))
    return join(this.imageSaveDir, dir, imgName)
  }
}

const spider = new SpiderExample({
  url: "",
  proxy: "",
  headless: false,
})

const pageCounts = 15

spider.run(pageCounts).catch((err) => {
  console.error(err)
})
