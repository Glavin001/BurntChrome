# BurntChrome

> Software Engineering class project

## Contributing

1. Install [Node.js & `npm`](https://nodejs.org/)
2. Install the dependencies using `npm`:
 ```bash
npm install
```

3. Build the extension:
 ```bash
# Compile all files
npm compile
# Recompile files
npm start
```

4. To load your extension in Chrome, open up [`chrome://extensions/`](chrome://extensions/) in your browser and click `Developer mode` in the top right. Now click `Load unpacked extension…` and select the `extension` directory. You should now see your extension in the list.

 When you change or add code in your extension, just come back to this page and reload the page. Chrome will reload your extension. I recommend that you install [`Extensions Reloader`](https://chrome.google.com/webstore/detail/extensions-reloader/fimgfedafeadlieiabdeeaodndnlbhid).
5. Profit

We are using ES6 which is compiled down to ES5.
See https://github.com/lukehoban/es6features for a detailed list of features supported by ES6.
