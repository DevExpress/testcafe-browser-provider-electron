import path from 'path';
import { statSync } from 'fs';
import { spawn } from 'child_process';
import Promise from 'pinkie';
import browserTools from 'testcafe-browser-tools';
import OS from 'os-family';
import { getFreePorts } from 'endpoint-utils';
import NodeDebug from './node-debug';
import NodeInspect from './node-inspect';
import isAbsolute from './utils/is-absolute';
import getConfig from './utils/get-config';
import getHookCode from './hook';
import { Server as IPCServer } from './ipc';
import Helpers from './helpers';
import setupTestCafeMocks from './testcafe-mocks';
import CONSTANTS from './constants';
import ERRORS from './errors';

import testRunTracker from 'testcafe/lib/api/test-run-tracker';

function startElectron (config, ports) {
    var cmd            = '';
    var args           = null;
    var debugPortsArgs = [`--debug-brk=${ports[0]}`, `--inspect-brk=${ports[1]}`];
    var extraArgs      = config.appArgs || [];

    if (OS.mac && statSync(config.electronPath).isDirectory()) {
        cmd  = 'open';
        args = ['-naW', `"${config.electronPath}"`, '--args'].concat(debugPortsArgs, extraArgs);
    }
    else {
        cmd  = config.electronPath;
        args = debugPortsArgs.concat(extraArgs);
    }

    spawn(cmd, args, { stdio: 'ignore' });
}

async function injectHookCode (client, code) {
    await client.connect();
    await client.evaluate(code);

    client.dispose();
}


const ElectronBrowserProvider = {
    isMultiBrowser: true,
    openedBrowsers: {},

    _getBrowserHelpers () {
        var testRun = testRunTracker.resolveContextTestRun();
        var id      = testRun.browserConnection.id;

        return ElectronBrowserProvider.openedBrowsers[id].helpers;
    },

    async openBrowser (id, pageUrl, mainPath) {
        if (!isAbsolute(mainPath))
            mainPath = path.join(process.cwd(), mainPath);

        var config    = getConfig(id, mainPath);
        var ipcServer = new IPCServer(config);

        await ipcServer.start();

        var ports = await getFreePorts(2);

        startElectron(config, ports, ipcServer);

        var hookCode      = getHookCode(config, pageUrl);
        var debugClient   = new NodeDebug(ports[0]);
        var inspectClient = new NodeInspect(ports[1]);

        await Promise.race([
            injectHookCode(debugClient, hookCode),
            injectHookCode(inspectClient, hookCode)
        ]);

        await ipcServer.connect();

        var injectingStatus = await ipcServer.getInjectingStatus();

        if (!injectingStatus.completed) {
            await ipcServer.terminateProcess();

            ipcServer.stop();

            throw new Error(ERRORS.render(ERRORS.mainUrlWasNotLoaded, {
                mainWindowUrl: config.mainWindowUrl,
                openedUrls:    injectingStatus.openedUrls
            }));
        }

        this.openedBrowsers[id] = {
            config:  config,
            ipc:     ipcServer,
            helpers: new Helpers(ipcServer)
        };
    },

    async closeBrowser (id) {
        await this.openedBrowsers[id].ipc.terminateProcess();

        this.openedBrowsers[id].ipc.stop();

        delete this.openedBrowsers[id];
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
    },

    //Helpers
    async getMainMenu () {
        return ElectronBrowserProvider._getBrowserHelpers().getMainMenu();
    },


    async getContextMenu () {
        return ElectronBrowserProvider._getBrowserHelpers().getContextMenu();
    },

    async clickOnMenuItem (menuItem, modifiers = {}) {
        return ElectronBrowserProvider._getBrowserHelpers().clickOnMenuItem(menuItem, modifiers);
    },

    async setElectronDialogHandler (fn, context) {
        return ElectronBrowserProvider._getBrowserHelpers().setElectronDialogHandler(fn, context);
    },

    async getMenuItem (menuItemSelector) {
        return ElectronBrowserProvider._getBrowserHelpers().getMainMenu(menuItemSelector);
    },

    mainWindowUrl () {
        var testRun = testRunTracker.resolveContextTestRun();

        if (!testRun)
            return CONSTANTS.blankPage;

        var id = testRun.browserConnection.id;

        return ElectronBrowserProvider.openedBrowsers[id].config.mainWindowUrl;
    }


};

export { ElectronBrowserProvider as default };

setupTestCafeMocks(ElectronBrowserProvider);
