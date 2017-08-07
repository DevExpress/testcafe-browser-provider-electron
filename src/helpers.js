import CONSTANTS from './constants';
import ERRORS from './errors';

const simplifyMenuItemLabel = label => label.replace(/[\s&]/g, '').toLowerCase();

const MENU_ITEM_INDEX_RE = /\[(\d+)\]$/;

const MODIFIERS_KEYS_MAP = {
    'shift': 'shiftKey',
    'ctrl':  'ctrlKey',
    'alt':   'altKey',
    'meta':  'metaKey'
};

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

export default class Helpers {
    constructor (ipc) {
        this.ipc = ipc;
    }

    async getMainMenu () {
        return wrapMenu(CONSTANTS.mainMenuType, await this.ipc.getMainMenu());
    }

    async getContextMenu () {
        return wrapMenu(CONSTANTS.contextMenuType, await this.ipc.getContextMenu());
    }

    async clickOnMenuItem (menuItem, modifiers = {}) {
        var menuItemSnapshot = typeof menuItem === 'string' ? await this.getMenuItem(menuItem) : menuItem;

        if (!menuItemSnapshot)
            throw new Error(ERRORS.invalidMenuItemArgument);

        await this.ipc.clickOnMenuItem(menuItemSnapshot[CONSTANTS.typeProperty], menuItemSnapshot[CONSTANTS.indexProperty], ensureModifiers(modifiers));
    }

    async setElectronDialogHandler (fn, context) {
        await this.ipc.setDialogHandler(fn, context);
    }

    async getMenuItem (menuItemSelector) {
        var menuItemPath = menuItemSelector.split(/\s*>\s*/).map(simplifyMenuItemLabel);
        var menu         = menuItemPath[0] === 'contextmenu' ? await this.getContextMenu() : await this.getMainMenu();

        if (menuItemPath[0] === 'contextmenu' || menuItemPath[0] === 'mainmenu')
            menuItemPath.shift();

        return findMenuItem(menu, menuItemPath);
    }
}
