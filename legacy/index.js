var Promise     = require('pinkie');
var ipcRenderer = require('electron').ipcRenderer;
var Helpers     = require('../lib/helpers');
var MESSAGES    = require('../lib/messages');


function _emitWithResponse (event, data) {
    return new Promise(function (resolve) {
        ipcRenderer.once(event + MESSAGES.responsePostfix, (e, data) => {
            resolve(data);
        });

        if (data)
            ipcRenderer.send(event, data);
        else
            ipcRenderer.send(event);
    });
}

var legacyIPC = {
    setDialogHandler: function (fn, context) {
        return _emitWithResponse(MESSAGES.setDialogHandler, [
            fn && fn.toString() || null,
            context
        ]);
    },

    getDialogHandlerStatus: function () {
        return _emitWithResponse(MESSAGES.getDialogHandlerStatus);
    },

    resetDialogHandler: function () {
        return _emitWithResponse(MESSAGES.resetDialogHandler);
    },

    getMainMenu: function () {
        return _emitWithResponse(MESSAGES.getMainMenu);
    },

    getContextMenu: function () {
        return _emitWithResponse(MESSAGES.getContextMenu);
    },

    clickOnMenuItem: function (menuType, menuItemIndex, modifiers) {
        return _emitWithResponse(MESSAGES.clickOnMenuItem, [menuType, menuItemIndex, modifiers]);
    }
};

module.exports = new Helpers(legacyIPC);
