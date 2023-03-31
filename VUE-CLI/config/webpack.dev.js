const path = require('path')
const { DefinePlugin } = require("webpack")
const EslintWebpackPlugin = require('eslint-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { VueLoaderPlugin } = require('vue-loader')
// 返回处理样式loader函数
const getStyleLoaders = (pre) => {
  return [
    'vue-style-loader',
    'css-loader',
    {
      // 处理css兼容性问题
      // 配合package.json中browserslist来指定兼容性
      loader: 'postcss-loader',
      options: {
        postcssOptions: {
          plugins: ['postcss-preset-env'],
        },
      },
    },
    pre,
  ].filter(Boolean)
}

module.exports = {
  // 打包入口文件
  entry: './src/main.js',
  // 打包出口配置
  output: {
    path: undefined, //出口路径
    filename: 'static/js/[name].js', //打包后文件名称 [name]:根据打包的文件名称命名
    chunkFilename: 'static/js/[name].chunk.js', // 其它语法打包出来的文件名称
    assetModuleFilename: 'static/media/[hash:10][ext][query]', // 图片打包出的文件名称
  },
  // 打包配置
  module: {
    rules: [
      // 处理css
      {
        test: /\.css$/,
        use: getStyleLoaders(),
      },
      // 处理less
      {
        test: /\.less$/,
        use: getStyleLoaders('less-loader'),
      },
      // 处理scss
      {
        test: /\.s[ac]ss$/,
        use: getStyleLoaders('sass-loader'),
      },
      // 处理styl
      {
        test: /\.styl$/,
        use: getStyleLoaders('stylus-loader'),
      },
      // 处理图片
      {
        test: /\.(jpg|png|gif|webp|svg)/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024, // 超过这个值则转换成base64
          },
        },
      },
      // 处理其它资源
      {
        test: /\.(woff2?|ttf)/,
        type: 'asset/resource',
      },
      // 处理js
      {
        test: /\.js$/,
        include: path.resolve(__dirname, '../src'),
        loader: 'babel-loader',
        options: {
          cacheDirectory: true,
          cacheCompression: false,
        },
      },
      // 处理vue
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
    ],
  },
  // 安装插件
  // 处理html
  plugins: [
    new EslintWebpackPlugin({
      context: path.resolve(__dirname, '../src'),
      exclude: 'node_modules', //排除文件不处理
      cache: true,
      cacheLocation: path.resolve(
        __dirname,
        '../node_modules/.cache/.eslintcache'
      ),
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../public/index.html'),
    }),
    new VueLoaderPlugin(),
    // cross-env定义的环境变量给打包工具使用
    // DefinePlugin定义环境变量给源代码使用，从而解决vue3页面警告的问题
    new DefinePlugin({
      __VUE_OPTIONS_API__:true,
      __VUE_PROD_DEVTOOLS__:false,
    })
  ],
  mode: 'development',
  devtool: 'cheap-module-source-map',
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
    runtimeChunk: {
      name: (entrypoint) => `runtime~${entrypoint.name}.js`,
    },
  },
  // webpack解析模块加载选项
  resolve: {
    // 自动补全文件扩展名
    extensions: [".vue", ".js", ".json"],
  },
  devServer: {
    host: 'localhost',
    port: 3000,
    open: true,
    hot: true,
    historyApiFallback: true
  },
}
