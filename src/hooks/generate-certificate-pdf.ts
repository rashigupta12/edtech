/*eslint-disable @typescript-eslint/no-unused-expressions */
/*eslint-disable @typescript-eslint/no-unused-vars */
// hooks/generate-certificate-pdf.ts
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function generateCertificatePDF(
  element: HTMLElement,
  filename: string
): Promise<string> {
  try {
    console.log('Starting PDF generation...');
    console.log('Element:', element);
    console.log('Filename:', filename);

    // Ensure element is visible for rendering
    const originalDisplay = element.style.display;
    const originalPosition = element.style.position;
    element.style.display = 'block';
    element.style.position = 'relative';

    // Force a reflow to ensure styles are applied
    element.offsetHeight;

    // Wait for styles and rendering to complete
    await new Promise(resolve => setTimeout(resolve, 200));

    console.log('Element dimensions:', element.offsetWidth, 'x', element.offsetHeight);
    console.log('Capturing canvas...');

    // Capture the element as canvas with high quality
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: true,
      backgroundColor: '#ffffff',
      width: 1200,
      height: 850,
      windowWidth: 1200,
      windowHeight: 850,
    });

    console.log('Canvas captured:', canvas.width, 'x', canvas.height);

    // Restore original styles
    element.style.display = originalDisplay;
    element.style.position = originalPosition;

    // Convert canvas to image
    const imgData = canvas.toDataURL('image/png', 1.0);
    
    console.log('Creating PDF...');

    // Create PDF (A4 landscape for certificate)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // A4 dimensions in mm
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    console.log('PDF dimensions:', pdfWidth, 'x', pdfHeight);

    // Calculate dimensions to fit certificate in PDF while maintaining aspect ratio
    const imgAspectRatio = canvas.width / canvas.height;
    // const pdfAspectRatio = pdfWidth / pdfHeight;

    let imgWidth = pdfWidth;
    let imgHeight = pdfWidth / imgAspectRatio;

    // If image is taller than page, scale by height instead
    if (imgHeight > pdfHeight) {
      imgHeight = pdfHeight;
      imgWidth = pdfHeight * imgAspectRatio;
    }

    // Center the image
    const xOffset = (pdfWidth - imgWidth) / 2;
    const yOffset = (pdfHeight - imgHeight) / 2;

    console.log('Image dimensions in PDF:', imgWidth, 'x', imgHeight);
    console.log('Offsets:', xOffset, 'x', yOffset);
    console.log('Adding image to PDF...');

    // Add image to PDF
    pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight, undefined, 'FAST');

    console.log('Saving PDF...');

    // Save the PDF
    pdf.save(`${filename}.pdf`);

    console.log('PDF generated successfully!');

    // Return a success indicator
    return 'success';
  } catch (error) {
    console.error('Error generating PDF:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Alternative version that returns blob URL instead of downloading
export async function generateCertificatePDFBlob(
  element: HTMLElement,
  filename: string
): Promise<string> {
  try {
    console.log('Starting PDF generation (blob version)...');

    // Ensure element is visible for rendering
    const originalDisplay = element.style.display;
    element.style.display = 'block';

    await new Promise(resolve => setTimeout(resolve, 100));

    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Restore original display
    element.style.display = originalDisplay;

    // Convert canvas to image
    const imgData = canvas.toDataURL('image/png');

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const yOffset = imgHeight < pdfHeight ? (pdfHeight - imgHeight) / 2 : 0;

    pdf.addImage(imgData, 'PNG', 0, yOffset, imgWidth, imgHeight);

    // Get blob instead of saving
    const blob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(blob);

    console.log('PDF blob created successfully!');

    return blobUrl;
  } catch (error) {
    console.error('Error generating PDF blob:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}