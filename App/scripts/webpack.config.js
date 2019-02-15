const path = require('path')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const LessPluginFunctions = require('less-plugin-functions')
const CopyWebpackPlugin = require('copy-webpack-plugin')
let webpackConfig = {
  mode: 'production',
  // mode: 'development',
  target: 'electron-renderer',
  entry: './src/index.jsx',
  output: {
    path: path.resolve(__dirname, '../../www/js'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
          query: {
            presets: [
              '@babel/preset-react'
            ],
            plugins: [
              '@babel/plugin-proposal-class-properties'
            ]
          }
        }]
      },
      {
        test: /\.(less|css)$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            'css-loader',
            {
              loader: 'less-loader',
              options: {
                plugins: [new LessPluginFunctions()]
              }
            }
          ]
        })
      },
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: [{
          loader: 'babel-loader',
          query: {
            presets: []
          }
        }]
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: 'url-loader?limit=1024&name=../img/[name].[ext]'
      }
    ]
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      minChunks: 2,
      name: 'commons'
    },
    runtimeChunk: {
      name: 'manifest'
    }
  },
  resolve: {
    extensions: ['.json', '.js', '.jsx', '.css', '.less'],
    alias: {}
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM'
  },
  plugins: [
    new ExtractTextPlugin({
      filename: '../css/[name].css',
      allChunks: false
    }),
    new OptimizeCssAssetsPlugin({
      assetNameRegExp: /\.css$/g,
      cssProcessor: require('cssnano'),
      cssProcessorOptions: {
        discardComments: { removeAll: true },
        safe: true,
        reduceIdents: false
      },
      canPrint: true
    }),
    new CopyWebpackPlugin([
      { from: './public/index.html', to: '../../www' },
      { from: './public/js/vendor', to: '../../www/js/vendor' }
    ])
  ]
}

module.exports = webpackConfig
