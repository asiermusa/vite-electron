const EPC_LEN = 24; // EPC
const PRESET_VALUE = 0xFFFF;
const POLYNOMIAL = 0x8408;

const moment = require('moment');

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

function filterName(tag, startList) {
    if (tag.length != EPC_LEN) return ["UNKNOWN"];

    if (!startList) return 'La lista no esta cargada...';

    let find = null;
    find = startList.filter((res, i) => {
        if (i == 0) return;
        if (res[0].padStart(24, '0') == tag) return res;
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
    let diff = time - start * 1000;
    // milliseconds
    let milli = diff / 1000;
    let decimalValue = milli.toString().indexOf(".");
    let resultMilli = milli.toString().substring(decimalValue + 1);

    let hour = [];
    hour.push(moment.utc(diff).format("HH"));
    hour.push(moment.utc(diff).format("mm"));
    hour.push(moment.utc(diff).format("ss"));
    hour.push(zeroPrefix(resultMilli, 3));

    return `${hour[0]}h:${hour[1]}:${hour[2]}:${hour[3]}`;
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

// Export all functions at once
module.exports = {
    calculateCRC16bit,
    getAntenna,
    hex2bin,
    bin2dec,
    dec2hex,
    CheckSum,
    filterName,
    getPrettyTime,
    stringToSlug,
    uniqueId,
};