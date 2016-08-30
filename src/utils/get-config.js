import { readFileSync } from 'fs';
import path from 'path';
import resolveFileUrl from './resolve-file-url';


export default function (appPath) {
    var configPath   = path.join(appPath, '.testcafe-electron-rc');
    var configString = readFileSync(configPath).toString();

    var config = JSON.parse(configString);

    if (config.mainWindowUrl.indexOf('file:') === 0)
        config.mainWindowUrl = resolveFileUrl(config.mainWindowUrl, appPath);

    return config;
}
