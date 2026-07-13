const monthlyReportModal = require("../../model/admin/monthlyReportModal");

exports.getAllSales = async (req, res) => {
  try {
    const { filterType, month, year } = req?.body;

    const data = await monthlyReportModal.getFilteredPaymentData(
      filterType,
      month,
      year
    );
    res.json({ success: true, data });
  } catch (error) {
    res.json({ success: false, error: "Failed to fetch products" });
  }
};

exports.getAllSalesRajlaxmi = async (req, res) => {
  try {
    const { filterType, month, year } = req?.body;

    const data = await monthlyReportModal.getFilteredPaymentDataRajlaxmi(
      filterType,
      month,
      year
    );
    res.json({ success: true, data });
  } catch (error) {
    res.json({ success: false, error: "Failed to fetch products" });
  }
};
