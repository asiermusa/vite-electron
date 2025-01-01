// serial USB
let {
    SerialPort
} = require("serialport");

const {
    calculateCRC16bit,
} = require('../helpers/helpers.js');

async function requests_serial(data) {
    let cmd = data[0];

    if (cmd == 'get-serial') {
        let allPorts = [];
        // List all available serial ports

        SerialPort.list()
            .then(ports => {
                ports.forEach(port => {
                    allPorts.push(port.path); // Output just the path
                });
                global.mainWindow.webContents.send('fromMain', ['send-serials', JSON.stringify(allPorts)]);
            })
            .catch(err => {
                console.error('Error listing ports:', err);
            });
    }


    if (cmd == 'read-tag') {
        const disabled = data[2]
        let port = new SerialPort({
            path: data[1], //   /dev/cu.usbserial-0001
            baudRate: 57600,
        })

        port.on('data', (data) => {
            const buf = Buffer.from(data, 'ascii');
            const response = buf.toString('hex', 0, buf.length);
            console.log('dis', response)
            global.mainWindow.webContents.send('fromMain', ['serial-usb', response.slice(12, 36), disabled]);
            port.close()
        });

        port.on('open', () => {
            console.log('Serial port is open');
            const query = Buffer.from([0x04, 0x00, 0x01]);
            const check = calculateCRC16bit(query); // Example check
            const message = Buffer.concat([query, check]); // Concatenate buffers
            port.write(message, () => {});
        });
        port.on('error', (err) => {
            console.error('Error:', err.message);
        });
    }

    if (cmd == 'write-tag') {

        // let dig1 = '0x' + data[1][0] + data[1][1];
        // let dig2 = '0x' + data[1][2] + data[1][3];

        let hexString = data[2];

        hexString = hexString.padStart(Math.ceil(hexString.length / 2) * 2, '0');

        // Create an array of hex pairs
        let hexPairs = [];
        for (let i = 0; i < hexString.length; i += 2) {
            let pair = hexString.substring(i, i + 2);


            // Ensure each pair is 2 digits long
            if (pair.length === 1) {
                pair += '0'; // Add a zero to the right if needed
            }
            hexPairs.push(`0x${pair}`);
        }

        // Limit to 12 pairs and pad with '00' if needed
        while (hexPairs.length < 12) {
            hexPairs.unshift('00'); // Add '00' at the beginning
        }

        //serial USB
        let {
            SerialPort
        } = require("serialport");

        let port = new SerialPort({
            path: data[1],
            baudRate: 57600,
        })

        port.on('data', (data) => {
            const buf = Buffer.from(data, 'ascii');
            const response = buf.toString('hex', 0, buf.length);
            global.mainWindow.webContents.send('fromMain', ['serial-usb-write', true]);
            port.close()
        });

        port.on('open', () => {
            const query = Buffer.from([0x15, 0x00, 0x04, 0x06, 0x00, 0x00, 0x00, 0x00, hexPairs[0], hexPairs[1], hexPairs[2], hexPairs[3], hexPairs[4], hexPairs[5], hexPairs[6], hexPairs[7], hexPairs[8], hexPairs[9], hexPairs[10], hexPairs[11]]);
            const check = calculateCRC16bit(query); // Example check
            const message = Buffer.concat([query, check]); // Concatenate buffers
            port.write(message, () => {});
        });

    }
}

module.exports = requests_serial;