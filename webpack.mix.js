const mix = require('laravel-mix');

// Override font output dir for webpack file-loader?
mix.config.publicPath = 'public';

mix
  .react('client/index.js', 'public/app.js')
  .less('client/index.less', 'public/app.css')
  .copy('client/index.html', 'public/')
  .sourceMaps()
  .browserSync({
    port: 8080,
    proxy: 'localhost:3000'
  });
