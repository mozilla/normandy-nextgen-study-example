/* eslint-env node */

const defaultConfig = {
  run: {
    firefox: process.env.FIREFOX_BINARY || "firefoxdeveloperedition",
    browserConsole: true,
    startUrl: ["about:debugging"],
    pref: ["extensions.legacy.enabled=true"],
  },
};

module.exports = defaultConfig;
