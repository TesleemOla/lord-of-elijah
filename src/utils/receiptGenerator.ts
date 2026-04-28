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

import html2canvas from 'html2canvas';

export const downloadStatement = async (data: any) => {
  const { client, statement, summary } = data;
  
  // Create a temporary container for the HTML content
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px'; // A4-ish width
  container.style.backgroundColor = 'white';
  container.style.padding = '40px';
  container.style.fontFamily = 'Arial, sans-serif';

  const html = `
    <div style="padding: 20px; color: #000; background-color: #fff;">
      <div style="border-bottom: 3px solid #4338ca; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h1 style="margin: 0; color: #4338ca; font-size: 28px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px;">Lord of Elijah</h1>
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 2px;">
            <div style="width: 4px; height: 4px; border-radius: 50%; background-color: #94a3b8;"></div>
            <p style="margin: 0; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; font-size: 10px; font-weight: 600;">Premium Management System</p>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="background-color: #4338ca; color: white; padding: 4px 12px; font-size: 10px; font-weight: 900; letter-spacing: 1px; border-radius: 4px; display: inline-block; margin-bottom: 5px;">
            STATEMENT
          </div>
          <p style="margin: 0; color: #64748b; font-size: 10px; font-weight: 600; text-transform: uppercase;">Generated: ${new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 35px; gap: 40px;">
        <div style="flex: 1;">
          <h3 style="margin: 0 0 8px; color: #94a3b8; text-transform: uppercase; font-size: 9px; font-weight: 800; letter-spacing: 1px;">Billed To</h3>
          <p style="margin: 0; color: #1e1b4b; font-size: 20px; font-weight: 900;">${client.name}</p>
          <p style="margin: 4px 0; color: #4338ca; font-weight: 800; font-size: 11px; text-transform: uppercase;">REF: ${client.clientId}</p>
          <p style="margin: 0; color: #64748b; font-size: 13px; font-weight: 500;">${client.phone || 'No contact provided'}</p>
        </div>
        <div style="flex: 1; background-color: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <h3 style="margin: 0 0 12px; color: #94a3b8; text-transform: uppercase; font-size: 9px; font-weight: 800; letter-spacing: 1px;">Account Overview</h3>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase;">Total Sales</span>
            <span style="color: #1e293b; font-weight: 800; font-size: 12px;">₦${summary.totalPurchases.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase;">Total Paid</span>
            <span style="color: #059669; font-weight: 800; font-size: 12px;">₦${summary.totalPaid.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px dashed #cbd5e1; margin-top: 5px; align-items: center;">
            <span style="color: #1e1b4b; font-weight: 900; font-size: 13px; text-transform: uppercase;">Net Balance</span>
            <span style="color: ${summary.balance > 0 ? '#dc2626' : '#059669'}; font-weight: 900; font-size: 20px;">₦${summary.balance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid #1e1b4b;">
            <th style="text-align: left; padding: 12px 8px; color: #1e1b4b; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">Date</th>
            <th style="text-align: left; padding: 12px 8px; color: #1e1b4b; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">Description</th>
            <th style="text-align: left; padding: 12px 8px; color: #1e1b4b; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">Type</th>
            <th style="text-align: right; padding: 12px 8px; color: #1e1b4b; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">Debit</th>
            <th style="text-align: right; padding: 12px 8px; color: #1e1b4b; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">Credit</th>
            <th style="text-align: right; padding: 12px 8px; color: #1e1b4b; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">Balance</th>
          </tr>
        </thead>
        <tbody>
          ${statement.map((row: any) => `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 12px 8px; color: #64748b; font-size: 11px; font-weight: 600;">${new Date(row.date).toLocaleDateString()}</td>
              <td style="padding: 12px 8px; color: #1e293b; font-size: 11px; font-weight: 500; max-width: 220px;">${row.items || 'Manual Payment / Refund'}</td>
              <td style="padding: 12px 8px;">
                <span style="padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: 900; background-color: ${row.type === 'SALE' ? '#e0e7ff' : '#fef3c7'}; color: ${row.type === 'SALE' ? '#4338ca' : '#b45309'}; text-transform: uppercase;">
                  ${row.type}
                </span>
              </td>
              <td style="padding: 12px 8px; text-align: right; color: #1e293b; font-weight: 700; font-size: 11px;">
                ${row.type === 'SALE' ? '₦' + row.total.toLocaleString() : (row.total < 0 ? '₦' + Math.abs(row.total).toLocaleString() : '-')}
              </td>
              <td style="padding: 12px 8px; text-align: right; color: #059669; font-weight: 700; font-size: 11px;">
                ${row.paid > 0 ? '₦' + row.paid.toLocaleString() : '-'}
              </td>
              <td style="padding: 12px 8px; text-align: right; color: ${row.balance > 0 ? '#dc2626' : '#059669'}; font-weight: 900; font-size: 11px;">
                ₦${row.balance.toLocaleString()}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="margin-top: 60px; padding-top: 20px; border-top: 1px dashed #e2e8f0; text-align: center;">
        <div style="display: inline-block; background-color: #f8fafc; padding: 4px 16px; border-radius: 999px; border: 1px solid #f1f5f9; margin-bottom: 8px;">
          <p style="margin: 0; color: #94a3b8; font-size: 9px; font-weight: 800; text-transform: uppercase; font-style: italic; letter-spacing: 1px;">Official Statement of Account</p>
        </div>
        <p style="color: #cbd5e1; font-size: 9px; margin: 0;">© 2026 Lord of Elijah Transaction Management. All rights reserved.</p>
      </div>
    </div>
  `;


  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Calculate how many mm high the whole canvas image should be in the PDF
    const canvasHeightInMm = (imgHeight * pdfWidth) / imgWidth;

    let heightLeft = canvasHeightInMm;
    let position = 0;

    // Page 1
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, canvasHeightInMm, undefined, 'FAST');
    heightLeft -= pdfHeight;

    // Add more pages if content remains (Multi-page slicing logic from ReceiptModal)
    while (heightLeft > 0) {
      position = heightLeft - canvasHeightInMm; // Negative offset to show the next slice
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, canvasHeightInMm, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }

    pdf.save(`Statement_${client.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('PDF Generation failed', error);
  } finally {
    document.body.removeChild(container);
  }
};



