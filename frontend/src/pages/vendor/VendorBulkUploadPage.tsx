import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, Download, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { vendorApi } from '../../lib/api';
import { toast } from 'react-hot-toast';

interface PreviewProduct {
  name: string;
  category: string;
  price: number;
  mrp: number;
  stock: number;
  description: string;
  unit: string;
  error?: string;
}

export const VendorBulkUploadPage: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewProduct[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{ success: number; failed: number } | null>(null);

  const generateTemplate = () => {
    const headers = ['Name', 'Category', 'Price', 'MRP', 'Stock', 'Description', 'Unit'];
    const sampleRow = ['Organic Red Tomatoes', 'Vegetables', '40', '50', '100', 'Fresh farm tomatoes', '1 kg'];
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), sampleRow.join(',')].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "shopsyy_product_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    const result: PreviewProduct[] = [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(',').map(v => v.trim());
      
      const rowData: Record<string, string> = {};
      headers.forEach((header, index) => {
        rowData[header] = values[index] || '';
      });

      const name = rowData['name'] || '';
      const category = rowData['category'] || '';
      const price = parseFloat(rowData['price'] || '0');
      const mrp = parseFloat(rowData['mrp'] || '0');
      const stock = parseInt(rowData['stock'] || '0', 10);
      const description = rowData['description'] || '';
      const unit = rowData['unit'] || '1 pc';

      let error = '';
      if (!name) error += 'Name is required. ';
      if (!category) error += 'Category is required. ';
      if (isNaN(price) || price <= 0) error += 'Invalid Price. ';
      if (isNaN(mrp) || mrp < price) error += 'MRP cannot be less than Price. ';
      if (isNaN(stock) || stock < 0) error += 'Invalid Stock. ';

      result.push({
        name, category, price, mrp, stock, description, unit,
        error: error || undefined
      });
    }
    setPreviewData(result);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        const reader = new FileReader();
        reader.onload = (event) => {
          parseCSV(event.target?.result as string);
        };
        reader.readAsText(selectedFile);
      } else {
        toast.error('Only CSV files are allowed');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        parseCSV(event.target?.result as string);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (previewData.length === 0) return;
    const validProducts = previewData.filter(p => !p.error);
    if (validProducts.length === 0) {
      toast.error('No valid products to upload');
      return;
    }

    setUploading(true);
    setProgress(0);
    let successCount = 0;
    let failedCount = previewData.length - validProducts.length;

    for (let i = 0; i < validProducts.length; i++) {
      const prod = validProducts[i];
      try {
        await vendorApi.products.create({
          name: prod.name,
          category: prod.category,
          price: prod.price,
          mrp: prod.mrp,
          stock: prod.stock,
          description: prod.description,
          unit: prod.unit,
          images: [],
          isAvailable: true,
          tags: []
        });
        successCount++;
      } catch (err) {
        failedCount++;
      }
      setProgress(Math.round(((i + 1) / validProducts.length) * 100));
    }

    setUploading(false);
    setUploadResult({ success: successCount, failed: failedCount });
    toast.success(`Successfully uploaded ${successCount} products!`);
  };

  const resetPage = () => {
    setFile(null);
    setPreviewData([]);
    setUploadResult(null);
    setProgress(0);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] border shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-0"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-blue-950 tracking-tight">Bulk Product Upload</h1>
          <p className="text-sm text-gray-500 mt-1">Upload multiple products simultaneously using a CSV spreadsheet.</p>
        </div>
        <button
          onClick={generateTemplate}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Download className="w-4 h-4" /> Download Template CSV
        </button>
      </div>

      {!file && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-3 border-dashed rounded-[2rem] p-12 text-center transition-all bg-white shadow-sm ${
            dragActive ? 'border-orange-500 bg-orange-50/50' : 'border-gray-200'
          }`}
        >
          <Upload className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-lg font-bold text-gray-700 mb-1">Drag and drop your spreadsheet here</p>
          <p className="text-sm text-gray-400 mb-6">Supported format: .csv only</p>
          <label className="inline-flex items-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl cursor-pointer transition-colors shadow-sm">
            Browse Files
            <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
      )}

      {file && !uploadResult && (
        <div className="bg-white rounded-[2rem] border p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-orange-500" />
              <div>
                <p className="font-bold text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB • {previewData.length} records</p>
              </div>
            </div>
            <button
              onClick={resetPage}
              disabled={uploading}
              className="text-sm font-bold text-red-500 hover:underline"
            >
              Remove
            </button>
          </div>

          {uploading ? (
            <div className="py-8 text-center space-y-4">
              <RefreshCw className="w-10 h-10 mx-auto text-orange-500 animate-spin" />
              <p className="font-bold text-gray-700">Uploading catalogue... {progress}%</p>
              <div className="w-full bg-gray-150 h-2 rounded-full max-w-md mx-auto overflow-hidden border">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          ) : (
            <>
              <div className="max-h-[350px] overflow-auto border rounded-xl">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-gray-50 text-gray-600 border-b sticky top-0">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Row</th>
                      <th className="px-4 py-3 font-semibold">Name</th>
                      <th className="px-4 py-3 font-semibold">Category</th>
                      <th className="px-4 py-3 font-semibold">Price</th>
                      <th className="px-4 py-3 font-semibold">MRP</th>
                      <th className="px-4 py-3 font-semibold">Stock</th>
                      <th className="px-4 py-3 font-semibold">Status/Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {previewData.map((prod, index) => (
                      <tr key={index} className={prod.error ? 'bg-red-50/50' : ''}>
                        <td className="px-4 py-3 font-medium text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{prod.name || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{prod.category || '-'}</td>
                        <td className="px-4 py-3 font-bold">₹{prod.price}</td>
                        <td className="px-4 py-3 text-gray-500">₹{prod.mrp}</td>
                        <td className="px-4 py-3">{prod.stock}</td>
                        <td className="px-4 py-3">
                          {prod.error ? (
                            <span className="flex items-center gap-1 text-red-600 font-medium text-xs">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {prod.error}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-emerald-600 font-medium text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Valid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={resetPage}
                  className="px-6 py-3 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Upload Products
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {uploadResult && (
        <div className="bg-white rounded-[2rem] border p-12 text-center space-y-6 max-w-md mx-auto shadow-sm">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-100 shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <div>
            <h3 className="text-xl font-black text-blue-950">Upload Completed!</h3>
            <p className="text-sm text-gray-500 mt-2">
              Import processing has completed successfully.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border">
            <div className="text-center">
              <span className="block text-2xl font-black text-emerald-600">{uploadResult.success}</span>
              <span className="text-xs text-gray-500 font-medium">Uploaded Successfully</span>
            </div>
            <div className="text-center border-l">
              <span className="block text-2xl font-black text-red-500">{uploadResult.failed}</span>
              <span className="text-xs text-gray-500 font-medium">Skipped/Failed</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={resetPage}
              className="flex-1 py-3 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
            >
              Upload More
            </button>
            <Link
              to="/vendor/products"
              className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Go to Products
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
