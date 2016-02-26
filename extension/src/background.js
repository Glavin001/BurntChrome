chrome.webRequest.onBeforeRequest.addListener(
    function(info) {
        var request = info['url'];
        return {cancel: (request.search("/.*\.google\..*/") == -1)}
    },

    {
        urls: ["<all_urls>"]
    },

    ["blocking"]
);
