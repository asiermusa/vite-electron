const moment = require('moment');

const {
    CheckSum,
    filterName,
    getPrettyTime,
    getAntenna,
    uniqueId
} = require('../helpers/helpers.js');
const os = require('os');

function get_data(message, reader, reader_id = null) {

    reader.write(message, () => {});
    console.log('sended again from HELPER...', 'Reader ID: ' + reader_id);
}

function inventory_fn(data, win, reader, checkAntennas, startInventory, startTime, startList, count, TAG_LEN, READ_DELAY_MS, selectedSplits, readerInfo) {

    let buf = Buffer.from(data);
    let response = buf.toString('hex', 0, buf.length);
    let resp = [];
    buf.forEach((res) => {
        let current = res.toString(16);
        resp.push(current)
    })

    // Regex to match both full-length (48 characters) and shorter tags (28 characters like a00a...)
    let tags = response.match(/a00a[0-9a-f]{20}/g);
    
    if (tags) {
        response = tags[0];
    }

    // console.log(response)


    // if (resp[1] == 4 && resp[4] != 10) {
    //   respuesta = errors.errors.find((err) => resp[4] == err.id)
    // }

    //ANTENNA CHECKING
    // if (resp[3] == '8a' && checkAntennas && resp[1] == 'a') {
    //     win.webContents.send('fromMain', ['checking', resp]);
    //     checkAntennas = false;
    //     return false;
    // }

    if (response.substring(2, 4) == '0a' && startInventory == true) {

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

    if (response.substring(6, 8) == '8a' && startInventory == true) {
        // let tagFilter = response.slice(14, 18);
        // if(tagFilter != '0000') return;
        // if(response.slice(14, 38).length < 23) return;

        let currentTime = moment().tz("Europe/Madrid").format('x');
        let ant = getAntenna('0x' + resp[4], '0x' + resp[resp.length - 2]);

        if (!count.length) {
            _mountTag(win, response.slice(14, TAG_LEN), count, startList, startTime, currentTime, ant, selectedSplits, readerInfo.name)
        }

        // ikusi ea tag hau count array nagusian existitzen den ala ez.
        let tagExist = false;
        count.forEach((res) => {
            // compare tag time
            let tagTime = parseInt(res.time) + READ_DELAY_MS;
            if (res.tag == response.slice(14, TAG_LEN) && currentTime < tagTime) {
                tagExist = true;
            }
        })

        if (!tagExist) {
            _mountTag(win, response.slice(14, TAG_LEN), count, startList, startTime, currentTime, ant, selectedSplits, readerInfo.name)
        }
    }
}

function _mountTag(win, tag_len, count, startList, startTime, currentTime, ant, selectedSplits, readerName) {

    let currentTag = {
        tag: tag_len,
        ant: ant,
        time: currentTime,
    }

    

    let current = filterName(currentTag.tag, startList);

    if (current == "UNKNOWN") return false;

    let real_datetime = moment().unix(moment().tz("Europe/Madrid").format())

    let current_time = moment(current[4].start_date).unix(
        moment().tz("Europe/Madrid").format()
    );

    if (parseInt(real_datetime) < parseInt(current_time)) {
        console.log("Ez da irakurketa hasi...");
        return false;
    }

    

    // Count array orokorrean gordeta dauden baloreetatik ikusi zenbat aldiz irakurri den TAG hau.
    let hostname = os.userInfo().username;
    let find = count.filter((res) => {
        return res.tag == tag_len;
    });

    let splitSlug = false;

    let findIndex = find.length ? find.length : 0;

    let array = [];
    selectedSplits.forEach((split) => {
        current[4].splits.forEach((item) => {
            if (split.items.includes(hostname) && split.group == item.slug) {
                array.push(item.name)
            }
        })
    })



    splitSlug = array[findIndex];

    if (!splitSlug) {
        console.log("Ez dago splitik gordetzeko...");
        return true;
    }

    // if (find.length < current[4].splits.length) {
    // } else {
    //     console.log("Ezin da besterik irakurri...");
    //     return false;
    // }

    let splitDiffSeconds = moment.duration(current[4].splits[find.length].min_time).asSeconds();

    // console.log(parseInt(real_datetime) + ' < ' + parseInt(current_time + splitDiffSeconds))

    if (parseInt(real_datetime) < parseInt(current_time + splitDiffSeconds)) {
        // console.log("Split hau oraindik ezin da irakurri...");
        return false;
    }

    let start = null;

    startTime.forEach(res => {
        if (res.unique_id == uniqueId(current[4].name, startTime)) {
            start = res.start;
        }
    });

    if (!start) {
        console.log("Korrikalari honen lasterketa oraindik ez da hasi...");
        return false;
    }

    currentTag.name = current[2];
    currentTag.city = current[3];
    currentTag.pretty_time = getPrettyTime(currentTime, uniqueId(current[4].name, startTime), startTime);
    currentTag.real_time = moment().tz("Europe/Madrid").format("YYYY-MM-DD HH:mm:ss");
    currentTag.split = splitSlug;
    currentTag.reader = readerName;

    

    count.push(currentTag)


    if (currentTag) {
        // currentFilter = currentTag.tag.substring(0, 4);
        

        win.webContents.send('fromMain', ['inventory', currentTag]);

        // socket.emit("currentTag", {
        //     currentTag
        // });

        return count;
    }
}


module.exports = {
    inventory_fn,
    get_data
}