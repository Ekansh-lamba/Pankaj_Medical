const { parse } = require('csv-parse/sync');

// Helper to auto-detect form from name suffix
function detectFormFromName(name) {
  if (!name) return 'OTHER';
  const cleanName = name.trim().toUpperCase();
  if (/\b(TABS?|TABLETS?)\b/i.test(cleanName) || cleanName.endsWith(' TAB') || cleanName.endsWith(' TABS')) return 'TAB';
  if (/\b(CAPS?|CAPSULES?)\b/i.test(cleanName) || cleanName.endsWith(' CAP') || cleanName.endsWith(' CAPS')) return 'CAP';
  if (/\b(SYPS?|LIQUIDS?|SUSPENSIONS?|DROPS?)\b/i.test(cleanName) || cleanName.endsWith(' SYP')) return 'SYP';
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
    'Tablets & Capsules', 'Syrups & Liquids', 'Injections',
    'Surgical & Devices', 'Vitamins & Supplements',
    'Baby Care', 'Personal Care', 'Ayurvedic & Herbal'
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
      rowErrors.push({ row: rowNum, field: 'category', message: `Invalid category: "${record.category}". Must be one of the 8 approved categories.` });
    }

    // 4. Form check & Auto-detection
    let detectedForm = record.form ? record.form.trim().toUpperCase() : '';
    if (!detectedForm) {
      detectedForm = detectFormFromName(record.name);
    } else if (!validForms.includes(detectedForm)) {
      rowErrors.push({ row: rowNum, field: 'form', message: `Invalid form: "${record.form}". Must be one of: ${validForms.join(', ')}` });
    }

    // 5. MRP Check
    const mrp = parseFloat(record.mrp);
    if (isNaN(mrp) || mrp <= 0) {
      rowErrors.push({ row: rowNum, field: 'mrp', message: 'MRP must be a positive number' });
    }

    // 6. Selling Price Check
    const sellingPrice = parseFloat(record.sellingPrice);
    if (isNaN(sellingPrice) || sellingPrice <= 0) {
      rowErrors.push({ row: rowNum, field: 'sellingPrice', message: 'Selling Price must be a positive number' });
    } else if (sellingPrice > mrp) {
      rowErrors.push({ row: rowNum, field: 'sellingPrice', message: 'Selling Price cannot be greater than MRP' });
    }

    // 7. Rx Type Check
    const rxType = record.rxType ? record.rxType.trim().toUpperCase() : 'OTC';
    if (!validRxTypes.includes(rxType)) {
      rowErrors.push({ row: rowNum, field: 'rxType', message: `Invalid rxType: "${record.rxType}". Must be: OTC, H, NRX, or H1` });
    }

    // 8. Stock Check
    const stock = parseInt(record.stock, 10);
    if (isNaN(stock) || stock < 0) {
      rowErrors.push({ row: rowNum, field: 'stock', message: 'Stock must be a non-negative integer' });
    }

    // 9. Expiry Date Check
    let expiryDate = null;
    if (record.expiryDate && record.expiryDate.trim()) {
      expiryDate = parseExpiryDate(record.expiryDate);
      if (!expiryDate) {
        rowErrors.push({ row: rowNum, field: 'expiryDate', message: 'Expiry date must be in MM/YYYY format' });
      }
    }

    // 10. GST Rate Check
    const gstRate = record.gstRate ? parseInt(record.gstRate, 10) : 12;
    if (![5, 12, 18].includes(gstRate)) {
      rowErrors.push({ row: rowNum, field: 'gstRate', message: 'GST rate must be 5%, 12%, or 18%' });
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

module.exports = { parseAndValidateCSV };
