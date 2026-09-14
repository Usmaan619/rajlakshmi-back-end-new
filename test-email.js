require('dotenv').config();
const { sendInvoiceEmail } = require('./utils/emailService');

(async () => {
  const result = await sendInvoiceEmail('test@example.com', 'Test User', '12345', Buffer.from('test pdf content'));
  console.log('Result:', result);
})();
