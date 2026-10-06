const PDFDocument = require("pdfkit");
const moment = require("moment");
const path = require("path");
const fs = require("fs");

// ─── Brand Colors ───────────────────────────────────────────
const BRAND_GREEN = "#01722C";
const DARK_TEXT = "#1A202C";
const BODY_TEXT = "#4A5568";
const MUTED_TEXT = "#718096";
const LIGHT_BORDER = "#E2E8F0";
const CARD_BG = "#F8FAFC";
const BADGE_BG = "#DEF7EC";
const BADGE_TEXT = "#03543F";
const ROW_ALT = "#FCFDFE";
const DISCOUNT_RED = "#E53E3E";

// ─── Helper: hex color to RGB array ─────────────────────────
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
};

// ─── Helper: Draw a rounded rect ────────────────────────────
const roundedRect = (doc, x, y, w, h, r) => {
  doc
    .moveTo(x + r, y)
    .lineTo(x + w - r, y)
    .quadraticCurveTo(x + w, y, x + w, y + r)
    .lineTo(x + w, y + h - r)
    .quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    .lineTo(x + r, y + h)
    .quadraticCurveTo(x, y + h, x, y + h - r)
    .lineTo(x, y + r)
    .quadraticCurveTo(x, y, x + r, y);
};

// ─── Helper: Draw a filled rounded rect ─────────────────────
const fillRoundedRect = (doc, x, y, w, h, r, fillColor) => {
  roundedRect(doc, x, y, w, h, r);
  doc.fill(fillColor);
};

// ─── Helper: Draw a stroked rounded rect ────────────────────
const strokeRoundedRect = (doc, x, y, w, h, r, strokeColor, lineWidth = 0.5) => {
  roundedRect(doc, x, y, w, h, r);
  doc.lineWidth(lineWidth).stroke(strokeColor);
};

// ─── Get logo path ──────────────────────────────────────────
const getLogoPath = () => {
  const logoPath = path.join(__dirname, "../../RLJ/src/assets/logo/RAJLAXMI-JAVIK-png.png");
  if (fs.existsSync(logoPath)) return logoPath;
  return null;
};

/**
 * Generates a premium PDF invoice buffer using PDFKit (no browser needed)
 */
