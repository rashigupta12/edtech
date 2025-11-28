/*eslint-disable  @typescript-eslint/no-explicit-any*/
// app/api/invoice/download/route.ts
import { db } from "@/db";
import { CoursesTable, PaymentsTable, UsersTable, EnrollmentsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const { invoiceNumber } = await req.json();

    if (!invoiceNumber) {
      return NextResponse.json(
        { error: "Invoice number is required" },
        { status: 400 }
      );
    }

    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: User not logged in" },
        { status: 401 }
      );
    }

    // Get payment details
    const [payment] = await db
      .select()
      .from(PaymentsTable)
      .where(eq(PaymentsTable.invoiceNumber, invoiceNumber))
      .limit(1);

    if (!payment) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Verify user owns this invoice
    if (payment.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized: You don't have access to this invoice" },
        { status: 403 }
      );
    }

    // Get user details
    const [user] = await db
      .select()
      .from(UsersTable)
      .where(eq(UsersTable.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get course details via enrollment
    if (!payment.enrollmentId) {
      return NextResponse.json(
        { error: "Enrollment not found for this payment" },
        { status: 404 }
      );
    }

    const [enrollment] = await db
      .select()
      .from(EnrollmentsTable)
      .where(eq(EnrollmentsTable.id, payment.enrollmentId))
      .limit(1);

    if (!enrollment) {
      return NextResponse.json(
        { error: "Enrollment details not found" },
        { status: 404 }
      );
    }

    const [course] = await db
      .select()
      .from(CoursesTable)
      .where(eq(CoursesTable.id, enrollment.courseId))
      .limit(1);

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    // Generate PDF using pdf-lib
    const pdfBuffer = await generateInvoiceWithPDFLib({ payment, user, course });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Invoice-${invoiceNumber}.pdf"`,
      },
    });

  } catch (error) {
    console.error("Invoice download error:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}

async function generateInvoiceWithPDFLib(data: {
  payment: any;
  user: any;
  course: any;
}): Promise<Buffer> {
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
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points

  // Embed fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Set initial coordinates
  let y = 800;
  const leftMargin = 50;
  const pageWidth = 595.28;
  const rightAlign = pageWidth - 50;

  // Colors
  const black = rgb(0, 0, 0);
  const blue = rgb(0.149, 0.388, 0.922);
  const gray = rgb(0.4, 0.4, 0.4);
  // const lightGray = rgb(0.9, 0.9, 0.9);
  const tableHeaderBg = rgb(0.95, 0.95, 0.95);

  // Logo placeholder (you'll need to embed an actual image)
  // For now, we'll use text as a placeholder
  page.drawText('FutureTek', {
    x: leftMargin,
    y,
    size: 20,
    font: boldFont,
    color: blue,
  });

  // INVOICE header (right aligned)
  page.drawText('INVOICE', {
    x: rightAlign - 80,
    y,
    size: 24,
    font: boldFont,
    color: black,
  });
  y -= 15;

  // Invoice details (right aligned)
  page.drawText(`Invoice #:`, {
    x: rightAlign - 150,
    y,
    size: 10,
    font: font,
    color: black,
  });
  page.drawText(payment.invoiceNumber, {
    x: rightAlign - 80,
    y,
    size: 10,
    font: font,
    color: black,
  });
  y -= 15;

  page.drawText(`Date:`, {
    x: rightAlign - 150,
    y,
    size: 10,
    font: font,
    color: black,
  });
  page.drawText(new Date(payment.createdAt).toLocaleDateString('en-IN'), {
    x: rightAlign - 80,
    y,
    size: 10,
    font: font,
    color: black,
  });
  
  // Company address (left side)
  y = 755;
  page.drawText('Address: B-204, The Crescent, F-2, Sector 50,', {
    x: leftMargin,
    y,
    size: 9,
    font: font,
    color: black,
  });
  y -= 12;

  page.drawText('Noida, UP 201301', {
    x: leftMargin,
    y,
    size: 9,
    font: font,
    color: black,
  });
  y -= 12;

  page.drawText('Email: billing@futuretek.com', {
    x: leftMargin,
    y,
    size: 9,
    font: font,
    color: black,
  });
  y -= 40;

  // Bill To Section
  page.drawText('Bill To:', {
    x: leftMargin,
    y,
    size: 11,
    font: boldFont,
    color: black,
  });
  y -= 15;

  page.drawText(user.name || 'Customer Name', {
    x: leftMargin,
    y,
    size: 10,
    font: font,
    color: black,
  });
  y -= 12;

  page.drawText(user.email, {
    x: leftMargin,
    y,
    size: 10,
    font: font,
    color: black,
  });
  y -= 30;

  // Table Header
  const tableTop = y;
  const descColX = leftMargin;
  // const qtyColX = 300;
  const priceColX = 350;
  const totalColX = 470;
  const tableWidth = rightAlign - leftMargin;
  const rowHeight = 25;

  // Draw table header background
  page.drawRectangle({
    x: leftMargin,
    y: tableTop - 20,
    width: tableWidth,
    height: rowHeight,
    color: tableHeaderBg,
  });

  // Table headers
  page.drawText('Description', {
    x: descColX + 5,
    y: tableTop - 15,
    size: 10,
    font: boldFont,
    color: black,
  });

  // page.drawText('Quantity', {
  //   x: qtyColX,
  //   y: tableTop - 15,
  //   size: 10,
  //   font: boldFont,
  //   color: black,
  // });

  page.drawText('Unit Price', {
    x: priceColX,
    y: tableTop - 15,
    size: 10,
    font: boldFont,
    color: black,
  });

  page.drawText('Total', {
    x: totalColX,
    y: tableTop - 15,
    size: 10,
    font: boldFont,
    color: black,
  });

  // Draw table lines
  y = tableTop - 20;
  page.drawLine({
    start: { x: leftMargin, y },
    end: { x: rightAlign, y },
    thickness: 1,
    color: gray,
  });

  y -= rowHeight;

  // Table content row
  const courseTitle = course.title.length > 35 ? course.title.substring(0, 35) + '...' : course.title;
  page.drawText(courseTitle, {
    x: descColX + 5,
    y: y + 8,
    size: 10,
    font: font,
    color: black,
  });

  // page.drawText('1', {
  //   x: qtyColX + 20,
  //   y: y + 8,
  //   size: 10,
  //   font: font,
  //   color: black,
  // });

  page.drawText(`Rs.${parseFloat(payment.amount).toFixed(2)}`, {
    x: priceColX,
    y: y + 8,
    size: 10,
    font: font,
    color: black,
  });

  page.drawText(`Rs.${parseFloat(payment.amount).toFixed(2)}`, {
    x: totalColX,
    y: y + 8,
    size: 10,
    font: font,
    color: black,
  });

  // Bottom line of table
  page.drawLine({
    start: { x: leftMargin, y },
    end: { x: rightAlign, y },
    thickness: 1,
    color: gray,
  });

  y -= 40;

  // Summary section (right aligned)
  const summaryX = 350;
  const valueX = 480;

  page.drawText('Subtotal:', {
    x: summaryX,
    y,
    size: 10,
    font: font,
    color: black,
  });
  const subtotal = parseFloat(payment.amount);
  page.drawText(`Rs.${subtotal.toFixed(2)}`, {
    x: valueX,
    y,
    size: 10,
    font: font,
    color: black,
  });
  y -= 20;

  page.drawText('Discount:', {
    x: summaryX,
    y,
    size: 10,
    font: font,
    color: black,
  });
  const discount = parseFloat(payment.discountAmount || '0');
  page.drawText(`Rs.${discount.toFixed(2)}`, {
    x: valueX,
    y,
    size: 10,
    font: font,
    color: black,
  });
  y -= 20;

  page.drawText('Tax (0%):', {
    x: summaryX,
    y,
    size: 10,
    font: font,
    color: black,
  });
  const tax = parseFloat(payment.gstAmount || '0');
  page.drawText(`Rs.${tax.toFixed(2)}`, {
    x: valueX,
    y,
    size: 10,
    font: font,
    color: black,
  });
  y -= 25;

  // Grand Total
  page.drawText('Grand Total:', {
    x: summaryX,
    y,
    size: 12,
    font: boldFont,
    color: black,
  });
  const grandTotal = parseFloat(payment.finalAmount);
  page.drawText(`Rs.${grandTotal.toFixed(2)}`, {
    x: valueX,
    y,
    size: 12,
    font: boldFont,
    color: black,
  });
  y -= 50;

  // Footer
  y = 100;
  const centerX = pageWidth / 2;
  page.drawText('Thank you for your business!', {
    x: centerX - 80,
    y,
    size: 10,
    font: boldFont,
    color: black,
  });
  y -= 15;

  page.drawText('For any questions, contact us at billing@futuretek.com', {
    x: centerX - 130,
    y,
    size: 9,
    font: font,
    color: gray,
  });

  // Save PDF
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// Helper function to wrap text
// function wrapText(text: string, maxLength: number): string[] {
//   const words = text.split(' ');
//   const lines: string[] = [];
//   let currentLine = '';

//   for (const word of words) {
//     if ((currentLine + word).length > maxLength) {
//       if (currentLine) lines.push(currentLine.trim());
//       currentLine = word + ' ';
//     } else {
//       currentLine += word + ' ';
//     }
//   }

//   if (currentLine) lines.push(currentLine.trim());
//   return lines;
// }