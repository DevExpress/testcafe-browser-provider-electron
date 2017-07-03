var Promise        = require('pinkie');
var { Socket }     = require('net');
var promisifyEvent = require('promisify-event');
var EventEmitter   = require('events');

const delay = ms => new Promise(r => setTimeout(r, ms));

const RETRY_DELAY     = 300;
const MAX_RETRY_COUNT = 10;

module.exports = class NodeDebug {
    constructor (port = 5858, host = '127.0.0.1') {
        this.currentPacketNumber = 1;
        this.events              = new EventEmitter();
        this.port                = port;
        this.host                = host;
        this.socket              = new Socket();
        this.buffer              = Buffer.alloc(0);
        this.getPacketPromise    = Promise.resolve();
        this.sendPacketPromise   = Promise.resolve();

        this.nodeInfo = {
            v8Version:       '',
            protocolVersion: '',
            embeddingHost:   ''
        };
    }

    async _attemptToConnect (port, host) {
        this.socket.connect(port, host);

        var connectionPromise = Promise.race([
            promisifyEvent(this.socket, 'connect'),
            promisifyEvent(this.socket, 'error')
        ]);

        return await connectionPromise
            .then(() => true)
            .catch(() => delay(RETRY_DELAY));
    }

    async _connectSocket (port, host) {
        var connected = await this._attemptToConnect(port, host);

        for (var i = 0; !connected && i < MAX_RETRY_COUNT; i++)
            connected = await this._attemptToConnect(port, host);

        if (!connected)
            throw new Error('Unable to connect');

        this.socket.on('data', data => this._handleNewData(data));
    }

    async _writeSocket (message) {
        if (!this.socket.write(message))
            await promisifyEvent(this.socket, 'drain');
    }

    _handleNewData (data) {
        this.buffer = Buffer.concat([this.buffer, data]);

        this.events.emit('new-data');
    }

    _getPacket () {
        this.getPacketPromise = this.getPacketPromise.then(async () => {
            var index = this.buffer.indexOf('\r\n\r\n');

            while (index < 0) {
                await promisifyEvent(this.events, 'new-data');

                index = this.buffer.indexOf('\r\n\r\n');
            }

            var packet = {
                headers: null,
                body:    null
            };

            packet.headers = this.buffer
                .toString('utf8', 0, index)
                .split('\r\n')
                .map(line => line.match(/^([^:]+):\s+(.*)$/))
                .reduce((obj, match) => {
                    obj[match[1].toLowerCase()] = match[2];

                    return obj;
                }, {});

            var contentLength = packet.headers['content-length'] && parseInt(packet.headers['content-length'], 10);

            if (!contentLength) {
                this.buffer = this.buffer.slice(index + 4);
                return packet;
            }


            while (this.buffer.length - index - 4 < contentLength)
                await promisifyEvent(this.events, 'new-data');


            packet.body = JSON.parse(this.buffer.toString('utf8', index + 4, index + 4 + contentLength));

            this.buffer = this.buffer.slice(index + 4 + contentLength);

            return packet;
        });

        return this.getPacketPromise;
    }

    _sendPacket (payload) {
        this.sendPacketPromise = this.sendPacketPromise.then(async () => {
            var body       = Object.assign({}, payload, { seq: this.currentPacketNumber++, type: 'request' });
            var serialized = JSON.stringify(body);
            var message    = 'Content-Length: ' + Buffer.byteLength(serialized, 'utf8') + '\r\n\r\n' + serialized;

            this._writeSocket(message);
        });

        return this.sendPacketPromise;
    }

    async connect () {
        await this._connectSocket(this.port, this.host);

        var infoPacket = await this._getPacket();

        this.nodeInfo = {
            v8Version:       infoPacket.headers['v8-version'],
            protocolVersion: infoPacket.headers['protocol-version'],
            embeddingHost:   infoPacket.headers['embedding-host']
        };
    }

    dispose () {
        this.socket.end();
        this.buffer = null;
    }

    async evaluate (expression) {
        var packetNumber = this.currentPacketNumber;

        await this._sendPacket({ command: 'evaluate', arguments: { expression: expression, 'disable_break': true } });

        var responsePacket = await this._getPacket();

        while (!responsePacket.body || responsePacket.body['request_seq'] !== packetNumber)
            responsePacket = await this._getPacket();

        return responsePacket;
    }
};

