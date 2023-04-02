# Comic-spider

一个通用的漫画爬虫框架

演示: [成熟的浏览器要会自己下载漫画!](https://www.bilibili.com/video/BV1v24y1d7FK/?vd_source=070d82916b7d7dd6bf3e924865dfbe06)

## **注意: 本项目不针对任何特定站点, 不包含任何实际的代码实现, 仅提供一个思路框架**

## 框架设计

### 网站数据访问

为了模拟人类的行为, comic-spider(以下简称 cs)使用 puppeteer 来访问网站数据

这给予了实现者丰富的 api 来操作网页内容, 更加方便

### 数据获取流程

cs 的原本设计目标是下载漫画, 数据获取流程是模仿人类用户访问的行为的

通常的一部漫画会有一个目录页面, 方便用户选择章节

cs 暴露了一个`abstract class Spider`, `constructor`接受一个`indexUrl`参数, 用于指定目录页

打开目录页后, 需要从页面中提取出所有章节的入口, 使用者需要实现`getChapterEntries`来返回一个所有章节入口 url 的数组

有了所有章节的入口 url 的数组, 接着 cs 会按照顺序一个个打开各个章节入口页面, 一次同时打开的页面数量可通过`pageParallelCounts`配置

打开某一章节内容页后, 需要获取本章节的页数, 实现者需要实现`getChapterPageCounts`来返回本章节的页数. 页数用于告知 cs 何时完成本章节爬取

打开某一章节内容页后, 需要获取具体的图像, 实现者需要实现`getImageUrls`来返回本章节包含的漫画图像链接, 返回一个数组, 因为有时一个页面不止一页漫画

打开某一章节内容页后, 需要获取下一页的链接, 实现者需要实现`getNextPageUrl`来返回下一页的链接

**例外情况**:
有些网站的漫画下一页不需要加载新页面, 只需要在当前页点击相关按钮就可以拉取下一张图片, 这种情况下 `getNextPageUrl` 可以返回 `undefined`, 就不加载下一页了

获取到章节内容页的图片链接后, 依据链接, 实现者需要指定图像的保存位置, 需要实现`getImageSavePath`来从链接生成对应的图像文件下载保存路径

## 如何使用

前置知识: web 前端基础, ts, nodejs, 了解 puppeteer

**注意: 由于懒得折腾, 作者只在 mac 上实际跑过, 期待 win11 的 wslg**

使用`yarn`来安装依赖

实现者需要基于`Spider`来自己实现细节, 参考`src/examples/spiderExample.ts`

具体实现的文件入口路径为`src/app/app.ts`, 可以从`src/examples/spiderExample.ts`复制过去

实现后, 使用`yarn build-dev`编译, 之后`node out/app.js`运行

## 调试

推荐使用 vscode, 项目带有 vscode 的调试配置

`yarn build-dev`后, 在调试面板启动调试即可

## 自定义

### 配置代理

`Spider`的`constructor` 参数指定`proxy`, 为一个 http 代理服务器地址, 暂未实现用户认证; 常见的情况是本地 clash 的代理地址

### 配置请求头

`Spider`的`constructor` 参数指定`headers`, 类型为`[string, string][]`

### 并发页面数量

`Spider`的`constructor` 参数指定`pageParallelCounts`, 控制 puppeteer 一次开启的页面数量(并行爬取多个章节)

### 为了模仿人类, 打开下一页时配置延迟与抖动

`Spider`的`constructor` 参数指定`throttle`(毫秒), `throttleRandom`(毫秒), 每次爬完一页, 等待一会儿再翻页

### 只爬取某个范围内的章节

`Spider`的`constructor` 参数指定`chapterRange`, 在`getChapterEntries`获取全面章节后, `chapterRange`会作为全部章节`.slice`的参数, 来指定具体爬取的章节范围

### 显示 puppeteer 界面

`Spider`的`constructor` 参数指定`headless`为`false`, 默认为`true`

## License

MIT @[MXXXXXS](https://github.com/MXXXXXS/comic-spider)
