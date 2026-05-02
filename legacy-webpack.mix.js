const mix = require('laravel-mix');
const webpack = require('webpack');
const config = require('./config');

// Override font output dir for webpack file-loader?
mix.config.publicPath = 'public';

mix
  .react('client/index.js', 'public/app.js')
  .less('client/index.less', 'public/app.css')
  .copy('client/index.html', 'public/')
  .sourceMaps()
  .browserSync({
    open: false,
    port: 8080,
    proxy: 'localhost:3000',
    minify: false,
  })
  .webpackConfig({
    plugins: [
      new webpack.DefinePlugin({
        ALTPLAYER: JSON.stringify(config)
      })
    ]
  });

