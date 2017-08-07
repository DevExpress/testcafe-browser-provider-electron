import TestRun from 'testcafe/lib/test-run';
import { UncaughtErrorInTestCode } from 'testcafe/lib/errors/test-run';
import testRunTracker from 'testcafe/lib/api/test-run-tracker';


var originalAddError = TestRun.prototype.addError;

TestRun.prototype.addError = function (err, screenshotPath) {
    var predicate = this['%addErrorPredicate%'];

    var errorList = err.items ? err.items : [err];

    for (const error of errorList) {
        if (predicate && predicate(error)) {
            this['%addErrorPredicatePassed%'] = true;
            return;
        }
    }

    originalAddError.call(this, err, screenshotPath);
};

var originalEmit = TestRun.prototype.emit;

TestRun.prototype.emit = function (...args) {
    if (args[0] === 'done') {
        if (this['%addErrorPredicate%'] && !this['%addErrorPredicatePassed%'])
            this.addError(new UncaughtErrorInTestCode('AssertionError: The expected error didn\'t appear', ''));
    }

    return originalEmit.apply(this, args);
};

export default function (predicate) {
    var testRun = testRunTracker.resolveContextTestRun();

    testRun['%addErrorPredicate%'] = predicate;
}
