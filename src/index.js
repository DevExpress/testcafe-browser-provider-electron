import path from 'path';
import { statSync } from 'fs';
import browserTools from 'testcafe-browser-tools';
import { exec as nodeExec } from 'child_process';
import Promise from 'pinkie';
import OS from 'os-family';
import promisify from 'pify';
import nodeFreePort from 'freeport';
import NodeDebug from './node-debug';
import isAbsolute from './utils/is-absolute';
import getConfig from './utils/get-config';
import getHookCode from './hook';
import MESSAGES from './messages';
import CONSTANTS from './constants';

import { ClientFunction } from 'testcafe';


const getFreePort = promisify(nodeFreePort, Promise);
const exec = promisify(nodeExec, Promise);

const simplifyMenuItemLabel = label => label.replace(/[\s&]/g, '').toLowerCase();

const MENU_ITEM_INDEX_RE = /\[(\d+)\]$/;

const MODIFIERS_KEYS_MAP = {
    'shift': 'shiftKey',
    'ctrl':  'ctrlKey',
    'alt':   'altKey',
    'meta':  'metaKey'
};

/* eslint-disable no-undef */
function terminateElectron () {
    setTimeout(function () {
        require('electron').remote.process.exit(0);
    }, 100);

    return true;
}

const getMainMenu = ClientFunction(() => {
    return require('electron').remote.Menu.getApplicationMenu();
});

const getContextMenu = ClientFunction(() => {
    return require('electron').remote.getGlobal(contextMenuGlobal);
}, { dependencies: CONSTANTS });

const doClickOnMenuItem = ClientFunction((menuType, menuItemIndex, modifiers) => {
    var remote = require('electron').remote;
    var menu   = null;

    switch (menuType) {
        case mainMenuType:
            menu = remote.Menu.getApplicationMenu();
            break;

        case contextMenuType:
            menu = remote.getGlobal(contextMenuGlobal);
            break;
    }

    if (!menu)
        return;

    var menuItem = menuItemIndex
        .reduce((m, i) => m.items[i].submenu || m.items[i], menu);

    menuItem.click(menuItem, require('electron').remote.getCurrentWindow(), modifiers);
}, { dependencies: CONSTANTS });

const doSetElectronDialogHandler = ClientFunction(serializedHandler => {
    var { ipcRenderer } = require('electron');

    ipcRenderer.send(setHandler, serializedHandler);
}, { dependencies: MESSAGES });
/* eslint-enable no-undef */

const TERMINATE_ELECTRON_SCRIPT = terminateElectron.toString();

function startElectron (config, port) {
    var cmd       = '';
    var extraArgs = config.appArgs ? ' ' + config.appArgs.join(' ') : '';

    if (OS.win)
        cmd = `start /D "${path.dirname(config.electronPath)}" .\\${path.basename(config.electronPath)} --debug-brk=${port}${extraArgs}`;
    else if (OS.mac && statSync(config.electronPath).isDirectory())
        cmd = `open -n -a "${config.electronPath}" --args --debug-brk=${port}${extraArgs}`;
    else
        cmd = `"${config.electronPath}" --debug-brk=${port}${extraArgs} 0<&- >/dev/null 2>&1 &`;

    return exec(cmd);
}

function wrapMenu (type, menu, index = []) {
    if (!menu)
        return null;

    for (var i = 0; i < menu.items.length; i++) {
        var currentIndex = index.concat(i);
        var item         = menu.items[i];

        item[CONSTANTS.typeProperty]  = type;
        item[CONSTANTS.indexProperty] = currentIndex;

        if (item.submenu)
            wrapMenu(type, item.submenu, currentIndex);
    }

    return menu;
}

function findMenuItem (menu, menuItemPath) {
    var menuItem = null;

    for (let i = 0; menu && i < menuItemPath.length; i++) {
        const indexMatch = menuItemPath[i].match(MENU_ITEM_INDEX_RE);
        const index      = indexMatch ? Number(indexMatch[1]) - 1 : 0;
        const label      = indexMatch ? menuItemPath[i].replace(MENU_ITEM_INDEX_RE, '') : menuItemPath[i];

        menuItem = menu.items.filter(item => simplifyMenuItemLabel(item.label) === label)[index];

        menu = menuItem && menuItem.submenu || null;
    }

    return menuItem || null;
}

function ensureModifiers (srcModifiers = {}) {
    var result = {};

    Object.keys(MODIFIERS_KEYS_MAP).forEach(mod => result[MODIFIERS_KEYS_MAP[mod]] = !!srcModifiers[mod]);

    return result;
}

const ElectronBrowserProvider = {
    isMultiBrowser: true,

    async openBrowser (id, pageUrl, mainPath) {
        if (!isAbsolute(mainPath))
            mainPath = path.join(process.cwd(), mainPath);

        var config = getConfig(mainPath);

        var port = config.port || await getFreePort();

        await startElectron(config, port);

        var client = new NodeDebug(port);

        await client.connect();
        await client.evaluate(getHookCode(config, pageUrl));

        client.dispose();
    },

    async closeBrowser (id) {
        await this.runInitScript(id, TERMINATE_ELECTRON_SCRIPT);
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
        return wrapMenu(CONSTANTS.mainMenuType, await getMainMenu());
    },

    async getContextMenu () {
        return wrapMenu(CONSTANTS.contextMenuType, await getContextMenu());
    },

    async clickOnMenuItem (menuItem, modifiers = {}) {
        var menuItemSnapshot = typeof menuItem === 'string' ? await ElectronBrowserProvider.getMenuItem(menuItem) : menuItem;

        if (!menuItemSnapshot)
            throw new Error('Invalid menu item argument');

        await doClickOnMenuItem(menuItemSnapshot[CONSTANTS.typeProperty], menuItemSnapshot[CONSTANTS.indexProperty], ensureModifiers(modifiers));
    },

    async setElectronDialogHandler (fn, context) {
        await doSetElectronDialogHandler({
            fn:  fn.toString(),
            ctx: context
        });
    },

    async getMenuItem (menuItemSelector) {
        var menuItemPath = menuItemSelector.split(/\s*>\s*/).map(simplifyMenuItemLabel);
        var menu         = menuItemPath[0] === 'contextmenu' ? await ElectronBrowserProvider.getContextMenu() : await ElectronBrowserProvider.getMainMenu();

        if (menuItemPath[0] === 'contextmenu' || menuItemPath[0] === 'mainmenu')
            menuItemPath.shift();

        return findMenuItem(menu, menuItemPath);
    }
};

export { ElectronBrowserProvider as default };
