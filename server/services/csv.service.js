const { parse } = require('csv-parse/sync');
const XLSX = require('xlsx');

// Helper to auto-detect form from name suffix
function detectFormFromName(name) {
  if (!name) return 'OTHER';
  const cleanName = name.trim().toUpperCase();
  if (
    /\b(TABS?|TABLETS?)\b/i.test(cleanName) ||
    cleanName.endsWith(' TAB') ||
    cleanName.endsWith(' TABS')
  )
    return 'TAB';
  if (
    /\b(CAPS?|CAPSULES?)\b/i.test(cleanName) ||
    cleanName.endsWith(' CAP') ||
    cleanName.endsWith(' CAPS')
  )
    return 'CAP';
  if (/\b(SYPS?|LIQUIDS?|SUSPENSIONS?|DROPS?)\b/i.test(cleanName) || cleanName.endsWith(' SYP'))
    return 'SYP';
  if (/\b(INJS?|INJECTIONS?)\b/i.test(cleanName) || cleanName.endsWith(' INJ')) return 'INJ';
  if (/\b(GELS?)\b/i.test(cleanName)) return 'GEL';
  if (/\b(CREAMS?|OINTMENTS?)\b/i.test(cleanName)) return 'CREAM';
  if (/\b(POWDERS?)\b/i.test(cleanName)) return 'POWDER';
  if (/\b(DROPS?)\b/i.test(cleanName)) return 'DROP';
  return 'OTHER';
}

