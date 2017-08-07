import { embeddingUtils } from 'testcafe';
import { TestRun as LegacyTestRun } from 'testcafe-legacy-api';
import { Proxy as HammerheadProxy } from 'testcafe-hammerhead';
import { UncaughtErrorInTestCode } from 'testcafe/lib/errors/test-run';
import { uncaughtJSError } from 'testcafe-legacy-api/lib/test-run-error/type';
import CONSTANTS from './constants';
import ERRORS from './errors';


function mockTestRun (provider) {
    var originalStart = embeddingUtils.TestRun.prototype.start;

    embeddingUtils.TestRun.prototype.start = function () {
        var id = this.browserConnection.id;

        if (!provider.openedBrowsers[id])
            return originalStart.call(this);

        var testRun          = this;
        var ipc              = provider.openedBrowsers[id].ipc;
        var beforeFnName     = ['beforeFn', 'beforeEachFn', 'fn'].filter(fn => this.test[fn])[0];
        var originalBeforeFn = this.test[beforeFnName];

        this.test[beforeFnName] = async function (...args) {
            await ipc.resetDialogHandler();

            return originalBeforeFn.apply(this, args);
        };

        var afterFnName     = ['afterEachFn', 'afterFn', 'fn'].filter(fn => this.test[fn])[0];
        var originalAfterFn = this.test[afterFnName];

        this.test[afterFnName] = async function (...args) {
            var result       = await originalAfterFn.apply(this, args);
            var dialogStatus = await ipc.getDialogHandlerStatus();

            if (dialogStatus.hadUnexpectedDialogs)
                testRun.addError(new UncaughtErrorInTestCode(ERRORS.unexpectedDialogAppeared));

            if (dialogStatus.hadNoExpectedDialogs)
                testRun.addError(new UncaughtErrorInTestCode(ERRORS.expectedDialogDidntAppear));

            return result;
        };

        return originalStart.call(this);
    };
}

function mockLegacyTestRun (provider) {
    var originalEmit = LegacyTestRun.prototype.emit;

    LegacyTestRun.prototype.emit = function (...args) {
        var id = this.browserConnection.id;

        if (!provider.openedBrowsers[id])
            return originalEmit.apply(this, args);

        var ipc = provider.openedBrowsers[id].ipc;

        if (args[0] === 'start') {
            ipc.resetDialogHandler();

            return originalEmit.apply(this, args);
        }
        else if (args[0] === 'done') {
            ipc
                .getDialogHandlerStatus()
                .then(async dialogStatus => {
                    if (dialogStatus.hadUnexpectedDialogs)
                        await this._addError({ type: uncaughtJSError, scriptErr: ERRORS.unexpectedDialogAppeared });

                    if (dialogStatus.hadNoExpectedDialogs)
                        await this._addError({ type: uncaughtJSError, scriptErr: ERRORS.expectedDialogDidntAppear });

                    originalEmit.apply(this, args);
                });

            return !!this.listeners(args[0]).length;
        }

        return originalEmit.apply(this, args);
    };
}

function mockProxy (provider) {
    var originalOpenSession = HammerheadProxy.prototype.openSession;

    HammerheadProxy.prototype.openSession = function (...args) {
        if (args[1].browserConnection.browserInfo.providerName !== 'electron' || !args[0] && args[0] !== 'about:blank' && !CONSTANTS.testUrlMarkerRegExp.test(args[0]))
            return originalOpenSession.apply(this, args);

        var id            = args[1].browserConnection.id;
        var mainWindowUrl = provider.openedBrowsers[id].config.mainWindowUrl;

        args[0]              = mainWindowUrl;
        args[1].test.pageUrl = mainWindowUrl;

        return originalOpenSession.apply(this, args);
    };
}

export default function (provider) {
    mockProxy(provider);
    mockTestRun(provider);
    mockLegacyTestRun(provider);
}
