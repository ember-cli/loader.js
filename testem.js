module.exports = {
  framework: 'qunit',
  src_files: [
    'node_modules/heimdalljs/dist/heimdalljs.iife.js',
    'lib/loader/loader.js',
    'tests/all.js'
  ],
  before_tests: './build.js',
  test_page: 'tests/index.html?hidepassed',
  launch_in_dev: [
    'Chrome'
  ],
  launch_in_ci: [
    'Chrome'
  ],
  browser_args: {
    Chrome: {
      ci: [
        // --no-sandbox is needed when running Chrome inside a container
        process.env.CI ? '--no-sandbox' : null,
        '--headless',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-software-rasterizer',
        '--mute-audio',
        '--remote-debugging-port=0',
        '--window-size=1440,900'
      ].filter(Boolean)
    }
  }
};
