const ExcelJS = require('exceljs');
const path = require('path');

async function createExcel(responseData) {
    try {
        // Validate the input structure
        if (!responseData || !responseData.data || !responseData.data.headers || !responseData.data.data) {
            throw new Error('Invalid data format: Missing headers or rows.');
        }

        const headers = responseData.data.head; // Extract headers
        const rows = responseData.data.data;     // Extract data rows

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
        const filePath = path.join(__dirname, 'results.xlsx');
        await workbook.xlsx.writeFile(filePath);

        console.log(`Excel file created successfully at: ${filePath}`);
        return filePath; // Return the file path for further use
    } catch (error) {
        console.error('Error creating Excel file:', error.message);
        throw error; // Re-throw the error for the caller to handle
    }
}

module.exports = createExcel;