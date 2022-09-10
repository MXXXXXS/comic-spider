const path = require('path')

const output = path.resolve(__dirname, 'dist')
const puppeteer_spider = path.resolve(__dirname, 'puppeteer_spider.ts')
const download_spider = path.resolve(__dirname, 'download_spider.ts')

module.exports = {
  mode: 'development',
  target: 'node',
  watch: true,
  entry: {
    puppeteer_spider,
    download_spider
  },
  output: {
    filename: '[name].js',
    path: output
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  devtool: 'source-map'
}