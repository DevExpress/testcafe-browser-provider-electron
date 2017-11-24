import { Client } from '../ipc';
import resolveFileUrl from '../utils/resolve-file-url';
import CONSTANTS from '../constants';


const URL_QUERY_RE      = /\?(.*)$/;
const NAVIGATION_EVENTS = ['will-navigate', 'did-navigate'];

var ipc                = null;
var loadingTimeout     = null;
var openedUrls         = [];
var contextMenuHandler = { menu: null };
var windowHandler      = { window: null };

var dialogHandler = {
    fn:                   null,
    handledDialog:        false,
    hadUnexpectedDialogs: false,
    hadNoExpectedDialogs: false
};

function startLoadingTimeout () {
    if (loadingTimeout)
        return;

    loadingTimeout = setTimeout(() => {
        ipc.sendInjectingStatus({ completed: false, openedUrls });
    }, CONSTANTS.loadingTimeout);
}

function stopLoadingTimeout () {
    clearTimeout(loadingTimeout);

    loadingTimeout = 0;
}

function handleDialog (type, args) {
    if (!dialogHandler.fn) {
        dialogHandler.hadUnexpectedDialogs = true;
        return void 0;
    }

    dialogHandler.handledDialog = true;

    var handlerFunction = dialogHandler.fn;
    var handlerResult   = handlerFunction(type, ...args);
    var lastArg         = args.length ? args[args.length - 1] : null;

    if (typeof lastArg === 'function')
        lastArg(handlerResult);

    return handlerResult;
}

module.exports = function install (config, testPageUrl) {
    ipc = new Client(config, { dialogHandler, contextMenuHandler, windowHandler });

    ipc.connect();

    var { BrowserWindow, Menu, dialog } = require('electron');

    var { WebContents } = process.atomBinding('web_contents');

    var origLoadURL = BrowserWindow.prototype.loadURL;


    function parseUrl (url) {
        const queryMatch = url.match(URL_QUERY_RE);

        return {
            url:   url.replace(URL_QUERY_RE, ''),
            query: queryMatch && queryMatch[1]
        };
    }

    function buildUrl (parsedUrl) {
        if (!parsedUrl.query)
            return parsedUrl.url;

        return parsedUrl.url + '?' + parsedUrl.query;
    }

    BrowserWindow.prototype.loadURL = function (url) {
        startLoadingTimeout(config.mainWindowUrl);

        var parsedTestUrl = parseUrl(url);
        var parsedMainUrl = parseUrl(config.mainWindowUrl);

        if (parsedTestUrl.url.indexOf('file:') === 0)
            parsedTestUrl.url = resolveFileUrl(config.appPath, parsedTestUrl.url);

        openedUrls.push(buildUrl(parsedTestUrl));

        if (parsedTestUrl.url.toLowerCase() === parsedMainUrl.url.toLowerCase()) {
            stopLoadingTimeout();

            ipc.sendInjectingStatus({ completed: true });

            BrowserWindow.prototype.loadURL = origLoadURL;

            url = testPageUrl;

            windowHandler.window = this;

            if (config.openDevTools)
                this.webContents.openDevTools();
        }

        return origLoadURL.call(this, url);
    };

    Menu.prototype.popup = function () {
        contextMenuHandler.menu = this;
    };

    Menu.prototype.closePopup = function () {
        contextMenuHandler.menu = null;
    };

    if (!config.enableNavigateEvents) {
        var origOn = WebContents.prototype.on;

        WebContents.prototype.on = function (event, listener) {
            if (NAVIGATION_EVENTS.indexOf(event) > -1)
                return;

            origOn.call(this, event, listener);
        };
    }

    dialog.showOpenDialog = (...args) => handleDialog('open-dialog', args);

    dialog.showSaveDialog = (...args) => handleDialog('save-dialog', args);

    dialog.showMessageBox = (...args) => handleDialog('message-box', args);

    dialog.showErrorBox = (...args) => handleDialog('error-box', args);

    dialog.showCertificateTrustDialog = (...args) => handleDialog('certificate-trust-dialog', args);

    process.argv.splice(1, 2);
};

