const moment = require("moment/moment");
const { withConnection, calculateProfit } = require("../../utils/helper");

// final
exports.getFilteredPaymentData = async (filterType, month, year) => {
  try {
    let startDate, endDate;

    if (filterType === "last7days") {
      startDate = moment()
        .subtract(6, "days")
        .startOf("day")
        .format("YYYY-MM-DD");
      endDate = moment().endOf("day").format("YYYY-MM-DD");
    } else if (filterType === "monthly") {
      startDate = moment(`${year}-${month}-01`)
        .startOf("month")
        .format("YYYY-MM-DD");
      endDate = moment(`${year}-${month}-01`)
        .endOf("month")
        .format("YYYY-MM-DD");
    } else if (filterType === "yearly") {
      startDate = moment(`${year}-01-01`).format("YYYY-MM-DD");
      endDate = moment(`${year}-12-31`).format("YYYY-MM-DD");
    } else {
      throw new Error("Invalid filterType provided");
    }

    return await withConnection(async (connection) => {
      const dailyQuery = `
        SELECT 
          DATE_FORMAT(date, '%Y-%m-%d') AS day,
          COUNT(*) AS daily_total_users,
          SUM(user_total_amount) AS daily_total_sales
        FROM rajlaksmi_payment
        WHERE date BETWEEN ? AND ?
          AND status != 'Cancel'
          AND isPaymentPaid = '1'
        GROUP BY day;
      `;

      const summaryQuery = `
        SELECT 
          COUNT(*) AS total_users,
          SUM(user_total_amount) AS total_sales
        FROM rajlaksmi_payment
        WHERE date BETWEEN ? AND ?
          AND status != 'Cancel'
          AND isPaymentPaid = '1';
      `;

      const profitDataQuery = `
        SELECT 
          user_total_amount, purchase_price, product_quantity
        FROM rajlaksmi_payment
        WHERE date BETWEEN ? AND ?
          AND status != 'Cancel'
          AND isPaymentPaid = '1';
      `;

      const totalOrdersQuery = `
        SELECT COUNT(*) AS total_orders
        FROM rajlaksmi_payment
        WHERE date BETWEEN ? AND ?
          AND status != 'Cancel'
          AND isPaymentPaid = '1';
      `;

      const totalProductsQuery = `
        SELECT COUNT(*) AS total_products
        FROM rajlaksmi_product;
      `;

      const topUsersQuery = `
        SELECT *
        FROM rajlaksmi_payment
        WHERE date BETWEEN ? AND ?
          AND status != 'Cancel'
          AND isPaymentPaid = '1';
      `;

      const recentOrdersQuery = `
        SELECT *
        FROM rajlaksmi_payment
        WHERE status != 'Cancel'
          AND isPaymentPaid = '1'
        ORDER BY date DESC, time DESC
        LIMIT 10;
      `;

      const [
        [dailyDataRows],
        [[summaryData]],
        [profitRawRows],
        [[ordersData]],
        [[productsData]],
        [topUsers],
        [recentOrders],
      ] = await Promise.all([
        connection.execute(dailyQuery, [startDate, endDate]),
        connection.execute(summaryQuery, [startDate, endDate]),
        connection.execute(profitDataQuery, [startDate, endDate]),
        connection.execute(totalOrdersQuery, [startDate, endDate]),
        connection.execute(totalProductsQuery),
        connection.execute(topUsersQuery, [startDate, endDate]),
        connection.execute(recentOrdersQuery),
      ]);

      // Profit calculation
      let totalProfit = 0;
      for (const row of profitRawRows) {
        console.log("row.product_quantity: ", row.product_quantity);
        console.log("row.purchase_price: ", row.purchase_price);
        totalProfit += calculateProfit(
          row.user_total_amount,
          row.purchase_price,
          row.product_quantity,
        );
      }

      return {
        filterType,
        start: startDate,
        end: endDate,
        summary: summaryData,
        dailyBreakdown: dailyDataRows,
        monthlyProfit: totalProfit,
        totalOrders: ordersData.total_orders || 0,
        totalProducts: productsData.total_products || 0,
        topUsers,
        recentOrders,
      };
    });
  } catch (error) {
    console.error("Error in getFilteredPaymentData:", error);
    throw error;
  }
};

