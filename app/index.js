'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var wiredep = require('wiredep');

module.exports = yeoman.generators.Base.extend({
  initializing: function () {
    this.pkg = require('../package.json');
  },

  prompting: function () {
    var done = this.async();

    this.log(yosay(
      'What\'s up? I\'m ' + chalk.red('Will') + '.  This is my generator.'
    ));

    var prompts = [{
      type: 'checkbox',
      name: 'features',
      message: 'What more would you like?',
      choices: [{
        name: 'Susy',
        value: 'includeSusy',
        checked: true
      }, {
        name: 'Jekyll',
        value: 'includeJekyll',
        checked: true
      }, {
        name: 'Icon Fonts',
        value: 'includeIcons',
        checked: false
      }, {
        name: 'CSS Sprites',
        value: 'includeSprites',
        checked: false
      }]
    }];

    this.prompt(prompts, function (answers) {
      var features = answers.features;

      var hasFeature = function (feat) {
        return features.indexOf(feat) !== -1;
      };

      // manually deal with the response, get back and store the results.
      // we change a bit this way of doing to automatically do this in the self.prompt() method.
      this.includeSusy = hasFeature('includeSusy');
      this.includeJekyll = hasFeature('includeJekyll');
      this.includeIcons = hasFeature('includeIcons');
      this.includeSprites = hasFeature('includeSprites');

      done();
    }.bind(this));
  },

  writing: {
    gulpfile: function () {
      this.template('gulpfile.js');
    },

    packageJSON: function () {
      this.template('_package.json', 'package.json');
    },

    git: function () {
      this.template('gitignore', '.gitignore');
      this.copy('gitattributes', '.gitattributes');
    },

    bower: function () {
      var bower = {
        name: this._.slugify(this.appname),
        private: true,
        dependencies: {
          'jquery': '~1.11.0',
          'normalize-css': '~3.0.2',
          'modernizr': '~2.8.3'
        }
      };

      if (this.includeSusy) {
        bower.dependencies.susy = '~2.1.3';
      }

      this.copy('bowerrc', '.bowerrc');
      this.write('bower.json', JSON.stringify(bower, null, 2));
    },

    js: function () {
      this.copy('jshintrc', '.jshintrc');
      this.copy('jscsrc', '.jscsrc');
    },

    editorConfig: function () {
      this.copy('editorconfig', '.editorconfig');
    },

    h5bp: function () {
      var indexPath = 'app/';

      if (this.includeJekyll) {
        indexPath += 'pages/';
      }

      this.copy('robots.txt', indexPath + 'robots.txt');
    },

    stylesheets: function () {
      this.directory('styles', 'app/styles');
    },

    rubyGems: function () {
      this.template('Gemfile', 'Gemfile');
    },

    writeIndex: function () {
      if (this.includeJekyll) {
        this.directory('jekyll', 'app/pages');
      } else {
        this.template('index.html', 'app/index.html');
      }
    },

    app: function () {
      this.mkdir('app');
      this.mkdir('app/scripts');
      this.mkdir('app/styles');
      this.mkdir('app/images');
      this.mkdir('app/fonts');
      this.copy('main.js', 'app/scripts/main.js');
      this.copy('gitkeep', 'app/fonts/.gitkeep');
      this.copy('gitkeep', 'app/images/.gitkeep');

      if (this.includeJekyll) {
        this.mkdir('app/pages');
        this.mkdir('app/pages/_layouts');
        this.mkdir('app/pages/_includes');
        this.copy('_config.yml');
      }

      if (this.includeIcons || this.includeSprites) {
        this.mkdir('app/templates');
      }

      if (this.includeIcons) {
        this.mkdir('app/images/icons');
        this.copy('gitkeep', 'app/images/icons/.gitkeep');
        this.copy('_icons.scss', 'app/templates/_icons.scss');
      }

      if (this.includeSprites) {
        this.mkdir('app/images/sprites');
        this.copy('gitkeep', 'app/images/sprites/.gitkeep');
        this.copy('sprites.mustache', 'app/templates/sprites.mustache');
      }
    },

    install: function () {
      this.installDependencies();

      this.on('end', function () {
        var bowerJson = this.dest.readJSON('bower.json');

        // wire Bower packages to .html
        wiredep({
          bowerJson: bowerJson,
          directory: 'app/bower_components',
          ignorePath: /^(\.\.\/)+/,
          src: 'app/**/*.html'
        });

        // wire Bower packages to .scss
        wiredep({
          bowerJson: bowerJson,
          directory: 'app/bower_components',
          src: 'app/styles/*.scss'
        });
      }.bind(this));
    }
  }
});
