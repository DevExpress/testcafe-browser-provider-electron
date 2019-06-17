var ASAR_PATH_RE = /\.asar$/;

export default function (appPath) {
    return ASAR_PATH_RE.test(appPath);
}