// exports.getFilteredPaymentData = async (filterType, month, year) => {
//   try {
//     let startDate, endDate;

//     if (filterType === "last7days") {
//       startDate = moment()
//         .subtract(6, "days")
//         .startOf("day")
//         .format("YYYY-MM-DD");
//       endDate = moment().endOf("day").format("YYYY-MM-DD");
//     } else if (filterType === "monthly") {
//       startDate = moment(`${year}-${month}-01`)
//         .startOf("month")
//         .format("YYYY-MM-DD");
//       endDate = moment(`${year}-${month}-01`)
//         .endOf("month")
//         .format("YYYY-MM-DD");
//     } else if (filterType === "yearly") {
//       startDate = moment(`${year}-01-01`).format("YYYY-MM-DD");
//       endDate = moment(`${year}-12-31`).format("YYYY-MM-DD");
//     } else {
//       throw new Error("Invalid filterType provided");
//     }

//     return await withConnection(async (connection) => {
//       const dailyQuery = `
//         SELECT
//           DATE_FORMAT(date, '%Y-%m-%d') AS day,
//           COUNT(*) AS daily_total_users,
//           SUM(user_total_amount) AS daily_total_sales
//         FROM rajlaksmi_payment
//         WHERE date BETWEEN ? AND ?
//           AND status != 'Cancel'
//         GROUP BY day;
//       `;

//       const summaryQuery = `
//         SELECT
//           COUNT(*) AS total_users,
//           SUM(user_total_amount) AS total_sales
//         FROM rajlaksmi_payment
//         WHERE date BETWEEN ? AND ?
//           AND status != 'Cancel';
//       `;

//       const profitDataQuery = `
//         SELECT
//           user_total_amount, purchase_price, product_quantity
//         FROM rajlaksmi_payment
//         WHERE date BETWEEN ? AND ?
//           AND status != 'Cancel';
//       `;

//       const totalOrdersQuery = `
//         SELECT COUNT(*) AS total_orders
//         FROM rajlaksmi_payment
//         WHERE date BETWEEN ? AND ?
//           AND status != 'Cancel';
//       `;

//       const totalProductsQuery = `
//         SELECT COUNT(*) AS total_products
//         FROM rajlaksmi_product;
//       `;

//       const topUsersQuery = `
//         SELECT *
//         FROM rajlaksmi_payment
//         WHERE date BETWEEN ? AND ?
//           AND status != 'Cancel';
//       `;

//       const recentOrdersQuery = `
//         SELECT *
//         FROM rajlaksmi_payment
//         WHERE status != 'Cancel'
//         ORDER BY date DESC, time DESC
//         LIMIT 10;
//       `;

//       const [
//         [dailyDataRows],
//         [[summaryData]],
//         [profitRawRows],
//         [[ordersData]],
//         [[productsData]],
//         [topUsers],
//         [recentOrders],
//       ] = await Promise.all([
//         connection.execute(dailyQuery, [startDate, endDate]),
//         connection.execute(summaryQuery, [startDate, endDate]),
//         connection.execute(profitDataQuery, [startDate, endDate]),
//         connection.execute(totalOrdersQuery, [startDate, endDate]),
//         connection.execute(totalProductsQuery),
//         connection.execute(topUsersQuery, [startDate, endDate]),
//         connection.execute(recentOrdersQuery),
//       ]);

//       let totalProfit = 0;
//       for (const row of profitRawRows) {
//         totalProfit += calculateProfit(
//           row.user_total_amount,
//           row.purchase_price,
//           row.product_quantity,
//         );
//       }

//       return {
//         filterType,
//         start: startDate,
//         end: endDate,
//         summary: summaryData,
//         dailyBreakdown: dailyDataRows,
//         monthlyProfit: totalProfit,
//         totalOrders: ordersData.total_orders || 0,
//         totalProducts: productsData.total_products || 0,
//         topUsers,
//         recentOrders,
//       };
//     });
//   } catch (error) {
//     console.error("Error in getFilteredPaymentData:", error);
//     throw error;
//   }
// };

