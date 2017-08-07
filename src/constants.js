export default {
    configFileName:          '.testcafe-electron-rc',
    mainMenuType:            'mainMenu',
    contextMenuType:         'contextMenu',
    typeProperty:            '%type%',
    indexProperty:           '%index%',
    connectionRetryDelay:    300,
    maxConnectionRetryCount: 10,
    loadingTimeout:          3000,

    menuSerializableProperties: [
        'items', 'groupsMap', 'commandsMap', 'label', 'submenu', 'type', 'role', 'accelerator',
        'icon', 'sublabel', 'enabled', 'visible', 'checked', 'commandId'
    ],

    testUrlMarker:       'ELECTRON MAIN WINDOW URL',
    testUrlMarkerRegExp: /ELECTRON\s*MAIN\s*WINDOW\s*URL/i
};
