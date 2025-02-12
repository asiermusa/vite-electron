const EPC_LEN = 24; // EPC
const PRESET_VALUE = 0xFFFF;
const POLYNOMIAL = 0x8408;
const moment = require('moment');
const player = require('play-sound')();
const path = require('path')

const {
    execSync
} = require('child_process');
const os = require('os');
const si = require('systeminformation');


function getUsername() {
    const platform = os.platform();

    if (platform === 'win32') {
        return os.hostname();
    }

    // macOS/Linux: Use os.userInfo().username
    const username = os.userInfo().username || 'unknown';
    return username;
}

async function generateComputerDescription() {
    const osNameMap = {
        win32: 'windows',
        darwin: 'mac',
        linux: 'linux',
    };

    const osName = osNameMap[os.platform()] || os.platform(); // Human-readable OS name
    const username = getUsername();


    // Obtener información de la batería
    let batteryStatus = 'laptop';
    try {
        const battery = await si.battery();

        if (!battery.hasBattery) {
            batteryStatus = 'desk';
        }

    } catch (error) {
        batteryStatus = 'No se pudo obtener información sobre la batería.';
        console.error('Error al obtener información de la batería:', error);
    }

    // Generate description: username-platform
    const raw = `${username}-${osName}-${batteryStatus}`;

    const slug = raw
        .toLowerCase() // Convert to lowercase
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric characters with '-'
        .replace(/^-+|-+$/g, ''); // Remove leading or trailing dashes

    return slug;

}


function getAccurateTime(current = false) {
    let d = moment().add(global.timeOffset, 'milliseconds'); // Adjust local time using the offset
    return d;
}

function percentsSum(currentTag) {
    // cambiar porcentajes
    if (!global.percents.length) {

        global.percents.push({
            name: currentTag.split,
            group: currentTag.split_id,
            count: 1
        })
    } else {
        let exist = 'no';
        global.percents.forEach((p, i) => {
            if (p.group == currentTag.split_id) exist = i;
        })

        if (exist == 'no') {
            global.percents.push({
                name: currentTag.split,
                group: currentTag.split_id,
                count: 1
            })
        } else {
            global.percents[exist].count = parseInt(global.percents[exist].count) + 1;
        }
    }
}

function onTagDetected() {
    // Reproduce un pitido o un sonido específico
    let ruta = path.join(__dirname, '../assets/beep.mp3');
    player.play(ruta, (err) => {
        if (err) console.log("Error al reproducir sonido:", err);
    });
}

const calculateCRC16bit = (pucY) => {
    let uiCrcValue = PRESET_VALUE;
    for (let i = 0; i < pucY.length; i++) {
        uiCrcValue ^= (pucY[i]);
        for (let j = 0; j < 8; j++) {
            uiCrcValue = (uiCrcValue >> 1) ^ ((uiCrcValue & 0x0001) && POLYNOMIAL)
        }
    }
    const buf = Buffer.from(uiCrcValue.toString(16), 'hex');
    const [msb, lsb] = buf;
    return Buffer.from([lsb, msb], 'hex');
};

function getAntenna(ant, rssi) {
    // let antBin = hex2bin(ant);


    // Extract the high bit (most significant bit)
    let highBit = (rssi & 0x80) >> 7;

    // Extract the low 2 bits to determine the antenna ID
    let low2Bits = ant & 0x03; // Mask with 0x03 to get the last 2 bits

    // Determine the antenna ID based on the high bit
    let antennaID;
    if (highBit === 1) {
        // High bit is 1, use antenna IDs 5, 6, 7, 8
        antennaID = low2Bits + 5; // Map 00 -> 5, 01 -> 6, 10 -> 7, 11 -> 8
    } else {
        // High bit is 0, use antenna IDs 1, 2, 3, 4
        antennaID = low2Bits + 1; // Map 00 -> 1, 01 -> 2, 10 -> 3, 11 -> 4
    }
    return antennaID;
}


function hex2bin(hex) {
    return (parseInt(hex, 16).toString(2)).padStart(8, '0');
}

function hexToDec(hex) {
    return parseInt(hex, 16);
  }

function bin2dec(binary) {
    return parseInt(binary, 2);
}

function dec2hex(decimal) {
    return '0x' + parseInt(decimal).toString(16);
}

function CheckSum(data) {
    let uBuff = data;
    let uSum = 0;
    for (let i = 0; i < uBuff.length; i++) {
        uSum += uBuff[i];
    }
    uSum = (~uSum) + 1;

    // const toInt8 = createToInt(8);
    return '0x' + ((uSum) >>> 0).toString(16).slice(-2);
}

