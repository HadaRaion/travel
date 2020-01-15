const currentTask = process.env.npm_lifecycle_event
const path = require('path') // The part of the node library - It will be able to generate and absolute path to the correct folder
const {CleanWebpackPlugin} = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlughin = require('html-webpack-plugin')
const fse = require('fs-extra')

const postCSSPlugins = [
  require('postcss-import'),
  require('postcss-mixins'),
  require('postcss-simple-vars'),
  require('postcss-nested'),
  require('postcss-hexrgba'),
  require('autoprefixer')
]

class RundAfterCompile {
  apply(compliler) {
    compliler.hooks.done.tap('Copy Images', function() {
      fse.copySync('./app/assets/images', './docs/assets/images')
    })
  }
}

let cssConfig =  {
  test: /\.css$/i,
  use: ['css-loader?url=false', {loader: 'postcss-loader', options: {plugins: postCSSPlugins}}]
}

let pages = fse.readdirSync('./app').filter(function(file) {
  return file.endsWith('.html')
}).map(function(page) {
  return new HtmlWebpackPlughin({
    filename: page,
    template: `./app/${page}`
  })
})

let config = {
  entry: './app/assets/scripts/App.js',
  plugins: pages, 
  module: {
    rules: [
      cssConfig
    ]
  }
}

if (currentTask == 'dev') {
  cssConfig.use.unshift('style-loader')
  config.output = {
    filename: 'bundled.js',
    path: path.resolve(__dirname, 'app')
  }
  config.devServer = {
    before: function(app, server) {
      server._watch('./app/**/*.html')
    },
    contentBase: path.resolve(__dirname, 'app'), 
    hot: true,
    port: 3000,
    host: '0.0.0.0'
  }
  config.mode = 'development'
}

if (currentTask == 'build') {
  config.module.rules.push({
    test: /\.js$/,
    exclude: /(node_modules)/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-env']
      }
    }
  })

  cssConfig.use.unshift(MiniCssExtractPlugin.loader)
  postCSSPlugins.push(require('cssnano'))
  config.output = {
    filename: '[name].[chunkhash].js',
    chunkFilename: '[name].[chunkhash].js',
    path: path.resolve(__dirname, 'docs')
  }
  config.mode = 'production'
  config.optimization = {
    splitChunks: {chunks: 'all'}
  }
  config.plugins.push(
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({filename: 'styles.[chunkhash].css'}),
    new RundAfterCompile()
    )
}

module.exports = config

// module.exports = {
//   entry: './app/assets/scripts/App.js', // Type a path that points towrds the JavaScript file that you want to bundle
//   output: {
//     filename: 'bundled.js', // What bundled file should be named 
//     path: path.resolve(__dirname, 'app') // Where the newly generated file is placed
//   },
//   devServer: {
//     before: function(app, server) {
//       server._watch('./app/**/*.html')
//     },
//     contentBase: path.resolve(__dirname, 'app'), //Where we point towards the folder or directory that you want web pack to serve up
//     hot: true, // Going to allow Web pack to inject your css and Java Script into the browser's memory on the fly without needing a reload or refresh
//     port: 3000,
//     host: '0.0.0.0'
//   },
//   mode: 'development',
//   //watch: true, // Web pack will stay running and it will watch and detect any time you save a change - after dev Server you don't need it
//   module: {
//     rules: [
//       {
//         test: /\.css$/i, // Only interested in files that pass the following test - only if the file name ends in .css 
//         use: ['style-loader', 'css-loader?url=false', {loader: 'postcss-loader', options: {plugins: postCSSPlugins}}] // Then we wnat to use the style-loader(Let applies or uses css in the browser itself) and css-loader(Let Web pack understand or bundle css files)
//        }
//     ]
//   }
// }