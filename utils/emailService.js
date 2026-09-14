const { createEmailTransporter } = require("./helper");
const { getInvoiceEmailTemplate } = require("../emailTemplates/invoiceTemplate");

/**
 * Sends an email with the invoice PDF attached
 * @param {string} toEmail 
 * @param {string} userName 
 * @param {string} orderId 
 * @param {Buffer} pdfBuffer 
 */
const sendInvoiceEmail = async (toEmail, userName, orderId, pdfBuffer) => {
  try {
    const transporter = await createEmailTransporter();
    
    // Set up email data
    const mailOptions = {
      from: `"Rajlakshmi Javiks Online" <${process.env.SMTP_SIW_USER}>`,
      to: toEmail,
      subject: `Invoice for your Order #${orderId} - Rajlakshmi Javiks Online`,
      html: getInvoiceEmailTemplate(userName, orderId),
      attachments: [
        {
          filename: `Invoice_${orderId}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Invoice email sent successfully to ${toEmail}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to send invoice email:", error);
    return false;
  }
};

module.exports = {
  sendInvoiceEmail
};
