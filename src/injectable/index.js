module.exports = function (config, testPageUrl) {
    var Module = require('module');

    var origModuleLoad = Module._load;

    Module._load = function (...args) {
        const isMain               = args[2];
        const isDefaultElectronApp = isMain && args[0].endsWith('electron\\dist\\resources\\default_app.asar\\main.js');

        if (isDefaultElectronApp) {
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
