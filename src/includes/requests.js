const moment = require("moment-timezone");
const axios = require("axios");
const createExcel = require("../helpers/excel.js");
const {
    CheckSum,
    dec2hex,
    getAccurateTime
} = require("../helpers/helpers.js");
const {
    Socket
} = require("net");
const {
    inventory_fn,
    get_data
} = require("./inventory.js");
const os = require('os');

const COMPUTER_NAME = os.userInfo().username;

/** vars */
global.count = [];
global.percents = [];
global.readersInfo = [];
global.readers = [];
global.checkAntennas = false;
global.startInventory = false;
global.startTime = [];
global.startList = null;
global.selectedSplits = false;
global.readDelaySec = 30;
global.outputPower = false;

async function requests(data) {
    let cmd = data[0];

    if (cmd == 'connect') {
        let heartbeatInterval;
        let readers = JSON.parse(data[1]);
        let result;
        // Gorde readerren informazio orokorra (izena, antenak...)
        global.readersInfo = readers;

        // Renderretik jasotako readerrak kudeatu (izena, ip...)
        readers.forEach((reader, i) => {

            if (!reader.ip) return true;

            var READER_IP = reader.ip;
            var READER_PORT = reader.port;

            // Reader Objetuak sortu reader fisikoarekin konexioak burutzeko
            global.readers[i] = new Socket();
            global.readers[i].connect(READER_PORT, READER_IP, async () => {
                console.log('connected: ' + reader.name)
                global.mainWindow.webContents.send('fromMain', ['connection', reader.name]);
                global.readers[i].setKeepAlive(true, 5000);

                // 5 segunduro heartbeat datuak bidali readerra kokentatuta dagoela ziurtatzeko
                heartbeatInterval = setInterval(() => {
                    if (global.readers[i].writable) {
                        console.log('beat...')
                        global.readers[i].write('ping');
                    }
                }, 5000);
            })

            // Konexioak itxi
            global.readers[i].on('close', (hadError) => {
                console.log('Conexión cerrada');

                if (global.mainWindow && !global.mainWindow.isDestroyed()) global.mainWindow.webContents.send('fromMain', ['connection-error', i]);
                global.startInventory = false;
                clearInterval(heartbeatInterval); // Detener el heartbeat
                if (hadError) {
                    console.error('Conexión cerrada debido a un error');
                }
            });

            // Erroreak kudeatu
            global.readers[i].on('error', (err) => {
                console.error('Error de conexión:', err.message);
                //global.mainWindow.webContents.send('fromMain', ['connection-error', i]);
                // global.readers.splice(i, 1);
                clearInterval(heartbeatInterval); // heartbeat geratu
                if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
                    console.log('El lector fue desconectado físicamente.');
                    global.readers[i].destroy();
                }
            });

            // Readerrak erantzuten duenean...
            global.readers[i].on('data', (data) => {

                // Inbentarioa hasi edo antena txekeoa
                if (global.startInventory || global.checkAntennas) {
                    result = inventory_fn(data, global.readers[i], global.readersInfo[i]);
                    if (result) global.count = result;
                }

                // Antenen potentzia kudeatu behar denean
                if (global.outputPower) {
                    const buf = Buffer.from(data);
                    let resp = [];
                    buf.forEach((res) => {
                        let current = res.toString(16);
                        resp.push(current)
                    })
                    global.outputPower = false;
                }
            });
        })

    }

    if (cmd == 'alive') {
        let readers = JSON.parse(data[1]);
        if (global.readers.length) {
            global.readers.forEach((res, i) => {
                console.log('connected: ' + readers[i].name)
                global.mainWindow.webContents.send('fromMain', ['connection', readers[i].name]);

            })
        }
    }

    if (cmd == 'is-inventory-started') {
        global.mainWindow.webContents.send('fromMain', ['inventory-status', global.startInventory]);
    }

    // Deskonektatu (Cookiak ere ezabatuko dira)
    if (cmd == "disconnect") {
        global.readers.forEach(reader => {
            reader.end(() => {
                console.log('Server has ended the connection.');
            })
        });
        global.readers = [];
        global.startInventory = false;
    }


    if (cmd == 'excel') {
        let items = data[1];
        await axios.post('https://denborak.online/api/v2/save-data', {
            items,
            host: COMPUTER_NAME
        });
        //createExcel(items, app)
    }


    if (cmd == 'get_hostname') {
        setTimeout(() => {
            global.mainWindow.webContents.send('fromMain', ['hostname', COMPUTER_NAME]);
        }, 0)
    }


    if (cmd == 'stop') {
        global.startInventory = false;
        global.mainWindow.webContents.send('fromMain', ['inventory-status', global.startInventory]);
        console.log('stop')
        // socket.emit("currentTag", {
        //     name: 'asierrrrr'
        // });
    }


    if (cmd == 'delete') {
        global.count = []
        global.percents = []
        global.mainWindow.webContents.send('fromMain', ['deleted', true]);
        global.mainWindow.webContents.send('fromMain', ['percents', false]);
    }


    if (cmd == 'get-read-percents') {
        global.mainWindow.webContents.send('fromMain', ['percents', global.percents]);
    }

    if (cmd == 'get-output-power') {
        let reader = JSON.parse(data[1]);
        let selectedReader;
        if (reader.name == 'Reader 1') selectedReader = global.readers[0];
        const query = Buffer.from([0xA0, 0x03, 0x01, 0x77]);
        const check = CheckSum(query); // Example check
        const message = Buffer.concat([query, Buffer.from([check])]); // Concatenate buffers
        selectedReader.write(message, () => {
            global.outputPower = true;
        });
    }

    if (cmd == 'set-output-power') {
        let reader = JSON.parse(data[1]);
        let selectedReader;

        global.readersInfo.forEach((r, i) => {
            if (r.name == reader.name) selectedReader = global.readers[i]
        })

        let power = [];
        reader.power.forEach((res, i) => {
            if (res) power[i] = dec2hex(res)
        })
        const query = Buffer.from([0xA0, 0x0B, 0x01, 0x76, power[0], power[1], power[2], power[3], power[4], power[5], power[6], power[7]]);
        const check = CheckSum(query); // Example check
        const message = Buffer.concat([query, Buffer.from([check])]); // Concatenate buffers
        selectedReader.write(message, () => {
            global.outputPower = true;
        });
    }

    if (cmd == 'start-list') {
        global.startList = JSON.parse(data[1]);
    }

    if (cmd == 'get-antenna') {
        console.log('antena', data)
    }

    if (cmd == 'start-time') {
        let array = JSON.parse(data[1]);

        array.forEach(event => {
            global.startTime.push(event)
        })
    }

    // Inbentarioak hasi (hau da garrantzitsuena)
    if (cmd == 'inventory') {
        global.readDelaySec = data[1];
        global.selectedSplits = JSON.parse(data[2]);
        global.startInventory = true;

        // Renderretik jasotako reader guztien inbentarioa hasi (gehienez 2)
        global.readers.forEach((reader, i) => {

            if (!global.readersInfo[i].ip) return;

            let antennas = [];
            global.readersInfo[i].ants.filter((res, i) => {
                if (res) antennas[i] = '0x01'
                else antennas[i] = '0x00'
            })

            if (!antennas.includes('0x01')) {
                // Render pantaila bistaratuta badago bidali bestela ez. Programa hemen ETEN.
                if (global.mainWindow && !global.mainWindow.isDestroyed()) global.mainWindow.webContents.send('fromMain', ['no-ants']);
                else console.error("Cannot send message, mainWindow is either destroyed or does not exist.");
                return false;
            }

            global.mainWindow.webContents.send('fromMain', ['inventory-status', global.startInventory]);

            //let query = Buffer.from([0xA0, 0x0D, 0x01, 0x8A, 0x00, antennas[0], 0x01, antennas[1], 0x02, antennas[2], 0x03, antennas[3], 0x00, 0xFF]);
            // 8 ports
            let query = Buffer.from([0xA0, 0x15, 0x01, 0x8A, 0x00, antennas[0], 0x01, antennas[1], 0x02, antennas[2], 0x03, antennas[3], 0x04, antennas[4], 0x05, antennas[5], 0x06, antennas[6], 0x07, antennas[7], 0x25, 0xFF]);
            let check = CheckSum(query); // Example check
            let message = Buffer.concat([query, Buffer.from([check])]); // Concatenate buffers
            // write to the current reader
            get_data(message, reader, global.readersInfo[i].name)
        })

    }

    if (cmd == 'load_list') {
        setTimeout(() => {
            global.mainWindow.webContents.send('fromMain', ['load', global.count]);
        }, 300)
    }

    if (cmd == 'check-antennas') {
        global.startInventory = false;
        let selectedReader = JSON.parse(data[1])
        let antennas = [];
        selectedReader.ants.filter((res, i) => {
            if (res) antennas[i] = '0x01'
            else antennas[i] = '0x00'
        })

        if (selectedReader.name == 'Reader 1') selectedReader = global.readers[0];

        let query = Buffer.from([0xA0, 0x15, 0x01, 0x8A, 0x00, antennas[0], 0x01, antennas[1], 0x02, antennas[2], 0x03, antennas[3], 0x04, antennas[4], 0x05, antennas[5], 0x06, antennas[6], 0x07, antennas[7], 0x00, 0x01]);
        const check = CheckSum(query); // Example check
        const message = Buffer.concat([query, Buffer.from([check])]); // Concatenate buffers
        selectedReader.write(message, () => {
            global.checkAntennas = true;
        });
    }

    if (cmd == 'manual') {
        // Example date string
        const dateString = "2024-06-25 " + data[2];

        // Convert the date string to a moment object with timezone
        const unixTimestamp = moment.tz(dateString, 'Europe/Madrid').format('x');

        let currentTag = {
            tag: data[1],
            total: 1,
            ant: '-',
            time: unixTimestamp
        }

        global.mainWindow.webContents.send('fromMain', ['inventory', currentTag]);
    }
}

module.exports = requests;