// Parse MM/YYYY into Date
function parseExpiryDate(dateStr) {
  if (!dateStr || !dateStr.trim()) return null;
  const match = dateStr.trim().match(/^(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const month = parseInt(match[1], 10);
  const year = parseInt(match[2], 10);
  if (month < 1 || month > 12) return null;
  // Use first day of month
  return new Date(year, month - 1, 1);
}

/**
 * Parses CSV buffer and validates entries
 * @param {Buffer} buffer - CSV file buffer
 * @returns {{ validRows: Array, errors: Array }}
 */
function parseAndValidateCSV(buffer) {
  const errors = [];
  const validRows = [];

  let records;
  try {
    records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
  } catch (err) {
    throw new Error('Failed to parse CSV syntax: ' + err.message);
  }

  // Categories list
  const validCategories = [
    'Tablets & Capsules',
    'Syrups & Liquids',
    'Injections',
    'Surgical & Devices',
    'Vitamins & Supplements',
    'Baby Care',
    'Personal Care',
    'Ayurvedic & Herbal'
  ];

  // Forms list
  const validForms = ['TAB', 'CAP', 'SYP', 'INH', 'GEL', 'CREAM', 'DROP', 'INJ', 'POWDER', 'OTHER'];

  // Rx Types list
  const validRxTypes = ['OTC', 'H', 'NRX', 'H1'];

  records.forEach((record, index) => {
    const rowNum = index + 2; // 1-based index + header row offset
    const rowErrors = [];

    // 1. Name Check
    if (!record.name || !record.name.trim()) {
      rowErrors.push({ row: rowNum, field: 'name', message: 'Name is required' });
    }

    // 2. Brand Check
    if (!record.brand || !record.brand.trim()) {
      rowErrors.push({ row: rowNum, field: 'brand', message: 'Brand is required' });
    }

    // 3. Category Check
    if (!record.category || !record.category.trim()) {
      rowErrors.push({ row: rowNum, field: 'category', message: 'Category is required' });
    } else if (!validCategories.includes(record.category.trim())) {
      rowErrors.push({
        row: rowNum,
        field: 'category',
        message: `Invalid category: "${record.category}". Must be one of the 8 approved categories.`
      });
    }

    // 4. Form check & Auto-detection
    let detectedForm = record.form ? record.form.trim().toUpperCase() : '';
    if (!detectedForm) {
      detectedForm = detectFormFromName(record.name);
    } else if (!validForms.includes(detectedForm)) {
      rowErrors.push({
        row: rowNum,
        field: 'form',
        message: `Invalid form: "${record.form}". Must be one of: ${validForms.join(', ')}`
      });
    }

    // 5. MRP Check
    const mrp = parseFloat(record.mrp);
    if (isNaN(mrp) || mrp <= 0) {
      rowErrors.push({ row: rowNum, field: 'mrp', message: 'MRP must be a positive number' });
    }

    // 6. Selling Price Check
    const sellingPrice = parseFloat(record.sellingPrice);
    if (isNaN(sellingPrice) || sellingPrice <= 0) {
      rowErrors.push({
        row: rowNum,
        field: 'sellingPrice',
        message: 'Selling Price must be a positive number'
      });
    } else if (sellingPrice > mrp) {
      rowErrors.push({
        row: rowNum,
        field: 'sellingPrice',
        message: 'Selling Price cannot be greater than MRP'
      });
    }

    // 7. Rx Type Check
    const rxType = record.rxType ? record.rxType.trim().toUpperCase() : 'OTC';
    if (!validRxTypes.includes(rxType)) {
      rowErrors.push({
        row: rowNum,
        field: 'rxType',
        message: `Invalid rxType: "${record.rxType}". Must be: OTC, H, NRX, or H1`
      });
    }

    // 8. Stock Check
    const stock = parseInt(record.stock, 10);
    if (isNaN(stock) || stock < 0) {
      rowErrors.push({
        row: rowNum,
        field: 'stock',
        message: 'Stock must be a non-negative integer'
      });
    }

    // 9. Expiry Date Check
    let expiryDate = null;
    if (record.expiryDate && record.expiryDate.trim()) {
      expiryDate = parseExpiryDate(record.expiryDate);
      if (!expiryDate) {
        rowErrors.push({
          row: rowNum,
          field: 'expiryDate',
          message: 'Expiry date must be in MM/YYYY format'
        });
      }
    }

    // 10. GST Rate Check
    const gstRate = record.gstRate ? parseInt(record.gstRate, 10) : 12;
    if (![5, 12, 18].includes(gstRate)) {
      rowErrors.push({
        row: rowNum,
        field: 'gstRate',
        message: 'GST rate must be 5%, 12%, or 18%'
      });
    }

    // If row has errors, append to errors list, else push to valid rows
    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      // Compute discount %
      const discountVal = mrp > 0 ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;

      validRows.push({
        name: record.name.trim(),
        brand: record.brand.trim(),
        manufacturer: record.manufacturer ? record.manufacturer.trim() : '',
        composition: record.composition ? record.composition.trim() : '',
        category: record.category.trim(),
        form: detectedForm,
        dosage: record.dosage ? record.dosage.trim() : '',
        mrp,
        sellingPrice,
        discount: discountVal > 0 ? discountVal : 0,
        rxType,
        stock,
        expiryDate,
        batchNumber: record.batchNumber ? record.batchNumber.trim() : '',
        hsnCode: record.hsnCode ? record.hsnCode.trim() : '',
        gstRate,
        rackLocation: record.rackLocation ? record.rackLocation.trim() : '',
        description: record.description ? record.description.trim() : '',
        sideEffects: record.sideEffects ? record.sideEffects.trim() : '',
        storageInstructions: record.storageInstructions ? record.storageInstructions.trim() : ''
      });
    }
  });

  return { validRows, errors };
}

/**
 * Parses Purchase Order buffer (XLSX grouped-report format, or flat CSV)
 *
 * XLSX format (billing software grouped report):
 *   - Rows 1–7: report header — skipped
 *   - Row 8: column labels — skipped
 *   - Row 9: empty — skipped
 *   - Repeating 3-row block per product:
 *       [Product name row]  col A starts with ">"  e.g. "> 1-AL SYP"
 *       [Supplier row]      col A starts with "-"  e.g. "- BHAGAT SINGH & SONS 09AWDPS2837E1ZE"
 *                           col E=Qty  col F=Free  col G=NetAmt
 *       [Product Total row] col B = "Product Total" — skip
 *
 * One product may have multiple supplier rows — quantities and amounts are summed.
 *
 * CSV format (flat table):
 *   Headers: Product name, Supplier/Party name, Supplier GSTIN,
 *            Quantity purchased, Free quantity, Net amount paid
 *
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Uploaded file name to detect extension
 * @returns {{ validRows: Array, errors: Array }}
 */
function parseAndValidatePurchaseOrderFile(buffer, filename = '') {
  const errors = [];

  const isExcel =
    filename.toString().toLowerCase().endsWith('.xlsx') ||
    filename.toString().toLowerCase().endsWith('.xls');

  // ── XLSX branch: grouped billing-software report ──────────────────────────
  if (isExcel) {
    let rows = [];
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      // Parse as array-of-arrays so we control column indexing directly
      rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    } catch (err) {
      throw new Error('Failed to parse Excel PO sheet: ' + err.message);
    }

    // productMap accumulates quantities when a product has multiple supplier rows
    const productMap = {}; // key = lower-cased name → { name, brand, gstin, qty, free, amt }
    let currentProduct = null;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const colA = String(row[0] || '').trim();
      const colB = String(row[1] || '').trim();

      // ── Product name row ──────────────────────────────────────────────────
      if (colA.startsWith('>')) {
        currentProduct = colA.replace(/^>\s*/, '').trim();
        continue;
      }

      // ── Supplier row ──────────────────────────────────────────────────────
      if (colA.startsWith('-')) {
        if (!currentProduct) {
          errors.push({ row: i + 1, message: 'Supplier row found without a preceding product name row' });
          continue;
        }

        // Parse GSTIN (always the last 15-char alphanumeric word, if present)
        const supplierText = colA.replace(/^-\s*/, '').trim();
        const parts = supplierText.split(/\s+/);
        const lastWord = parts[parts.length - 1];
        const gstin = /^[0-9A-Z]{15}$/i.test(lastWord) ? lastWord.toUpperCase() : '';
        const supplierName = gstin
          ? parts.slice(0, -1).join(' ').trim()
          : supplierText;

        // Column indices: E=4, F=5, G=6 (0-based)
        const qty     = Math.round(parseFloat(row[4]) || 0);
        const free    = Math.round(parseFloat(row[5]) || 0);
        const netAmt  = parseFloat(row[6]) || 0;

        const key = currentProduct.toLowerCase();
        if (productMap[key]) {
          // Accumulate quantities for the same product across multiple suppliers
          productMap[key].quantityPurchased += qty;
          productMap[key].freeQuantity      += free;
          productMap[key].netAmountPaid     += netAmt;
          // Append additional supplier names
          if (supplierName && !productMap[key].brand.includes(supplierName)) {
            productMap[key].brand += `, ${supplierName}`;
          }
        } else {
          productMap[key] = {
            name:              currentProduct,
            brand:             supplierName || 'Generic',
            gstin,
            quantityPurchased: qty,
            freeQuantity:      free,
            netAmountPaid:     netAmt
          };
        }

        // Do NOT reset currentProduct — the same product may have more supplier rows
        continue;
      }

      // ── Product Total row — skip ───────────────────────────────────────────
      if (colB === 'Product Total') {
        // Reset currentProduct after the subtotal row closes the block
        currentProduct = null;
        continue;
      }

      // All other rows (report header, empty lines, grand total) — skip
    }

    // Convert map to flat array; filter out rows where total qty is 0
    const validRows = Object.values(productMap).filter(r => r.quantityPurchased + r.freeQuantity > 0);

    if (validRows.length === 0 && errors.length === 0) {
      errors.push({ row: 0, message: 'No valid product rows found. Check that the file is the correct billing software export format.' });
    }

    return { validRows, errors };
  }

  // ── CSV branch: flat table with column headers ────────────────────────────
  let records = [];
  try {
    records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
  } catch (err) {
    throw new Error('Failed to parse CSV syntax: ' + err.message);
  }

  const HEADER_MAPPINGS = {
    name:         ['productname', 'name', 'prodname', 'product', 'item', 'itemname'],
    supplier:     ['supplierpartyname', 'suppliername', 'partyname', 'supplier', 'party', 'supplierparty'],
    gstin:        ['suppliergstin', 'gstin', 'suppliergst'],
    quantity:     ['quantitypurchased', 'qtypurchased', 'quantity', 'qty', 'purchasedquantity'],
    freeQuantity: ['freequantity', 'freeqty'],
    amountPaid:   ['netamountpaid', 'netamount', 'amountpaid', 'amount']
  };

  function normalizeKey(key) {
    return key.toString().toLowerCase().replace(/[^a-z0-9]/gi, '');
  }

  const csvValidRows = [];

  records.forEach((record, index) => {
    const rowNum = index + 2;
    const rowErrors = [];

    // Map raw column headers to standard keys
    const rowData = {};
    Object.keys(record).forEach(key => {
      const normKey = normalizeKey(key);
      for (const [stdKey, aliases] of Object.entries(HEADER_MAPPINGS)) {
        if (aliases.includes(normKey)) {
          rowData[stdKey] = record[key];
        }
      }
    });

    const name = rowData.name ? rowData.name.toString().trim() : '';
    if (!name) {
      rowErrors.push({ row: rowNum, field: 'Product name', message: 'Product name is required' });
    }

    const supplier = rowData.supplier ? rowData.supplier.toString().trim() : 'Generic';
    const gstin    = rowData.gstin    ? rowData.gstin.toString().trim()    : '';

    let quantity = 0;
    if (rowData.quantity !== undefined && rowData.quantity !== '') {
      quantity = parseInt(rowData.quantity, 10);
      if (isNaN(quantity) || quantity < 0) {
        rowErrors.push({ row: rowNum, field: 'Quantity purchased', message: 'Must be a non-negative integer' });
      }
    } else {
      rowErrors.push({ row: rowNum, field: 'Quantity purchased', message: 'Quantity purchased is required' });
    }

    let freeQty = 0;
    if (rowData.freeQuantity !== undefined && rowData.freeQuantity !== '') {
      freeQty = parseInt(rowData.freeQuantity, 10);
      if (isNaN(freeQty) || freeQty < 0) {
        rowErrors.push({ row: rowNum, field: 'Free quantity', message: 'Must be a non-negative integer' });
      }
    }

    let amountPaid = 0;
    if (rowData.amountPaid !== undefined && rowData.amountPaid !== '') {
      amountPaid = parseFloat(rowData.amountPaid);
      if (isNaN(amountPaid) || amountPaid < 0) {
        rowErrors.push({ row: rowNum, field: 'Net amount paid', message: 'Must be a non-negative number' });
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      csvValidRows.push({
        name,
        brand:             supplier,
        gstin,
        quantityPurchased: quantity,
        freeQuantity:      freeQty,
        netAmountPaid:     amountPaid
      });
    }
  });

  return { validRows: csvValidRows, errors };
}

module.exports = {
  parseAndValidateCSV,
  parseAndValidatePurchaseOrderFile,
  detectFormFromName
};
