
paths =
  pub: '_public'
  template: 'app/templates/*.jade'
  assets: 'app/assets/**'
  ls-app: 'app/**/*.ls'
  stylus: 'app/styles/*.styl'
  css: 'app/styles/*.css'

require! <[gulp gulp-util gulp-concat gulp-livescript gulp-livereload streamqueue path gulp-if gulp-bower]>
gutil = gulp-util

livereload-server = require(\tiny-lr)!
livereload = -> gulp-livereload livereload-server

production = true if gutil.env.env is \production

var http-server

gulp.task \httpServer ->
  require! express
  port = 3333
  app = express!
  app.use require('connect-livereload')!
  app.use express.static path.resolve paths.pub
  app.all '/**' (req, res, next) ->
    res.sendfile __dirname + '/_public/index.html'
  http-server := require \http .create-server app
  http-server.listen port, ->
    gutil.log "Running on " + gutil.colors.bold.inverse "http://localhost:#port"

gulp.task 'build' <[assets js:app index css]>
gulp.task 'dev' <[build httpServer]> ->
  #port = 35729
  #livereload-server.listen port, -> gutil.log it if it
  gulp.watch paths.template, <[index]>
  gulp.watch paths.assets, <[assets]>
  gulp.watch paths.ls-app, <[js:app]>
  gulp.watch paths.stylus, <[css]>

require! <[gulp-uglify]>
gulp.task 'js:app' ->
  app = gulp.src paths.ls-app
    .pipe gulp-livescript({+bare}).on \error gutil.log

  s = streamqueue { +objectMode }
    .done app
    .pipe gulp-concat 'app.js'
    .pipe gulp-if production, gulp-uglify!
    .pipe gulp.dest "#{paths.pub}/js"

require! <[gulp-filter gulp-stylus gulp-csso nib]>

gulp.task 'css' ->

  css = gulp.src paths.css

  styl = gulp.src paths.stylus
    .pipe gulp-filter (.path isnt /\/_[^/]+\.styl$/) # isnt files for including
    .pipe gulp-stylus use: [nib!]

  s = streamqueue { +objectMode }
    .done css, styl
    .pipe gulp-concat 'app.css'
    .pipe gulp.dest paths.pub#
    .pipe livereload!

require! <[gulp-jade]>

gulp.task 'index' ->
  pretty = yes 
  gulp.src paths.template
    .pipe gulp-jade do
      pretty: pretty
    .pipe gulp.dest paths.pub
    .pipe livereload!

gulp.task 'assets' ->
  gulp.src paths.assets
    .pipe gulp.dest paths.pub

gulp.task 'bower' ->
  gulp-bower!
    .pipe gulp.dest paths.pub + '/lib/'

gulp.task 'default' <[build]>

