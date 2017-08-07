import vm from 'vm';
import Promise from 'pinkie';
import { IPC } from 'node-ipc';
import CONSTANTS from './constants';
import MESSAGES from './messages';


export class Server {
    constructor (config) {
        this.id            = config.serverId;
        this.ipc           = new IPC();
        this.server        = null;
        this.socket        = null;
        this.socketPromise = null;
        this.injectingStatus = null;
        this.injectingStatusPromise = null;
    }

    _emitWithResponse (event, data) {
        return new Promise(resolve => {
            this.server.on(event + MESSAGES.responsePostfix, result => {
                this.server.off(event + MESSAGES.responsePostfix, '*');
                resolve(result);
            });

            if (data)
                this.server.emit(this.socket, event, data);
            else
                this.server.emit(this.socket, event);
        });
    }

    _startIpcServer () {
        return new Promise(resolve => {
            this.ipc.serve(() => resolve(this.ipc.server));

            this.ipc.server.start();
        });
    }

    _getIpcSocket () {
        return new Promise(resolve => this.server.on('connect', resolve));
    }

    _getInjectingStatusPromise () {
        return new Promise(resolve => {
            this.server.on(MESSAGES.getInjectingStatus, data => {
                this.server.off(MESSAGES.getInjectingStatus, '*');
                resolve(data);
            });
        });
    }

    async start () {
        this.ipc.config.id     = this.id;
        this.ipc.config.silent = true;

        this.server = await this._startIpcServer();

        if (!this.socketPromise)
            this.socketPromise = this._getIpcSocket();

        return this.server;
    }

    async connect () {
        if (this.socket)
            return;

        if (!this.socketPromise)
            this.socketPromise = this._getIpcSocket();

        if (!this.injectingStatusPromise)
            this.injectingStatusPromise = this._getInjectingStatusPromise();

        this.socket = await this.socketPromise;
    }

    stop () {
        this.server.stop();
    }

    async setDialogHandler (fn, context) {
        return await this._emitWithResponse(MESSAGES.setDialogHandler, [
            fn && fn.toString() || null,
            context
        ]);
    }

    async getMenuItems (menuType) {
        return await this._emitWithResponse(MESSAGES.getMenuItems, [menuType]);
    }

    async clickOnMenuItem (menuType, menuItemProperties, modifiers) {
        var descriptiveProperties = JSON.parse(JSON.stringify(menuItemProperties, [
            CONSTANTS.menuPathProperty,
            'commandId'
        ]));

        return await this._emitWithResponse(MESSAGES.clickOnMenuItem, [menuType, descriptiveProperties, modifiers]);
    }

    async getInjectingStatus () {
        if (this.injectingStatus)
            return this.injectingStatus;

        if (!this.injectingStatusPromise)
            this.injectingStatusPromise = this._getInjectingStatusPromise();

        return await this.injectingStatusPromise;
    }

    async terminateProcess () {
        return await this._emitWithResponse(MESSAGES.terminateProcess);
    }
}

export class Client {
    constructor (config, { dialogHandler, contextMenuHandler, windowHandler }) {
        this.id       = config.clientId;
        this.serverId = config.serverId;
        this.ipc      = new IPC();
        this.client   = null;

        this.dialogHandler      = dialogHandler;
        this.contextMenuHandler = contextMenuHandler;
        this.windowHandler      = windowHandler;
    }

    _connectToIpcServer () {
        return new Promise(resolve => {
            this.ipc.connectTo(this.serverId, resolve);
        });
    }

    _updateDialogHandlerStatus () {
        if (this.dialogHandler.fn && !this.dialogHandler.handledDialog)
            this.dialogHandler.hadNoExpectedDialogs = true;
    }

    _setupHandler (event, handler) {
        this.client.on(event, async args => {
            var result = await handler.apply(this, args);

            this.client.emit(event + MESSAGES.responsePostfix, result);
        });

        require('electron').ipcMain.on(event, async (e, args) => {
            var result = await handler.apply(this, args);

            e.sender.send(event + MESSAGES.responsePostfix, result);
        });
    }

    _serializeMenuItems (menuItems) {
        var x = JSON.parse(JSON.stringify(menuItems, (key, value) => {
            if (!key || CONSTANTS.menuItemSerializableProperties.indexOf(key) >= 0 || Number.isInteger(Number(key)))
                return value;

            if (key === 'submenu' && value)
                return value.items;

            return void 0;
        }));

        return x;
    }

    _getMenu (menuType) {
        switch (menuType) {
            case CONSTANTS.mainMenuType:
                return require('electron').Menu.getApplicationMenu();

            case CONSTANTS.contextMenuType:
                return this.contextMenuHandler.menu;
        }

        return null;
    }

    setDialogHandler (fn, context) {
        this._updateDialogHandlerStatus();

        this.dialogHandler.handledDialog = false;

        if (!fn) {
            this.dialogHandler.fn = null;
            return;
        }

        this.dialogHandler.fn = vm.runInNewContext(`(${fn})`, context || {});
    }

    getMenuItems (menuType) {
        var menu = this._getMenu(menuType);

        return this._serializeMenuItems(menu.items);
    }

    clickOnMenuItem (menuType, menuItemProperties, modifiers) {
        var menu = this._getMenu(menuType);

        if (!menu)
            return;

        var parentMenu = menuItemProperties[CONSTANTS.menuPathProperty].reduce((currentMenu, id) => currentMenu.commandsMap[id].submenu, menu);
        var menuItem   = parentMenu.commandsMap[menuItemProperties.commandId];

        menuItem.click(menuItem, this.windowHandler.window, modifiers);
    }

    sendInjectingStatus (status) {
        this.client.emit(MESSAGES.getInjectingStatus, status);
    }

    terminateProcess () {
        setTimeout(() => process.exit(0), 0);
    }

    async connect () {
        this.ipc.config.id     = this.id;
        this.ipc.config.silent = true;

        await this._connectToIpcServer();

        this.client = this.ipc.of[this.serverId];

        this._setupHandler(MESSAGES.setDialogHandler, this.setDialogHandler);
        this._setupHandler(MESSAGES.getMenuItems, this.getMenuItems);
        this._setupHandler(MESSAGES.clickOnMenuItem, this.clickOnMenuItem);
        this._setupHandler(MESSAGES.terminateProcess, this.terminateProcess);
    }

}
