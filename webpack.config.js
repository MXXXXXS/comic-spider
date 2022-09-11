const process = require('process')
const { resolve } = require('path')

const { NODE_ENV, APP } = process.env
const isProduction = NODE_ENV === 'production'

const outputDir = resolve('out')
const commonConfig = require('./webpack/common')
const appConfig = require('./webpack/app')
const { default: merge } = require('webpack-merge')

const workspace = resolve(__dirname)

console.log('isProduction: ', isProduction)

module.exports = []
  .concat(APP ? [appConfig(isProduction, outputDir, workspace)] : [])
  .map((config) => merge(commonConfig, config))
