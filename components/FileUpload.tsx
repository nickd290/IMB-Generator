import React, { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, FileSpreadsheet, AlertCircle, TableProperties, ArrowRight, RotateCcw } from 'lucide-react';

interface Props {
  onDataLoaded: (data: string[]) => void;
  isProcessing: boolean;
}

interface ColumnMapping {
  street: number;
  city: number;
  state: number;
  zip: number;
  plus4: number;
}

export const FileUpload: React.FC<Props> = ({ onDataLoaded, isProcessing }) => {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({ street: -1, city: -1, state: -1, zip: -1, plus4: -1 });
  const [isMapping, setIsMapping] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      
      // Get data as array of arrays
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      
      if (data.length > 0) {
        const headerRow = data[0].map(String);
        const bodyRows = data.slice(1);
        
        setHeaders(headerRow);
        setRawData(bodyRows);
        
        // Try auto-detect mapping
        const newMapping = { street: -1, city: -1, state: -1, zip: -1, plus4: -1 };
        
        headerRow.forEach((h, idx) => {
            const lower = h.toLowerCase();
            if (lower.includes('street') || lower.includes('address') || lower.includes('addr') || lower.includes('line 1')) newMapping.street = idx;
            else if (lower.includes('city') || lower.includes('town')) newMapping.city = idx;
            else if (lower.includes('state') || lower.includes('province') || lower === 'st') newMapping.state = idx;
            else if ((lower.includes('zip') || lower.includes('postal') || lower.includes('code')) && !lower.includes('plus') && !lower.includes('+')) newMapping.zip = idx;
            else if (lower.includes('plus') || lower.includes('+4') || lower.includes('add-on') || lower.includes('addon')) newMapping.plus4 = idx;
        });

        // If we couldn't find a specific street column but only have one column, assume it's the full address
        if (newMapping.street === -1 && headerRow.length === 1) {
            newMapping.street = 0;
        }

        setMapping(newMapping);
        setIsMapping(true);
      }
    };
    reader.readAsBinaryString(file);
  }, []);

  const handleProcessMapping = () => {
      const formattedAddresses: string[] = [];
      
      rawData.forEach(row => {
          const getValue = (idx: number) => idx > -1 ? (row[idx] || '') : '';

          const street = getValue(mapping.street);
          const city = getValue(mapping.city);
          const state = getValue(mapping.state);
          const zip = getValue(mapping.zip);
          const plus4 = getValue(mapping.plus4);

          // Only process if we have at least a street/address part
          if (street) {
              // Construct a single string for the AI to parse
              // If plus4 is present, we append it to zip if zip exists, or just list it
              let zipStr = zip;
              if (plus4) {
                  zipStr = zip ? `${zip}-${plus4}` : `ZIP+4:${plus4}`;
              }

              const fullStr = [street, city, state, zipStr].filter(Boolean).join(', ');
              formattedAddresses.push(fullStr);
          }
      });

      onDataLoaded(formattedAddresses);
      setIsMapping(false);
      setHeaders([]);
      setRawData([]);
  };

  const resetUpload = () => {
      setIsMapping(false);
      setHeaders([]);
      setRawData([]);
      setFileName("");
  };

  // If we are in the mapping phase
  if (isMapping) {
      return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <TableProperties className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">Map Columns</h2>
                        <p className="text-xs text-slate-500">File: {fileName}</p>
                    </div>
                </div>
                <button onClick={resetUpload} className="text-slate-400 hover:text-red-500 transition-colors">
                    <RotateCcw className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {[
                    { key: 'street', label: 'Street Address / Full Address', required: true },
                    { key: 'city', label: 'City', required: false },
                    { key: 'state', label: 'State', required: false },
                    { key: 'zip', label: 'Zip Code', required: false },
                    { key: 'plus4', label: '+4 Zip Code', required: false }
                ].map((field) => (
                    <div key={field.key} className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                            {field.label}
                            {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <select
                            value={mapping[field.key as keyof ColumnMapping]}
                            onChange={(e) => setMapping(prev => ({ ...prev, [field.key]: parseInt(e.target.value) }))}
                            className={`w-full px-3 py-2 bg-slate-50 border rounded-lg focus:ring-2 outline-none transition-all text-sm ${mapping[field.key as keyof ColumnMapping] === -1 && field.required ? 'border-red-200 focus:border-red-400 ring-red-100' : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
                        >
                            <option value={-1}>-- Select Column --</option>
                            {headers.map((h, idx) => (
                                <option key={idx} value={idx}>{h}</option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>

            <div className="flex justify-end">
                <button 
                    onClick={handleProcessMapping}
                    disabled={mapping.street === -1}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                    Start Processing
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
      );
  }

  // Default Upload View
  return (
    <div className="mb-8">
      <div className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${isProcessing ? 'border-slate-200 bg-slate-50 cursor-wait' : 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-400'}`}>
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileUpload}
          disabled={isProcessing}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          value=""
        />
        
        <div className="flex flex-col items-center gap-3 pointer-events-none">
          <div className={`p-3 rounded-full ${isProcessing ? 'bg-slate-200 text-slate-500' : 'bg-indigo-100 text-indigo-600'}`}>
            {isProcessing ? <FileSpreadsheet className="w-6 h-6 animate-pulse" /> : <UploadCloud className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
                {isProcessing ? 'Processing File...' : 'Upload Address List'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
                Drag and drop your Excel (.xlsx) file here, or click to browse.
            </p>
            <p className="text-xs text-slate-400 mt-2">
                Map your columns (Street, City, State, Zip, +4) in the next step.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-3 flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>
            <strong>Tip:</strong> If your list is missing ZIP+4 codes, leave that column unmapped and our AI will determine the correct +4 and Delivery Point codes for you.
        </p>
      </div>
    </div>
  );
};