function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function filterName(tag, startList) {
    if (tag.length != EPC_LEN) return ["UNKNOWN"];

    if (!startList) return 'La lista no esta cargada...';

    let find = null;
    find = startList.filter((res, i) => {
        if(res.tag) {
            if (res.tag.padStart(24, '0') == tag) return res;
        }
    });

    if (!find.length) return ["UNKNOWN"];
    return find[0];
}

function zeroPrefix(num, digit) {
    var zero = "";
    for (var i = 0; i < digit; i++) {
        zero += "0";
    }
    return (zero + num).slice(-digit);
}

function getPrettyTime(time, event, startTime) {

    let start = null;
    startTime.forEach(res => {
        if (res.unique_id == event) {
            start = res.start;

        }
    });

    let diff = time - start;
    // milliseconds
    let milli = diff / 1000;
    let decimalValue = milli.toString().indexOf(".");
    let resultMilli = milli.toString().substring(decimalValue + 1);

    let hour = [];
    hour.push(moment.utc(diff).format("H"));
    hour.push(moment.utc(diff).format("mm"));
    hour.push(moment.utc(diff).format("ss"));
    hour.push(zeroPrefix(resultMilli, 3));

    return `${hour[0]}:${hour[1]}:${hour[2]}:${hour[3]}`;
}



function stringToSlug(str) {
    return str
        .toLowerCase() // Convert the string to lowercase
        .trim() // Trim whitespace from both ends of the string
        .replace(/[^\w\s-]/g, '') // Remove all non-word characters (excluding whitespace and hyphens)
        .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with a single hyphen
        .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
}

function uniqueId(str, startTime) {

    let id = null;
    startTime.forEach(res => {
        if (res.name == str) id = res.unique_id
    })

    return id;
}



function organizeExcelData(datos, validacionesCabeceras) {
    if (!Array.isArray(datos) || datos.length < 2) {
        return {
            success: false,
            message: "Errorea: Ez da daturik eskuratu. Gutxienez errenkada bat izan behar duzu excelean.",
        };
    }

    // Extraer y normalizar las cabeceras
    const cabeceras = datos[0].map(cabecera => cabecera.trim().toLowerCase());

    // Crear el mapeo de cabeceras validado
    const mapeoCabeceras = {};
    for (const [clave, variantes] of Object.entries(validacionesCabeceras)) {
        const cabeceraValida = cabeceras.find(cabecera => variantes.includes(cabecera));
        if (!cabeceraValida) {
            return {
                success: false,
                message: `Errorea: Goiburu bat ez dago ondo excelean. Onartzen direnak: ${variantes.join(", ")}`,
            };
        }
        mapeoCabeceras[clave] = cabeceras.indexOf(cabeceraValida);
    }

    // Validar si hay columnas que no son válidas
    const columnasInvalidas = cabeceras.filter(
        cabecera => !Object.values(validacionesCabeceras).flat().includes(cabecera)
    );
    if (columnasInvalidas.length > 0) {
        return {
            success: false,
            message: `Errorea: Errenkada kopurua gaizki dagoela ematen du.`,
        };
    }

    // Convertir las filas de datos en objetos usando el mapeo de cabeceras
    const filas = datos.slice(1);
    const resultado = filas.map(fila => {
        const obj = {};
        for (const [clave, indice] of Object.entries(mapeoCabeceras)) {
            obj[clave] = fila[indice] || null; // Asignar null si el valor está vacío
        }
        return obj;
    });


    // Mapear las cabeceras originales a sus nuevos nombres
    const cabecerasOriginales = [...datos[0]];

    const cabecerasRenombradas = cabecerasOriginales.map(cabeceraOriginal => {
        const cabeceraNormalizada = cabeceraOriginal.trim().toLowerCase();

        // Buscar un nuevo nombre para esta cabecera
        for (const [nuevoNombre, variantes] of Object.entries(global.validacionesCabeceras)) {
            if (variantes.includes(cabeceraNormalizada)) {
                return nuevoNombre; // Encontramos un nombre válido
            }
        }

        // // Si no hay un nombre válido, lanzar un error
        // throw new Error(`Cabecera inválida encontrada: "${cabeceraOriginal}".`);
    });

    return {
        success: true,
        result: resultado,
        headers: cabecerasRenombradas // Clonar para preservar el orden
    };
}

function toSlug(str) {

    if (typeof str !== 'string') {
        return null;
    }

    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove non-alphanumeric characters
        .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading or trailing hyphens
}

// Export all functions at once
module.exports = {
    generateComputerDescription,
    calculateCRC16bit,
    getAntenna,
    hex2bin,
    hexToDec,
    bin2dec,
    dec2hex,
    CheckSum,
    filterName,
    getPrettyTime,
    stringToSlug,
    uniqueId,
    getAccurateTime,
    onTagDetected,
    percentsSum,
    generateRandomString,
    organizeExcelData,
    toSlug
};