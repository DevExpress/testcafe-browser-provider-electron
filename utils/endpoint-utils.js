const createServer = require('net').createServer;
const Promise      = require('pinkie');

function createServerOnFreePort () {
    return new Promise(resolve => {
        const server = createServer();

        server.once('listening', () => {
            resolve(server);
        });

        server.listen(0);
    });
}

function closeServers (servers) {
    return Promise.all(servers.map(server => {
        return new Promise(resolve => {
            server.once('close', resolve);
            server.close();
        });
    }));
}

exports.getFreePorts = function (count) {
    const serverPromises = [];
    let ports          = null;

    // NOTE: Sequentially collect listening
    // servers to avoid interference.
    for (let i = 0; i < count; i++)
        serverPromises.push(createServerOnFreePort());

    return Promise.all(serverPromises)
        .then(servers => {
            ports = servers.map(server => {
                return server.address().port;
            });

            return servers;
        })
        .then(closeServers)
        .then(() => {
            return ports;
        });
};
