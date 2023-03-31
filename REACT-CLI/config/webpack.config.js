const path = require('path')
const EslintWebpackPlugin = require('eslint-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerWebpackPlugin  = require('css-minimizer-webpack-plugin')
const TerserWebpackPlugin  = require('terser-webpack-plugin')
const ImageMinimizerWebpackPlugin  = require('image-minimizer-webpack-plugin')
const CopyPlugin = require("copy-webpack-plugin");
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
// 获取当前运行环境
console.log(process.env.NODE_ENV);
const env = process.env.NODE_ENV === 'production'
// 返回处理样式loader函数
const getStyleLoaders = (pre) => {
  return [
    env ? MiniCssExtractPlugin.loader : "style-loader",
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
    pre && {
      loader: pre,
      options: pre === 'less-loader' ? {
        lessOptions: {
          modifyVars: {
            "@primary-color": "#1DA57A"
          },
          javascriptEnabled: true
        }
      } : {}
    },
  ].filter(Boolean)
}

module.exports = {
  // 打包入口文件
  entry: './src/main.js',
  // 打包出口配置
  output: {
    path: env ? path.resolve(__dirname,"../dist") : undefined, //出口路径
    filename: env ? 'static/js/[name].[contenthash:10].js' : 'static/js/[name].js', //打包后文件名称 [name]:根据打包的文件名称命名，contenthash：10 = 取十位哈希值进行命名
    chunkFilename: env ? 'static/js/[name].[contenthash:10].chunk.js' : 'static/js/[name].chunk.js', // 其它语法打包出来的文件名称
    assetModuleFilename: 'static/media/[hash:10][ext][query]', // 图片打包出的文件名称
    clean: true, // 把上次打包文件清空
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
        test: /\.jsx?$/,
        include: path.resolve(__dirname, '../src'),
        loader: 'babel-loader',
        options: {
          cacheDirectory: true,
          cacheCompression: false,
          plugins: [
            !env && 'react-refresh/babel' // 激活js的HMR
          ].filter(Boolean),
        },
        
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
    env && new MiniCssExtractPlugin({
      filename: 'static/css/[name].[contenthash:10].css',
      chunkFilename: 'static/css/[name].[contenthash:10].chunk.css'
    }),
    env && new CopyPlugin({ 
      patterns: [
        // 从public目录下复制文件到打包后的dist目录下
        { from: path.resolve(__dirname,"../public"), to: path.resolve(__dirname,"../dist"),
        globOptions: { 
          // 忽略index.html文件
          ignore: ["**/index.html*"],
        },
      },
      ],
    }),
    !env && new ReactRefreshWebpackPlugin()
  ].filter(Boolean),
  mode: env ? 'production' : 'development',
  devtool: env ? 'source-map' : 'cheap-module-source-map',
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // react react-dom react-router-dom 一起打包成一个js文件
        react :{
          test: /[\\/]node_modules[\\/]react(.*)?[\\/]/, //打包规则
          name: 'chunk-react', //文件名
          priority: 40,
        },
        // antd  //单独打包
        antd :{
          test: /[\\/]node_modules[\\/]antd[\\/]/, //打包规则
          name: 'chunk-antd', //文件名
          priority: 30,
        },
        // 剩下node_modules单独打包
        libs :{
          test: /[\\/]node_modules[\\/]/, //打包规则
          name: 'chunk-libs', //文件名
          priority: 20,
        },
      },
    },
    runtimeChunk: {
      name: (entrypoint) => `runtime~${entrypoint.name}.js`,
    },
    minimize: env, //是否进行压缩
    // css压缩   //js压缩
    minimizer: [new CssMinimizerWebpackPlugin(), new TerserWebpackPlugin(),
      // 图片压缩
      new ImageMinimizerWebpackPlugin({
        minimizer: {
          implementation: ImageMinimizerWebpackPlugin.imageminGenerate,
          options: {
          // Lossless optimization with custom option
          // Feel free to experiment with options for better result for you
          plugins: [
            ["gifsicle", { interlaced: true }],
            ["jpegtran", { progressive: true }],
            ["optipng", { optimizationLevel: 5 }],
            // Svgo configuration here https://github.com/svg/svgo#configuration
            [
              "svgo",
              {
                plugins: [
                  "preset-default",
                  "prefixIds",
                  {
                    name: "sortAttrs",
                    params: {
                      xmlnsOrder: "alphabetical",
                    }
                  }
                ]
              },
            ],
          ],
          },
        },
      })
    ] // css文件压缩
  },
  // webpack解析模块加载选项
  resolve: {
    // 自动补全文件扩展名
    extensions: [".jsx", ".js", ".json"],
  },
  devServer: {
    host: 'localhost',
    port: 3000,
    open: true,
    hot: true,
    historyApiFallback: true,
  },
  performance: false, // 关闭性能分析，提升打包速度
}
