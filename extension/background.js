browser.browserAction.onClicked.addListener(async () => {
  await browser.tabs.create({
    url: "debug-page/index.html"
  });
});
