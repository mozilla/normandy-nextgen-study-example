/* eslint-env node */

const defaultConfig = {
  run: {
    firefox: process.env.FIREFOX_BINARY || "firefoxdeveloperedition",
    browserConsole: true,
    startUrl: ["about:debugging#/runtime/this-firefox"],
    pref: ["extensions.legacy.enabled=true", "extensions.experiments.enabled=true"],
  },
};

module.exports = defaultConfig;
