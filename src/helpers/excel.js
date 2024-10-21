const ExcelJS = require('exceljs');
const path = require('path');

const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('My Sheet');

async function createExcel(items, app) {
    worksheet.columns = [{
            header: 'Izena',
            key: 'name',
            width: 30
        },
        {
            header: 'Herria',
            key: 'city',
            width: 20
        },
        {
            header: 'Denbora',
            key: 'time',
            width: 15
        },
        {
            header: 'Tag',
            key: 'tag',
            width: 30
        },
        {
            header: 'Antena',
            key: 'ant',
            width: 10
        }
    ];

    items = JSON.parse(items);

    items.forEach(res => {
        worksheet.addRow({
            name: res.name,
            city: res.city,
            time: res.pretty_time,
            tag: res.tag,
            ant: res.ant
        });
    })

    const filePath = path.join(app.getPath('downloads'), 'time.xlsx');
    await workbook.xlsx.writeFile(filePath);

    return filePath;
}

module.exports = createExcel;