exports.getFilteredPaymentDataRajlaxmi = async (filterType, month, year) => {
  try {
    let startDate, endDate;

    if (filterType === "last7days") {
      startDate = moment()
        .subtract(6, "days")
        .startOf("day")
        .format("YYYY-MM-DD");
      endDate = moment().endOf("day").format("YYYY-MM-DD");
    } else if (filterType === "monthly") {
      startDate = moment(`${year}-${month}-01`)
        .startOf("month")
        .format("YYYY-MM-DD");
      endDate = moment(`${year}-${month}-01`)
        .endOf("month")
        .format("YYYY-MM-DD");
    } else if (filterType === "yearly") {
      startDate = moment(`${year}-01-01`).format("YYYY-MM-DD");
      endDate = moment(`${year}-12-31`).format("YYYY-MM-DD");
    } else {
      throw new Error("Invalid filterType provided");
    }

    return await withConnection(async (connection) => {
      const dailyQuery = `
        SELECT 
          DATE_FORMAT(date, '%Y-%m-%d') AS day,
          COUNT(*) AS daily_total_users,
          SUM(user_total_amount) AS daily_total_sales
        FROM rajlaxmi_payment
        WHERE date BETWEEN ? AND ?
          AND status != 'Cancel'
        GROUP BY day;
      `;

      const summaryQuery = `
        SELECT 
          COUNT(*) AS total_users,
          SUM(user_total_amount) AS total_sales
        FROM rajlaxmi_payment
        WHERE date BETWEEN ? AND ?
          AND status != 'Cancel';
      `;

      const profitDataQuery = `
        SELECT 
          user_total_amount, purchase_price, product_quantity
        FROM rajlaxmi_payment
        WHERE date BETWEEN ? AND ?
          AND status != 'Cancel';
      `;

      const totalOrdersQuery = `
        SELECT COUNT(*) AS total_orders
        FROM rajlaxmi_orders
        WHERE DATE(created_at) BETWEEN ? AND ?
          AND order_status = 'Processing';
      `;

      const totalProductsQuery = `
        SELECT COUNT(*) AS total_products
        FROM rajlaxmi_payment;
      `;

      const topUsersQuery = `
        SELECT *
        FROM rajlaxmi_payment
        WHERE date BETWEEN ? AND ?
          AND status != 'Cancel';
      `;

      const recentOrdersQuery = `
        SELECT *
        FROM rajlaxmi_orders
        WHERE order_status = 'Processing'
        ORDER BY created_at DESC
        LIMIT 10;
      `;

      const [
        [dailyDataRows],
        [[summaryData]],
        [profitRawRows],
        [[ordersData]],
        [[productsData]],
        [topUsers],
        [recentOrders],
      ] = await Promise.all([
        connection.execute(dailyQuery, [startDate, endDate]),
        connection.execute(summaryQuery, [startDate, endDate]),
        connection.execute(profitDataQuery, [startDate, endDate]),
        connection.execute(totalOrdersQuery, [startDate, endDate]),
        connection.execute(totalProductsQuery),
        connection.execute(topUsersQuery, [startDate, endDate]),
        connection.execute(recentOrdersQuery),
      ]);

      let totalProfit = 0;
      for (const row of profitRawRows) {
        totalProfit += calculateProfit(
          row.user_total_amount,
          row.purchase_price,
          row.product_quantity,
        );
      }

      return {
        filterType,
        start: startDate,
        end: endDate,
        summary: summaryData,
        dailyBreakdown: dailyDataRows,
        monthlyProfit: totalProfit,
        totalOrders: ordersData.total_orders || 0,
        totalProducts: productsData.total_products || 0,
        topUsers,
        recentOrders,
      };
    });
  } catch (error) {
    console.error("Error in getFilteredPaymentData:", error);
    throw error;
  }
};

// exports.getFilteredPaymentDataRajlaxmi = async (filterType, month, year) => {
//   try {
//     let startDate, endDate;

