const moment = require("moment-timezone");
const axios = require("axios");
const createExcel = require("../helpers/excel.js");
const { CheckSum, dec2hex } = require("../helpers/helpers.js");
const { Socket } = require("net");
const { inventory_fn, get_data } = require("./inventory.js");
const os = require('os');


const COMPUTER_NAME = os.userInfo().username;
const TAG_LEN = 38; // Total length (no EPC)

/** vars */
let read_delay_sec = 30;
let count = [];
let startInventory = false;
let checkAntennas = false;
let selectedSplits = false;
let outputPower = false;

let readerInfo = [];
let readers = [];

let startTime = [];
let startList = null;



async function requests(data, app, win) {
    let cmd = data[0];

    if (cmd == 'connect') {
        let heartbeatInterval;
        let reader = JSON.parse(data[1]);
        let result;
        console.log('connect')
        // gorde readerren informazio orokorra (izena, antenak...)
        readerInfo = reader;
        // SET READERS

        reader.forEach( (res, i) => {
            if (!res.ip) return true;

            var READER_IP = res.ip;
            var READER_PORT = res.port;


            readers[i] = new Socket();
            readers[i].connect(READER_PORT, READER_IP, async () => {
                console.log('connected: ' + res.name)

                win.webContents.send('fromMain', ['connection', res.name]);
                readers[i].setKeepAlive(true, 5000);

                // Enviar un "heartbeat" cada 5 segundos para verificar la conexión
                heartbeatInterval = setInterval(() => {
                    if (readers[i].writable) {
                        console.log('beat...')
                        readers[i].write('ping'); // Enviamos un mensaje pequeño para verificar la conexión
                    }
                }, 5000);

                // setTimeout(() => {
                //     win.webContents.send('fromMain', ['connection-error', i]);
                // }, 6000)
            })

            readers[i].on('close', (hadError) => {
                console.log('Conexión cerrada');
                win.webContents.send('fromMain', ['connection-error', i]);
                clearInterval(heartbeatInterval); // Detener el heartbeat
                if (hadError) {
                    console.error('Conexión cerrada debido a un error');
                }
            });

            // Manejar errores de conexión
            readers[i].on('error', (err) => {
                console.error('Error de conexión:', err.message);
                win.webContents.send('fromMain', ['connection-error', i]);
                clearInterval(heartbeatInterval); // Detener el heartbeat
                if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
                    console.log('El lector fue desconectado físicamente.');
                    readers[i].destroy(); // Cerrar la conexión
                }
            });

            readers[i].on('data', data => {
                if (startInventory || checkAntennas) {

                    result = inventory_fn(data, win, readers[i], checkAntennas, startInventory, startTime, startList, count, TAG_LEN, read_delay_sec, selectedSplits, res);
                    if (result) count = result;
                }

                if (outputPower) {

                    const buf = Buffer.from(data);
                    let resp = [];
                    buf.forEach((res) => {
                        let current = res.toString(16);
                        resp.push(current)
                    })
                    outputPower = false;
                }
            });
        })

    }

    if(cmd == 'alive') {

        let reader = JSON.parse(data[1]);
        
        if(readers.length) {
            readers.forEach((res, i) => {
                console.log('connectd: ' + reader[i].name)
                win.webContents.send('fromMain', ['connection', reader[i].name]);

            })
        }
        

       

    }
    if(cmd == "disconnect") {

        readers[0].end(() => {
            console.log('Server has ended the connection.');
        });

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
            win.webContents.send('fromMain', ['hostname', COMPUTER_NAME]);
        }, 1000)

    }

    if (cmd == 'stop') {
        startInventory = false;
        console.log('stop')
        // socket.emit("currentTag", {
        //     name: 'asierrrrr'
        // });
    }

    if (cmd == 'delete') {
        count = []
        win.webContents.send('fromMain', ['deleted', true]);
    }


    if (cmd == 'get-output-power') {
        let reader = JSON.parse(data[1]);
        let selectedReader;
        if (reader.name == 'Reader 1') selectedReader = readers[0];
        const query = Buffer.from([0xA0, 0x03, 0x01, 0x77]);
        const check = CheckSum(query); // Example check
        const message = Buffer.concat([query, Buffer.from([check])]); // Concatenate buffers
        selectedReader.write(message, () => {
            outputPower = true;
        });
    }


    if (cmd == 'set-output-power') {

        let reader = JSON.parse(data[1]);

        let selectedReader;
        if (reader.name == 'Reader 1') selectedReader = readers[0];

        let power = [];
        reader.power.forEach((res, i) => {
            if (res) power[i] = dec2hex(res)
        })

        const query = Buffer.from([0xA0, 0x0B, 0x01, 0x76, power[0], power[1], power[2], power[3], power[4], power[5], power[6], power[7]]);

        const check = CheckSum(query); // Example check
        const message = Buffer.concat([query, Buffer.from([check])]); // Concatenate buffers
        selectedReader.write(message, () => {
            outputPower = true;
        });

    }

    if (cmd == 'start-list') {
        startList = JSON.parse(data[1]);
    }

    if (cmd == 'get-antenna') {
        console.log('antena', data)
    }

    if (cmd == 'start-time') {
        let array = JSON.parse(data[1]);

        array.forEach(event => {
            startTime.push(event)
        })

    }

    if (cmd == 'inventory') {
        read_delay_sec = data[1];
        selectedSplits = JSON.parse(data[2]);
        startInventory = true;



        // Readers
        readers.forEach((reader, i) => {

            if (!readerInfo[i].ip) return;

            let antennas = [];
            readerInfo[i].ants.filter((res, i) => {
                if (res) antennas[i] = '0x01'
                else antennas[i] = '0x00'
            })

            //let query = Buffer.from([0xA0, 0x0D, 0x01, 0x8A, 0x00, antennas[0], 0x01, antennas[1], 0x02, antennas[2], 0x03, antennas[3], 0x00, 0xFF]);
            // 8 ports
            let query = Buffer.from([0xA0, 0x15, 0x01, 0x8A, 0x00, antennas[0], 0x01, antennas[1], 0x02, antennas[2], 0x03, antennas[3], 0x04, antennas[4], 0x05, antennas[5], 0x06, antennas[6], 0x07, antennas[7], 0x25, 0xFF]);

            let check = CheckSum(query); // Example check
            let message = Buffer.concat([query, Buffer.from([check])]); // Concatenate buffers

            // write to the current reader
            get_data(message, reader, readerInfo[i].name)
        })


        // setInterval(() => {
        //   const query = Buffer.from([0xA0, 0x0D, 0x01, 0x8A, 0x00, 0x01, 0x01, 0x01, 0x02, 0x01, 0x03, 0x01, 0x00, 0xFF]);
        //   //const query = Buffer.from([0xA0, 0x04, 0x01, 0x89, 0xFF]);
        //   const check = CheckSum(query); // Example check
        //   const message = Buffer.concat([query, Buffer.from([check])]); // Concatenate buffers
        //   get_data(message)
        // }, 3500)

        // reader.write(message, () => {});
    }

    if (cmd == 'load_list') {

        setTimeout(() => {
            win.webContents.send('fromMain', ['load', count]);
        }, 1000)
    }

    if (cmd == 'check-antennas') {
        startInventory = false;
        let selectedReader = JSON.parse(data[1])
        let antennas = [];
        selectedReader.ants.filter((res, i) => {
            if (res) antennas[i] = '0x01'
            else antennas[i] = '0x00'
        })

        if (selectedReader.name == 'Reader 1') selectedReader = readers[0];

        let query = Buffer.from([0xA0, 0x15, 0x01, 0x8A, 0x00, antennas[0], 0x01, antennas[1], 0x02, antennas[2], 0x03, antennas[3], 0x04, antennas[4], 0x05, antennas[5], 0x06, antennas[6], 0x07, antennas[7], 0x00, 0x01]);
        const check = CheckSum(query); // Example check
        const message = Buffer.concat([query, Buffer.from([check])]); // Concatenate buffers
        selectedReader.write(message, () => {
            checkAntennas = true;
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

        win.webContents.send('fromMain', ['inventory', currentTag]);
    }
}

module.exports = requests;