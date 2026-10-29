/**
 * Format date for official case document
 */
function formatDate(dateStr) {
  if (!dateStr) return 'Not Specified';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return String(dateStr);
  }
}

/**
 * Format datetime for timeline entries and generation stamp
 */
function formatDateTime(dateStr) {
  if (!dateStr) return 'Not Specified';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(dateStr);
  }
}

/**
 * Helper to fetch and convert an image URL to Base64 data URL
 */
async function getBase64ImageFromUrl(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Could not load logo for PDF:', err);
    return null;
  }
}

/**
 * Clean/safe display name and type for an evidence file
 */
function getEvidenceDisplay(filename, index) {
  if (!filename) return { name: `Evidence Item ${index + 1}`, type: 'Document' };
  const str = String(filename);
  const ext = str.split('.').pop().toLowerCase();
  
  let type = 'Document';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) type = 'Image';
  else if (ext === 'pdf') type = 'PDF Document';
  else if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) type = 'Video';

  // If filename looks like a raw uploaded hash (e.g. 1729000-abc1234.jpg), provide a clean safe name
  const isHashed = /^\d{10,}-[a-f0-9]{8,}\.[a-z0-9]+$/i.test(str);
  const name = isHashed ? `Attachment_${index + 1}.${ext}` : str.split('/').pop().split('\\').pop();

  return { name, type };
}

/**
 * Get status explanation text
 */
function getStatusDescription(status) {
  switch (status) {
    case 'Pending':
      return 'Your complaint is currently awaiting administrator review and assignment.';
    case 'Approved':
      return 'The complaint has been officially verified and accepted for departmental action.';
    case 'Under Investigation':
      return 'An investigating officer has been assigned. Active inquiries and evidence reviews are in progress.';
    case 'Resolved':
      return 'The case investigation has been concluded and resolved by law enforcement authorities.';
    case 'Rejected':
      return 'The submission was reviewed and rejected. Please contact administration for further clarification.';
    default:
      return 'Case record is maintained under active registry monitoring.';
  }
}

/**
 * Main Case File PDF Generator
 * Creates an official, multi-page, selectable-text A4 PDF document.
 */
