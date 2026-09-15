import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';

export function exportWeeklyWagesToExcel({ reportData, siteName, startDate, endDate }) {
  if (!reportData || !reportData.matrix || reportData.matrix.length === 0) {
    throw new Error('No wage data available to export.');
  }

  const days = reportData.date_range?.days || [];
  
  const headers = [
    '#',
    'Subcontractor',
    'Trade / Item Description',
    'Type',
    'Unit',
    ...days.map(d => `${d.day_name.slice(0, 3)} (${d.date.slice(5)})`),
    'Total Shifts',
    'Rate (₹)',
    'Total Amount (₹)'
  ];

  const rows = reportData.matrix.map((row, idx) => {
    const dayShifts = days.map(d => Number(row.shifts_by_date?.[d.date] || 0));
    return [
      idx + 1,
      row.contractor_name || '—',
      row.item_name,
      row.classification,
      row.uom,
      ...dayShifts,
      Number(row.total_shifts || 0),
      Number(row.rate || 0),
      Number(row.total_amount || 0)
    ];
  });

  // Footer summary row
  const dayTotals = days.map(d => Number(reportData.daily_totals?.[d.date]?.shifts || 0));
  const footerRow = [
    '',
    'TOTALS',
    '',
    '',
    '',
    ...dayTotals,
    Number(reportData.total_shifts || 0),
    '',
    Number(reportData.total_amount || 0)
  ];

  const worksheetData = [
    [`KS CONSTRUCTION - WEEKLY WAGES REPORT`],
    [`Site: ${siteName || 'All Sites'} | Period: ${startDate} to ${endDate}`],
    [],
    headers,
    ...rows,
    [],
    footerRow
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Column widths
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 24 },
    { wch: 28 },
    { wch: 14 },
    { wch: 8 },
    ...days.map(() => ({ wch: 12 })),
    { wch: 14 },
    { wch: 12 },
    { wch: 18 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Weekly Wages');

  const filename = `Weekly_Wages_${(siteName || 'Site').replace(/[^a-zA-Z0-9]/g, '_')}_${startDate}_${endDate}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

export function exportWeeklyWagesToPdf({ reportData, siteName, startDate, endDate }) {
  if (!reportData || !reportData.matrix || reportData.matrix.length === 0) {
    throw new Error('No wage data available to export.');
  }

  const days = reportData.date_range?.days || [];
  const container = document.createElement('div');
  container.style.padding = '24px';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.color = '#1e293b';
  container.style.background = '#ffffff';

  const dayHeadersHtml = days.map(d => `
    <th style="padding: 6px 4px; border: 1px solid #cbd5e1; background: #f1f5f9; text-align: center; font-size: 10px;">
      ${d.day_name.slice(0, 3)}<br/><span style="color:#64748b; font-weight:normal;">${d.date.slice(5)}</span>
    </th>
  `).join('');

  const rowsHtml = reportData.matrix.map((row, idx) => {
    const dayCells = days.map(d => {
      const s = Number(row.shifts_by_date?.[d.date] || 0);
      return `<td style="padding: 6px 4px; border: 1px solid #cbd5e1; text-align: center; font-size: 11px; ${s > 0 ? 'font-weight: bold; color: #0f172a; background: #f8fafc;' : 'color: #94a3b8;'}">${s > 0 ? s : '—'}</td>`;
    }).join('');

    return `
      <tr style="${idx % 2 === 1 ? 'background: #fafafa;' : ''}">
        <td style="padding: 6px 4px; border: 1px solid #cbd5e1; text-align: center; font-size: 11px;">${idx + 1}</td>
        <td style="padding: 6px 6px; border: 1px solid #cbd5e1; font-size: 11px; font-weight: bold;">${row.contractor_name || '—'}</td>
        <td style="padding: 6px 6px; border: 1px solid #cbd5e1; font-size: 11px;">${row.item_name}</td>
        <td style="padding: 6px 4px; border: 1px solid #cbd5e1; text-align: center; font-size: 10px;"><span style="background: #e2e8f0; padding: 2px 5px; border-radius: 4px;">${row.classification}</span></td>
        <td style="padding: 6px 4px; border: 1px solid #cbd5e1; text-align: center; font-size: 10px;">${row.uom}</td>
        ${dayCells}
        <td style="padding: 6px 4px; border: 1px solid #cbd5e1; text-align: center; font-size: 11px; font-weight: bold;">${Number(row.total_shifts || 0)}</td>
        <td style="padding: 6px 4px; border: 1px solid #cbd5e1; text-align: right; font-size: 11px;">₹${Number(row.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td style="padding: 6px 6px; border: 1px solid #cbd5e1; text-align: right; font-size: 11px; font-weight: bold; color: #047857;">₹${Number(row.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      </tr>
    `;
  }).join('');

  const dayTotalsCells = days.map(d => {
    const s = Number(reportData.daily_totals?.[d.date]?.shifts || 0);
    return `<td style="padding: 8px 4px; border: 1px solid #cbd5e1; text-align: center; font-size: 11px; font-weight: bold;">${s}</td>`;
  }).join('');

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
      <div>
        <h1 style="font-size: 18px; margin: 0; font-weight: 800; color: #0f172a; letter-spacing: 0.5px;">KS CONSTRUCTION</h1>
        <h2 style="font-size: 14px; margin: 4px 0 0 0; color: #334155; font-weight: 600;">SUBCONTRACTOR WEEKLY WAGE REPORT</h2>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
          Site: <strong>${siteName || 'All Sites'}</strong> | Period: <strong>${startDate} to ${endDate}</strong>
        </div>
      </div>
      <div style="text-align: right; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px 16px;">
        <div style="font-size: 10px; text-transform: uppercase; font-weight: bold; color: #166534;">TOTAL WEEKLY PAYOUT</div>
        <div style="font-size: 18px; font-weight: 800; color: #15803d;">₹${Number(reportData.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        <div style="font-size: 10px; color: #166534;">Total Shifts: <strong>${reportData.total_shifts || 0}</strong></div>
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <thead>
        <tr>
          <th style="padding: 6px 4px; border: 1px solid #cbd5e1; background: #f1f5f9; text-align: center; font-size: 10px; width: 25px;">#</th>
          <th style="padding: 6px 6px; border: 1px solid #cbd5e1; background: #f1f5f9; text-align: left; font-size: 10px;">SUBCONTRACTOR</th>
          <th style="padding: 6px 6px; border: 1px solid #cbd5e1; background: #f1f5f9; text-align: left; font-size: 10px;">TRADE / ITEM</th>
          <th style="padding: 6px 4px; border: 1px solid #cbd5e1; background: #f1f5f9; text-align: center; font-size: 10px;">TYPE</th>
          <th style="padding: 6px 4px; border: 1px solid #cbd5e1; background: #f1f5f9; text-align: center; font-size: 10px;">UNIT</th>
          ${dayHeadersHtml}
          <th style="padding: 6px 4px; border: 1px solid #cbd5e1; background: #f1f5f9; text-align: center; font-size: 10px;">SHIFTS</th>
          <th style="padding: 6px 4px; border: 1px solid #cbd5e1; background: #f1f5f9; text-align: right; font-size: 10px;">RATE (₹)</th>
          <th style="padding: 6px 6px; border: 1px solid #cbd5e1; background: #f1f5f9; text-align: right; font-size: 10px;">AMOUNT (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
      <tfoot>
        <tr style="background: #e2e8f0; font-weight: bold;">
          <td colspan="5" style="padding: 8px 8px; border: 1px solid #cbd5e1; text-align: right; font-size: 11px;">TOTALS</td>
          ${dayTotalsCells}
          <td style="padding: 8px 4px; border: 1px solid #cbd5e1; text-align: center; font-size: 11px; font-weight: 800;">${Number(reportData.total_shifts || 0)}</td>
          <td style="padding: 8px 4px; border: 1px solid #cbd5e1;"></td>
          <td style="padding: 8px 6px; border: 1px solid #cbd5e1; text-align: right; font-size: 12px; font-weight: 800; color: #047857;">₹${Number(reportData.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      </tfoot>
    </table>

    <div style="margin-top: 40px; display: flex; justify-content: space-between; padding: 0 20px;">
      <div style="text-align: center;">
        <div style="border-top: 1px dashed #94a3b8; width: 150px; padding-top: 4px; font-size: 11px; color: #64748b;">Prepared By (Timekeeper)</div>
      </div>
      <div style="text-align: center;">
        <div style="border-top: 1px dashed #94a3b8; width: 150px; padding-top: 4px; font-size: 11px; color: #64748b;">Site Engineer</div>
      </div>
      <div style="text-align: center;">
        <div style="border-top: 1px dashed #94a3b8; width: 150px; padding-top: 4px; font-size: 11px; color: #64748b;">Project Manager / Approved</div>
      </div>
    </div>
  `;

  const opt = {
    margin: 8,
    filename: `Weekly_Wages_${(siteName || 'Site').replace(/[^a-zA-Z0-9]/g, '_')}_${startDate}_${endDate}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
  };

  html2pdf().set(opt).from(container).save();
}
