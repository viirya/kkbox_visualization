// Generated by LiveScript 1.2.0
(function(){
  var paths, gulp, gulpUtil, gulpConcat, gulpLivescript, gulpLivereload, streamqueue, path, gulpIf, gulpBower, gutil, livereloadServer, livereload, production, httpServer, gulpUglify, gulpFilter, gulpStylus, gulpCsso, nib, gulpJade;
  paths = {
    pub: '_public',
    template: 'app/templates/*.jade',
    assets: 'app/assets/**',
    lsApp: 'app/**/*.ls',
    stylus: 'app/styles/*.styl',
    css: 'app/styles/*.css'
  };
  gulp = require('gulp');
  gulpUtil = require('gulp-util');
  gulpConcat = require('gulp-concat');
  gulpLivescript = require('gulp-livescript');
  gulpLivereload = require('gulp-livereload');
  streamqueue = require('streamqueue');
  path = require('path');
  gulpIf = require('gulp-if');
  gulpBower = require('gulp-bower');
  gutil = gulpUtil;
  livereloadServer = require('tiny-lr')();
  livereload = function(){
    return gulpLivereload(livereloadServer);
  };
  if (gutil.env.env === 'production') {
    production = true;
  }
  gulp.task('httpServer', function(){
    var express, port, app;
    express = require('express');
    port = 3333;
    app = express();
    app.use(require('connect-livereload')());
    app.use(express['static'](path.resolve(paths.pub)));
    app.all('/**', function(req, res, next){
      return res.sendfile(__dirname + '/_public/index.html');
    });
    httpServer = require('http').createServer(app);
    return httpServer.listen(port, function(){
      return gutil.log("Running on " + gutil.colors.bold.inverse("http://localhost:" + port));
    });
  });
  gulp.task('build', ['assets', 'js:app', 'index', 'css']);
  gulp.task('dev', ['build', 'httpServer'], function(){
    gulp.watch(paths.template, ['index']);
    gulp.watch(paths.assets, ['assets']);
    gulp.watch(paths.lsApp, ['js:app']);
    return gulp.watch(paths.stylus, ['css']);
  });
  gulpUglify = require('gulp-uglify');
  gulp.task('js:app', function(){
    var app, s;
    app = gulp.src(paths.lsApp).pipe(gulpLivescript({
      bare: true
    }).on('error', gutil.log));
    return s = streamqueue({
      objectMode: true
    }).done(app).pipe(gulpConcat('app.js')).pipe(gulpIf(production, gulpUglify())).pipe(gulp.dest(paths.pub + "/js"));
  });
  gulpFilter = require('gulp-filter');
  gulpStylus = require('gulp-stylus');
  gulpCsso = require('gulp-csso');
  nib = require('nib');
  gulp.task('css', function(){
    var css, styl, s;
    css = gulp.src(paths.css);
    styl = gulp.src(paths.stylus).pipe(gulpFilter(function(it){
      return !/\/_[^/]+\.styl$/.test(it.path);
    })).pipe(gulpStylus({
      use: [nib()]
    }));
    return s = streamqueue({
      objectMode: true
    }).done(css, styl).pipe(gulpConcat('app.css')).pipe(gulp.dest(paths.pub)).pipe(livereload());
  });
  gulpJade = require('gulp-jade');
  gulp.task('index', function(){
    var pretty;
    pretty = true;
    return gulp.src(paths.template).pipe(gulpJade({
      pretty: pretty
    })).pipe(gulp.dest(paths.pub)).pipe(livereload());
  });
  gulp.task('assets', function(){
    return gulp.src(paths.assets).pipe(gulp.dest(paths.pub));
  });
  gulp.task('bower', function(){
    return gulpBower().pipe(gulp.dest(paths.pub + '/lib/'));
  });
  gulp.task('default', ['build']);
}).call(this);