export async function generateCaseFilePdf(complaint) {
  if (!complaint || !complaint.complaintId) {
    throw new Error('Valid complaint data is required to generate case file PDF.');
  }

  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 16;
  const contentWidth = pageWidth - (margin * 2); // 178 mm
  const maxY = 270; // Printable height before page-break

  let y = margin;

  // Helper for adding a new page with top spacing
  const checkPageBreak = (neededHeight) => {
    if (y + neededHeight > maxY) {
      doc.addPage();
      y = margin + 5;
      return true;
    }
    return false;
  };

  // 1. Header with Logo & Agency Title
  const logoBase64 = await getBase64ImageFromUrl('/images/logo_bg_remove.png');
  if (logoBase64) {
    try {
      // Add logo (width 16mm, height 16mm)
      doc.addImage(logoBase64, 'PNG', margin, y, 16, 16);
    } catch {
      // Fallback gracefully if image add fails
    }
  }

  // Official Titles
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 36, 71); // #0f2447 deep navy
  doc.text('CRIME INVESTIGATION WEBSITE', margin + 20, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(26, 58, 107); // #1a3a6b
  doc.text('OFFICIAL INCIDENT CASE FILE', margin + 20, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('National Law Enforcement & Public Safety Registry System', margin + 20, y + 16);

  y += 22;

  // Header dividing line
  doc.setDrawColor(26, 58, 107);
  doc.setLineWidth(0.8);
  doc.line(margin, y, margin + contentWidth, y);
  y += 5;

  // 2. Case Reference & Status Bar (Prominent Box)
  doc.setFillColor(245, 248, 252);
  doc.setDrawColor(210, 222, 235);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 36, 71);
  doc.text('CASE REFERENCE ID:', margin + 4, y + 7);

  doc.setFont('courier', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(26, 58, 107);
  doc.text(String(complaint.complaintId), margin + 48, y + 7.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(70, 70, 70);
  doc.text('CURRENT STATUS:', margin + 105, y + 7);

  // Status Badge in Box
  const statusStr = String(complaint.status || 'Pending');
  let statusBg = [255, 243, 205]; // warning light yellow
  let statusFg = [102, 77, 3];
  if (statusStr === 'Under Investigation') {
    statusBg = [207, 226, 255]; // light primary
    statusFg = [10, 44, 97];
  } else if (statusStr === 'Approved') {
    statusBg = [209, 231, 221]; // light green
    statusFg = [15, 81, 50];
  } else if (statusStr === 'Resolved') {
    statusBg = [209, 231, 221];
    statusFg = [15, 81, 50];
  } else if (statusStr === 'Rejected') {
    statusBg = [248, 215, 218];
    statusFg = [132, 32, 41];
  }

  doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
  doc.setDrawColor(statusFg[0], statusFg[1], statusFg[2]);
  doc.roundedRect(margin + 140, y + 2.5, 33, 7, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(statusFg[0], statusFg[1], statusFg[2]);
  doc.text(statusStr, margin + 156.5, y + 7, { align: 'center' });

  // Filing type note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const filingType = complaint.isAnonymous ? 'Confidential Anonymous Incident Report' : 'Registered Citizen Incident Report';
  doc.text(`Filing Category: ${filingType}`, margin + 4, y + 14);

  y += 24;

  // Section Heading Helper
  const drawSectionHeader = (title) => {
    checkPageBreak(14);
    doc.setFillColor(235, 242, 250);
    doc.rect(margin, y, contentWidth, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 36, 71);
    doc.text(title.toUpperCase(), margin + 3, y + 4.5);
    y += 9;
  };

  // 3. CASE INFORMATION
  drawSectionHeader('Case Information');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  const loc = complaint.location 
    ? `${complaint.location}${complaint.district ? ', ' + complaint.district : ''}`
    : (complaint.district || 'Not Specified');

  const infoRows = [
    [
      { label: 'Crime Category:', value: complaint.category || 'Not Specified' },
      { label: 'Incident Date:', value: formatDate(complaint.incidentDate || complaint.createdAt) }
    ],
    [
      { label: 'Incident Location:', value: loc },
      { label: 'Reported Date:', value: formatDateTime(complaint.createdAt) }
    ],
    [
      { label: 'District / Jurisdiction:', value: complaint.district || 'National Jurisdiction' },
      { label: 'Last Registry Update:', value: formatDateTime(complaint.updatedAt || complaint.createdAt) }
    ]
  ];

  infoRows.forEach(row => {
    checkPageBreak(8);
    // Col 1
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text(row[0].label, margin + 3, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    doc.text(String(row[0].value), margin + 42, y);

    // Col 2
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text(row[1].label, margin + 95, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    doc.text(String(row[1].value), margin + 130, y);

    y += 6;
  });

  y += 3;

  // 4. INCIDENT SUMMARY (TITLE)
  drawSectionHeader('Incident Summary');
  checkPageBreak(10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 36, 71);
  const titleLines = doc.splitTextToSize(complaint.title || 'Incident Report', contentWidth - 6);
  doc.text(titleLines, margin + 3, y);
  y += (titleLines.length * 5) + 3;

  // 5. INCIDENT DESCRIPTION (NARRATIVE)
  drawSectionHeader('Incident Narrative & Detailed Description');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);

  const narrative = complaint.description || 'No detailed incident narrative was provided with this submission.';
  const narrativeLines = doc.splitTextToSize(narrative, contentWidth - 6);

  // Render narrative lines with multi-page handling
  for (let i = 0; i < narrativeLines.length; i++) {
    checkPageBreak(5);
    doc.text(narrativeLines[i], margin + 3, y);
    y += 4.5;
  }
  y += 4;

  // Suspect & Witness Details (if available)
  if (complaint.suspectDetails || complaint.witnessDetails) {
    drawSectionHeader('Suspect & Witness Intelligence');

    if (complaint.suspectDetails) {
      checkPageBreak(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(80, 80, 80);
      doc.text('Suspect Information:', margin + 3, y);
      y += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      const suspectLines = doc.splitTextToSize(complaint.suspectDetails, contentWidth - 6);
      for (const line of suspectLines) {
        checkPageBreak(5);
        doc.text(line, margin + 3, y);
        y += 4.5;
      }
      y += 2;
    }

    if (complaint.witnessDetails) {
      checkPageBreak(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(80, 80, 80);
      doc.text('Witness Information:', margin + 3, y);
      y += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      const witnessLines = doc.splitTextToSize(complaint.witnessDetails, contentWidth - 6);
      for (const line of witnessLines) {
        checkPageBreak(5);
        doc.text(line, margin + 3, y);
        y += 4.5;
      }
      y += 2;
    }
  }

  // 6. OFFICIAL CASE STATUS & SUMMARY
  drawSectionHeader('Official Investigation Status');
  checkPageBreak(14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 36, 71);
  doc.text(`Status: ${statusStr}`, margin + 3, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  const statusDescLines = doc.splitTextToSize(getStatusDescription(statusStr), contentWidth - 6);
  doc.text(statusDescLines, margin + 3, y);
  y += (statusDescLines.length * 4.5) + 4;

  // 7. DYNAMIC CASE TIMELINE & AUDIT HISTORY
  drawSectionHeader('Case Timeline & Official History');

  let timeline = Array.isArray(complaint.statusHistory) && complaint.statusHistory.length > 0
    ? [...complaint.statusHistory]
    : [
        {
          status: 'Pending',
          changedAt: complaint.createdAt,
          changedByRole: 'Citizen',
          note: 'Initial incident filing'
        }
      ];

  // Append current status if not matching last timeline status
  const lastStatus = timeline[timeline.length - 1]?.status;
  if (complaint.status && complaint.status !== lastStatus) {
    timeline.push({
      status: complaint.status,
      changedAt: complaint.updatedAt || complaint.createdAt,
      changedByRole: 'Admin',
      note: 'Status updated by administration'
    });
  }

  timeline.forEach((item, idx) => {
    checkPageBreak(13);
    // Bullet / marker
    doc.setFillColor(26, 58, 107);
    doc.circle(margin + 5, y - 1, 1.2, 'F');

    // Title line
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 36, 71);
    doc.text(`${item.status || 'Status Update'}`, margin + 10, y);

    // Timestamp & actor
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    const dateText = formatDateTime(item.changedAt);
    const roleText = item.changedByRole ? ` · Logged by ${item.changedByRole}` : '';
    doc.text(`${dateText}${roleText}`, margin + 60, y);

    y += 4;

    // Note if present
    if (item.note) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      const noteLines = doc.splitTextToSize(`"${item.note}"`, contentWidth - 14);
      doc.text(noteLines, margin + 10, y);
      y += (noteLines.length * 4);
    }
    y += 3;
  });

  y += 2;

  // 8. EVIDENCE ATTACHMENTS SUMMARY
  drawSectionHeader('Evidence & Attachments Summary');

  const evidenceFiles = Array.isArray(complaint.evidenceFiles) ? complaint.evidenceFiles : [];
  checkPageBreak(10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text(`Total Registered Attachments: ${evidenceFiles.length}`, margin + 3, y);
  y += 5;

  if (evidenceFiles.length === 0) {
    checkPageBreak(6);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('No physical or digital evidence files were submitted with this incident report.', margin + 3, y);
    y += 6;
  } else {
    evidenceFiles.forEach((fileRef, idx) => {
      checkPageBreak(8);
      const display = getEvidenceDisplay(fileRef, idx);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(20, 20, 20);
      doc.text(`${idx + 1}. ${display.name}`, margin + 5, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Type: ${display.type}`, margin + 100, y);

      y += 5;
    });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    doc.text('Note: Original binary evidence files are securely stored in the official repository vault.', margin + 3, y);
    y += 6;
  }

  y += 2;

  // 9. DOCUMENT INFORMATION & LEGAL FOOTNOTE
  checkPageBreak(25);
  doc.setDrawColor(200, 210, 225);
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + contentWidth, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 36, 71);
  doc.text('DOCUMENT RECORD INFORMATION', margin + 3, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(90, 90, 90);
  const nowStr = formatDateTime(new Date());
  doc.text(`Generated On: ${nowStr} (Local System Time)`, margin + 3, y);
  doc.text(`Record Reference: ${complaint.complaintId}`, margin + 100, y);
  y += 4;

  const legalNotice = 'This document constitutes an official case report extracted from the Crime Investigation & Complaint Management System. Any unauthorized alteration, forgery, or fraudulent reproduction of this document is strictly prohibited and subject to legal prosecution.';
  const legalLines = doc.splitTextToSize(legalNotice, contentWidth - 6);
  doc.text(legalLines, margin + 3, y);
  y += (legalLines.length * 3.5) + 3;

  // 10. MULTI-PAGE NUMBERING & FOOTERS (Apply to all pages)
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer divider line
    doc.setDrawColor(210, 215, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, margin + contentWidth, pageHeight - 12);

    // Footer text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);

    const leftFooter = `Crime Investigation Website • Case File: ${complaint.complaintId}`;
    const rightFooter = `Page ${i} of ${totalPages}`;

    doc.text(leftFooter, margin, pageHeight - 7);
    doc.text(rightFooter, margin + contentWidth, pageHeight - 7, { align: 'right' });
  }

  // Save the generated document
  const fileName = `${complaint.complaintId}-Case-File.pdf`;
  doc.save(fileName);
  return fileName;
}
