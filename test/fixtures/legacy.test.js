/*eslint-disable*/
"@fixture Legacy Dialog";
"@page Electron Main Window URL";

"@test"["Legacy Dialog Test"] = {
    "Test": function () {
        act.waitFor(function (cb) {
            var electronProvider = require('../../legacy');

            electronProvider
                .setElectronDialogHandler(function (type) {return type + ' handled'})
                .then(function () { return electronProvider.clickOnMenuItem('Test > Dialog') })
                .then(cb);
        });
    },
    "Assert": function () {
        eq(window.dialogResult, 'open-dialog handled')
    }
};

// "@test"["Legacy Unexpected Dialog Test"] = {
//     "Test": function () {
//         act.waitFor(function (cb) {
//             var electronProvider = require('../../legacy');
//
//             electronProvider.clickOnMenuItem('Test > Dialog')
//                 .then(cb);
//         })
//     }
// };
//
// "@test"["Legacy No Expected Dialog Test"] = {
//     "Test": function () {
//         act.waitFor(function (cb) {
//             var electronProvider = require('../../legacy');
//
//             electronProvider
//                 .setElectronDialogHandler(function (type) {return type + ' handled'})
//                 .then(cb);
//         })
//     }
// };

