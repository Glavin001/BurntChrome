
chrome.webRequest.onBeforeRequest.addListener(
  function(info) {
    console.log("Cat intercepted: " + info.url);
    // Redirect the lolcal request to a random loldog URL.
    var i = Math.round(Math.random() * loldogs.length);
    return {redirectUrl: loldogs[i]};
  },
  // filters
  {
    urls: [
      "*"
    ],
    //types: ["image"]
  },
  // extraInfoSpec
  ["blocking"]);
