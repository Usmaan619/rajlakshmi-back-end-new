const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const moment = require("moment");
const { withConnection } = require("../../utils/helper");
// async function exportTableByDateToExcel(tableName) {
//   try {
//     return await withConnection(async (connection) => {
//       const todayDate = moment().format("YYYY-MM-DD");

//       // const todayDate = "2024-11-01"

//       // SQL query with a filter for the date column
//       const query = `SELECT * FROM ?? WHERE date = ?`;

//       const [rows] = await connection.execute(query, [tableName, todayDate]);

//       const worksheet = XLSX.utils.json_to_sheet(rows);

//       const workbook = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(workbook, worksheet, tableName);

//       // Specify the output Excel file path

//       const filePath = path.join(__dirname, `${tableName}.csv`);
//       // Write the workbook to a file
//       XLSX.writeFile(workbook, filePath);

//       console.log(`Excel file created successfully: ${filePath}`);
//       return filePath; // Return the file path
//     });
//   } catch (error) {
//     console.error("Error exporting table to Excel:", error.message);
//     throw error;
//   }
// }

async function exportTableToExcel(tableName) {
  try {
    return await withConnection(async (connection) => {
      const query = `SELECT * FROM \`${tableName}\``;

      const [rows] = await connection.execute(query);

      const worksheet = XLSX.utils.json_to_sheet(rows);

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, tableName);

      const filePath = path.join(__dirname, `${tableName}.xlsx`);

      XLSX.writeFile(workbook, filePath);

      console.log(`Excel file created successfully: ${filePath}`);

      return filePath; // Return the file path
    });
  } catch (error) {
    console.error("Error exporting table to Excel:", error.message);
    throw error;
  }
}

// working
// async function exportTableByMonthToExcel(tableName) {
//   try {
//     return await withConnection(async (connection) => {
//       // Get the first and last dates of the current month
//       const startOfMonth = moment().startOf("month").format("YYYY-MM-DD");
//       const endOfMonth = moment().endOf("month").format("YYYY-MM-DD");

//       // SQL query with a filter for the date range
//       const query = `SELECT * FROM ${tableName}`;

//       // Execute the query with date parameters only
//       const [rows] = await connection.execute(query, [
//         startOfMonth,
//         endOfMonth,
//       ]);

//       const worksheet = XLSX.utils.json_to_sheet(rows);

//       const workbook = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(workbook, worksheet, tableName);

//       // Specify the output Excel file path
//       const filePath = path.join(
//         __dirname,
//         `${tableName}_monthly_${moment().format("YYYY_MM")}.csv`
//       );

//       // Write the workbook to a file
//       XLSX.writeFile(workbook, filePath);

//       console.log(`Excel file created successfully: ${filePath}`);
//       return filePath; // Return the file path
//     });
//   } catch (error) {
//     console.error("Error exporting table to Excel:", error.message);
//     throw error;
//   }
// }

module.exports = {
  exportTableToExcel,
  // exportTableByDateToExcel,
  // exportTableByMonthToExcel,
};
