import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { ArrowLeft, Download, AlertCircle, CheckCircle, FileSpreadsheet, Loader2, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatCurrency';

export default function CsvImport() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [importMode, setImportMode] = useState('catalogue');

  // Preview data returned from API
  const [previewData, setPreviewData] = useState(null);
  
  // Final ingest response data from API
  const [resultData, setResultData] = useState(null);

  const handleLoadPreview = useCallback(async (selectedFile, activeMode = importMode) => {
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await api.post(`/api/products/import-csv?preview=true&importMode=${activeMode}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.data && response.data.success) {
        setPreviewData(response.data.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to parse file preview. Please verify structure.');
    } finally {
      setLoading(false);
    }
  }, [importMode]);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError(`${importMode === 'purchase_order' ? 'Excel/CSV' : 'CSV'} file size exceeds the 5MB maximum limit.`);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setPreviewData(null);
      setResultData(null);
      // Automatically load preview
      handleLoadPreview(selectedFile, importMode);
    }
  }, [importMode, handleLoadPreview]);

  const acceptConfig = importMode === 'purchase_order'
    ? {
        'text/csv': ['.csv'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'application/vnd.ms-excel': ['.xls']
      }
    : {
        'text/csv': ['.csv']
      };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptConfig,
    multiple: false
  });

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get(`/api/products/import-template?importMode=${importMode}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = importMode === 'purchase_order' ? 'pankaj_purchase_order_template.csv' : 'pankaj_stock_import_template.csv';
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Failed to download template:', err);
      alert('Failed to download template.');
    }
  };

  const handleConfirmImport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post(`/api/products/import-csv?preview=false&importMode=${importMode}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.data && response.data.success) {
        setResultData(response.data.data);
        setPreviewData(null);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'An error occurred during final stock import.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link to="/admin/products" className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:text-teal-700 hover:border-teal-100 transition-colors bg-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-black text-teal-900">Bulk Stock Spreadsheet Import</h1>
          <p className="text-xs text-gray-500 font-semibold mt-0.5">
            Ingest and merge distributor sheets or purchase order billing exports.
          </p>
        </div>
      </div>

      {/* Import Mode Tabs */}
      <div className="flex p-1 rounded-xl mb-8 max-w-md shadow-inner border border-gray-200 bg-gray-100">
        <button
          onClick={() => {
            if (loading) return;
            setImportMode('catalogue');
            setFile(null);
            setPreviewData(null);
            setResultData(null);
            setError(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-extrabold rounded-lg transition-all ${
            importMode === 'catalogue'
              ? 'bg-white text-teal-850 shadow-sm border border-gray-200/20'
              : 'text-gray-500 hover:text-teal-850'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Catalogue Import
        </button>
        <button
          onClick={() => {
            if (loading) return;
            setImportMode('purchase_order');
            setFile(null);
            setPreviewData(null);
            setResultData(null);
            setError(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-extrabold rounded-lg transition-all ${
            importMode === 'purchase_order'
              ? 'bg-white text-teal-850 shadow-sm border border-gray-200/20'
              : 'text-gray-500 hover:text-teal-850'
          }`}
        >
          <Sparkles className="w-4 h-4 animate-pulse text-teal-600" /> Purchase Order Import
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-2 mb-6 text-sm text-red-800 font-medium animate-fadeIn">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Warning Banners */}
      {previewData && previewData.warning && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg flex items-start gap-2.5 text-sm text-amber-900 font-semibold animate-fadeIn mb-6 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 animate-bounce" />
          <div className="space-y-1">
            <span className="font-extrabold uppercase text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded tracking-wider">Pricing Note</span>
            <p className="mt-1 leading-relaxed text-xs">{previewData.warning}</p>
          </div>
        </div>
      )}

      {resultData && resultData.warning && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg flex items-start gap-2.5 text-sm text-amber-900 font-semibold animate-fadeIn mb-6 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 animate-bounce" />
          <div className="space-y-1">
            <span className="font-extrabold uppercase text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded tracking-wider">Warning</span>
            <p className="mt-1 leading-relaxed text-xs">{resultData.warning}</p>
          </div>
        </div>
      )}

      {/* Main Container Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Upload zone and Instructions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-extrabold text-teal-900 mb-3 uppercase tracking-wider">
              1. Setup and Guidelines
            </h3>
            
            <p className="text-xs text-gray-500 leading-relaxed mb-4 font-medium">
              {importMode === 'purchase_order'
                ? 'Select a Purchase Order Excel file (.xlsx, .xls) or CSV exported from the pharmacy billing software. Stock increases automatically by (Quantity purchased + Free quantity). New items are created as Inactive.'
                : 'Catalogue spreadsheet must match standard headers. Standardize forms and categories to allow clean merging. Active items will show up immediately.'}
            </p>

            <button
              onClick={handleDownloadTemplate}
              className="w-full btn-teal-outline flex items-center justify-center gap-2 text-xs py-2 px-4 shadow-xs"
            >
              <Download className="w-4 h-4" /> Download {importMode === 'purchase_order' ? 'PO' : 'Catalogue'} Template
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-extrabold text-teal-900 mb-3 uppercase tracking-wider">
              2. Select File
            </h3>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragActive
                  ? 'border-teal-500 bg-teal-50/30'
                  : file
                  ? 'border-teal-300 bg-teal-50/10'
                  : 'border-gray-300 hover:border-teal-400 bg-gray-50/50 hover:bg-white'
              }`}
            >
              <input {...getInputProps()} />
              <FileSpreadsheet className={`w-10 h-10 mx-auto mb-2.5 ${file ? 'text-teal-600' : 'text-gray-400'}`} />
              
              {file ? (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-teal-900 break-all">{file.name}</p>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                    {(file.size / 1024).toFixed(1)} KB &bull; Change file
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-700">
                    {importMode === 'purchase_order' ? 'Drag & drop Excel (.xlsx, .xls) or CSV here' : 'Drag & drop stock CSV here'}
                  </p>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                    or click to browse folder (Max 5MB)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Preview & Diagnostic Reports */}
        <div className="lg:col-span-2 space-y-6">
          
          {loading && (
            <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-sm text-gray-400 flex flex-col items-center justify-center shadow-xs">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-3" />
              Parsing file buffer and checking validation rules...
            </div>
          )}

          {/* Result Panel (Successfully Ingested) */}
          {resultData && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs animate-fadeIn space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-teal-900">Import Successfully Completed</h3>
                  <p className="text-xs text-gray-500 font-semibold">Bulk stock changes have been applied to MongoDB Atlas.</p>
                </div>
              </div>

              {/* Stats card */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-teal-50/50 border border-teal-100/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-teal-850">{resultData.imported}</p>
                  <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider mt-0.5">New Products</p>
                </div>
                <div className="bg-teal-50/50 border border-teal-100/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-teal-850">{resultData.updated}</p>
                  <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider mt-0.5">Updated Stock</p>
                </div>
                <div className="bg-red-50/30 border border-red-100/40 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-red-700">{resultData.skipped}</p>
                  <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-0.5">Skipped / Failed</p>
                </div>
              </div>

              {/* Diagnostics inside import */}
              {resultData.errors && resultData.errors.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider mb-2.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Skipped Diagnostic Report
                  </h4>
                  <div className="max-h-40 overflow-y-auto border border-red-100 rounded-lg divide-y divide-red-50/40 text-xs">
                    {resultData.errors.map((err, idx) => (
                      <div key={idx} className="p-2.5 bg-red-50/20 text-red-700 flex justify-between font-semibold">
                        <span>Row {err.row}: Field <span className="underline font-bold">{err.field}</span></span>
                        <span>{err.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Link to="/admin/products" className="btn-teal py-2 px-6 font-semibold shadow-xs">
                  Return to Inventory
                </Link>
              </div>
            </div>
          )}

          {/* Preview Panel */}
          {previewData && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs animate-fadeIn space-y-6">
              <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-600" />
                  <h3 className="text-sm font-extrabold text-teal-900 uppercase tracking-wider">Spreadsheet Diagnostic Preview</h3>
                </div>
                <span className="bg-teal-50 border border-teal-100 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  Ingestion Validated
                </span>
              </div>

              {/* Ingestion Stats card */}
              {importMode === 'purchase_order' ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-teal-50/50 border border-teal-100/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-teal-850">{previewData.newCount}</p>
                    <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider mt-0.5">New Products</p>
                  </div>
                  <div className="bg-teal-50/50 border border-teal-100/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-teal-850">{previewData.updatedCount}</p>
                    <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider mt-0.5">Matched & Updated Stock</p>
                  </div>
                  <div className="bg-red-50/30 border border-red-100/40 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-red-700">{previewData.errorCount}</p>
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-0.5">Errors Detected</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-teal-50/50 border border-teal-100/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-teal-850">{previewData.newCount}</p>
                    <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider mt-0.5">Valid Rows Ready to Ingest</p>
                  </div>
                  <div className="bg-red-50/30 border border-red-100/40 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-red-700">{previewData.errorCount}</p>
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-0.5">Validation Errors Detected</p>
                  </div>
                </div>
              )}

              {/* Diagnostics list */}
              {previewData.errors && previewData.errors.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider mb-2.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 animate-pulse" /> Urgent: Fix These Errors and Re-upload
                  </h4>
                  <div className="max-h-48 overflow-y-auto border border-red-100 rounded-lg divide-y divide-red-50/40 text-xs">
                    {previewData.errors.map((err, idx) => (
                      <div key={idx} className="p-2.5 bg-red-50/20 text-red-700 flex justify-between font-semibold">
                        <span>Row {err.row}: Field <span className="underline font-bold">{err.field}</span></span>
                        <span>{err.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Valid Rows Preview Table (Max first 10 rows) */}
              {previewData.previewRows && previewData.previewRows.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider mb-2.5">
                    Sample Ingestion Data (First 10 Rows)
                  </h4>
                  <div className="overflow-x-auto border border-gray-250 rounded-lg">
                    {importMode === 'purchase_order' ? (
                      <table className="w-full border-collapse text-left text-xs text-gray-500">
                        <thead className="bg-gray-55/60 border-b border-gray-200 font-bold text-teal-900">
                          <tr>
                            <th className="p-3">Product Name</th>
                            <th className="p-3">Supplier / Party</th>
                            <th className="p-3">Supplier GSTIN</th>
                            <th className="p-3 text-right">Qty Purchased</th>
                            <th className="p-3 text-right">Free Qty</th>
                            <th className="p-3 text-right">Net Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {previewData.previewRows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-teal-50/5">
                              <td className="p-3 font-semibold text-gray-800">
                                {row.name}
                              </td>
                              <td className="p-3 font-medium text-gray-600">
                                {row.brand || 'Generic'}
                              </td>
                              <td className="p-3 text-xs text-gray-400 font-mono">
                                {row.gstin || 'N/A'}
                              </td>
                              <td className="p-3 text-right font-bold text-gray-700">
                                {row.quantityPurchased}
                              </td>
                              <td className="p-3 text-right font-medium text-teal-600">
                                +{row.freeQuantity}
                              </td>
                              <td className="p-3 text-right font-bold text-teal-850">
                                {formatCurrency(row.netAmountPaid)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <table className="w-full border-collapse text-left text-xs text-gray-500">
                        <thead className="bg-gray-55/60 border-b border-gray-200 font-bold text-teal-900">
                          <tr>
                            <th className="p-3">Medicine Specifications</th>
                            <th className="p-3">Category</th>
                            <th className="p-3 text-right">Pricing (MRP/Sell)</th>
                            <th className="p-3 text-center">Stock</th>
                            <th className="p-3 text-center">Form</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {previewData.previewRows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-teal-50/5">
                              <td className="p-3 font-semibold text-gray-800">
                                <div className="flex flex-col">
                                  <span>{row.name}</span>
                                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                    {row.brand} &bull; {row.batchNumber || 'No Batch'}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3 font-medium">{row.category}</td>
                              <td className="p-3 text-right">
                                <div className="flex flex-col items-end">
                                  <span className="font-bold text-teal-800">{formatCurrency(row.sellingPrice)}</span>
                                  <span className="text-[10px] text-gray-400 line-through">{formatCurrency(row.mrp)}</span>
                                </div>
                              </td>
                              <td className="p-3 text-center font-bold text-gray-700">{row.stock}</td>
                              <td className="p-3 text-center font-bold text-gray-400">{row.form}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* Ingest Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setFile(null);
                    setPreviewData(null);
                  }}
                  className="btn-white py-2.5 px-6 font-semibold"
                >
                  Discard File
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={loading || (previewData.newCount === 0 && previewData.updatedCount === 0 && previewData.totalRows === 0)}
                  className="btn-teal py-2.5 px-6 font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Ingesting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" /> Confirm & Ingest Stock
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!previewData && !resultData && (
            <div className="bg-white border border-gray-200 rounded-xl p-16 text-center text-sm text-gray-400 flex flex-col items-center justify-center shadow-xs">
              <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-base font-bold text-teal-900 mb-1.5">No File Loaded</h3>
              <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                {importMode === 'purchase_order'
                  ? 'Drag a Purchase Order Excel (.xlsx, .xls) or CSV sheet inside the uploader to review parsing diagnostics, match existing products, and preview stock updates.'
                  : 'Drag a CSV sheet of medicines inside the uploader to review parsing diagnostics, check categories compliance, and verify row updates.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
