import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const downloadReceipt = (transaction: any) => {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [63, 81, 181]; // Indigo-ish
  const secondaryColor = [100, 100, 100];

  // Header: Company Name with a bar
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('Lord of Elijah', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Premium Transaction Management System', 105, 30, { align: 'center' });

  // Content Start
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT RECEIPT', 14, 55);

  // Decorative line
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(14, 58, 60, 58);

  // Info Section
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

  const leftCol = 14;
  const rightCol = 140;

  doc.text('ISSUED TO:', leftCol, 70);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(transaction.customerName || 'Guest Customer', leftCol, 75);

  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.text('RECEIPT DETAILS:', rightCol, 70);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(`Receipt #: ${transaction._id?.toString().slice(-8).toUpperCase() || 'N/A'}`, rightCol, 75);
  doc.text(`Date: ${new Date(transaction.createdAt || transaction.timestamp || new Date()).toLocaleString()}`, rightCol, 80);
  doc.text(`Status: ${transaction.status || 'SUCCESS'}`, rightCol, 85);

  // Items Table
  const tableColumn = ["Product Description", "Qty", "Unit Price", "Subtotal"];
  const tableRows: any[] = [];

  transaction.items?.forEach((item: any) => {
    const itemData = [
      item.productName || 'Unknown Product',
      item.qty,
      `₦ ${item.priceAtTime?.toLocaleString() || '0.00'}`,
      `₦ ${(item.qty * (item.priceAtTime || 0)).toLocaleString()}`
    ];
    tableRows.push(itemData);
  });

  autoTable(doc, {
    startY: 95,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor as any,
      textColor: [255, 255, 255],
      fontSize: 11,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 95;

  // Totals Area
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(130, finalY + 5, 196, finalY + 5);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const totalVal = transaction.totalAmount || transaction.total || 0;
  doc.text('TOTAL:', 130, finalY + 15);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`₦ ${totalVal.toLocaleString()}`, 196, finalY + 15, { align: 'right' });

  // Footer message
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('This is a computer-generated receipt and requires no signature.', 105, 280, { align: 'center' });
  doc.text('Thank you for choosing Lord of Elijah!', 105, 285, { align: 'center' });

  // Save the document
  doc.save(`Receipt_LordOfElijah_${transaction._id?.toString().slice(-6) || 'tx'}.pdf`);
};
