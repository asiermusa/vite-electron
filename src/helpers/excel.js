const ExcelJS = require('exceljs');
const path = require('path');
const os = require('os'); // Para obtener la carpeta de usuario

async function createExcel(responseData) {
    try {

        responseData = JSON.parse(responseData)

        // Validate the input structure
        if (!responseData || !responseData.data.data || !responseData.data.head) {
            throw new Error('Invalid data format: Missing headers or rows.');
        }

        const headers = responseData.data.head; // Extract headers
        const rows = responseData.data.data; // Extract data rows

        // Create a new workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Results');

        // Add headers as the first row
        worksheet.addRow(headers);

        // Add each row of data
        rows.forEach(row => {
            const rowValues = headers.map(header => row[header] || ''); // Ensure values match headers
            worksheet.addRow(rowValues);
        });

        // Save the workbook to a file

        // Obtener la ruta a la carpeta Descargas del usuario
        const downloadsFolder = path.join(os.homedir(), 'Downloads');
        const filePath = path.join(downloadsFolder, 'results.xlsx');

        // Guardar el archivo en la carpeta Descargas
        await workbook.xlsx.writeFile(filePath);

        console.log(`Archivo Excel descargado en: ${filePath}`);
        return filePath; // Devolver la ruta del archivo por si es necesario

    } catch (error) {
        console.error('Error creating Excel file:', error.message);
        throw error; // Re-throw the error for the caller to handle
    }
}

module.exports = createExcel;