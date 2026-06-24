import React, { useState, useRef } from 'react';
import { Upload, Download, CheckCircle, XCircle, AlertCircle, FileSpreadsheet, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

interface BulkResult {
  updated: number;
  failed: number;
  errors: string[];
}

const BulkStock: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (!f.name.endsWith('.csv')) {
        toast.error('Please upload a CSV file');
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setFile(f);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/vendor/products/bulk-stock', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data.data);
      toast.success(`Updated ${res.data.data.updated} products`);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const downloadSample = () => {
    const csv = 'product_id,stock,price,groupPrice,isActive\nabc123,50,999,899,true\ndef456,100,499,449,true\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-stock-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-artz font-bold text-navy">Bulk Stock Update</h1>
        <button onClick={downloadSample} className="flex items-center gap-2 bg-white text-navy border border-navy/20 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-navy/5 transition-colors">
          <Download size={16} /> Download Sample CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-teal/10 rounded-xl flex items-center justify-center">
            <FileSpreadsheet size={24} className="text-teal" />
          </div>
          <div>
            <h2 className="font-artz font-bold text-navy">Upload CSV File</h2>
            <p className="text-xs text-slate-500">Update stock, price, and status for multiple products at once</p>
          </div>
        </div>

        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-teal/50 transition-colors cursor-pointer" onClick={() => fileRef.current?.click()}>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          {file ? (
            <div>
              <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
              <p className="text-sm font-medium text-slate-700">{file.name}</p>
              <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ''; }} className="text-xs text-red-500 hover:underline mt-2">Remove</button>
            </div>
          ) : (
            <div>
              <Upload size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm text-slate-500">Drop your CSV here or click to browse</p>
              <p className="text-xs text-slate-400 mt-1">Maximum 5MB, up to 1000 rows</p>
            </div>
          )}
        </div>

        <div className="mt-4 p-4 bg-slate-50 rounded-xl">
          <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">CSV Format</h3>
          <p className="text-xs text-slate-500">Required columns: <code className="bg-slate-200 px-1 rounded text-xs">product_id</code></p>
          <p className="text-xs text-slate-500">Optional columns: <code className="bg-slate-200 px-1 rounded text-xs">stock</code>, <code className="bg-slate-200 px-1 rounded text-xs">price</code>, <code className="bg-slate-200 px-1 rounded text-xs">groupPrice</code>, <code className="bg-slate-200 px-1 rounded text-xs">isActive</code></p>
        </div>

        <button onClick={handleUpload} disabled={!file || uploading} className="mt-4 w-full flex items-center justify-center gap-2 bg-teal text-white px-6 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {uploading ? 'Uploading...' : 'Upload & Update Stock'}
        </button>
      </div>

      {result && (
        <div className={`bg-white rounded-2xl border p-6 shadow-sm ${result.failed > 0 ? 'border-amber-200' : 'border-green-200'}`}>
          <h2 className="font-artz font-bold text-navy mb-4">Upload Results</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <CheckCircle size={24} className="mx-auto mb-1 text-green-500" />
              <p className="text-2xl font-bold text-green-600">{result.updated}</p>
              <p className="text-xs text-green-600">Updated</p>
            </div>
            <div className={`rounded-xl p-4 text-center ${result.failed > 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
              {result.failed > 0 ? <XCircle size={24} className="mx-auto mb-1 text-red-500" /> : <CheckCircle size={24} className="mx-auto mb-1 text-slate-400" />}
              <p className="text-2xl font-bold text-red-600">{result.failed}</p>
              <p className="text-xs text-red-600">Failed</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1"><AlertCircle size={12} /> Errors</h3>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {result.errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-500 bg-red-50 px-3 py-1 rounded">{err}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkStock;
