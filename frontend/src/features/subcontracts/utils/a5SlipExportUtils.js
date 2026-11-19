export function numberToWords(num) {
  const amount = Math.round(Number(num) || 0);
  if (amount <= 0) return 'Rupees Zero Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(val) {
    if (val < 10) return singleDigits[val];
    if (val < 20) return teens[val - 10];
    const unit = val % 10;
    return tens[Math.floor(val / 10)] + (unit ? ' ' + singleDigits[unit] : '');
  }

  function convertThreeDigits(val) {
    const hundred = Math.floor(val / 100);
    const rest = val % 100;
    let res = '';
    if (hundred) {
      res += singleDigits[hundred] + ' Hundred';
      if (rest) res += ' and ';
    }
    if (rest) {
      res += convertTwoDigits(rest);
    }
    return res;
  }

  let crore = Math.floor(amount / 10000000);
  let remainder = amount % 10000000;
  let lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;
  let thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;
  let hundredAndRest = remainder;

  const parts = [];
  if (crore > 0) parts.push(convertThreeDigits(crore) + ' Crore');
  if (lakh > 0) parts.push(convertTwoDigits(lakh) + ' Lakh');
  if (thousand > 0) parts.push(convertTwoDigits(thousand) + ' Thousand');
  if (hundredAndRest > 0) parts.push(convertThreeDigits(hundredAndRest));

  return 'Rupees ' + parts.join(' ') + ' Only';
}

import html2pdf from 'html2pdf.js';

