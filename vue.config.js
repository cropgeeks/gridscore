// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
// 
module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
  pwa: {
    name: 'GridScore',
    themeColor: '#325D88',
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    start_url: '/index.html',
    workboxOptions: {
      skipWaiting: true
    }
  },
  configureWebpack: {
    // plugins: [
    //   new BundleAnalyzerPlugin()
    // ],
    resolve: {
      // ... rest of the resolve config
      fallback: {
        'path': require.resolve('path-browserify')
      }
    },
    devtool: 'eval-source-map',
    target: 'web'
  }
}