import { ClientFunction } from 'testcafe';
import { setElectronDialogHandler, clickOnMenuItem } from 'testcafe-browser-provider-electron';
import shouldHaveError from '../helpers/should-have-error';


fixture `Dialog`;

const checkDialogHandled = ClientFunction(() => window.dialogResult);

test('Should handle Open Dialog', async t => {
    await setElectronDialogHandler(type => type + ' handled');

    await clickOnMenuItem('Test > Dialog');

    await t.expect(checkDialogHandled()).eql('open-dialog handled');
});

test('Should throw an Error if there was an unexpected dialog', async t => {
    shouldHaveError(error => error.errMsg === 'Error: An unexpected Electron dialog appeared');

    await clickOnMenuItem('Test > Dialog');

    await t.wait(3000);
});

test('Should throw an Error if there was no expected dialog', async t => {
    shouldHaveError(error => error.errMsg === 'Error: An expected Electron dialog didn\'t appear');

    await setElectronDialogHandler(type => type + ' handled');

    await t.wait(3000);
});
