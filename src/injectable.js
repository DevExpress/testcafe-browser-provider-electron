function install (config, testPageUrl) {
    var { BrowserWindow, Menu, ipcMain, dialog } = require('electron');

    var vm             = require('vm');
    var OS             = require('os-family');
    var resolveFileUrl = require('./utils/resolve-file-url');

    var MESSAGES      = require('./messages');
    var CONSTANTS     = require('./constants');

    var NAVIGATION_EVENTS = ['will-navigate', 'did-navigate'];

    var { WebContents } = process.atomBinding('web_contents');

    var origLoadURL    = BrowserWindow.prototype.loadURL;

    var electronDialogsHandler = null;

    global[CONSTANTS.contextMenuGlobal] = null;

    function refineUrl (url) {
        if (OS.win)
            url = url.replace(/$file:\/\/(\w)/, 'file:///$1').toLowerCase();
        else if (OS.mac)
            url = url.toLowerCase();


        return url.replace(/\?.*$/, '');
    }

    BrowserWindow.prototype.loadURL = function (url) {
        var testUrl = refineUrl(url);

        if (url.indexOf('file:') === 0)
            testUrl = resolveFileUrl(config.appPath, testUrl);

        if (testUrl === config.mainWindowUrl) {
            BrowserWindow.prototype.loadURL = origLoadURL;

            url = testPageUrl;

            if (config.openDevTools)
                this.webContents.openDevTools();
        }

        return origLoadURL.call(this, url);
    };

    Menu.prototype.popup = function () {
        global[CONSTANTS.contextMenuGlobal] = this;
    };

    Menu.prototype.closePopup = function () {
        global[CONSTANTS.contextMenuGlobal]  = null;
    };

    if (!config.enableNavigateEvents) {
        var origOn = WebContents.prototype.on;

        WebContents.prototype.on = function (event, listener) {
            if (NAVIGATION_EVENTS.indexOf(event) > -1)
                return;

            origOn.call(this, event, listener);
        };
    }

    function handleDialog (type, args) {
        if (!electronDialogsHandler)
            return void 0;

        var handlerResult = electronDialogsHandler(type, ...args);
        var lastArg       = args.length ? args[args.length - 1] : null;

        if (typeof lastArg === 'function')
            lastArg(handlerResult);

        return handlerResult;
    }

    ipcMain.on(MESSAGES.setHandler, (event, arg) => {
        electronDialogsHandler = arg ? vm.runInNewContext(`(${arg.fn})`, arg.ctx || {}) : null;
    });

    dialog.showOpenDialog = (...args) => handleDialog('open-dialog', args);

    dialog.showSaveDialog = (...args) => handleDialog('save-dialog', args);

    dialog.showMessageBox = (...args) => handleDialog('message-box', args);

    dialog.showErrorBox = (...args) => handleDialog('error-box', args);

    dialog.showCertificateTrustDialog = (...args) => handleDialog('certificate-trust-dialog', args);

    process.argv.splice(1, 1);
}

module.exports = function (config, testPageUrl) {
    var Module = require('module');

    var origModuleLoad = Module._load;

    Module._load = function (...args) {
        if (args[2]) {
            if (config.appPath)
                args[0] = config.appPath;
            else
                config.appPath = require.resolve(args[0]);

            install(config, testPageUrl);
            Module._load = origModuleLoad;
        }

        return origModuleLoad.apply(this, args);
    };
};

