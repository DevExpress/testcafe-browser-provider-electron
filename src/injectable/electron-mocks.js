import { Client } from '../ipc';
import resolveFileUrl from '../utils/resolve-file-url';
import CONSTANTS from '../constants';
import path from 'path';
import { format as urlFormat } from 'url';
import { statSync } from 'fs';

const URL_QUERY_RE      = /\?.*$/;
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

    var { Menu, dialog, app } = require('electron');

    var { WebContents } = process.atomBinding('web_contents');

    var origLoadURL = WebContents.prototype.loadURL;

    function stripQuery (url) {
        return url.replace(URL_QUERY_RE, '');
    }

    function isFileProtocol (url) {
        return url.indexOf('file:') === 0;
    }

    function getCustomAppPathDir () {
        let customAppPath = null;

        if (!config.appPath)
            return customAppPath;

        customAppPath = config.appPath;

        if (!statSync(customAppPath).isDirectory())
            customAppPath = path.dirname(customAppPath);

        return customAppPath;
    }

    WebContents.prototype.loadURL = function (url, options) {
        startLoadingTimeout(config.mainWindowUrl);

        let testUrl = stripQuery(url);

        if (isFileProtocol(url))
            testUrl = resolveFileUrl(config.appPath, testUrl);

        openedUrls.push(testUrl);

        if (testUrl.toLowerCase() === config.mainWindowUrl.toLowerCase()) {
            stopLoadingTimeout();

            ipc.sendInjectingStatus({ completed: true });

            WebContents.prototype.loadURL = origLoadURL;

            url = testPageUrl;

            windowHandler.window = this;

            if (config.openDevTools)
                this.openDevTools();
        }

        return origLoadURL.call(this, url, options);
    };

    WebContents.prototype.loadFile = function (filePath, options = {}) {
        const { query, search, hash } = options;
        const resolvedURL             = path.resolve(getCustomAppPathDir() || app.getAppPath(), filePath);

        return this.loadURL(urlFormat({
            protocol: 'file',
            slashes:  true,
            pathname: resolvedURL,
            query,
            search,
            hash
        }));
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

