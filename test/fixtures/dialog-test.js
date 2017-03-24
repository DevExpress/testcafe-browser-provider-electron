import { testPage } from '../config';
import { ClientFunction } from 'testcafe';
import { mainMenu, setElectronDialogHandler, menuClick } from 'testcafe-browser-provider-electron';


fixture `Dialog`
    .page(testPage);

const checkDialogHandled = ClientFunction(() => window.dialogResult);

test('Should handle Open Dialog', async t => {
    var menu = await mainMenu();

    await setElectronDialogHandler(type => type + ' handled');

    await menuClick(menu.items[0].submenu.items[1]);

    await t.expect(checkDialogHandled()).eql('open-dialog handled');
});
