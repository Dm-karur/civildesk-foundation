import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';

/**
 * Export BOQ items to a formatted Excel file (.xlsx)
 */
export function exportBoqToExcel(boq, items, sections = []) {
  const sectionMap = {};
  sections.forEach((s) => {
    sectionMap[s.id] = s.section_name || s.name || s.section_code;
  });

  const rows = (items || []).map((item, index) => {
    const qty = Number(item.quantity || 0);
    const rate = Number(item.rate || 0);
    const amount = Number(item.amount || (qty * rate));
    const executed = Number(item.executed_quantity || 0);
    const balance = Math.max(0, qty - executed);
    const progress = qty > 0 ? Math.min(100, Math.round((executed / qty) * 100)) : 0;
    const status = progress >= 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started';

    return {
      'Item No': item.item_code || `${index + 1}.01`,
      'Section': sectionMap[item.section_id] || item.section_name || 'General Works',
      'Description': item.item_name || item.description || '—',
      'Category': item.category_name || item.work_category_name || 'Civil',
      'Unit': item.unit_code || item.unit_symbol || item.uom_name || 'Nos',
      'BOQ Qty': qty,
      'Rate (₹)': rate,
      'Amount (₹)': amount,
      'Executed Qty': executed,
      'Balance Qty': balance,
      'Progress %': `${progress}%`,
      'Status': status,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 12 }, // Item No
    { wch: 20 }, // Section
    { wch: 35 }, // Description
    { wch: 15 }, // Category
    { wch: 10 }, // Unit
    { wch: 12 }, // BOQ Qty
    { wch: 14 }, // Rate
    { wch: 16 }, // Amount
    { wch: 14 }, // Executed Qty
    { wch: 14 }, // Balance Qty
    { wch: 12 }, // Progress %
    { wch: 14 }, // Status
  ];

  const workbook = XLSX.utils.book_new();
  const sheetName = (boq?.boq_code || 'BOQ').substring(0, 31);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const filename = `${boq?.boq_code || 'BOQ'}_${(boq?.site_name || 'Site').replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * Generate and download a professional BOQ PDF document
 */
export function exportBoqToPdf(boq, items, sections = []) {
  const sectionMap = {};
  sections.forEach((s) => {
    sectionMap[s.id] = s.section_name || s.name || s.section_code;
  });

  const totalAmount = Number(boq?.total_amount || items.reduce((s, i) => s + Number(i.amount || 0), 0));
  const executedAmount = Number(boq?.executed_amount || items.reduce((s, i) => s + (Number(i.executed_quantity || 0) * Number(i.rate || 0)), 0));
  const balanceAmount = Math.max(0, totalAmount - executedAmount);

  const container = document.createElement('div');
  container.style.padding = '24px';
  container.style.fontFamily = "'Poppins', sans-serif, system-ui";
  container.style.color = '#1f2937';
  container.style.backgroundColor = '#ffffff';
  container.style.maxWidth = '900px';

  container.innerHTML = `
    <div style="border-bottom: 2px solid #70b816; padding-bottom: 16px; margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px;">KS CONSTRUCTION</h1>
          <p style="font-size: 11px; color: #64748b; margin: 2px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Enterprise Construction ERP</p>
        </div>
        <div style="text-align: right;">
          <h2 style="font-size: 16px; font-weight: 700; color: #70b816; margin: 0;">BILL OF QUANTITIES (BOQ)</h2>
          <p style="font-size: 12px; font-weight: 600; color: #334155; margin: 4px 0 0 0;">Code: ${boq?.boq_code || '—'}</p>
          <p style="font-size: 11px; color: #64748b; margin: 2px 0 0 0;">Date: ${boq?.boq_date ? boq.boq_date.substring(0, 10) : new Date().toISOString().substring(0, 10)} | Rev: ${boq?.revision_no ?? 0}</p>
        </div>
      </div>
    </div>

    <!-- Metadata Grid -->
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 12px;">
      <div>
        <p style="margin: 0; color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 600;">Site / Location</p>
        <p style="margin: 2px 0 0 0; font-weight: 600; color: #0f172a;">${boq?.site_name || 'Primary Construction Site'}</p>
      </div>
      <div>
        <p style="margin: 0; color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 600;">Client</p>
        <p style="margin: 2px 0 0 0; font-weight: 600; color: #0f172a;">${boq?.client_name || 'Standard Client'}</p>
      </div>
      <div>
        <p style="margin: 0; color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 600;">BOQ Name</p>
        <p style="margin: 2px 0 0 0; font-weight: 600; color: #0f172a;">${boq?.boq_name || 'Schedule of Quantities'}</p>
      </div>
      <div>
        <p style="margin: 0; color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 600;">Status</p>
        <p style="margin: 2px 0 0 0; font-weight: 700; color: ${boq?.status_name?.toLowerCase().includes('approved') ? '#16a34a' : '#d97706'};">${boq?.status_name || 'Draft'}</p>
      </div>
    </div>

    <!-- Table -->
    <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
      <thead>
        <tr style="background: #0f172a; color: #ffffff; text-align: left;">
          <th style="padding: 8px; width: 60px;">Item</th>
          <th style="padding: 8px;">Description</th>
          <th style="padding: 8px; width: 60px; text-align: center;">Unit</th>
          <th style="padding: 8px; width: 75px; text-align: right;">Qty</th>
          <th style="padding: 8px; width: 85px; text-align: right;">Rate (₹)</th>
          <th style="padding: 8px; width: 100px; text-align: right;">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${(items || []).map((item, idx) => `
          <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
            <td style="padding: 7px 8px; font-weight: 600; color: #70b816; font-family: monospace;">${item.item_code || `${idx + 1}.01`}</td>
            <td style="padding: 7px 8px; color: #1e293b;">
              <div style="font-weight: 500;">${item.item_name || item.description || '—'}</div>
              ${item.section_name ? `<div style="font-size: 9px; color: #64748b;">${item.section_name}</div>` : ''}
            </td>
            <td style="padding: 7px 8px; text-align: center; color: #64748b;">${item.unit_code || item.unit_symbol || item.uom_name || 'Nos'}</td>
            <td style="padding: 7px 8px; text-align: right; font-family: monospace;">${Number(item.quantity || 0).toLocaleString('en-IN')}</td>
            <td style="padding: 7px 8px; text-align: right; font-family: monospace;">₹${Number(item.rate || 0).toLocaleString('en-IN')}</td>
            <td style="padding: 7px 8px; text-align: right; font-weight: 600; font-family: monospace;">₹${Number(item.amount || (item.quantity * item.rate) || 0).toLocaleString('en-IN')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Totals Summary -->
    <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
      <div style="width: 280px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 11px; color: #64748b;">
          <span>Subtotal:</span>
          <span style="font-weight: 600; color: #0f172a; font-family: monospace;">₹${totalAmount.toLocaleString('en-IN')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 11px; color: #64748b;">
          <span>Executed Value:</span>
          <span style="font-weight: 600; color: #16a34a; font-family: monospace;">₹${executedAmount.toLocaleString('en-IN')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 11px; color: #64748b;">
          <span>Balance Value:</span>
          <span style="font-weight: 600; color: #d97706; font-family: monospace;">₹${balanceAmount.toLocaleString('en-IN')}</span>
        </div>
        <div style="border-top: 1px solid #cbd5e1; padding-top: 6px; margin-top: 6px; display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #0f172a;">
          <span>Total BOQ Value:</span>
          <span style="color: #70b816; font-family: monospace;">₹${totalAmount.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>

    <!-- Sign-off & Approval Footer -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; border-top: 1px dashed #cbd5e1; padding-top: 24px; text-align: center; font-size: 11px; color: #64748b;">
      <div>
        <div style="height: 35px;"></div>
        <p style="border-top: 1px solid #94a3b8; margin: 0; padding-top: 4px; font-weight: 500;">Prepared By (Site Engineer)</p>
      </div>
      <div>
        <div style="height: 35px;"></div>
        <p style="border-top: 1px solid #94a3b8; margin: 0; padding-top: 4px; font-weight: 500;">Reviewed By (Project Manager)</p>
      </div>
      <div>
        <div style="height: 35px;"></div>
        <p style="border-top: 1px solid #94a3b8; margin: 0; padding-top: 4px; font-weight: 500;">Approved By (Commercial / Client)</p>
      </div>
    </div>
  `;

  const opt = {
    margin: [10, 10, 10, 10],
    filename: `${boq?.boq_code || 'BOQ'}_Schedule.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };

  html2pdf().set(opt).from(container).save();
}

/**
 * Download sample BOQ Excel template for bulk import
 */
export function downloadBoqImportTemplate() {
  const sampleData = [
    {
      'Item No': '1.01',
      'Section': 'Earthwork',
      'Description': 'Excavation for foundation in all kinds of soil',
      'Category': 'Earthwork',
      'Unit': 'm3',
      'Quantity': 250,
      'Rate': 300,
      'Specification': 'Standard foundation depth up to 1.5m',
    },
    {
      'Item No': '1.02',
      'Section': 'Earthwork',
      'Description': 'Filling in plinth with quarry dust including compaction',
      'Category': 'Earthwork',
      'Unit': 'm3',
      'Quantity': 120,
      'Rate': 450,
      'Specification': 'Compacted in 15cm layers',
    },
    {
      'Item No': '2.01',
      'Section': 'Concrete Work',
      'Description': 'PCC 1:4:8 using 40mm metal for foundation bed',
      'Category': 'Concrete',
      'Unit': 'm3',
      'Quantity': 45,
      'Rate': 4200,
      'Specification': 'M7.5 grade nominal mix',
    },
    {
      'Item No': '2.02',
      'Section': 'Concrete Work',
      'Description': 'RCC M25 grade for column footings and pedestals',
      'Category': 'Concrete',
      'Unit': 'm3',
      'Quantity': 120,
      'Rate': 7500,
      'Specification': 'Excluding reinforcement and shuttering',
    },
    {
      'Item No': '3.01',
      'Section': 'Steel Work',
      'Description': 'Thermo-mechanically treated (TMT) Fe 500D bars',
      'Category': 'Steel',
      'Unit': 'kg',
      'Quantity': 8500,
      'Rate': 72,
      'Specification': 'Including cutting, bending, and placing',
    },
    {
      'Item No': '4.01',
      'Section': 'Masonry',
      'Description': 'Solid concrete block masonry in CM 1:6 for substructure',
      'Category': 'Masonry',
      'Unit': 'm3',
      'Quantity': 80,
      'Rate': 5200,
      'Specification': '200mm thick walling',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 18 },
    { wch: 45 },
    { wch: 15 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 35 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'BOQ_Template');
  XLSX.writeFile(workbook, 'KS_Construction_BOQ_Import_Template.xlsx');
}

export const downloadBoqTemplate = downloadBoqImportTemplate;

