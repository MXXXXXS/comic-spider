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

  async getChapterEntries(indexPage: Page): Promise<string[]> {
    return indexPage.$eval("", (el) => {
      const ddEls = el.querySelectorAll("dd")
      return Array.from(ddEls).map((ddEl) => {
        const aEl = ddEl.querySelector("a") as HTMLAnchorElement
        return aEl.href
      })
    })
  }

  async getChapterPageCounts(page: Page): Promise<number> {
    return page.$eval("", (el) => {
      const { innerText } = el as HTMLElement
      const [_, pages] = innerText.match(/共(\d+)页/) || [undefined, "0"]
      return parseInt(pages)
    })
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
  indexUrl: "",
  proxy: "",
  headless: false,
  chapterRange: [0, 1],
})

spider.run().catch((err) => {
  console.error(err)
})