//     if (filterType === "last7days") {
//       startDate = moment().subtract(6, "days").startOf("day").format("YYYY-MM-DD");
//       endDate = moment().endOf("day").format("YYYY-MM-DD");
//     } else if (filterType === "monthly") {
//       startDate = moment(`${year}-${month}-01`).startOf("month").format("YYYY-MM-DD");
//       endDate = moment(`${year}-${month}-01`).endOf("month").format("YYYY-MM-DD");
//     } else if (filterType === "yearly") {
//       startDate = moment(`${year}-01-01`).format("YYYY-MM-DD");
//       endDate = moment(`${year}-12-31`).format("YYYY-MM-DD");
//     } else {
//       throw new Error("Invalid filterType provided");
//     }

//     return await withConnection(async (connection) => {
//       const dailyQuery = `
//         SELECT
//           DATE_FORMAT(date, '%Y-%m-%d') AS day,
//           COUNT(*) AS daily_total_users,
//           SUM(user_total_amount) AS daily_total_sales
//         FROM rajlaxmi_payment
//         WHERE date BETWEEN ? AND ?
//           AND status = 'Cancel'
//         GROUP BY day;
//       `;

//       const summaryQuery = `
//         SELECT
//           COUNT(*) AS total_users,
//           SUM(user_total_amount) AS total_sales
//         FROM rajlaxmi_payment
//         WHERE date BETWEEN ? AND ?
//           AND status = 'Cancel';
//       `;

//       const profitDataQuery = `
//         SELECT
//           user_total_amount, purchase_price, product_quantity
//         FROM rajlaxmi_payment
//         WHERE date BETWEEN ? AND ?
//           AND status = 'Cancel';
//       `;

//       const totalOrdersQuery = `
//         SELECT COUNT(*) AS total_orders
//         FROM rajlaxmi_orders
//         WHERE DATE(created_at) BETWEEN ? AND ?
//           AND order_status = 'Processing';
//       `;

//       const totalProductsQuery = `
//         SELECT COUNT(*) AS total_products
//         FROM rajlaxmi_payment
//         WHERE date BETWEEN ? AND ?
//           AND status = 'Cancel';
//       `;

//       const topUsersQuery = `
//         SELECT
//           u.firstName,
//           u.lastName,
//           u.email,
//           u.mobileNumber,
//           p.uid,
//           p.user_total_amount,
//           p.product_quantity,
//           p.date
//         FROM rajlaxmi_payment p
//         JOIN rajlaxmi_user u ON p.uid = u.uid
//         WHERE p.date BETWEEN ? AND ?
//           AND p.status = 'Cancel';
//       `;

//       const recentOrdersQuery = `
//         SELECT o.*, u.firstName, u.lastName
//         FROM rajlaxmi_orders o
//         JOIN rajlaxmi_user u ON o.uid = u.uid
//         WHERE o.order_status = 'Processing'
//         ORDER BY o.created_at DESC
//         LIMIT 10;
//       `;

//       const [
//         [dailyDataRows],
//         [[summaryData]],
//         [profitRawRows],
//         [[ordersData]],
//         [[productsData]],
//         [topUsers],
//         [recentOrders],
//       ] = await Promise.all([
//         connection.execute(dailyQuery, [startDate, endDate]),
//         connection.execute(summaryQuery, [startDate, endDate]),
//         connection.execute(profitDataQuery, [startDate, endDate]),
//         connection.execute(totalOrdersQuery, [startDate, endDate]),
//         connection.execute(totalProductsQuery, [startDate, endDate]),
//         connection.execute(topUsersQuery, [startDate, endDate]),
//         connection.execute(recentOrdersQuery),
//       ]);

//       let totalProfit = 0;
//       for (const row of profitRawRows) {
//         totalProfit += calculateProfit(
//           row.user_total_amount,
//           row.purchase_price,
//           row.product_quantity
//         );
//       }

//       return {
//         filterType,
//         start: startDate,
//         end: endDate,
//         summary: summaryData,
//         dailyBreakdown: dailyDataRows,
//         monthlyProfit: totalProfit,
//         totalOrders: ordersData.total_orders || 0,
//         totalProducts: productsData.total_products || 0,
//         topUsers,
//         recentOrders,
//       };
//     });
//   } catch (error) {
//     console.error("Error in getFilteredPaymentDataRajlaxmi:", error);
//     throw error;
//   }
// };
