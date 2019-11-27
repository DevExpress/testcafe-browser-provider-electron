import { sep } from 'path';

module.exports = function (config, testPageUrl) {
    var Module = require('module');

    var origModuleLoad = Module._load;

    Module._load = function (...args) {
        const isMain                     = args[2];
        const isNotBrowserInitMainModule = isMain &&
            args[0] !== 'electron/js2c/browser_init' && // >= Electron v7.0.0
            !args[0].endsWith('electron.asar' + sep + 'browser' + sep + 'init.js'); // <= Electron v6.1.5

        if (isNotBrowserInitMainModule) {
            if (config.appPath) {
                config.appEntryPoint = require.resolve(config.appPath);

                args[0] = config.appEntryPoint;
            }
            else
                config.appEntryPoint = require.resolve(args[0]);

            var installElectronMocks = require('./electron-mocks');

            installElectronMocks(config, testPageUrl);

            Module._load = origModuleLoad;
        }

        return origModuleLoad.apply(this, args);
    };
};
