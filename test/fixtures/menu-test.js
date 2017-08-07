import { ClientFunction } from 'testcafe';
import { clickOnMainMenuItem, clickOnContextMenuItem } from 'testcafe-browser-provider-electron';
import { testPage } from '../config';


fixture `Menu`
    .page(testPage);

const checkMainMenuClicked    = ClientFunction(() => window.mainMenuClicked);
const checkContextMenuClicked = ClientFunction(() => window.contextMenuClicked);

test('Should click on main menu', async t => {
    await t.click('body');

    await clickOnMainMenuItem(['Test', 'Click']);

    await t.expect(checkMainMenuClicked()).ok();
});

test('Should click on context menu', async t => {
    await t.rightClick('body');

    await clickOnContextMenuItem(['Test']);

    await t.expect(checkContextMenuClicked()).ok();
});
