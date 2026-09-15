import html2pdf from 'html2pdf.js';

export const exportA5SlipFromElement = async (element, filename = 'Weekly_Slip.pdf') => {
  if (!element) throw new Error('Slip element not provided');

  const pdfFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  const opt = {
    margin: [4, 4, 4, 4], // mm
    filename: pdfFilename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a5',
      orientation: 'landscape',
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  };

  return html2pdf().set(opt).from(element).save();
};

const buildA5SlipHtml = (item) => {
  // Look up full slip details from localStorage if available
  let savedSlip = null;
  try {
    const slips = JSON.parse(localStorage.getItem('mock_maistry_slips') || '[]');
    savedSlip = slips.find(s => s.id === item.id || s.ref_no === item.voucher_no || s.ref_no === item.id);
  } catch {}

  const voucherNo = item.voucher_no || savedSlip?.ref_no || item.id || `SWP-${Date.now().toString().slice(-4)}`;
  const contractorName = item.contractor_name || savedSlip?.maistry_name || 'Subcontractor';
  const siteName = item.site_name || savedSlip?.site_name || item.project_name || 'Site';
  const clientName = item.client_name || savedSlip?.client_name || 'KS Construction Client';
  const tradeType = item.trade_category || savedSlip?.trade || 'MAISTRY';
  const weekStart = item.week_start || savedSlip?.start_date || '';
  const weekEnd = item.week_end || savedSlip?.end_date || '';
  const dateStr = item.payment_date || weekEnd || savedSlip?.end_date || new Date().toISOString().split('T')[0];

  // Calculate 7-day columns
  const dateLabels = [];
  try {
    const startBase = weekStart || (dateStr ? new Date(new Date(dateStr).getTime() - 6 * 86400000).toISOString().split('T')[0] : '');
    const startParts = startBase.split('-').map(Number);
    for (let i = 0; i < 7; i++) {
      const cur = new Date(startParts[0], startParts[1] - 1, startParts[2] + i);
      const day = String(cur.getDate()).padStart(2, '0');
      const month = String(cur.getMonth() + 1).padStart(2, '0');
      dateLabels.push(`${day}/${month}`);
    }
  } catch {
    dateLabels.push('07/09', '08/09', '09/09', '10/09', '11/09', '12/09', '13/09');
  }

  let rowCounter = 1;
  let categoriesHtml = '';
  let grandTotal = Number(item.grand_total ?? (savedSlip?.grand_total ?? (item.net_payable || item.gross_amount || 0)));

  const activeCategories = (Array.isArray(item.categories) && item.categories.length > 0)
    ? item.categories
    : (Array.isArray(savedSlip?.categories) && savedSlip.categories.length > 0 ? savedSlip.categories : null);

  if (activeCategories && activeCategories.length > 0) {
    activeCategories.forEach((cat) => {
      categoriesHtml += `
        <tr style="border-bottom: 1px solid #000; background: rgba(0,0,0,0.04); font-size: 10px; font-weight: bold; text-transform: uppercase;">
          <td colspan="12" style="padding: 3px 6px;">${cat.category}</td>
        </tr>
      `;

      if (Array.isArray(cat.items)) {
        cat.items.forEach((it) => {
          const days = Array.isArray(it.days) ? it.days : ['', '', '', '', '', '', ''];
          const qty = Math.round(days.reduce((sum, d) => sum + (Number(d) || 0), 0) * 100) / 100;
          const rate = Number(it.rate) || 0;
          const amt = Math.round(qty * rate * 100) / 100;

          const daysHtml = days.slice(0, 7).map(d => {
            const num = Number(d);
            return `<td style="border-right: 1px solid #000; padding: 3px; text-align: center; font-size: 10px; font-family: monospace;">${num > 0 ? (num % 1 === 0 ? num : num.toFixed(1)) : '-'}</td>`;
          }).join('');

          const qtyDisplay = qty > 0 ? (qty % 1 === 0 ? qty : qty.toFixed(1)) : 0;
          const amtDisplay = amt > 0 ? (amt % 1 === 0 ? amt : amt.toFixed(2)) : 0;

          categoriesHtml += `
            <tr style="border-bottom: 1px solid #000; font-size: 11px;">
              <td style="border-right: 1px solid #000; padding: 3px 4px; text-align: center; font-weight: bold; width: 26px;">${rowCounter++}</td>
              <td style="border-right: 1px solid #000; padding: 3px 6px; font-weight: 600;">${it.description || 'Item'}</td>
              <td style="border-right: 1px solid #000; padding: 3px 6px; text-align: right; font-family: monospace; width: 60px;">${rate}</td>
              ${daysHtml}
              <td style="border-right: 1px solid #000; padding: 3px 4px; text-align: center; font-weight: bold; font-family: monospace; width: 42px;">${qtyDisplay}</td>
              <td style="padding: 3px 6px; text-align: right; font-weight: bold; font-family: monospace; width: 75px;">${amtDisplay}</td>
            </tr>
          `;
        });
      }
    });
  } else {
    // Default categories if no saved categories
    let trades = [];
    if (Array.isArray(item.trades) && item.trades.length > 0) {
      trades = item.trades;
    } else {
      trades = [
        { item: item.trade_category || 'Labour Gang', rate: item.avg_rate_per_day || 800, qty: item.total_mandays || 1, amount: item.gross_amount || 0 }
      ];
    }

    const tradeRowsHtml = trades.map((t) => {
      const qty = Math.round(Number(t.qty || 0) * 100) / 100;
      const rate = Number(t.rate || 0);
      const amt = Math.round((t.amount ? Number(t.amount) : qty * rate) * 100) / 100;
      const isSingleDay = qty > 0;
      const qtyDisplay = qty > 0 ? (qty % 1 === 0 ? qty : qty.toFixed(1)) : 0;
      const amtDisplay = amt > 0 ? (amt % 1 === 0 ? amt : amt.toFixed(2)) : 0;

      return `
        <tr style="border-bottom: 1px solid #000; font-size: 11px;">
          <td style="border-right: 1px solid #000; padding: 3px 4px; text-align: center; font-weight: bold; width: 26px;">${rowCounter++}</td>
          <td style="border-right: 1px solid #000; padding: 3px 6px; font-weight: 600;">${t.item || 'Labour'}</td>
          <td style="border-right: 1px solid #000; padding: 3px 6px; text-align: right; font-family: monospace; width: 60px;">${rate}</td>
          <td style="border-right: 1px solid #000; padding: 3px; text-align: center; font-family: monospace;">-</td>
          <td style="border-right: 1px solid #000; padding: 3px; text-align: center; font-family: monospace;">-</td>
          <td style="border-right: 1px solid #000; padding: 3px; text-align: center; font-family: monospace;">-</td>
          <td style="border-right: 1px solid #000; padding: 3px; text-align: center; font-family: monospace;">-</td>
          <td style="border-right: 1px solid #000; padding: 3px; text-align: center; font-weight: bold; font-family: monospace;">${isSingleDay ? qtyDisplay : '-'}</td>
          <td style="border-right: 1px solid #000; padding: 3px; text-align: center; font-family: monospace;">-</td>
          <td style="border-right: 1px solid #000; padding: 3px; text-align: center; font-family: monospace;">-</td>
          <td style="border-right: 1px solid #000; padding: 3px 4px; text-align: center; font-weight: bold; font-family: monospace; width: 42px;">${qtyDisplay}</td>
          <td style="padding: 3px 6px; text-align: right; font-weight: bold; font-family: monospace; width: 75px;">${amtDisplay}</td>
        </tr>
      `;
    }).join('');

    categoriesHtml = `
      <tr style="border-bottom: 1px solid #000; background: rgba(0,0,0,0.04); font-size: 10px; font-weight: bold; text-transform: uppercase;">
        <td colspan="12" style="padding: 3px 6px;">LABOUR / MANPOWER</td>
      </tr>
      ${tradeRowsHtml}
      <tr style="border-bottom: 1px solid #000; background: rgba(0,0,0,0.04); font-size: 10px; font-weight: bold; text-transform: uppercase;">
        <td colspan="12" style="padding: 3px 6px;">EQUIPMENT / RENTALS</td>
      </tr>
      <tr style="border-bottom: 1px solid #000; background: rgba(0,0,0,0.04); font-size: 10px; font-weight: bold; text-transform: uppercase;">
        <td colspan="12" style="padding: 3px 6px;">EXPENSES & CHARGES</td>
      </tr>
    `;
  }

  // Commission Row if applicable
  let commissionHtml = '';
  const hasCommission = item.enable_maistry_pct ?? savedSlip?.enable_maistry_pct;
  const commPct = Number(item.maistry_pct_value ?? savedSlip?.maistry_pct_value ?? 0);
  if (hasCommission && commPct > 0) {
    const comm = Math.round(grandTotal * (commPct / 100));
    commissionHtml = `
      <tr style="border-top: 1px solid #000; font-size: 11px;">
        <td colspan="11" style="border-right: 1px solid #000; padding: 4px 8px; text-align: right; text-transform: uppercase; font-weight: bold;">
          ${contractorName} (${commPct}%) :
        </td>
        <td style="padding: 4px 8px; text-align: right; font-weight: bold; font-family: monospace;">
          ₹${comm.toLocaleString('en-IN')}
        </td>
      </tr>
    `;
  }

  return `
    <div style="width: 760px; margin: 0 auto; padding: 12px 14px; background: #fff; box-sizing: border-box; font-family: monospace, 'Courier New', Courier, sans-serif; color: #000; border: 2px solid #000; page-break-inside: avoid;">
      <!-- Header Box -->
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 10px; font-size: 11px;">
        <tr style="border-bottom: 1px solid #000;">
          <td style="border-right: 1px solid #000; padding: 4px 8px; font-weight: bold; text-transform: uppercase; width: 50%;">
            <span style="display: inline-block; width: 75px; opacity: 0.85;">CLIENT :</span> ${clientName}
          </td>
          <td style="padding: 4px 8px; font-weight: bold; text-transform: uppercase; width: 50%;">
            <span style="display: inline-block; width: 75px; opacity: 0.85;">DATE :</span> ${dateStr.split('-').reverse().join('-')}
          </td>
        </tr>
        <tr style="border-bottom: 1px solid #000;">
          <td style="border-right: 1px solid #000; padding: 4px 8px; font-weight: bold; text-transform: uppercase;">
            <span style="display: inline-block; width: 75px; opacity: 0.85;">SITE :</span> ${siteName}
          </td>
          <td style="padding: 4px 8px; font-weight: bold; text-transform: uppercase;">
            <span style="display: inline-block; width: 75px; opacity: 0.85;">TYPE :</span> ${tradeType}
          </td>
        </tr>
        <tr>
          <td style="border-right: 1px solid #000; padding: 4px 8px; font-weight: bold; text-transform: uppercase;">
            <span style="display: inline-block; width: 75px; opacity: 0.85;">MAISTRY :</span> ${contractorName}
          </td>
          <td style="padding: 4px 8px; font-weight: bold; text-transform: uppercase;">
            <span style="display: inline-block; width: 75px; opacity: 0.85;">REF NO :</span> ${voucherNo}
          </td>
        </tr>
      </table>

      <!-- Main Table -->
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 11px; margin-bottom: 12px;">
        <thead>
          <tr style="border-bottom: 1px solid #000; background: rgba(0,0,0,0.05); font-size: 9.5px; font-weight: bold; text-transform: uppercase;">
            <th style="border-right: 1px solid #000; padding: 4px 2px; width: 26px; text-align: center;">#</th>
            <th style="border-right: 1px solid #000; padding: 4px 6px; text-align: left;">PARTICULARS / DESCRIPTION</th>
            <th style="border-right: 1px solid #000; padding: 4px 6px; width: 60px; text-align: right;">RATE (₹)</th>
            ${dateLabels.map(lbl => `<th style="border-right: 1px solid #000; padding: 4px 2px; width: 38px; text-align: center; font-size: 9px;">${lbl}</th>`).join('')}
            <th style="border-right: 1px solid #000; padding: 4px 4px; width: 42px; text-align: center;">QTY</th>
            <th style="padding: 4px 6px; width: 75px; text-align: right;">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          ${categoriesHtml}
          <!-- Total Row -->
          <tr style="border-top: 2px solid #000; font-weight: bold; background: rgba(0,0,0,0.04);">
            <td colspan="11" style="border-right: 1px solid #000; padding: 5px 8px; text-align: right; font-size: 11px; text-transform: uppercase; font-weight: 800;">
              TOTAL AMOUNT :
            </td>
            <td style="padding: 5px 8px; text-align: right; font-size: 12.5px; font-weight: 900; font-family: monospace;">
              ₹${Math.round(grandTotal).toLocaleString('en-IN')}
            </td>
          </tr>
          ${commissionHtml}
        </tbody>
      </table>

      <!-- Signatures Area -->
      <div style="display: flex; justify-content: space-between; text-align: center; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-top: 28px; padding: 0 15px;">
        <div style="width: 170px;">
          <div style="border-top: 2px solid #000; padding-top: 4px;">ENGINEER</div>
        </div>
        <div style="width: 170px;">
          <div style="border-top: 2px solid #000; padding-top: 4px;">SUPERVISOR</div>
        </div>
        <div style="width: 170px;">
          <div style="border-top: 2px solid #000; padding-top: 4px;">RECEIVER</div>
        </div>
      </div>
    </div>
  `;
};

export const generateAndDownloadA5SlipFromItem = async (item) => {
  if (!item) return;

  const voucherNo = item.voucher_no || item.id || `SWP-${Date.now().toString().slice(-4)}`;
  const contractorName = item.contractor_name || 'Subcontractor';

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '780px';
  container.style.backgroundColor = '#ffffff';

  container.innerHTML = buildA5SlipHtml(item);
  document.body.appendChild(container);

  try {
    const filename = `${voucherNo}_${contractorName.replace(/\s+/g, '_')}_A5Slip.pdf`;
    await exportA5SlipFromElement(container.firstElementChild || container, filename);
  } finally {
    document.body.removeChild(container);
  }
};

export const printA5SlipFromItem = (item) => {
  if (!item) return;

  const printWindow = window.open('', '_blank', 'width=880,height=650');
  if (!printWindow) {
    throw new Error('Popup blocked');
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Weekly Slip - ${item.voucher_no || item.id}</title>
        <style>
          @page {
            size: a5 landscape;
            margin: 4mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 8px;
            background: #fff;
            color: #000;
            font-family: monospace, 'Courier New', Courier, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        ${buildA5SlipHtml(item)}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
