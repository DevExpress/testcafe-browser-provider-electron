# testcafe-browser-provider-electron
[![Build Status](https://travis-ci.org/DevExpress/testcafe-browser-provider-electron.svg)](https://travis-ci.org/DevExpress/testcafe-browser-provider-electron)

This is the **electron** browser provider plugin for [TestCafe](http://devexpress.github.io/testcafe).

## Install

```
npm install testcafe-browser-provider-electron
```

## Usage
First, create a `.testcafe-electron-rc` file in root directory of your Electron app (for more info see the Config section):
```
{
  "mainWindowUrl": "./index.html"
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

## Config
Below is complete list of all configuration options that you can put into `.testcafe-electron-rc`.

 - `mainWindowUrl` __(mandatory)__ - specifies URL used for the main window page of the appplication. 
 If you use `file://` urls, you can also specify a relative (to the application directory) or an absolute path to the file of the page.
 - `appPath` __(optional)__ - alters path to the application. By default, application path is the part after `electron:` 
 of the string used in TestCafe CLI or API. You can override it by specifying an absolute path, or append a relative path from 'appPath'. 
 - `appArgs` __(optional)__ - overrides application commandline arguments with the values specified in this option. It should be an array or an object with numeric keys.
 - `disableNavigateEvents` __(optional)__ - if you use `did-navigate` ow `will-navigate` webContent events to prevent navigation, you should disable it by setting this option to `true`.
 - `openDevTools` __(optional)__ - if `true`, DevTools will be opened just before tests start
 .
## Author
Developer Express Inc. (https://devexpress.com)
