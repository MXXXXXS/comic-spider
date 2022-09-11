const { resolve } = require('path')
const { DefinePlugin } = require('webpack')

const config = (isProduction, outputDir, workspace) => {
  const source = resolve(workspace, 'src/app/app.ts')
  return {
    watch: false,
    target: 'node',
    node: {
      __dirname: false,
    },
    entry: {
      app: source,
    },
    output: {
      filename: '[name].js',
      path: resolve(outputDir),
    },
    plugins: [
      new DefinePlugin({
        IS_DEV: JSON.stringify(!isProduction),
      }),
    ],
    externalsPresets: { node: true }, // in order to ignore built-in modules like path, fs, etc.
  }
}

module.exports = config
