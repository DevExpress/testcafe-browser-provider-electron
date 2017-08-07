import { ClientFunction } from 'testcafe';
import { clickOnMenuItem, mainWindowUrl } from 'testcafe-browser-provider-electron';

fixture `Menu`
    .page(mainWindowUrl());

const checkMainMenuClicked    = ClientFunction(() => window.mainMenuClicked);
const checkContextMenuClicked = ClientFunction(() => window.contextMenuClicked);

test('Should click on main menu', async t => {
    await t.wait(1000);

    await clickOnMenuItem('Main menu > Test > Click');

    await t.expect(checkMainMenuClicked()).ok();
});

test('Should click on context menu', async t => {
    await t.rightClick('body');

    await clickOnMenuItem('Context Menu > Test');

    await t.expect(checkContextMenuClicked()).ok();
});
