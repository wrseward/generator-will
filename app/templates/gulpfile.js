/* global $:true */
'use strict';

var gulp = require('gulp');
var browserSync = require('browser-sync');
<% if (includeJekyll) { %>var cp = require('child_process');<% } %>
var $ = require('gulp-load-plugins')();
<% if (includeSprites) { %>var spritesmith = require('gulp.spritesmith');<% } %>

gulp.task('styles', function () {
  return gulp.src('app/styles/main.scss')
    .pipe($.plumber({ errorHandler: $.notify.onError('Error: <%%= error.message %>') }))
    .pipe($.rubySass({
      style: 'expanded',
      precision: 10,
      bundleExec: true
    }))
    .pipe($.autoprefixer('last 3 versions', 'ie >= 9'))
    .pipe(gulp.dest('.tmp/styles'))
    .pipe($.size());
});

gulp.task('scripts', function () {
  return gulp.src('app/scripts/**/*.js')
    .pipe($.jshint())
    .pipe($.jshint.reporter(require('jshint-stylish')))
    .pipe($.size());
});

gulp.task('html', ['styles', 'scripts'<% if (includeJekyll) { %>, 'templates'<% } %><% if (includeIcons) { %>, 'icons'<% } %><% if (includeSprites) { %>, 'sprites'<% } %>], function () {
  var jsFilter = $.filter('**/*.js');
  var cssFilter = $.filter('**/*.css');

  return gulp.src('<% if (includeJekyll) { %>.jekyll<% } else { %>app<% } %>/**/*.html')
    .pipe($.useref.assets({ searchPath: '{.tmp,app}' }))
    .pipe(jsFilter)
    .pipe($.uglify())
    .pipe(jsFilter.restore())
    .pipe(cssFilter)
    .pipe($.csso())
    .pipe(cssFilter.restore())
    .pipe($.rev())
    .pipe($.useref.restore())
    .pipe($.useref())
    .pipe($.revReplace())
    .pipe($.if('*.html', $.minifyHtml({
      comments: true,
      conditional: true,
      quotes: true,
      cdata: true,
      empty: true
    })))
    .pipe(gulp.dest('dist'))
    .pipe($.size());
});

gulp.task('images', function () {
  return gulp.src('app/images/**/*')
    .pipe($.imagemin({
      optimizationLevel: 3,
      progressive: true,
      interlaced: true
    }))
    .pipe(gulp.dest('dist/images'))
    .pipe($.size());
});

gulp.task('fonts', function () {
  return gulp.src('app/fonts/**/*')
    .pipe($.filter('**/*.{eot,svg,ttf,woff,woff2}'))
    .pipe($.flatten())
    .pipe(gulp.dest('dist/fonts'))
    .pipe($.size());
});

gulp.task('extras', function () {
  return gulp.src(['app/*.*', '!app/*.html'], { dot: true })
    .pipe(gulp.dest('dist'));
});

gulp.task('clean', function () {
  return gulp.src(['.tmp', 'dist'], { read: false }).pipe($.clean());
});

gulp.task('build', function (cb) {
  var runSequence = require('run-sequence');
  runSequence('clean', ['html', 'images', 'fonts', 'extras'], cb);
});

gulp.task('default', ['build']);

gulp.task('serve', ['watch', 'scripts', 'styles'<% if (includeJekyll) { %>, 'templates'<% } %>], function () {
  var files = [
    '.tmp/styles/**/*.css',
    'app/scripts/**/*.js',
    'app/images/*'
  ];

  browserSync.instance = browserSync.init(files, {
    startPath: '/index.html',
    server: {
      baseDir: ['app', '.tmp'<% if (includeJekyll) { %>, '.jekyll'<% } %>],
      routes:  { '/bower_components': 'bower_components' }
    },
  });
});

gulp.task('serve:dist', ['build'], function () {
  browserSync.instance = browserSync.init(['dist/**/*'], {
    startPath: '/index.html',
    server: {
      baseDir: ['dist']
    },
  });
});

gulp.task('watch', function () {
<% if (includeJekyll) { %>  gulp.watch('app/pages/**', ['templates:rebuild']);<% } %>
  gulp.watch('app/styles/**/*.scss', ['styles']);
  gulp.watch('app/scripts/**/*.js', ['scripts']);
  gulp.watch('app/images/**/*', ['images']);
});
<% if (includeJekyll) { %>
gulp.task('templates', function (done) {
  browserSync.notify('<span style="color: grey">Running:</span> $ jekyll build');
  return cp.spawn('bundle', ['exec', 'jekyll', 'build'], { stdio: 'inherit' })
    .on('close', done);
});

gulp.task('templates:rebuild', ['templates'], function () {
  browserSync.reload();
});
<% } %>
gulp.task('wiredep', function () {
  var wiredep = require('wiredep').stream;

  gulp.src('app/styles/*.scss')
    .pipe(wiredep({
      directory: 'app/bower_components'
    }))
    .pipe(gulp.dest('app/styles'));

  gulp.src('app/**/*.html')
    .pipe(wiredep({
      directory: 'app/bower_components',
      ignorePath: /^(\.\.\/\.\.)+/,
      exclude: ['bower_components/modernizr/modernizr.js']
    }))
    .pipe(gulp.dest('app'));
});

gulp.task('deploy', ['build'], function () {
  var rsync = require('rsyncwrapper').rsync;

  return rsync({
    ssh: true,
    src: './dist/*',
    dest: 'user@server.tld:/path/to/site/',
    recursive: true,
    syncDest: true,
    args: ['-avz', '--delete']
  }, function (error, stdout, stderr, cmd) {
    $.util.log('Command used was: ' + cmd);
    $.util.log(stdout);
  });
});
<% if (includeIcons) { %>
gulp.task('icons', function () {
  gulp.src(['app/images/icons/*.svg'])
    .pipe($.iconfont({
      fontName: 'icons',
      appendCodepoints: true,
      fontHeight: 500,
      normalize: true,
      centerHorizontally: true,
    }))
      .on('codepoints', function (codepoints) {
        gulp.src('templates/_iconfont.scss')
        .pipe($.consolidate('lodash', {
          glyphs: codepoints,
          fontName: 'icons',
          fontPath: '/fonts/',
          className: 'icon'
        }))
        .pipe(gulp.dest('app/styles/'));
      })
    .pipe(gulp.dest('app/fonts'));
});
<% } %><% if (includeSprites) { %>
gulp.task('sprites', function () {
  var spriteData = gulp.src('app/images/sprites/*.png').pipe(spritesmith({
    imgName: 'sprites.png',
    cssName: '_sprites.scss',
    algorithm: 'binary-tree',
    cssFormat: 'css',
    cssTemplate: 'gulp/spritesheet.mustache'
  }));
  spriteData.img.pipe(gulp.dest('app/images/'));
  spriteData.css.pipe(gulp.dest('app/styles/'));
});<% } %>
