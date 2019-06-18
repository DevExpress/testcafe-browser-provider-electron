var path = require('path');


module.exports = {
    testPage: 'file://' + path.join(__dirname, process.env.ASAR_MODE ? 'test-app.asar/index.html' : 'test-app-regular/index.html')
};
