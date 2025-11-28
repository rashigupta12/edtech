/*eslint-disable  @typescript-eslint/no-explicit-any*/
// lib/invoiceEmail.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

interface InvoiceEmailData {
  payment: any;
  user: any;
  course: any;
}

export async function createInvoiceEmailHTML(data: InvoiceEmailData) {
  const { payment, user, course } = data;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .invoice-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .invoice-details { background: #f0f4f8; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .invoice-details h3 { color: #667eea; margin-top: 0; margin-bottom: 10px; font-size: 16px; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { color: #6b7280; font-size: 14px; }
        .detail-value { font-weight: 600; color: #111827; font-size: 14px; }
        .total-row { background: #eff6ff; padding: 12px; border-radius: 4px; margin-top: 10px; }
        .total-row .detail-label { font-size: 16px; font-weight: 600; color: #1e40af; }
        .total-row .detail-value { font-size: 20px; font-weight: 700; color: #1e40af; }
        .button { background: #667eea; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; font-weight: 600; }
        .button:hover { background: #5568d3; }
        .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #666; font-size: 12px; }
        .info-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 4px; margin: 15px 0; }
        .info-box p { margin: 0; color: #92400e; font-size: 13px; }
        .success-badge { background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Invoice - Payment Successful! 🎉</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Your course enrollment is confirmed</p>
        </div>
        <div class="content">
          <div class="invoice-box">
            <div style="text-align: center; margin-bottom: 20px;">
              <span class="success-badge">✓ PAID</span>
            </div>
            
            <h2 style="color: #667eea; margin-top: 0;">Invoice #${payment.invoiceNumber}</h2>
            <p style="color: #6b7280; font-size: 14px;">Date: ${new Date(payment.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}</p>
            
            <div class="invoice-details">
              <h3>Bill To</h3>
              <p style="margin: 5px 0; font-weight: 600; color: #111827;">${user.name}</p>
              <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">${user.email}</p>
              ${user.gstNumber ? `<p style="margin: 5px 0; color: #6b7280; font-size: 14px;">GST No: ${user.gstNumber}</p>` : ''}
            </div>

            <div class="invoice-details">
              <h3>Course Details</h3>
              <div class="detail-row">
                <span class="detail-label">Course</span>
                <span class="detail-value">${course.title}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Original Price</span>
                <span class="detail-value">Rs. ${parseFloat(payment.amount).toLocaleString('en-IN')}</span>
              </div>
              ${parseFloat(payment.discountAmount || '0') > 0 ? `
              <div class="detail-row" style="color: #059669;">
                <span class="detail-label">Discount</span>
                <span class="detail-value">-Rs. ${parseFloat(payment.discountAmount).toLocaleString('en-IN')}</span>
              </div>
              ` : ''}
              <div class="detail-row">
                <span class="detail-label">Subtotal</span>
                <span class="detail-value">Rs. ${(parseFloat(payment.amount) - parseFloat(payment.discountAmount || "0")).toLocaleString('en-IN')}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">GST (18%)</span>
                <span class="detail-value">Rs. ${parseFloat(payment.gstAmount).toLocaleString('en-IN')}</span>
              </div>
              <div class="total-row">
                <div class="detail-row" style="border: none; padding: 0;">
                  <span class="detail-label">Total Paid</span>
                  <span class="detail-value">Rs. ${parseFloat(payment.finalAmount).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div class="invoice-details">
              <h3>Payment Information</h3>
              <div class="detail-row">
                <span class="detail-label">Payment Method</span>
                <span class="detail-value">Razorpay</span>
              </div>
              ${payment.razorpayPaymentId ? `
              <div class="detail-row">
                <span class="detail-label">Transaction ID</span>
                <span class="detail-value" style="font-family: monospace; font-size: 12px;">${payment.razorpayPaymentId}</span>
              </div>
              ` : ''}
              <div class="detail-row" style="border: none;">
                <span class="detail-label">Status</span>
                <span class="detail-value" style="color: #059669;">✓ Completed</span>
              </div>
            </div>
          </div>

          <div class="info-box">
            <p><strong>📎 Note:</strong> Your invoice is attached to this email as a PDF. You can also download it anytime from your dashboard.</p>
          </div>

          <div style="text-align: center; margin: 25px 0;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/user/courses" class="button">
              Go to My Courses
            </a>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/user/payments" class="button" style="background: #f59e0b; margin-left: 10px;">
              View All Invoices
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            If you have any questions about this invoice, please don't hesitate to contact our support team.
          </p>
        </div>
        <div class="footer">
          <p style="font-weight: 600; margin-bottom: 5px;">Thank you for choosing Futuretek!</p>
          <p>This is an automated email. Please do not reply to this message.</p>
          <p style="margin-top: 10px;">© ${new Date().getFullYear()} Futuretek. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate PDF using pdf-lib (NO CHROME REQUIRED!)
async function generateInvoicePDFAttachment(data: InvoiceEmailData): Promise<Buffer> {
  const { payment, user, course } = data;

  let PDFDocument, rgb, StandardFonts;

  try {
    const pdfLib = await import("pdf-lib");
    PDFDocument = pdfLib.PDFDocument;
    rgb = pdfLib.rgb;
    StandardFonts = pdfLib.StandardFonts;
  } catch (err) {
    console.error("❌ pdf-lib failed to load:", err);
    throw new Error("PDF library could not be loaded");
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size

  // Embed fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Set initial coordinates
  let y = 800;
  const leftMargin = 50;
  const rightMargin = 400;

  // Colors
  const blue = rgb(0.149, 0.388, 0.922);
  const gray = rgb(0.42, 0.45, 0.5);
  const green = rgb(0.02, 0.59, 0.41);
  const darkGray = rgb(0.17, 0.24, 0.31);

  // Header
  page.drawText('FUTURETEK', {
    x: leftMargin,
    y,
    size: 24,
    font: boldFont,
    color: blue,
  });

  page.drawText('INVOICE', {
    x: 400,
    y,
    size: 20,
    font: boldFont,
    color: darkGray,
  });
  y -= 30;

  // Invoice Number and Date
  page.drawText(`Invoice #: ${payment.invoiceNumber}`, {
    x: 400,
    y,
    size: 10,
    font: font,
    color: gray,
  });

  page.drawText(`Date: ${new Date(payment.createdAt).toLocaleDateString('en-IN')}`, {
    x: 400,
    y: y - 15,
    size: 10,
    font: font,
    color: gray,
  });
  y -= 50;

  // Company Info
  page.drawText('Education & Training', {
    x: leftMargin,
    y,
    size: 12,
    font: font,
    color: gray,
  });
  y -= 20;

  page.drawText('Email: support@futuretek.com', {
    x: leftMargin,
    y,
    size: 10,
    font: font,
    color: gray,
  });
  y -= 15;

  page.drawText('Phone: +91 XXXXXXXXXX', {
    x: leftMargin,
    y,
    size: 10,
    font: font,
    color: gray,
  });
  y -= 40;

  // Bill To
  page.drawText('Bill To:', {
    x: leftMargin,
    y,
    size: 14,
    font: boldFont,
    color: darkGray,
  });
  y -= 20;

  page.drawText(user.name, {
    x: leftMargin,
    y,
    size: 12,
    font: boldFont,
  });
  y -= 15;

  page.drawText(user.email, {
    x: leftMargin,
    y,
    size: 10,
    font: font,
    color: gray,
  });
  y -= 15;

  if (user.gstNumber) {
    page.drawText(`GST No: ${user.gstNumber}`, {
      x: leftMargin,
      y,
      size: 10,
      font: font,
      color: gray,
    });
    y -= 15;
  }
  y -= 20;

  // Table Header
  page.drawLine({
    start: { x: leftMargin, y },
    end: { x: 545, y },
    thickness: 2,
    color: gray,
  });
  y -= 20;

  page.drawText('Description', {
    x: leftMargin,
    y,
    size: 12,
    font: boldFont,
    color: darkGray,
  });

  page.drawText('Amount', {
    x: rightMargin,
    y,
    size: 12,
    font: boldFont,
    color: darkGray,
  });
  y -= 30;

  // Course Item
  page.drawText(course.title, {
    x: leftMargin,
    y,
    size: 12,
    font: boldFont,
  });

  page.drawText(`Rs. ${parseFloat(payment.amount).toLocaleString('en-IN')}`, {
    x: rightMargin,
    y,
    size: 12,
    font: font,
  });
  y -= 25;

  // Discount
  if (parseFloat(payment.discountAmount || '0') > 0) {
    page.drawText('Discount', {
      x: leftMargin,
      y,
      size: 11,
      font: font,
      color: green,
    });

    page.drawText(`-Rs. ${parseFloat(payment.discountAmount).toLocaleString('en-IN')}`, {
      x: rightMargin,
      y,
      size: 11,
      font: font,
      color: green,
    });
    y -= 25;
  }

  // Subtotal
  page.drawText('Subtotal', {
    x: leftMargin,
    y,
    size: 12,
    font: boldFont,
  });

  const subtotal = parseFloat(payment.amount) - parseFloat(payment.discountAmount || '0');
  page.drawText(`Rs. ${subtotal.toLocaleString('en-IN')}`, {
    x: rightMargin,
    y,
    size: 12,
    font: boldFont,
  });
  y -= 25;

  // GST
  page.drawText('GST (18%)', {
    x: leftMargin,
    y,
    size: 12,
    font: font,
  });

  page.drawText(`Rs. ${parseFloat(payment.gstAmount).toLocaleString('en-IN')}`, {
    x: rightMargin,
    y,
    size: 12,
    font: font,
  });
  y -= 30;

  // Total
  page.drawLine({
    start: { x: leftMargin, y: y + 5 },
    end: { x: 545, y: y + 5 },
    thickness: 1,
    color: blue,
  });
  y -= 20;

  page.drawText('Total Amount', {
    x: leftMargin,
    y,
    size: 16,
    font: boldFont,
    color: blue,
  });

  page.drawText(`Rs. ${parseFloat(payment.finalAmount).toLocaleString('en-IN')}`, {
    x: rightMargin,
    y,
    size: 16,
    font: boldFont,
    color: blue,
  });
  y -= 50;

  // Payment Details
  page.drawText('Payment Details', {
    x: leftMargin,
    y,
    size: 14,
    font: boldFont,
    color: darkGray,
  });
  y -= 25;

  page.drawText('Payment Method: Razorpay', {
    x: leftMargin,
    y,
    size: 11,
    font: font,
  });
  y -= 20;

  if (payment.razorpayPaymentId) {
    page.drawText(`Transaction ID: ${payment.razorpayPaymentId}`, {
      x: leftMargin,
      y,
      size: 10,
      font: font,
      color: gray,
    });
  }

  // Footer
  y = 50;
  page.drawText('Thank you for your purchase!', {
    x: leftMargin,
    y,
    size: 12,
    font: boldFont,
    color: gray,
  });
  y -= 20;

  page.drawText('This is a computer-generated invoice and does not require a signature.', {
    x: leftMargin,
    y,
    size: 9,
    font: font,
    color: gray,
  });
  y -= 15;

  page.drawText('For any queries, please contact support@futuretek.com', {
    x: leftMargin,
    y,
    size: 9,
    font: font,
    color: gray,
  });

  // Save PDF
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function sendInvoiceEmail(data: InvoiceEmailData) {
  try {
    const { payment, user } = data;

    const pdfBuffer = await generateInvoicePDFAttachment(data);

    // Create email HTML
    const emailHTML = await createInvoiceEmailHTML(data);

    const mailOptions = {
      from: `"Futuretek" <${process.env.MAIL_USERNAME}>`,
      to: user.email,
      subject: `Invoice ${payment.invoiceNumber} - Payment Confirmation`,
      html: emailHTML,
      attachments: [
        {
          filename: `Invoice-${payment.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("✅ Invoice email sent successfully to:", user.email);
    console.log("📧 Message ID:", result.messageId);

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("❌ Invoice email sending error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}