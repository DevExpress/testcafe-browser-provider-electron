import path from 'path';
import browserTools from 'testcafe-browser-tools';
import { exec as nodeExec } from 'child_process';
import Promise from 'pinkie';
import OS from 'os-family';
import promisify from 'pify';
import isAbsolute from './utils/is-absolute';
import ELECTRON_PATH from 'electron';


const exec = promisify(nodeExec, Promise);


function startElectron (electronPath, appPath, env) {
    var electronEnv = Object.assign({}, process.env, env);

    var cmd = '';

    if (OS.win)
        cmd = `start /D "${path.dirname(electronPath)}" ${path.basename(electronPath)} "${appPath}`;
    else
        cmd = `"${electronPath}" "${appPath}" 0<&- >/dev/null 2>&1 &`;

    return exec(cmd, { env: electronEnv });
}

export default {
    isMultiBrowser: true,

    async openBrowser (id, pageUrl, appPath) {
        if (!isAbsolute(appPath))
            appPath = path.resolve(process.cwd(), appPath);

        var proxyAppPath = path.join(__dirname, './proxy-app.js');

        return startElectron(ELECTRON_PATH, proxyAppPath, {
            TESTCAFE_ELECTRON_TEST_URL: pageUrl,
            TESTCAFE_ELECTRON_APP_PATH: appPath
        });
    },

    async closeBrowser (id) {
        return browserTools.close(id);
    },

    async getBrowserList () {
        return ['${PATH_TO_ELECTRON_APP}'];
    },

    // TODO: implement validation ?
    async isValidBrowserName (/* browserName */) {
        return true;
    },

    async resizeWindow (id, width, height, currentWidth, currentHeight) {
        return browserTools.resize(id, currentWidth, currentHeight, width, height);
    },

    async takeScreenshot (id, screenshotPath) {
        return browserTools.screenshot(id, screenshotPath);
    }
};
