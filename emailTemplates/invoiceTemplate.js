const getInvoiceEmailTemplate = (userName, orderId) => {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Order Invoice</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f9f9f9;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background-color: #ffffff;
        padding: 30px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .header {
        text-align: center;
        border-bottom: 2px solid #2ecc71;
        padding-bottom: 20px;
        margin-bottom: 20px;
      }
      .header h1 {
        color: #2ecc71;
        margin: 0;
        font-size: 24px;
      }
      .content p {
        color: #555555;
        font-size: 16px;
        line-height: 1.6;
      }
      .content strong {
        color: #333333;
      }
      .footer {
        text-align: center;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #eeeeee;
        color: #999999;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Rajlakshmi Javiks Online</h1>
      </div>
      <div class="content">
        <p>Dear <strong>${userName || "Customer"}</strong>,</p>
        <p>Thank you for shopping with us! Your order <strong>#${orderId}</strong> has been successfully placed and payment is confirmed.</p>
        <p>Please find attached the detailed invoice for your order.</p>
        <p>If you have any questions or need further assistance, feel free to reply to this email or contact our support team.</p>
        <p>Best regards,<br><strong>Rajlakshmi Javiks Online Team</strong></p>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} Rajlakshmi Javiks Online. All rights reserved.
      </div>
    </div>
  </body>
  </html>`;
};

module.exports = {
  getInvoiceEmailTemplate
};