const generateInvoicePDF = async (orderData, user, cart) => {
  return new Promise((resolve, reject) => {
    try {
      const invoiceDate = moment().format("DD MMM, YYYY");
      const orderId = orderData.orderId || "N/A";

      // ── Calculate totals ──────────────────────────────────
      let subtotal = 0;
      const items = cart.map((item, index) => {
        const price = Number(item.price || item.product_price || 0);
        const qty = Number(item.quantity || item.product_quantity || 1);
        const total = price * qty;
        const weight = item.weight || item.product_weight || "-";
        const gstPercent = Number(item.gst_percent || 0);
        const gstAmount = (price * (gstPercent / 100)) * qty;
        subtotal += total;
        return {
          index: index + 1,
          name: item.name || item.product_name || "Product",
          weight,
          qty,
          price,
          total,
          gstPercent,
          gstAmount,
        };
      });

      const shipping = Number(user.shipping_charge || 0);
      const gst = Number(user.gst_amount || 0);
      const platformFee = Number(user.platform_fee || 0);
      const discount = Number(user.discount_amount || 0);
      const totalAmount = Number(
        user.user_total_amount || subtotal + shipping + gst + platformFee - discount
      );

      // ── Create PDF Document ───────────────────────────────
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 40, bottom: 40, left: 45, right: 45 },
        bufferPages: true,
      });

      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      const pageWidth = doc.page.width;
      const contentWidth = pageWidth - 90; // 45px margins each side
      const leftMargin = 45;
      const rightEdge = pageWidth - 45;

      // ════════════════════════════════════════════════════════
      //  HEADER SECTION
      // ════════════════════════════════════════════════════════
      let cursorY = 40;

      // Logo
      const logoPath = getLogoPath();
      if (logoPath) {
        doc.image(logoPath, leftMargin, cursorY, { width: 140 });
      }

      // INVOICE title (top right)
      doc
        .font("Helvetica-Bold")
        .fontSize(28)
        .fillColor(BRAND_GREEN)
        .text("INVOICE", rightEdge - 170, cursorY + 5, {
          width: 170,
          align: "right",
        });

      cursorY += 55;

      // Company Name
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor(BRAND_GREEN)
        .text("Rajlakshmi Javiks International", leftMargin, cursorY);

      cursorY += 20;

      // Company Address
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(MUTED_TEXT)
        .text("11, Manish Bag Colony Rd, Durga Nagar,", leftMargin, cursorY)
        .text("Manish Baag Colony, Old Agarwal Nagar,", leftMargin, cursorY + 12)
        .text("Indore, Madhya Pradesh 452001", leftMargin, cursorY + 24);

      cursorY += 42;

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(MUTED_TEXT)
        .text("Phone: ", leftMargin, cursorY, { continued: true })
        .font("Helvetica")
        .text("87692-15905, 87691-15905");

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(MUTED_TEXT)
        .text("Email: ", leftMargin, cursorY + 13, { continued: true })
        .font("Helvetica")
        .text("rajlakshmijaviksonline@gmail.com");

      cursorY += 35;

      // Header separator line
      doc
        .moveTo(leftMargin, cursorY)
        .lineTo(rightEdge, cursorY)
        .lineWidth(1.5)
        .stroke(LIGHT_BORDER);

      cursorY += 20;

      // ════════════════════════════════════════════════════════
      //  INFO CARDS (Bill To + Invoice Details)
      // ════════════════════════════════════════════════════════
      const cardGap = 20;
      const cardWidth = (contentWidth - cardGap) / 2;
      const cardHeight = 140;
      const cardPadding = 16;

      // Bill To Card
      fillRoundedRect(doc, leftMargin, cursorY, cardWidth, cardHeight, 6, CARD_BG);
      strokeRoundedRect(doc, leftMargin, cursorY, cardWidth, cardHeight, 6, LIGHT_BORDER);

      let cardY = cursorY + cardPadding;
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(MUTED_TEXT)
        .text("BILL TO", leftMargin + cardPadding, cardY);

      cardY += 16;
      const name = user.user_name || "";
      const nameHeight = doc.heightOfString(name, { width: cardWidth - cardPadding * 2 }) || 14;
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(DARK_TEXT)
        .text(name, leftMargin + cardPadding, cardY, {
          width: cardWidth - cardPadding * 2,
        });

      cardY += Math.max(nameHeight, 14) + 6;

      const addressParts = [
        [user.user_house_number, user.user_landmark].filter(Boolean).join(", "),
        [user.user_city, user.user_state].filter(Boolean).join(", ") +
          (user.user_pincode ? ` - ${user.user_pincode}` : ""),
        user.user_country || "India",
      ].filter(Boolean);

      doc.font("Helvetica").fontSize(9).fillColor(BODY_TEXT);
      addressParts.forEach((line) => {
        const textHeight = doc.heightOfString(line, { width: cardWidth - cardPadding * 2 });
        doc.text(line, leftMargin + cardPadding, cardY, {
          width: cardWidth - cardPadding * 2,
        });
        cardY += textHeight + 2;
      });

      cardY += 4;
      if (user.user_mobile_num) {
        const phoneHeight = doc.heightOfString(`Phone: ${user.user_mobile_num}`, { width: cardWidth - cardPadding * 2 });
        doc.text(`Phone: ${user.user_mobile_num}`, leftMargin + cardPadding, cardY, {
          width: cardWidth - cardPadding * 2,
        });
        cardY += phoneHeight + 2;
      }
      if (user.user_email) {
        doc.text(`Email: ${user.user_email}`, leftMargin + cardPadding, cardY, {
          width: cardWidth - cardPadding * 2,
        });
      }

      // Invoice Details Card
      const card2X = leftMargin + cardWidth + cardGap;
      fillRoundedRect(doc, card2X, cursorY, cardWidth, cardHeight, 6, CARD_BG);
      strokeRoundedRect(doc, card2X, cursorY, cardWidth, cardHeight, 6, LIGHT_BORDER);

      cardY = cursorY + cardPadding;
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(MUTED_TEXT)
        .text("INVOICE DETAILS", card2X + cardPadding, cardY);

      cardY += 20;

      // Invoice meta rows
      const metaItems = [
        { label: "Invoice No.", value: orderId },
        { label: "Invoice Date", value: invoiceDate },
      ];

      metaItems.forEach((meta) => {
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor(MUTED_TEXT)
          .text(meta.label, card2X + cardPadding, cardY);
        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor(DARK_TEXT)
          .text(meta.value, card2X + cardPadding, cardY, {
            width: cardWidth - cardPadding * 2,
            align: "right",
          });
        // Separator line
        cardY += 14;
        doc
          .moveTo(card2X + cardPadding, cardY)
          .lineTo(card2X + cardWidth - cardPadding, cardY)
          .lineWidth(0.3)
          .stroke(LIGHT_BORDER);
        cardY += 10;
      });

      // Payment Status row
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(MUTED_TEXT)
        .text("Payment Status", card2X + cardPadding, cardY);

      // PAID badge
      const badgeW = 42;
      const badgeH = 16;
      const badgeX = card2X + cardWidth - cardPadding - badgeW;
      const badgeY = cardY - 2;
      fillRoundedRect(doc, badgeX, badgeY, badgeW, badgeH, 8, BADGE_BG);
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(BADGE_TEXT)
        .text("PAID", badgeX, badgeY + 4, { width: badgeW, align: "center" });

      cursorY += cardHeight + 25;

      // ════════════════════════════════════════════════════════
      //  ITEMS TABLE
      // ════════════════════════════════════════════════════════
      const colWidths = {
        num: 30,
        desc: contentWidth * 0.38,
        weight: contentWidth * 0.13,
        qty: contentWidth * 0.08,
        price: contentWidth * 0.15,
        total: contentWidth * 0.15,
      };

      // Remaining space for description
      colWidths.desc =
        contentWidth - colWidths.num - colWidths.weight - colWidths.qty - colWidths.price - colWidths.total;

      const colX = {
        num: leftMargin,
        desc: leftMargin + colWidths.num,
        weight: leftMargin + colWidths.num + colWidths.desc,
        qty: leftMargin + colWidths.num + colWidths.desc + colWidths.weight,
        price: leftMargin + colWidths.num + colWidths.desc + colWidths.weight + colWidths.qty,
        total: rightEdge - colWidths.total,
      };

      const rowHeight = 36;
      const headerHeight = 30;

      // Table border (rounded rect for whole table)
      const tableStartY = cursorY;

      // Table header background
      fillRoundedRect(doc, leftMargin, cursorY, contentWidth, headerHeight, 6, CARD_BG);
      // Only round top corners, so fill bottom part with same color
      doc.rect(leftMargin, cursorY + 10, contentWidth, headerHeight - 10).fill(CARD_BG);

      // Header text
      const headerY = cursorY + 9;
      doc.font("Helvetica-Bold").fontSize(8).fillColor(BODY_TEXT);
      doc.text("#", colX.num + 8, headerY);
      doc.text("ITEM DESCRIPTION", colX.desc + 8, headerY);
      doc.text("WEIGHT", colX.weight, headerY, { width: colWidths.weight, align: "center" });
      doc.text("QTY", colX.qty, headerY, { width: colWidths.qty, align: "center" });
      doc.text("PRICE", colX.price, headerY, { width: colWidths.price, align: "right" });
      doc.text("TOTAL", colX.total, headerY, { width: colWidths.total - 8, align: "right" });

      // Header bottom line
      cursorY += headerHeight;
      doc
        .moveTo(leftMargin, cursorY)
        .lineTo(rightEdge, cursorY)
        .lineWidth(0.5)
        .stroke(LIGHT_BORDER);

      // Table rows
      items.forEach((item, idx) => {
        // Check if we need a new page
        if (cursorY + rowHeight + 10 > doc.page.height - 120) {
          doc.addPage();
          cursorY = 40;
        }

        // Alternating row background
        if (idx % 2 === 1) {
          doc.rect(leftMargin, cursorY, contentWidth, rowHeight).fill(ROW_ALT);
        }

        const textY = cursorY + 10;

        // Row number
        doc.font("Helvetica").fontSize(9).fillColor(MUTED_TEXT);
        doc.text(String(item.index), colX.num + 8, textY);

        // Product name (bold)
        doc.font("Helvetica-Bold").fontSize(10).fillColor(DARK_TEXT);
        doc.text(item.name, colX.desc + 8, textY - 1, {
          width: colWidths.desc - 16,
          lineBreak: true,
          height: 14,
          ellipsis: true,
        });

        // GST info below name
        if (item.gstPercent > 0) {
          doc.font("Helvetica").fontSize(7).fillColor(MUTED_TEXT);
          doc.text(
            `GST: ${item.gstPercent.toFixed(2)}% (+Rs.${item.gstAmount.toFixed(2)})`,
            colX.desc + 8,
            textY + 13
          );
        }

        // Weight
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor(BODY_TEXT)
          .text(item.weight, colX.weight, textY, { width: colWidths.weight, align: "center" });

        // Qty
        doc.text(String(item.qty), colX.qty, textY, { width: colWidths.qty, align: "center" });

        // Price
        doc.text(`Rs.${item.price.toFixed(2)}`, colX.price, textY, {
          width: colWidths.price,
          align: "right",
        });

        // Total
        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor(DARK_TEXT)
          .text(`Rs.${item.total.toFixed(2)}`, colX.total, textY, {
            width: colWidths.total - 8,
            align: "right",
          });

        cursorY += rowHeight;

        // Row separator
        if (idx < items.length - 1) {
          doc
            .moveTo(leftMargin, cursorY)
            .lineTo(rightEdge, cursorY)
            .lineWidth(0.3)
            .stroke("#EDF2F7");
        }
      });

      // Table outer border
      const tableHeight = cursorY - tableStartY;
      strokeRoundedRect(doc, leftMargin, tableStartY, contentWidth, tableHeight, 6, LIGHT_BORDER, 0.5);

      cursorY += 20;

      // ════════════════════════════════════════════════════════
      //  SUMMARY CARD (right-aligned)
      // ════════════════════════════════════════════════════════
      const summaryWidth = 260;
      const summaryX = rightEdge - summaryWidth;
      let summaryRows = [{ label: "Subtotal", value: `Rs.${subtotal.toFixed(2)}` }];
      if (shipping > 0) summaryRows.push({ label: "Shipping", value: `Rs.${shipping.toFixed(2)}` });
      if (gst > 0) summaryRows.push({ label: "GST", value: `Rs.${gst.toFixed(2)}` });
      if (platformFee > 0) summaryRows.push({ label: "Platform Fee", value: `Rs.${platformFee.toFixed(2)}` });
      if (discount > 0) summaryRows.push({ label: "Discount", value: `-Rs.${discount.toFixed(2)}`, isDiscount: true });

      const summaryRowH = 24;
      const totalRowH = 36;
      const summaryHeight = summaryRows.length * summaryRowH + totalRowH + 30;

      // Check if summary fits on page
      if (cursorY + summaryHeight + 80 > doc.page.height - 40) {
        doc.addPage();
        cursorY = 40;
      }

      fillRoundedRect(doc, summaryX, cursorY, summaryWidth, summaryHeight, 6, CARD_BG);
      strokeRoundedRect(doc, summaryX, cursorY, summaryWidth, summaryHeight, 6, LIGHT_BORDER);

      let sumY = cursorY + 14;
      const sumPad = 18;

      summaryRows.forEach((row) => {
        doc.font("Helvetica").fontSize(9).fillColor(BODY_TEXT);
        doc.text(row.label, summaryX + sumPad, sumY);

        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor(row.isDiscount ? DISCOUNT_RED : DARK_TEXT)
          .text(row.value, summaryX + sumPad, sumY, {
            width: summaryWidth - sumPad * 2,
            align: "right",
          });
        sumY += summaryRowH;
      });

      // Divider before total
      sumY += 4;
      doc
        .moveTo(summaryX + sumPad, sumY)
        .lineTo(summaryX + summaryWidth - sumPad, sumY)
        .lineWidth(1.5)
        .stroke(LIGHT_BORDER);
      sumY += 12;

      // Grand Total
      doc.font("Helvetica-Bold").fontSize(16).fillColor(BRAND_GREEN);
      doc.text("Grand Total", summaryX + sumPad, sumY);
      doc.text(`Rs.${totalAmount.toFixed(2)}`, summaryX + sumPad, sumY, {
        width: summaryWidth - sumPad * 2,
        align: "right",
      });

      cursorY += summaryHeight + 40;

      // ════════════════════════════════════════════════════════
      //  FOOTER
      // ════════════════════════════════════════════════════════
      // Check if footer fits
      if (cursorY + 60 > doc.page.height - 40) {
        doc.addPage();
        cursorY = 40;
      }

      // Footer separator
      doc
        .moveTo(leftMargin, cursorY)
        .lineTo(rightEdge, cursorY)
        .lineWidth(0.5)
        .stroke(LIGHT_BORDER);

      cursorY += 18;

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor(BRAND_GREEN)
        .text("Thank you for your business!", leftMargin, cursorY, {
          width: contentWidth,
          align: "center",
        });

      cursorY += 20;

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(MUTED_TEXT)
        .text(
          "If you have any questions concerning this invoice, please contact us at:",
          leftMargin,
          cursorY,
          { width: contentWidth, align: "center" }
        );

      cursorY += 14;

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(BODY_TEXT)
        .text("rajlakshmijaviksonline@gmail.com", leftMargin, cursorY, {
          width: contentWidth,
          align: "center",
        });

      // ── Finalize ──────────────────────────────────────────
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateInvoicePDF,
};
