
chrome.action.onClicked.addListener(() => {
  const app = chrome.runtime.getURL('htmls/app.html')
  chrome.tabs.create({
    url: app,
  })
})