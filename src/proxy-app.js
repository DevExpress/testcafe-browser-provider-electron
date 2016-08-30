import { BrowserWindow } from 'electron';
import proxyquire from 'proxyquire';
import getConfig from './utils/get-config';
import resolveFileUrl from './utils/resolve-file-url';


var testAppPath = process.env.TESTCAFE_ELECTRON_APP_PATH;
var testPageURL = process.env.TESTCAFE_ELECTRON_TEST_URL;

var config      = getConfig(testAppPath);
var origLoadURL = BrowserWindow.prototype.loadURL;


BrowserWindow.prototype.loadURL = function (url) {
    var testUrl = url;

    if (url.indexOf('file:') === 0)
        testUrl = resolveFileUrl(url);

    if (testUrl === config.mainWindowUrl) {
        BrowserWindow.prototype.loadURL = origLoadURL;

        url = testPageURL;

        if (config.openDevTools)
            this.webContents.openDevTools();
    }

    return origLoadURL.call(this, url);
};

proxyquire(testAppPath, {
    'electron': {
        BrowserWindow: BrowserWindow
    }
});
