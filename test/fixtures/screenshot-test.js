import path from 'path';
import { expect } from 'chai';
import { statSync } from 'fs';
import { tmpNameSync as getTempFileName } from 'tmp';
import { testPage } from '../config';


fixture `Screenshot`
    .page(testPage);

test('Take screenshot', async t => {
    var screenshotName = getTempFileName({ template: 'screenshot-XXXXXX.png' });
    var screenshotPath = path.join('.screenshots', screenshotName);

    await t.takeScreenshot(screenshotName);

    expect(statSync(screenshotPath).isFile()).to.be.true;
});
