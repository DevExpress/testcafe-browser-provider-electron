# testcafe-browser-provider-electron
[![Build Status](https://travis-ci.org/DevExpress/testcafe-browser-provider-electron.svg)](https://travis-ci.org/DevExpress/testcafe-browser-provider-electron)

This is the **electron** browser provider plugin for [TestCafe](http://devexpress.github.io/testcafe).

## Install

```
npm install testcafe-browser-provider-electron
```

## Usage
First, create a `.testcafe-electron.json` file in root directory of your Electron app:
```
{
  "mainWindowUrl": "file://${APP_PATH}/index.html"
}
```

When you run tests from the command line, specify path to Electron app prefixed with "electron:" -

```
testcafe "electron:/home/user/electron-app" "path/to/test/file.js"
```


When you use API, pass the app path to the `browsers()` method:

```js
testCafe
    .createRunner()
    .src('path/to/test/file.js')
    .browsers('electron:/home/user/electron-app')
    .run();
```

## Author
Developer Express Inc. (https://devexpress.com)
