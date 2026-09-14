const puppeteer = require("puppeteer");
const moment = require("moment");
const path = require("path");
const fs = require("fs");

// Read logo and convert to base64
const getLogoBase64 = () => {
  try {
    const logoPath = path.join(__dirname, "../../RLJ/src/assets/logo/RAJLAXMI-JAVIK-png.png");
    if (fs.existsSync(logoPath)) {
      const bitmap = fs.readFileSync(logoPath);
      return `data:image/png;base64,${Buffer.from(bitmap).toString('base64')}`;
    }
  } catch (err) {
    console.error("Failed to load logo", err);
  }
  return "";
};

const generateInvoiceHTML = (orderData, user, cart) => {
  const invoiceDate = moment().format("DD MMM, YYYY");
  const orderId = orderData.orderId || "N/A";
  const logoSrc = getLogoBase64();
  
  let itemsHtml = "";
  let subtotal = 0;

  cart.forEach((item, index) => {
    const price = Number(item.price || item.product_price || 0);
    const qty = Number(item.quantity || item.product_quantity || 1);
    const total = price * qty;
    const weight = item.weight || item.product_weight || "-";
    const gstPercent = Number(item.gst_percent || 0);
    const gstAmount = (price * (gstPercent / 100)) * qty;
    
    subtotal += total;

    itemsHtml += `
      <tr>
        <td style="color: #718096;">${index + 1}</td>
        <td>
          <span class="item-name">${item.name || item.product_name}</span>
          ${gstPercent > 0 ? `<span class="item-meta">GST: ${gstPercent.toFixed(2)}% (+₹${gstAmount.toFixed(2)})</span>` : ''}
        </td>
        <td class="center" style="color: #4A5568;">${weight}</td>
        <td class="center" style="color: #4A5568;">${qty}</td>
        <td class="right" style="color: #4A5568;">₹${price.toFixed(2)}</td>
        <td class="right" style="font-weight: 600; color: #2D3748;">₹${total.toFixed(2)}</td>
      </tr>
    `;
  });

  const shipping = Number(user.shipping_charge || 0);
  const gst = Number(user.gst_amount || 0);
  const platformFee = Number(user.platform_fee || 0);
  const discount = Number(user.discount_amount || 0);
  const totalAmount = Number(user.user_total_amount || (subtotal + shipping + gst + platformFee - discount));

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice - ${orderId}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #2D3748;
          margin: 0;
          padding: 30px 40px;
          font-size: 13px;
          line-height: 1.6;
          background-color: #fff;
        }
        
        .invoice-container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
        }
        
        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          border-bottom: 2px solid #F0F4F8;
          padding-bottom: 25px;
        }
        
        .header-left {
          max-width: 60%;
        }
        
        .logo {
          margin-bottom: 15px;
        }
        
        .logo img {
          max-width: 180px;
          height: auto;
        }
        
        .company-details {
          color: #718096;
          font-size: 12px;
          line-height: 1.7;
        }
        
        .company-name {
          color: #01722C;
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }
        
        .header-right {
          text-align: right;
        }
        
        .invoice-title {
          font-size: 32px;
          font-weight: 700;
          color: #01722C;
          letter-spacing: 2px;
          margin: 0 0 10px 0;
          text-transform: uppercase;
        }
        
        /* Customer & Invoice Info Box */
        .info-section {
          display: flex;
          justify-content: space-between;
          gap: 30px;
          margin-bottom: 40px;
        }
        
        .info-card {
          background: #F8FAFC;
          border-radius: 8px;
          padding: 20px 25px;
          flex: 1;
          border: 1px solid #E2E8F0;
        }
        
        .info-card h3 {
          font-size: 11px;
          font-weight: 700;
          color: #A0AEC0;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 0 0 12px 0;
        }
        
        .bill-to p {
          margin: 4px 0;
          color: #4A5568;
        }
        
        .bill-to strong {
          color: #1A202C;
          font-size: 14px;
        }
        
        .invoice-meta {
          width: 100%;
          border-collapse: collapse;
        }
        
        .invoice-meta td {
          padding: 8px 0;
          border-bottom: 1px solid #EDF2F7;
        }
        
        .invoice-meta tr:last-child td {
          border-bottom: none;
        }
        
        .invoice-meta .label {
          color: #718096;
          font-weight: 500;
        }
        
        .invoice-meta .value {
          text-align: right;
          color: #2D3748;
          font-weight: 600;
        }
        
        .status-badge {
          background-color: #DEF7EC;
          color: #03543F;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          display: inline-block;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        /* Table */
        .table-container {
          margin-bottom: 30px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          overflow: hidden;
        }
        
        table.items {
          width: 100%;
          border-collapse: collapse;
        }
        
        table.items th {
          background-color: #F8FAFC;
          color: #4A5568;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 14px 16px;
          text-align: left;
          border-bottom: 1px solid #E2E8F0;
        }
        
        table.items th.center { text-align: center; }
        table.items th.right { text-align: right; }
        
        table.items td {
          padding: 16px;
          border-bottom: 1px solid #EDF2F7;
          vertical-align: top;
        }
        
        table.items tbody tr:last-child td {
          border-bottom: none;
        }
        
        table.items tbody tr:nth-child(even) {
          background-color: #FCFDFE;
        }
        
        table.items .item-name {
          font-weight: 600;
          color: #2D3748;
          display: block;
          margin-bottom: 4px;
          font-size: 14px;
        }
        
        table.items .item-meta {
          font-size: 11px;
          color: #718096;
        }
        
        table.items td.center { text-align: center; }
        table.items td.right { text-align: right; }
        
        /* Summary */
        .summary-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 50px;
        }
        
        .summary-card {
          width: 340px;
          background: #F8FAFC;
          border-radius: 8px;
          padding: 24px;
          border: 1px solid #E2E8F0;
        }
        
        .summary-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .summary-table td {
          padding: 8px 0;
          color: #4A5568;
        }
        
        .summary-table .value {
          text-align: right;
          font-weight: 500;
          color: #2D3748;
        }
        
        .summary-table .discount {
          color: #E53E3E;
        }
        
        .summary-table .total-row td {
          padding-top: 18px;
          margin-top: 10px;
          border-top: 2px solid #E2E8F0;
          color: #01722C;
          font-size: 20px;
          font-weight: 700;
        }
        
        .summary-table .total-row .value {
          color: #01722C;
        }
        
        /* Footer */
        .footer {
          border-top: 1px solid #E2E8F0;
          padding-top: 25px;
          text-align: center;
          color: #718096;
          font-size: 12px;
        }
        
        .footer p {
          margin: 6px 0;
        }
        
        .footer .thank-you {
          font-size: 15px;
          font-weight: 600;
          color: #01722C;
          margin-bottom: 12px;
          letter-spacing: 0.5px;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        
        <!-- Header -->
        <div class="header">
          <div class="header-left">
            <div class="logo">
              ${logoSrc ? `<img src="${logoSrc}" alt="Rajlakshmi Javiks International Logo" />` : ''}
            </div>
            <div class="company-name">Rajlakshmi Javiks International</div>
            <div class="company-details">
              11, Manish Bag Colony Rd, Durga Nagar,<br>
              Manish Baag Colony, Old Agarwal Nagar,<br>
              Indore, Madhya Pradesh 452001<br>
              <div style="margin-top: 6px;">
                <strong>Phone:</strong> 87692-15905, 87691-15905<br>
                <strong>Email:</strong> rajlakshmijaviksonline@gmail.com
              </div>
            </div>
          </div>
          <div class="header-right">
            <h1 class="invoice-title">Invoice</h1>
          </div>
        </div>

        <!-- Info Section -->
        <div class="info-section">
          <!-- Bill To -->
          <div class="info-card bill-to">
            <h3>Bill To</h3>
            <p><strong>${user.user_name || ""}</strong></p>
            <p>${user.user_house_number || ""}${user.user_landmark ? `, ${user.user_landmark}` : ""}</p>
            <p>${user.user_city || ""}${user.user_state ? `, ${user.user_state}` : ""} - ${user.user_pincode || ""}</p>
            <p>${user.user_country || "India"}</p>
            <div style="margin-top: 10px;">
              <p>Phone: ${user.user_mobile_num || ""}</p>
              <p>Email: ${user.user_email || ""}</p>
            </div>
          </div>
          
          <!-- Invoice Meta -->
          <div class="info-card">
            <h3>Invoice Details</h3>
            <table class="invoice-meta">
              <tr>
                <td class="label">Invoice No.</td>
                <td class="value">${orderId}</td>
              </tr>
              <tr>
                <td class="label">Invoice Date</td>
                <td class="value">${invoiceDate}</td>
              </tr>
              <tr>
                <td class="label">Payment Status</td>
                <td class="value"><span class="status-badge">PAID</span></td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Items Table -->
        <div class="table-container">
          <table class="items">
            <thead>
              <tr>
                <th style="width: 5%">#</th>
                <th style="width: 45%">Item Description</th>
                <th class="center" style="width: 15%">Weight</th>
                <th class="center" style="width: 10%">Qty</th>
                <th class="right" style="width: 12%">Price</th>
                <th class="right" style="width: 13%">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <!-- Summary Section -->
        <div class="summary-section">
          <div class="summary-card">
            <table class="summary-table">
              <tr>
                <td>Subtotal</td>
                <td class="value">₹${subtotal.toFixed(2)}</td>
              </tr>
              ${shipping > 0 ? `<tr><td>Shipping</td><td class="value">₹${shipping.toFixed(2)}</td></tr>` : ""}
              ${gst > 0 ? `<tr><td>GST</td><td class="value">₹${gst.toFixed(2)}</td></tr>` : ""}
              ${platformFee > 0 ? `<tr><td>Platform Fee</td><td class="value">₹${platformFee.toFixed(2)}</td></tr>` : ""}
              ${discount > 0 ? `<tr><td>Discount</td><td class="value discount">-₹${discount.toFixed(2)}</td></tr>` : ""}
              <tr class="total-row">
                <td>Grand Total</td>
                <td class="value">₹${totalAmount.toFixed(2)}</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="thank-you">Thank you for your business!</div>
          <p>If you have any questions concerning this invoice, please contact us at:</p>
          <p><strong>rajlakshmijaviksonline@gmail.com</strong></p>
        </div>
        
      </div>
    </body>
    </html>
  `;
};

/**
 * Generates a PDF invoice and returns the buffer
 * @param {Object} orderData { orderId }
 * @param {Object} user User details from payment
 * @param {Array} cart Array of cart items
 * @returns {Promise<Buffer>}
 */
const generateInvoicePDF = async (orderData, user, cart) => {
  const htmlContent = generateInvoiceHTML(orderData, user, cart);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });
  
  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "10mm", bottom: "10mm" },
  });

  await browser.close();
  return Buffer.from(pdfBuffer);
};

module.exports = {
  generateInvoicePDF,
  generateInvoiceHTML
};