export const exportA5SlipFromElement = async (element, filename = 'Weekly_Slip.pdf') => {
  if (!element) throw new Error('Slip element not provided');

  const pdfFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  const opt = {
    margin: [3, 4, 3, 4], // mm: [top, left, bottom, right] for tight single A5 fit
    filename: pdfFilename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 840,
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
  } catch (e) {
    // Ignore error
  }

  const clientName = item.client_name || savedSlip?.client_name || 'Client';
  const siteName = item.site_name || savedSlip?.site_name || 'Site Name';
  const contractorName = item.contractor_name || savedSlip?.contractor_name || 'Subcontractor';
  const tradeType = item.trade_category || savedSlip?.trade_category || 'Mason / Labour';
  const dateStr = item.date || item.created_at || new Date().toISOString().split('T')[0];
  const voucherNo = item.voucher_no || item.id || 'REF-001';

  // Only take categories that have non-empty items to prevent blank category divider rows
  const rawCats = (Array.isArray(item.categories) && item.categories.length > 0)
    ? item.categories
    : (Array.isArray(savedSlip?.categories) && savedSlip.categories.length > 0 ? savedSlip.categories : null);

  const activeCategories = rawCats ? rawCats.map(cat => ({
    ...cat,
    items: Array.isArray(cat.items) ? cat.items.filter(it => {
      const days = Array.isArray(it.days) ? it.days : [];
      const qty = days.reduce((sum, d) => sum + (Number(d) || 0), 0);
      return qty > 0 || (Number(it.rate) || 0) > 0 || (it.description && it.description.trim() !== '');
    }) : []
  })).filter(cat => cat.items && cat.items.length > 0) : null;

  // Calculate grandTotal accurately from item or sum of items
  let grandTotal = Number(item.grand_total || item.net_payable || item.net_amount || item.total_amount || item.gross_amount || savedSlip?.grand_total || 0);
  if (grandTotal <= 0 && activeCategories && activeCategories.length > 0) {
    let calculatedSum = 0;
    activeCategories.forEach(cat => {
      if (Array.isArray(cat.items)) {
        cat.items.forEach(it => {
          const days = Array.isArray(it.days) ? it.days : [];
          const qty = days.reduce((sum, d) => sum + (Number(d) || 0), 0);
          const rate = Number(it.rate) || 0;
          calculatedSum += qty * rate;
        });
      }
    });
    if (calculatedSum > 0) {
      grandTotal = Math.round(calculatedSum * 100) / 100;
    }
  }

  // Generate 7-day date headers
  const dateLabels = [];
  try {
    const end = new Date(dateStr);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(d.getDate() - i);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      dateLabels.push(`${day}/${month}`);
    }
  } catch (e) {
    for (let i = 1; i <= 7; i++) dateLabels.push(`Day ${i}`);
  }

  let rowCounter = 1;
  let categoriesHtml = '';

  if (activeCategories && activeCategories.length > 0) {
    activeCategories.forEach((cat) => {
      categoriesHtml += `
        <tr style="border-bottom: 1.5px solid #000; background: rgba(0,0,0,0.08); font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">
          <td colspan="12" style="padding: 3.5px 8px; vertical-align: middle; white-space: nowrap;">${cat.category}</td>
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
            return `<td style="border-right: 1px solid #000; padding: 4px 1px; text-align: center; font-size: 13.5px; font-weight: 700; font-family: monospace; vertical-align: middle; white-space: nowrap;">${num > 0 ? (num % 1 === 0 ? num : num.toFixed(1)) : '-'}</td>`;
          }).join('');

          const qtyDisplay = qty > 0 ? (qty % 1 === 0 ? qty : qty.toFixed(1)) : 0;
          const amtDisplay = amt > 0 ? (amt % 1 === 0 ? amt.toLocaleString('en-IN') : amt.toFixed(2)) : 0;

          categoriesHtml += `
            <tr style="border-bottom: 1px solid #000; font-size: 13.5px;">
              <td style="border-right: 1px solid #000; padding: 4px 2px; text-align: center; font-weight: bold; vertical-align: middle; white-space: nowrap; font-size: 13px;">${rowCounter++}</td>
              <td style="border-right: 1px solid #000; padding: 4px 6px; font-weight: 800; font-size: 14px; color: #000; vertical-align: middle; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${it.description || 'Item'}</td>
              <td style="border-right: 1px solid #000; padding: 4px 4px; text-align: right; font-weight: 700; font-family: monospace; font-size: 13.5px; vertical-align: middle; white-space: nowrap;">${rate}</td>
              ${daysHtml}
              <td style="border-right: 1px solid #000; padding: 4px 2px; text-align: center; font-weight: 800; font-family: monospace; font-size: 14px; vertical-align: middle; white-space: nowrap;">${qtyDisplay}</td>
              <td style="padding: 4px 6px; text-align: right; font-weight: 800; font-family: monospace; font-size: 14px; vertical-align: middle; white-space: nowrap;">${amtDisplay}</td>
            </tr>
          `;
        });
      }
    });
  } else {
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
      const amtDisplay = amt > 0 ? (amt % 1 === 0 ? amt.toLocaleString('en-IN') : amt.toFixed(2)) : 0;

      return `
        <tr style="border-bottom: 1px solid #000; font-size: 13.5px;">
          <td style="border-right: 1px solid #000; padding: 4px 2px; text-align: center; font-weight: bold; vertical-align: middle; white-space: nowrap; font-size: 13px;">${rowCounter++}</td>
          <td style="border-right: 1px solid #000; padding: 4px 6px; font-weight: 800; font-size: 14px; vertical-align: middle; white-space: nowrap;">${t.item || 'Labour'}</td>
          <td style="border-right: 1px solid #000; padding: 4px 4px; text-align: right; font-family: monospace; font-size: 13.5px; vertical-align: middle; white-space: nowrap;">${rate}</td>
          <td style="border-right: 1px solid #000; padding: 4px 1px; text-align: center; font-family: monospace; vertical-align: middle; white-space: nowrap;">-</td>
          <td style="border-right: 1px solid #000; padding: 4px 1px; text-align: center; font-family: monospace; vertical-align: middle; white-space: nowrap;">-</td>
          <td style="border-right: 1px solid #000; padding: 4px 1px; text-align: center; font-family: monospace; vertical-align: middle; white-space: nowrap;">-</td>
          <td style="border-right: 1px solid #000; padding: 4px 1px; text-align: center; font-family: monospace; vertical-align: middle; white-space: nowrap;">-</td>
          <td style="border-right: 1px solid #000; padding: 4px 1px; text-align: center; font-weight: bold; font-family: monospace; vertical-align: middle; white-space: nowrap;">${isSingleDay ? qtyDisplay : '-'}</td>
          <td style="border-right: 1px solid #000; padding: 4px 1px; text-align: center; font-family: monospace; vertical-align: middle; white-space: nowrap;">-</td>
          <td style="border-right: 1px solid #000; padding: 4px 1px; text-align: center; font-family: monospace; vertical-align: middle; white-space: nowrap;">-</td>
          <td style="border-right: 1px solid #000; padding: 4px 2px; text-align: center; font-weight: bold; font-family: monospace; font-size: 14px; vertical-align: middle; white-space: nowrap;">${qtyDisplay}</td>
          <td style="padding: 4px 6px; text-align: right; font-weight: bold; font-family: monospace; font-size: 14px; vertical-align: middle; white-space: nowrap;">${amtDisplay}</td>
        </tr>
      `;
    }).join('');

    categoriesHtml = `
      <tr style="border-bottom: 1.5px solid #000; background: rgba(0,0,0,0.04); font-size: 13px; font-weight: bold; text-transform: uppercase;">
        <td colspan="12" style="padding: 3.5px 8px; vertical-align: middle; white-space: nowrap;">LABOUR / MANPOWER</td>
      </tr>
      ${tradeRowsHtml}
    `;
  }

  // Commission Row if applicable
  let commissionHtml = '';
  const hasCommission = item.enable_maistry_pct ?? savedSlip?.enable_maistry_pct;
  const commPct = Number(item.maistry_pct_value ?? savedSlip?.maistry_pct_value ?? 0);
  if (hasCommission && commPct > 0) {
    const comm = Math.round(grandTotal * (commPct / 100));
    commissionHtml = `
      <tr style="border-top: 1.5px solid #000; font-size: 13px;">
        <td colspan="11" style="border-right: 1px solid #000; padding: 3px 8px; text-align: right; text-transform: uppercase; font-weight: bold; vertical-align: middle; white-space: nowrap;">
          ${contractorName} (${commPct}%) :
        </td>
        <td style="padding: 3px 6px; text-align: right; font-weight: bold; font-family: monospace; vertical-align: middle; white-space: nowrap; font-size: 14px;">
          ₹${comm.toLocaleString('en-IN')}
        </td>
      </tr>
    `;
  }

  return `
    <div style="width: 100%; max-width: 100%; margin: 0 auto; padding: 6px 8px; background: #fff; box-sizing: border-box; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; color: #000; border: 2px solid #000; page-break-inside: avoid; break-inside: avoid;">
      <!-- Header Box -->
      <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000; margin-bottom: 6px; font-size: 13.5px; table-layout: fixed;">
        <tr style="border-bottom: 1px solid #000;">
          <td style="border-right: 1px solid #000; padding: 4px 8px; font-weight: bold; text-transform: uppercase; width: 50%; vertical-align: middle; white-space: nowrap;">
            <span style="display: inline-block; width: 85px; font-weight: 800; opacity: 0.85; font-size: 13px;">CLIENT :</span> <span style="font-weight: 900; font-size: 14.5px;">${clientName}</span>
          </td>
          <td style="padding: 4px 8px; font-weight: bold; text-transform: uppercase; width: 50%; vertical-align: middle; white-space: nowrap;">
            <span style="display: inline-block; width: 85px; font-weight: 800; opacity: 0.85; font-size: 13px;">DATE :</span> <span style="font-weight: 900; font-size: 14.5px;">${dateStr.split('-').reverse().join('-')}</span>
          </td>
        </tr>
        <tr style="border-bottom: 1px solid #000;">
          <td style="border-right: 1px solid #000; padding: 4px 8px; font-weight: bold; text-transform: uppercase; vertical-align: middle; white-space: nowrap;">
            <span style="display: inline-block; width: 85px; font-weight: 800; opacity: 0.85; font-size: 13px;">SITE :</span> <span style="font-weight: 900; font-size: 14.5px;">${siteName}</span>
          </td>
          <td style="padding: 4px 8px; font-weight: bold; text-transform: uppercase; vertical-align: middle; white-space: nowrap;">
            <span style="display: inline-block; width: 85px; font-weight: 800; opacity: 0.85; font-size: 13px;">TYPE :</span> <span style="font-weight: 900; font-size: 14.5px;">${tradeType}</span>
          </td>
        </tr>
        <tr>
          <td style="border-right: 1px solid #000; padding: 4px 8px; font-weight: bold; text-transform: uppercase; vertical-align: middle; white-space: nowrap;">
            <span style="display: inline-block; width: 85px; font-weight: 800; opacity: 0.85; font-size: 13px;">MAISTRY :</span> <span style="font-weight: 900; font-size: 14.5px;">${contractorName}</span>
          </td>
          <td style="padding: 4px 8px; font-weight: bold; text-transform: uppercase; vertical-align: middle; white-space: nowrap;">
            <span style="display: inline-block; width: 85px; font-weight: 800; opacity: 0.85; font-size: 13px;">REF NO :</span> <span style="font-weight: 900; font-size: 14.5px;">${voucherNo}</span>
          </td>
        </tr>
      </table>

      <!-- Main Table -->
      <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000; font-size: 13px; margin-bottom: 6px; table-layout: fixed;">
        <thead>
          <tr style="border-bottom: 1.5px solid #000; background: rgba(0,0,0,0.06); font-size: 12px; font-weight: 800; text-transform: uppercase;">
            <th style="border-right: 1px solid #000; padding: 4px 2px; width: 4%; text-align: center; vertical-align: middle; white-space: nowrap;">#</th>
            <th style="border-right: 1px solid #000; padding: 4px 6px; width: 28%; text-align: left; vertical-align: middle; white-space: nowrap;">PARTICULARS / DESCRIPTION</th>
            <th style="border-right: 1px solid #000; padding: 4px 4px; width: 10%; text-align: right; vertical-align: middle; white-space: nowrap; font-size: 11.5px;">RATE (₹)</th>
            ${dateLabels.map(lbl => `<th style="border-right: 1px solid #000; padding: 4px 1px; width: 5.5%; text-align: center; font-size: 11px; font-weight: 700; vertical-align: middle; white-space: nowrap;">${lbl}</th>`).join('')}
            <th style="border-right: 1px solid #000; padding: 4px 2px; width: 7%; text-align: center; vertical-align: middle; white-space: nowrap; font-size: 12px;">QTY</th>
            <th style="padding: 4px 6px; width: 12.5%; text-align: right; vertical-align: middle; white-space: nowrap; font-size: 12px;">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          ${categoriesHtml}
          <!-- Total Row -->
          <tr style="border-top: 2px solid #000; font-weight: bold; background: rgba(0,0,0,0.05);">
            <td colspan="11" style="border-right: 1px solid #000; padding: 4px 8px; text-align: right; font-size: 14px; text-transform: uppercase; font-weight: 900; vertical-align: middle; white-space: nowrap;">
              TOTAL AMOUNT :
            </td>
            <td style="padding: 4px 6px; text-align: right; font-size: 16.5px; font-weight: 900; font-family: monospace; vertical-align: middle; white-space: nowrap;">
              ₹${Math.round(grandTotal).toLocaleString('en-IN')}
            </td>
          </tr>
          ${commissionHtml}
          <!-- Amount in Words -->
          <tr style="border-top: 1px solid #000; background: rgba(0,0,0,0.02);">
            <td colspan="12" style="padding: 4px 8px; font-size: 12px; vertical-align: middle; white-space: nowrap;">
              <span style="font-weight: 800; text-transform: uppercase; opacity: 0.85; margin-right: 6px; font-size: 12px;">AMOUNT IN WORDS:</span>
              <span style="font-style: italic; font-weight: 800; font-family: monospace; font-size: 13px;">${numberToWords(hasCommission && commPct > 0 ? grandTotal + Math.round(grandTotal * (commPct / 100)) : grandTotal)}</span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Signatures Area (Table format for flawless alignment across all devices and pdf exports) -->
      <table style="width: 100%; border: none; margin-top: 16px; font-size: 12px; font-weight: 800; text-transform: uppercase; border-collapse: collapse;">
        <tr>
          <td style="width: 26%; text-align: center; border: none; padding: 0; vertical-align: top;">
            <div style="border-top: 2px solid #000; margin: 0 10px; padding-top: 4px;">ENGINEER</div>
          </td>
          <td style="width: 11%; border: none; padding: 0;"></td>
          <td style="width: 26%; text-align: center; border: none; padding: 0; vertical-align: top;">
            <div style="border-top: 2px solid #000; margin: 0 10px; padding-top: 4px;">SUPERVISOR</div>
          </td>
          <td style="width: 11%; border: none; padding: 0;"></td>
          <td style="width: 26%; text-align: center; border: none; padding: 0; vertical-align: top;">
            <div style="border-top: 2px solid #000; margin: 0 10px; padding-top: 4px;">RECEIVER</div>
          </td>
        </tr>
      </table>
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
  container.style.width = '790px';
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
            size: landscape;
            margin: 5mm 6mm 5mm 6mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 4px 0 0 0;
            background: #fff;
            color: #000;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
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
