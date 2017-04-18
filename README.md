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

 - `mainWindowUrl` __(required)__ - specifies URL used for the main window page of the appplication. 
 If you use `file://` urls, you can also specify a relative (to the application directory) or an absolute path to the file of the page.
 - `appPath` __(optional)__ - alters path to the application. By default, application path is the part after `electron:` 
 of the string used in TestCafe CLI or API. You can override it by specifying an absolute path, or append a relative path from 'appPath'. 
 - `appArgs` __(optional)__ - overrides application commandline arguments with the values specified in this option. It should be an array or an object with numeric keys.
 - `disableNavigateEvents` __(optional)__ - if you use `did-navigate` ow `will-navigate` webContent events to prevent navigation, you should disable it by setting this option to `true`.
 - `openDevTools` __(optional)__ - if `true`, DevTools will be opened just before tests start.
 
## Helpers
You can use some helper functions from provider in your test files. Use ES6 import statement to get them, like 
```js
import { getMainMenu, clickOnMenuItem } from 'testcafe-browser-provider-electron';
```
 - `async function getMenuItem (menuItemSelector)` - get a snapshot of the given menu item. `menuItemSelector` is a string that consists
 of menu type and menu item labels, separated by the `>` sign, e.g. `Main Menu > File > Open` or `Context Menu > Undo`. 
 The `Main Menu` menu type can be skipped. If there are a number of the specified menu items with the same label on the same level, 
 you can specify a one-based index in square brackets, e.g. `Main Menu > Window > My Window [2]` selects the second menu item with 
 label `My Window` in the `Window` menu. Check properties available in the snapshot [here](https://github.com/electron/electron/blob/master/docs/api/menu-item.md).

 - `async function getMainMenu ()` - get a snapshot of application main menu. You can check properties available in the snapshot 
 [here](https://github.com/electron/electron/blob/master/docs/api/menu.md). 
 
 - `async function getContextMenu ()` - get a snapshot of context menu. You can check properties available in the snapshot 
 [here](https://github.com/electron/electron/blob/master/docs/api/menu.md), 

 - `async function clickOnMenuItem (menuItem, modifiers)` - perform a click on the given `menuItem`. It can be a string, 
 in this case it will be passed to the `getMenuItem` function and the returned value will be used; or a value retrieved 
 with `getMenuItem`, `getMainMenu`, `getContextMenu` functions. 
 Also you can pass state of control keys (`Ctrl`, `Alt`, `Meta` etc.) in the `modifiers` argument, e.g. the default is 
 `{ shift: false, ctrl: false, alt: false, meta: false}`. Examples: `clickOnMenuItem('Main Menu > File > Open')`,
 `clickOnMenuItem('File > Open')`, `clickOnMenuItem((await getMainMenu()).items[0].submenu.items[0])`,
 
 - `async function setElectronDialogHandler (handler, dependencies)` - set a function `function handler (type, ...args)` that will handle native Electron dialogs. Specify global variables of the function in the `dependencies` argument. 
 Handler function must be synchronous and will be invoked with the dialog type `type`, and the arguments `args` from the original dialog function. 

## Author
Developer Express Inc. (https://devexpress.com)
