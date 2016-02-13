# Burnt Chrome [![Build Status](https://travis-ci.org/Glavin001/BurntChrome.svg?branch=master)](https://travis-ci.org/Glavin001/BurntChrome)

> Class Project for CSCI 3428 Software Engineering

## About

### Documents

- [Risk Analysis](https://drive.google.com/open?id=1lOxLEEGWvbhaKKaLM5Oys0vn94d1937PmQm6UNcSkq8)
- [Requirements Specifications](https://drive.google.com/open?id=1k3z0ABU4Lxw3b5KyHMEdxxgWWG_033Yj4MgzTJdZ0QQ)

### Authors / Team Black

| [Evan Larose](https://github.com/LizardLeliel) | [Glavin Wiechert](https://github.com/Glavin001) | [Nathan Hernden](https://github.com/nhernden) | [Ziyun (Toby) Zhong](https://github.com/zhongziyun1993) |
| --- | --- | --- | --- |
| ![evan](https://avatars3.githubusercontent.com/u/7256908) | ![glavin](https://avatars0.githubusercontent.com/u/1885333) | ![nathan](https://avatars0.githubusercontent.com/u/13204557) | ![toby](https://avatars1.githubusercontent.com/u/3355559) |

## Contributing

1. Install [Node.js & `npm`](https://nodejs.org/)
2. Install the dependencies using `npm`:
 ```bash
npm install
```

3. Watch for file changes and compile the extension:
 ```bash
npm start
```

4. To load your extension in Chrome, open up [`chrome://extensions/`](chrome://extensions/) in your browser and click `Developer mode` in the top right. Now click `Load unpacked extension…` and select the `extension/` directory. You should now see your extension in the list.

 ![load extension](http://i.stack.imgur.com/vJexl.png)

 When you change or add code in your extension, just come back to the [`chrome://extensions/`](chrome://extensions/) page and reload the page. Chrome will reload your extension.
 I recommend that you install [`Extensions Reloader`](https://chrome.google.com/webstore/detail/extensions-reloader/fimgfedafeadlieiabdeeaodndnlbhid).
5. Profit

### Developing

We are using ES6 which is compiled down to ES5.
See https://github.com/lukehoban/es6features for a detailed list of features supported by ES6.

#### Commands

- `npm run compile`: Compile `extension/src/` to `extension/dist/` directory.
- `npm start` (or `npm run start`): Watch for file changes in `extension/src/` directory and compile changes to `extension/dist/` directory.


