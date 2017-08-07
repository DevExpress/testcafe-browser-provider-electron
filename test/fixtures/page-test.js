fixture `Electron page`;

test('Check page content', async t => {
    var header = await t.eval(() => document.querySelector('body > h1').textContent);

    await t.expect(header).eql('HELLO ELECTRON!');
});
