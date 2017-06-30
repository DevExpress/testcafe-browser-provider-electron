import { win } from 'os-family';
import { statSync } from 'fs';
import path from 'path';
import isAbsolute from './is-absolute';


function wrapPathWithProtocol (filePath) {
    return `file://${ win ? '/' + filePath.toLowerCase().replace(/\\/g, '/') : filePath}`;
}

export default function (basePath, url) {
    var urlPath = decodeURIComponent(url.replace(win ? /^file:\/\/\/?/ : /^file:\/\//, ''));

    if (isAbsolute(urlPath))
        return wrapPathWithProtocol(path.join(urlPath));

    if (!statSync(basePath).isDirectory())
        basePath = path.dirname(basePath);

    return wrapPathWithProtocol(path.join(basePath, urlPath));
}
