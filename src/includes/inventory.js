const moment = require('moment');
const axios = require('axios');

const {
    CheckSum,
    filterName,
    getPrettyTime,
    getAntenna,
    uniqueId,
    getAccurateTime,
    onTagDetected
} = require('../helpers/helpers.js');
const os = require('os');

function get_data(message, reader, reader_id = null) {
    reader.write(message, () => {});
    console.log('Inventory sended again from HELPER...', 'Reader ID: ' + reader_id);
}

function inventory_fn(data, reader, readerInfo) {

    // Reader jakin batetik jasotako datuak parseatu
    let buf = Buffer.from(data);
    let response = buf.toString('hex', 0, buf.length);
    let resp = [];
    buf.forEach((res) => {
        let current = res.toString(16);
        resp.push(current)
    })

    // ChatGPT - Batzuetan readerrak tag batzuk kate batean apilatzen ditu... Hau ekiditzeko balidazio hau egiten da. 
    // Honen bidez 20 karaktere eta a00a hasten den string bat dagoen ikusiko dugu. Horrela bada inbentario berriz eskatzeko (get_data) 
    let tags = response.match(/a00a[0-9a-f]{20}/g);
    if (tags) {
        response = tags[0];
    }

    // ANTENA TXEKEOA egin behar denean soilik.
    // Hau ez da inbentarioa
    if (response.substring(6, 8) == '8a' && global.checkAntennas && response.substring(2, 4) == '0a') {
        global.mainWindow.webContents.send('fromMain', ['checking', resp]);
        global.checkAntennas = false;
        return false;
    }

    // INBENTARIOA BERRIZ ESKATZEN denean. Eskuz geratu arte honek bueltaka jarraitu behar du (get-data() funtzioa deituo du berriz buklean sartzeko).
    if (response.substring(2, 4) == '0a' && global.startInventory == true) {

        let antennas = [];

        readerInfo.ants.filter((res, i) => {
            if (res) antennas[i] = '0x01'
            else antennas[i] = '0x00'
        })


        //let query = Buffer.from([0xA0, 0x0D, 0x01, 0x8A, 0x00, antennas[0], 0x01, antennas[1], 0x02, antennas[2], 0x03, antennas[3], 0x00, 0xFF]);
        // 8 ports
        let query = Buffer.from([0xA0, 0x15, 0x01, 0x8A, 0x00, antennas[0], 0x01, antennas[1], 0x02, antennas[2], 0x03, antennas[3], 0x04, antennas[4], 0x05, antennas[5], 0x06, antennas[6], 0x07, antennas[7], 0x25, 0xFF]);
        const check = CheckSum(query); // Example check
        const message = Buffer.concat([query, Buffer.from([check])]); // Concatenate buffers
        get_data(message, reader, readerInfo.name);
    }

    // TAGa balidatua izan denean hau kudeatu behar da.
    if (response.substring(6, 8) == '8a' && global.startInventory == true) {

        // Momentuko denbora timestamp jaso
        let currentTime = getAccurateTime().format('x');

        // Zein antenak jaso duen zehaztu
        let ant = getAntenna('0x' + resp[4], '0x' + resp[resp.length - 2]);

        // Ikusi ea count array nagusko 1. TAG den ala ez eta hau gorde.
        if (!global.count.length) {
            _mountTag(response.slice(14, global.TAG_LEN), currentTime, ant, readerInfo.name)
        }

        // Loop baten bidez zehaztu ea TAG hau count array nagusian existitzen den ala ez, TRUE / FALSE.
        let tagExist = false;
        global.count.forEach((res) => {
            // compare tag time
            let tagTime = parseInt(res.time) + global.readDelaySec;
            if (res.tag == response.slice(14, global.TAG_LEN) && currentTime < tagTime) {
                tagExist = true;
            }
        })

        // Exisititze ez bada hau kudeatu eta gorde _mountTag()
        if (!tagExist) {
            _mountTag(response.slice(14, global.TAG_LEN), currentTime, ant, readerInfo.name)
        }
    }
}

