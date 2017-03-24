import { testPage } from '../config';
import { ClientFunction } from 'testcafe';
import { mainMenu, contextMenu, menuClick } from 'testcafe-browser-provider-electron';


fixture `Menu`
    .page(testPage);

const checkMainMenuClicked    = ClientFunction(() => window.mainMenuClicked);
const checkContextMenuClicked = ClientFunction(() => window.contextMenuClicked);

test('Should click on main menu', async t => {
    var menu = await mainMenu();

    await menuClick(menu.items[0].submenu.items[0]);

    await t.expect(checkMainMenuClicked()).ok();
});

test('Should click on context menu', async t => {
    await t.rightClick('body');

    var menu = await contextMenu();

    await menuClick(menu.items[0]);

    await t.expect(checkContextMenuClicked()).ok();
});
