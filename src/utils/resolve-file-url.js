import path from 'path';
import isAbsolute from './is-absolute';


export default function (url, appPath) {
    var urlPath = decodeURIComponent(url.replace('file://', ''));

    if (isAbsolute(urlPath))
        return path.resolve(urlPath);

    return path.resolve(appPath, urlPath);
}
