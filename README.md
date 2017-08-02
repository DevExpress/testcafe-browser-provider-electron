# testcafe-browser-provider-electron
[![Build Status](https://travis-ci.org/DevExpress/testcafe-browser-provider-electron.svg)](https://travis-ci.org/DevExpress/testcafe-browser-provider-electron)

Use this plugin to test **Electron** applications witn [TestCafe](http://devexpress.github.io/testcafe).

## Getting Started

### Installation

```
npm install testcafe-browser-provider-electron
```

### Testing a JavaScript Application

If your JavaScript application runs in Electron, follow these steps to set up testing.

1. Create a `.testcafe-electron-rc` file in the root application directory. Include the following settings to this file.

    ```json
    {
      "mainWindowUrl": "./index.html"
    }
    ```

    An Electron app has a file that is loaded as a startup page. TestCafe waits until Electron loads this page and then runs tests. Specify the path to this file with `mainWindowUrl` option. If a relative path is specified, it is resolved from the `.testcafe-electron-rc` file location.

    For information about other options, see the [Configuration](#configuration) section.

2. Install the Electron module of the required version.

    ```sh
    npm install electron@latest
    ```

    The command above installs the latest version of the Electron executable.

3. Define the path to the config file. Use browser provider postfix: `electron:<path_to_testcafe-electron-rc_directory>`. Then run tests.

    ```sh
    testcafe "electron:/home/user/electron-app" "<tests_directory>/**/*.js"
    ```

4. The `.testcafe-electron-rc` file might be not in the application rood directory. In that case specify the path to the configuration file like this:

    ```json
    {
      "mainWindowUrl": "./index.html",
      "appPath": "/home/user/my_app"  
    }
    ```
    
    In this instance, the `appPath` directory will be used as a working directory of the Electron application.
    
### Testing an Executable Electron Application

If your Electron app is built it has `<your_app_name>.exe` or `electron.exe` file. In that case you don't need an Electron module to run tests. Perform the following steps instead.

1. In the application directory, create a `.testcafe-electron-rc` file with the following settings.

    ```json
    {
        "mainWindowUrl": "./index.html",
        "electronPath": "/home/user/myElectronApp/electron"
    }
    ```
    
    `mainWindowUrl` points to the application startup page; `electronPath` defines the path to your application's executable file. If you specify relative paths, they will be resolved from the `.testcafe-electron-rc` file location.
    
2. When you run tests, define the path to the configuration file. To do so, add the browser provider postfix: `electron:<path_to_testcafe-electron-rc_directory>`.

    ```sh
    testcafe "electron:/home/user/electron-app" "<tests_directory>/**/*.js"
    ```
    
### Launching Tests from API

To launch tests through the API, specify the application path with `electron:` prefix and pass it to the `browsers` method.

```js
testCafe
    .createRunner()
    .src('path/to/test/file.js')
    .browsers('electron:/home/user/electron-app')
    .run();
```

## Configuration

You can specify the following options in the `.testcafe-electron-rc` configuration file.

### mainWindowUrl

__Required.__ Specifies the URL of the application's main window page.
 For local application pages, you can also specify a relative (to the application directory) or an absolute path to the file of the page.

### appPath

__Optional.__ Alters path to the application, which, by default, must be located at the [default Electron app directory](https://github.com/electron/electron/blob/master/docs/tutorial/application-distribution.md#application-distribution).
You can use the `appPath` option to override the default path by specifying a new absolute path. Alternatively, you can append a relative path to the path specified after the "electron:" prefix.

### appArgs

__Optional.__ Overrides application command line arguments with the values specified in this option. It should be an array or an object with numeric keys.

### electronPath

__Optional__. Specifies a path to the electron binary. If `electronPath` is not specified, the [electron package](https://www.npmjs.com/package/electron) should be installed.
 On macOS, it can be either a path to the `electron` binary, or a path to the entire Electron.app (e.g. `/Applications/Electron.app`).

### enableNavigateEvents

__Optional.__ `testcafe-browser-provider-electron` suppresses `did-navigate` and `will-navigate`  webContent events because you will be unable to run tests if these events are used to prevent navigation. You can enable them back by setting this option to `true`.

### openDevTools

__Optional.__ If `true`, DevTools will be opened just before tests start.

## Helpers
You can use helper functions from the provider in your test files. Use ES6 import statement to access them.

```js
import { getMainMenu, clickOnMenuItem } from 'testcafe-browser-provider-electron';
```

### getMenuItem

Gets a snapshot of the specified menu item.

```js
async function getMenuItem (menuItemSelector)
```

Parameter          | Type   | Description
------------------ | ------ | -----
`menuItemSelector` | String | Consists of the menu type and menu item labels, separated by the `>` sign.

 For example, you can pass the following values in the `menuItemSelector` parameter.

 * `Main Menu > File > Open`
 * `Context Menu > Undo`

 The `Main Menu` menu type can be skipped.

 If there are several menu items with the same label on the same level, you can specify a one-based index
 in square brackets:

 * `Main Menu > Window > My Window [2]`

 This value corresponds to the second menu item with label `My Window` in the `Window` menu.

 Check the properties available in the snapshot
 [here](https://github.com/electron/electron/blob/master/docs/api/menu-item.md).

 ### getMainMenu

 Gets a snapshot of the application main menu.

 ```
 async function getMainMenu ()
 ```

 You can check properties available in the snapshot
 [here](https://github.com/electron/electron/blob/master/docs/api/menu.md).

 ### getContextMenu

 Gets a snapshot of the context menu.

 ```
 async function getContextMenu ()
 ```

 You can check properties available in the snapshot
 [here](https://github.com/electron/electron/blob/master/docs/api/menu.md),

 ### clickOnMenuItem

 Performs a click on the specified `menuItem`.

 ```
 async function clickOnMenuItem (menuItem, modifiers)
 ```

 Parameter          | Type   | Description
------------------ | ------ | -----
`menuItem` | String &#124; Object | The menu item to click.
`modifiers` | Object | Control keys held when clicking the menu item.

 If you specify a string in the `menuItem` parameter, it will be passed to the [getMenuItem](#getmenuitem) function and the returned value will be used. Alternatively, you can pass a value returned by the [getMenuItem](#getmenuitem), [getMainMenu](#getmainmenu) or [getContextMenu](#getcontextmenu) function.

 Use the `modifiers` parameter to specify state of the control keys (`Shift`, `Ctrl`, `Alt`, `Meta`). The default value is

 ```
 {
     shift: false,
     ctrl: false,
     alt: false,
     meta: false
 }
  ```

 **Examples**

 ```
 clickOnMenuItem('Main Menu > File > Open')
 ```

 ```
 clickOnMenuItem('File > Open')
 ```

 ```
 clickOnMenuItem((await getMainMenu()).items[0].submenu.items[0])
 ```

 ### setElectronDialogHandler

 Sets a function that will handle native Electron dialogs.

 ```
 async function setElectronDialogHandler (handler, dependencies)
 ```

  Parameter          | Type   | Description
------------------ | ------ | -----
`handler` | Function | A function that will handle Electron dialogs.
`dependencies` | Object | Variables passed to the `handler` function's scope as global variables.

 The `handler` function has the following signature.

 ```
 function handler (type, ...args)
 ```

 This function must be synchronous. It will be invoked with the dialog type `type`, and the arguments `args`
 from the original dialog function.

## Author
Developer Express Inc. (https://devexpress.com)
