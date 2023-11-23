const customLaunchers = {
  // Sandbox does not work in un-privileged dockers, so
  // use a custom launcher when run in a docker container
  ChromeInDocker: {
    base: 'ChromeHeadless',
    flags: ['--no-sandbox', '--headless', '--disable-gpu', '--disable-translate', '--disable-extensions'],
  },

  // All sorts of BrowserStack browsers, you can create your using:
  // https://www.browserstack.com/automate/capabilities
  ChromeWindows: {
    base: 'BrowserStack',
    browser: 'Chrome',
    os: 'Windows',
    os_version: '11',
  },
  Chrome80Windows: {
    base: 'BrowserStack',
    browser: 'Chrome',
    os: 'Windows',
    os_version: '11',
    browser_version: '80.0',
  },
  Edge88: {
    base: 'BrowserStack',
    browser: 'Edge',
    os: 'Windows',
    os_version: '11',
    browserVersion: '88.0',
  },
  Firefox78: {
    base: 'BrowserStack',
    browser: 'Firefox',
    os: 'Windows',
    os_version: '11',
    browser_version: '78.0',
  },
  Opera70: {
    base: 'BrowserStack',
    browser: 'Opera',
    os: 'Windows',
    os_version: '11',
    browser_version: '70.0',
  },
  Safari17: {
    base: 'BrowserStack',
    browser: 'Safari',
    os: 'OS X',
    os_version: 'Sonoma',
  },
  Safari14: {
    base: 'BrowserStack',
    browser: 'Safari',
    os: 'OS X',
    os_version: 'Big Sur',
  },
  iOS: {
    base: 'BrowserStack',
    device: 'iPhone 15',
    real_mobile: 'true',
    os: 'ios',
    os_version: '17',
  },
  AndroidChrome: {
    base: 'BrowserStack',
    browser: 'chrome',
    device: 'Samsung Galaxy S23',
    real_mobile: 'true',
    os: 'Android',
    os_version: '13.0',
  },
  Android11Samsung: {
    base: 'BrowserStack',
    browser: 'samsung',
    device: 'Samsung Galaxy S21',
    real_mobile: 'true',
    os: 'Android',
    os_version: '11.0',
  },
  Android6Chrome: {
    base: 'BrowserStack',
    browser: 'chrome',
    device: 'Samsung Galaxy S7',
    real_mobile: 'true',
    os: 'Android',
    os_version: '6.0',
  },
};

module.exports = { customLaunchers };
