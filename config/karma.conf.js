// Karma configuration
// Generated on Fri Nov 29 2013 12:39:24 GMT+0000 (GMT)

module.exports = function(config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '../',


    // frameworks to use
    frameworks: ['mocha', 'browserify'],


    // list of files / patterns to load in the browser
    files: [
      { pattern: 'test/*.js', included: true },

      // code
      { pattern: 'lib/*.js', watched: true, served: false, included: false },
      { pattern: 'index.js', watched: true, served: false, included: false },

      // fixtures
      { pattern: 'samples/*', watched: true, served: true, included: false },
    ],

    preprocessors: {
      // '**/*.coffee': ['coffee'],
      'test/*.js': ['browserify'],
    },

    // list of files to exclude
    exclude: [
      '**/.*.swp',
      '**/*~'
    ],


    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera (has to be installed with `npm install karma-opera-launcher`)
    // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
    // - PhantomJS
    // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
    browsers: ['Chrome', 'Firefox'],


    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false,

    browserify: {
      //extension: ['.coffee'],
      transform: [],
      // require: ['native-buffer-browserify'],
      watch: true
    },

    plugins: [
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-browserify',
      'karma-mocha'
    ]
  });
};
