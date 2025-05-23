const {
    BrowserWindow,
} = require('electron')
const {
    download
} = require('electron-dl'); // Install this package: npm install electron-dl

const moment = require("moment-timezone");
const fs = require('fs');
const axios = require("axios");
const {
    Parser
} = require('json2csv');

const createExcel = require("../helpers/excel.js");
const {
    generateComputerDescription,
    CheckSum,
    hexToDec,
    dec2hex,
    getAccurateTime,
    percentsSum,
    organizeExcelData,
    toSlug,
    uniqueId,
    onTagDetected,
    addTagToBuffer,
    getEventNameById,
    updateStartAndRecalculate
} = require("../helpers/helpers.js");


const {
    Socket
} = require("net");
const {
    inventory_fn,
    get_data
} = require("./inventory.js");
const socket = require('../socket-common.js')

// Use environment variables as a fallback
// const COMPUTER_NAME =
//     process.env.LOGNAME || // macOS/Linux
//     process.env.USER || // macOS/Linux
//     process.env.LNAME || // macOS/Linux
//     process.env.USERNAME || // Windows
//     os.userInfo().username;

/** vars */

// Array global donde irás acumulando los datos
global.targetEPC = "0090b0000000000000000000"
global.monitoredTagData = {
    epc: global.targetEPC,
    totalReads: 0,
    bestRssi: -Infinity,
    bestTimestamp: null,
    antennas: new Set(),
    frequencies: new Set()
};
global.epcWindowBuffer = {}; // Ventana de confirmación por EPC
global.DemoTag = false;

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
global.outputPower = [false, false];
global.setOutputPower = [false, false];
global.race = false;
global.hostname = false;
global.sound = false;
global.stream = false;
global.prevStarts = [];
// Definir las validaciones de cabeceras para INSCRITOS EN DRIVE
global.validacionesCabeceras = {
    tag: ["tag", "txip"], // Variantes aceptables
    bib: ['dorsal', 'bib', 'zenbakia', "dortsala", "dorsala"],
    name: ["nombre", "izena", "izen-abizenak", "nombre y apellidos"],
    city: ["ciudad", "herria", "provincia", "probintzia", "pais", "estado"],
    club: ["club", "equipo", "kluba", "klub", "taldea"],
    event: ['lasterketa', 'evento', "carrera", "ekitaldia"],
    sex: ['sexua', 'sexo', 'genero'],
    cat: ['kategoria', 'categoria', 'cat']
};

// Use async/await to retrieve the value
(async function () {
    global.hostname = await generateComputerDescription();
})();