function _mountTag(tagLength, currentTime, ant, readerName) {

    // Momentuko datuak gorde: TAG, ANTENA, MOMENTUKO DENBORA.
    let currentTag = {
        tag: tagLength,
        ant: ant,
        time: currentTime,
    }

    // Hasierako parte-hartzaileen zerrenda orokorretik TAG honen datuak ekarri (izena, abizena, dortsala...)
    let current = filterName(currentTag.tag, global.startList);

    // Zerrendan existitzen ez bada hemen ETEN.
    if (current == "UNKNOWN") return false;

    // Parte-hartzaile honi dagokion lasterketaren datuak ekarri (Parte-hartzaile honen lasterketa zein ordutan hasi den zehazki).
    let currentEventTime = moment(current[4].start_date).unix(
        moment().tz("Europe/Madrid").format()
    );

    // Lasterketa hasi ez bada hemen ETEN (WordPresseko datuetik; ez da benetan erreala)
    if (parseInt(currentTime) < parseInt(currentEventTime)) {
        console.log("Ez da irakurketa hasi...");
        return false;
    }

    // Count array orokorrean gordeta dauden baloreetatik ikusi zenbat aldiz irakurri den TAG hau.
    let hostname = os.userInfo().username;
    let find = global.count.filter((res) => {
        return res.tag == tagLength;
    });

    // parte-hartzaile honen lastreketak zein SPLIT dituen ekarri (IRTEERA, TARTEKOA, HELMUGA...)
    let splitSlug = false;
    let findIndex = find.length ? find.length : 0;
    let array = [];
    global.selectedSplits.forEach((split) => {
        current[4].splits.forEach((item) => {
            if (split.items.includes(hostname) && split.group == item.slug) {
                array.push({
                    name: item.name,
                    slug: item.slug
                })
            }
        })
    })
    splitSlug = array[findIndex];
    // Goiko LOOParen SPLITEN arabera jakin ea daturik gorde behar den ala ez.
    if (!splitSlug) {
        console.log("Ez dago splitik gordetzeko...");
        return true;
    }

    // Split hau gorde daitekeen ala ez ikusi, splitaren orduaren arabera (WordPress backendean dagoen informazioa da hau).
    let splitDiffSeconds = moment.duration(current[4].splits[find.length].min_time).asSeconds();
    if (parseInt(currentTime) < parseInt(currentEventTime + splitDiffSeconds)) {
        console.log("Split hau oraindik ezin da irakurri...");
        return false;
    }

    // Parte-hartzaile honen lasterketa hasita dagoen ala ez ikusi (benetako hasiera eta ez WordPressean zehaztu dena).
    let start = null;
    global.startTime.forEach(res => {
        if (res.unique_id == uniqueId(current[4].name, startTime)) {
            start = res.start;
        }
    });
    if (!start) {
        console.log("Korrikalari honen lasterketa oraindik ez da hasi...");
        return false;
    }

    // Goiko filtro guztiak pasatu baditu parte-hartzaile honen datuak GORDEKO DIRA.
    currentTag.dorsal = current[1];
    currentTag.name = current[2];
    currentTag.city = current[3];
    currentTag.pretty_time = getPrettyTime(currentTime, uniqueId(current[4].name, global.startTime), global.startTime);
    currentTag.real_time = getAccurateTime().format("YYYY-MM-DD HH:mm:ss.SSS");
    currentTag.event = current[4].name;
    currentTag.split = splitSlug.name;
    currentTag.split_slug = splitSlug.slug;
    currentTag.reader = readerName;

    // Count array nagusian gehitu.
    global.count.push(currentTag)

    // cambiar porcentajes
    if (!global.percents.length) {

        global.percents.push({
            name: currentTag.split,
            group: currentTag.split_slug,
            count: 1
        })
    } else {
        let exist = 'no';
        global.percents.forEach((p, i) => {
            if (p.group == currentTag.split_slug) exist = i;
        })

        if (exist == 'no') {
            global.percents.push({
                name: currentTag.split,
                group: currentTag.split_slug,
                count: 1
            })
        } else {
            global.percents[exist].count = parseInt(global.percents[exist].count) + 1;
        }

    }


    // Soinua egin
    onTagDetected(currentTag);

    if (currentTag) {

        // Render pantaila bistaratuta badago bidali bestela GORDE Baina ez bidali.
        if (global.mainWindow && !global.mainWindow.isDestroyed()) {
            global.mainWindow.webContents.send('fromMain', ['inventory', currentTag]);
            global.mainWindow.webContents.send('fromMain', ['percents', global.percents]);
        } else console.error("Cannot send message, mainWindow is either destroyed or does not exist.");

        // socket.emit("currentTag", {
        //     currentTag
        // });

        return global.count;
    }
}

module.exports = {
    inventory_fn,
    get_data
}