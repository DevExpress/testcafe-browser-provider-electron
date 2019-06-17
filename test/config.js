var path = require('path');
var fs   = require('fs');


class Config {
    constructor () {
        this.reset();
    }

    static _getAppPath () {
        return 'test/test-app';
    }

    static _getAppPathAsar () {
        return 'test/test-app.asar';
    }

    static _getTestPage () {
        return 'file://' + path.join(__dirname, 'test-app/index.html');
    }

    static _getTestPageAsar () {
        return 'file://' + path.join(__dirname, 'test-app.asar/index.html');
    }

    static _writeToConfigFile (testPage) {
        var configString = fs.readFileSync('./test/config.json').toString();
        var config       = JSON.parse(configString);

        config.testPage = testPage;

        fs.writeFileSync('./test/config.json', JSON.stringify(config)+ '\r\n');
    }

    reset () {
        this.appPath  = '';
        this.testPage = '';

        Config._writeToConfigFile(this.testPage);
    }

    switchToUnpackedApp () {
        this.appPath  = Config._getAppPath();
        this.testPage = Config._getTestPage();

        Config._writeToConfigFile(this.testPage);
    }

    switchToAsarApp () {
        this.appPath  = Config._getAppPathAsar();
        this.testPage = Config._getTestPageAsar();

        Config._writeToConfigFile(this.testPage);
    }
}

module.exports = new Config();