async function requests(data) {
    let cmd = data[0];

    if (cmd == 'connect') {

        let heartbeatInterval = [];
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
                heartbeatInterval[i] = setInterval(() => {
                    if (!global.readers.length) return;
                    if (global.readers[i].writable) {
                        console.log('beat...')
                        global.readers[i].write('ping');
                    }
                }, 5000);

                onTagDetected('Conectado');
            })

            // Konexioak itxi
            global.readers[i].on('close', (hadError) => {
                if (global.mainWindow && !global.mainWindow.isDestroyed()) global.mainWindow.webContents.send('fromMain', ['connection-error', i]);
                global.startInventory = false;
                clearInterval(heartbeatInterval[i]); // Detener el heartbeat
                if (hadError) {
                    console.log('Reader error.')
                    global.mainWindow.webContents.send('fromMain', ['global-error', 'Errorea: Konexioa galdu egin da Readerrarekin.']);
                }
            });

            // Erroreak kudeatu
            global.readers[i].on('error', (err) => {
                console.error('Error de conexión:', err.message);
                global.mainWindow.webContents.send('fromMain', ['global-error', 'Errorea: ' + err.message]);

                //global.mainWindow.webContents.send('fromMain', ['connection-error', i]);
                // global.readers.splice(i, 1);
                clearInterval(heartbeatInterval[i]); // heartbeat geratu
                if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
                    console.log('Error: ', err);
                    global.mainWindow.webContents.send('fromMain', ['global-error', 'Errorea: Readerra deskonektatu egin da.']);
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
                if (global.outputPower[i] || global.setOutputPower[i]) {
                    const buf = Buffer.from(data);
                    let resp = [];
                    buf.forEach((res) => {
                        let current = res.toString(16);
                        resp.push(current)
                    })


                    if (global.setOutputPower[i]) {
                        global.setOutputPower[i] = false;
                        return;
                    }


                    let db = []
                    resp.forEach((res, ind) => {
                        if (ind > 3 && ind < 12) {
                            db.push(hexToDec(res))
                        }
                    })

                    global.mainWindow.webContents.send('fromMain', ['modify-output-power', db, i]);
                    global.outputPower[i] = false;
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
                //global.mainWindow.webContents.send('fromMain', ['global-error', 'Errorea: Readerra deskonektatu egin da.']);
            })
        });
        global.readers = [];
        global.startInventory = false;
    }


    if (cmd == 'excel') {
        let items = data[1];
        // await axios.post('https://denborak.online/api/v2/save-data', {
        //     items,
        //     host: global.hostname
        // });

        createExcel(items)
    }


    if (cmd == 'change-item') {
        let item = JSON.parse(data[1]);

        let previous = JSON.parse(JSON.stringify(global.count.find(res => item.id == res.id)));


        global.count.map((res, i) => {
            if (item.id == res.id) {
                res.split = item.split;
                res.split_slug = item.split_slug;
                // realtime app SOKET.IO (edit TRUE)
                socket.emit("currentTag", res, true);

                // porcentajes: Restar el split anterior
                global.percents.map(res => {
                    if (res.group == previous.split_slug) res.count--;
                })
                // porcentajes: Sumar el split actual (cambiado)
                // Esta funcion es la que se utiliza en el inventario
                percentsSum(item)
            }
        })

    }

    if (cmd == 'upload-file') {

        const items = data[1];
        const raceID = data[2];
        const jsonData = JSON.parse(items); // Convertir texto a JSON
        if (!Array.isArray(jsonData)) throw new Error("El JSON no es un array.");
        if (jsonData.length === 0) throw new Error("El array está vacío.");

        // Campos del CSV
        const fields = [
            "tag",
            "ant",
            "timestamp",
            "id",
            "bib",
            "name",
            "city",
            "cat",
            "sex",
            "pretty_time",
            "real_time",
            "event",
            "split",
            "split_id",
            "reader",
            "host",
            "race"
        ];

        try {
            const json2csvParser = new Parser({
                fields
            });
            const csvData = json2csvParser.parse(jsonData);
            const FormData = require('form-data');

            try {
                // Wait for the file to be fully written before continuing
                //await fs.promises.writeFile('output.csv', csvData);

                const form = new FormData();
                //form.append("file", fs.createReadStream('output.csv'));
                form.append("post_id", raceID); // global.race.ID
                form.append("user", global.hostname);
                form.append("csv", csvData);

                const upload = await axios.post('https://denborak.biklik.eus/wp-json/v1/upload', form, {
                    headers: {
                        ...form.getHeaders() // ensure correct headers
                    }
                });

                if (upload.data.data.length) {
                    global.mainWindow.webContents.send('fromMain', ['upload-response', true]);
                } else {
                    global.mainWindow.webContents.send('fromMain', ['upload-response', false]);
                }

            } catch (error) {
                console.error("Error:", error.message);
                global.mainWindow.webContents.send('fromMain', ['upload-response', false]);
            }


        } catch (err) {
            console.error(err);
        }
    }


    // inscritos
    if (cmd == 'upload-inscritos') {

        const items = global.startList;
        const raceID = data[1];
        const jsonData = items; // Convertir texto a JSON
        if (!Array.isArray(jsonData)) throw new Error("El JSON no es un array.");
        if (jsonData.length === 0) throw new Error("El array está vacío.");

        // Campos del CSV
        const fields = ['tag', 'bib', 'name', 'city', 'event', 'sex', 'cat', 'club'];

        // Sanitize data
        const sanitizedData = jsonData.map(item => ({
            tag: item.tag || '',
            bib: item.bib || '',
            name: item.name || '',
            city: item.city || '',
            event: item.event || '',
            sex: item.sex || '',
            cat: item.cat || '',
            club: item.club || ''
        }));

        try {
            const json2csvParser = new Parser({
                fields
            });
            const csvData = json2csvParser.parse(sanitizedData);

            const FormData = require('form-data');

            try {
                // Write CSV to file
                // await fs.promises.writeFile('output.csv', csvData, 'utf8');                

                const form = new FormData();
                // form.append("file", fs.createReadStream('output.csv'));
                form.append("post_id", raceID); // global.race.ID
                form.append("user", global.hostname);
                form.append("csv", csvData);

                const upload = await axios.post('https://denborak.biklik.eus/wp-json/v1/upload-inscritos', form, {
                    headers: {
                        ...form.getHeaders()
                    }
                });

                if (upload.data.success) {
                    global.mainWindow.webContents.send('fromMain', ['upload-response', true]);
                } else {
                    global.mainWindow.webContents.send('fromMain', ['upload-response', false]);
                }


                // const leer = await axios.get('https://denborak.biklik.eus/wp-json/v1/get-inscritos', {
                //     params: {
                //         post_id: 20
                //     }
                // });

            } catch (error) {
                console.error("Error uploading file:", error.message);
            }

        } catch (err) {
            console.error("Error during JSON-to-CSV process:", err.message);
        }

    }


    if (cmd == 'get_hostname') {
        setTimeout(() => {
            global.mainWindow.webContents.send('fromMain', ['hostname', global.hostname]);
        }, 0)
    }


    if (cmd == 'stop') {
        global.startInventory = false;
        global.mainWindow.webContents.send('fromMain', ['inventory-status', global.startInventory]);
        console.log('stop')

    }


    if (cmd == 'socket-io') {
        socket.emit("currentTag", {
            name: 'asier'
        });
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



    if (cmd == 'start-list') {

        try {
            const result = organizeExcelData(JSON.parse(data[1]), global.validacionesCabeceras);
            const events = JSON.parse(data[2]);

            if (!result.success) {
                global.mainWindow.webContents.send('fromMain', ['global-error', result]);
                return
            }

            if (events) {
                events.forEach((event) => {
                    result.result.map((res) => {
                        if (toSlug(event.name) == toSlug(res.event)) {
                            res.event = event;
                        }
                    });
                });
            }


            global.startList = result.result;
            global.mainWindow.webContents.send('fromMain', ['start-list', result.result, result.headers]);

        } catch (err) {
            global.startList = null;
            global.mainWindow.webContents.send('fromMain', ['start-list', null]);

            const error = {
                success: false,
                message: err,
            };
            global.mainWindow.webContents.send('fromMain', ['global-error', error]);
        }

    }

    if (cmd == 'real-time') {
        global.mainWindow.webContents.send('fromMain', ['real-time', global.timeOffset]);
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
    if (cmd == 'check-demo-tag') {
        global.DemoTag = data[1];
    }

    // ezabatu item bat inbentariotik

    // Inbentarioak hasi (hau da garrantzitsuena)
    if (cmd == 'delete-item') {
        let deleteID = data[1];
        
        const index = global.count.findIndex(item => item.id === deleteID);
        const tag = global.count[index].tag;

        if (index !== -1) {
            global.count.splice(index, 1); // Elimina 1 elemento en esa posición
        }   

        // ✅ Recalcular percents
        global.percents = [];
        global.count.forEach(tag => percentsSum(tag));
        
        // 2. Limpiar también de epcWindowBuffer si existe
        if (global.epcWindowBuffer[tag]) {
        clearTimeout(global.epcWindowBuffer[tag].timeout);
        delete global.epcWindowBuffer[tag];
        }

        const del = await axios.post('https://denborak.online/api/v2/delete-data-by-id', {
            id: deleteID
        });

        global.mainWindow.webContents.send('fromMain', ['inventory-after-delete', global.count, 'delete']);
        global.mainWindow.webContents.send('fromMain', ['percents', global.percents]);
    }


    if (data[0] == "edit-time") {
        
        // balidazioak egin!!
        const { id, newTime } = data[1];

        const target = global.count.find((t) => t.id === id);
        if (!target) return;

        target.pretty_time = newTime;

        // Vuelve a calcular timestamp a partir del pretty_time
        const parts = newTime.split(":");
        const h = parseInt(parts[0]) || 0;
        const m = parseInt(parts[1]) || 0;
        const s = parseInt(parts[2]) || 0;
        const ms = parseInt(parts[3]) || 0;

        const totalMs = ((h * 3600) + (m * 60) + s) * 1000 + ms;
        // Buscar el "start" del evento al que pertenece el participante
        const startEvent = global.startTime.find(
        (s) => s.unique_id === uniqueId(target.event, global.startTime)
        );

        if (startEvent) {
            target.timestamp = parseInt(startEvent.start) + totalMs;
        }

        const del = await axios.post('https://denborak.online/api/v2/update-data-by-id', {
            id: id,
            newPrettyTime: target.pretty_time,
            newTimestamp: target.timestamp
        });

        // Recalcular los percents
        global.percents = []; // Limpiar
        global.count.forEach((t) => {
            percentsSum(t); // Recalcular
        });

        // Dentro del if (cmd == "edit-time")
        global.mainWindow.webContents.send("fromMain", [
        "inventory-after-delete",
        global.count.slice(), // usar slice() para no mutar original
        'edit'
        ]);
    }


    // Inbentarioak hasi (hau da garrantzitsuena)
    if (cmd == 'inventory') {
        global.readDelaySec = data[1];
        global.selectedSplits = JSON.parse(data[2]);
        global.race = JSON.parse(data[3]);
        global.sound = data[4]
        global.stream = data[5]
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
            let query = Buffer.from([0xA0, 0x15, 0x01, 0x8A, 0x00, antennas[0], 0x01, antennas[1], 0x02, antennas[2], 0x03, antennas[3], 0x04, antennas[4], 0x05, antennas[5], 0x06, antennas[6], 0x07, antennas[7], 0x05, 0xFF]);
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


   if (cmd === 'get-server-time') {
        let time = data[1];
        let shouldRecordStart = data[2];
        let affectedEvents = data[3] || []; // array de strings (event.unique_id)
        let raceID = data[4];

        if (!time) {
            const now = getAccurateTime();
            time = {
                timestamp: now.format('x'),
                pretty: now.format("YYYY-MM-DD HH:mm:ss.SSS")
            };
        }

        // ✅ Guardar como sugerencia
        if (shouldRecordStart === true) {
            if (!global.prevStarts) global.prevStarts = [];

            global.prevStarts.unshift({
                timestamp: time.timestamp,
                pretty: time.pretty
            });

            global.prevStarts = global.prevStarts.slice(0, 5);

             // 🔄 REEMPLAZAMOS count de golpe
            global.count = updateStartAndRecalculate(time, affectedEvents, global);

            let eventName;
            // 🔁 Recalcular tiempos en servidor para cada evento afectado
                for (const id of affectedEvents) {
                try {
                    // Buscar el nombre del evento a partir del ID
                    const eventName  = getEventNameById(id);

                    if (!eventName) {
                    console.warn(`⚠️ No se encontró el evento con ID: ${id}`);
                    continue;
                    }


                    // Hacer la petición al servidor
                    const response = await axios.post('https://denborak.online/api/v2/recalculate-times', {
                        race: raceID,
                        event: eventName,
                        newStartTimestamp: time.timestamp
                    });

                    console.log(`✅ Recalculado en el servidor: ${eventName}`, response.data);
                } catch (err) {
                    console.error(`❌ Error al recalcular tiempos para evento con ID: ${id}`, err.message);
                }
            }


            global.mainWindow.webContents.send('fromMain', [
                'inventory-after-delete',
                global.count.slice(),
                'edit'
            ]);
        }

        // 🔁 Enviar info al frontend
        global.mainWindow.webContents.send('fromMain', [
            'server-time',
            time,
            affectedEvents,
            shouldRecordStart
        ]);
    }



    if (cmd == 'server-time-info') {

        time = {
            timestamp: getAccurateTime().format('x'),
            pretty: getAccurateTime().format("YYYY-MM-DD HH:mm:ss.SSS")
        }
     
        global.mainWindow.webContents.send('fromMain', ['server-time-info', time]);
    }


    if (cmd == 'get-prev-starts') {
        global.mainWindow.webContents.send('fromMain', ['get-prev-starts', global.prevStarts]);
    }


    if (cmd == 'get-output-power') {
        let reader = JSON.parse(data[1]);
        let selectedReader;

        let readerIndex = 0;
        global.readersInfo.forEach((r, i) => {
            if (r.name == reader.name) {
                selectedReader = global.readers[i]
                readerIndex = i
            }
        })

        if (!selectedReader) return;

        const query = Buffer.from([0xA0, 0x03, 0x01, 0x97]);
        const check = CheckSum(query); // Example check
        const message = Buffer.concat([query, Buffer.from([check])]); // Concatenate buffers
        selectedReader.write(message, () => {
            global.outputPower[readerIndex] = true;
        });
    }

    if (cmd == 'set-output-power') {
        let reader = JSON.parse(data[1]);
        let selectedReader;
        let readerIndex = 0;
        global.readersInfo.forEach((r, i) => {
            if (r.name == reader.name) {
                selectedReader = global.readers[i]
                readerIndex = i
            }
        })

        let power = [];
        reader.power.forEach((res, i) => {
            if (res) power[i] = dec2hex(res)
        })
        const query = Buffer.from([0xA0, 0x0B, 0x01, 0x76, power[0], power[1], power[2], power[3], power[4], power[5], power[6], power[7]]);
        const check = CheckSum(query); // Example check
        const message = Buffer.concat([query, Buffer.from([check])]); // Concatenate buffers
        selectedReader.write(message, () => {
            global.setOutputPower[readerIndex] = true;
        });
    }

    if (cmd == 'check-antennas') {
        global.startInventory = false;
        let reader = JSON.parse(data[1])

        let antennas = [];
        reader.ants.filter((res, i) => {
            if (res) antennas[i] = '0x01'
            else antennas[i] = '0x00'
        })

        let selectedReader;

        global.readersInfo.forEach((r, i) => {
            if (r.name == reader.name) selectedReader = global.readers[i]
        })

        let query = Buffer.from([0xA0, 0x15, 0x01, 0x8A, 0x00, antennas[0], 0x01, antennas[1], 0x02, antennas[2], 0x03, antennas[3], 0x04, antennas[4], 0x05, antennas[5], 0x06, antennas[6], 0x07, antennas[7], 0x00, 0x01]);
        const check = CheckSum(query); // Example check
        const message = Buffer.concat([query, Buffer.from([check])]); // Concatenate buffers
        selectedReader.write(message, () => {
            global.checkAntennas = true;
        });
    }


    if (cmd == 'download-pdf') {
        try {
            await download(BrowserWindow.getFocusedWindow(), data[1], {
                filename: data[2] || 'download.pdf', // Default name
            });
        } catch (error) {
            console.log(error)
        }

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