const path = require('path')
const { resolve } = require('path')
const { DefinePlugin } = require('webpack')
const { NODE_ENV } = process.env
const isProduction = NODE_ENV === 'production'

const workspace = resolve(__dirname, '..')

module.exports = {
  context: workspace,
  mode: isProduction ? 'production' : 'development',
  devtool: isProduction ? undefined : 'source-map',
  resolve: {
    alias: {
      '~': resolve(workspace, 'src/app'),
      src: resolve(workspace, 'src'),
      workspace,
    },
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.[tj]sx?$/,
        use: [
          {
            loader: 'babel-loader',
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new DefinePlugin({
      isCompliedWitDespatcher: JSON.stringify(
        process.env.DESPATCHER === 'true'
      ),
      workspaceDir: JSON.stringify(path.resolve(__dirname, '../')),
    }),
  ].filter(Boolean),
}
