import React, { useState } from 'react';
import { AddressData, ProcessingStatus } from '../types';
import { CheckCircle, Loader2, AlertTriangle, Barcode, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  data: AddressData[];
  status: ProcessingStatus;
}

export const ResultsTable: React.FC<Props> = ({ data, status }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleExport = () => {
    const exportData = data.map(item => ({
        'Original Address': item.original,
        'Standardized Street': item.street,
        'City': item.city,
        'State': item.state,
        'ZIP': item.zip,
        'Plus 4': item.plus4,
        'Delivery Point': item.deliveryPoint,
        'IMB Payload': item.imbData,
        'Sequence Number': item.sequenceNumber
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Processed Addresses");
    XLSX.writeFile(wb, "IMB_Processed_Addresses.xlsx");
  };

  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Barcode className="w-4 h-4" />
            Processed Records 
            <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">
                {data.length}
            </span>
        </h3>
        
        <div className="flex items-center gap-3">
            {status === ProcessingStatus.PROCESSING && (
                <div className="flex items-center gap-2 text-sm text-indigo-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                </div>
            )}
            <button
                onClick={handleExport}
                disabled={status !== ProcessingStatus.COMPLETED && status !== ProcessingStatus.IDLE && data.length > 0}
                className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Export Excel
            </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-medium uppercase tracking-wider border-b border-slate-200">
              <th className="p-4 w-8"></th>
              <th className="p-4">Status</th>
              <th className="p-4">Original Address</th>
              <th className="p-4">Std. Address</th>
              <th className="p-4">ZIP + 4</th>
              <th className="p-4 text-center">D.P.</th>
              <th className="p-4">IMB Data String</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100">
            {data.map((item) => (
              <React.Fragment key={item.id}>
                <tr 
                    className={`hover:bg-slate-50 cursor-pointer transition-colors ${expandedRow === item.id ? 'bg-indigo-50/30' : ''}`}
                    onClick={() => toggleRow(item.id)}
                >
                  <td className="p-4 text-slate-400">
                     {expandedRow === item.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </td>
                  <td className="p-4">
                    {item.status === 'pending' && <span className="w-2 h-2 bg-slate-300 rounded-full block"></span>}
                    {item.status === 'processing' && <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />}
                    {item.status === 'completed' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                    {item.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                  </td>
                  <td className="p-4 text-slate-600 truncate max-w-xs" title={item.original}>
                    {item.original}
                  </td>
                  <td className="p-4 font-medium text-slate-800">
                    {item.status === 'completed' ? (
                        <>
                            <div>{item.street}</div>
                            <div className="text-xs text-slate-500">{item.city}, {item.state}</div>
                        </>
                    ) : '-'}
                  </td>
                  <td className="p-4 font-mono text-slate-700">
                    {item.status === 'completed' ? (
                        <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">
                            {item.zip}-{item.plus4}
                        </span>
                    ) : '-'}
                  </td>
                  <td className="p-4 text-center font-mono text-slate-700">
                     {item.status === 'completed' ? item.deliveryPoint : '-'}
                  </td>
                  <td className="p-4">
                    {item.imbData ? (
                        <div className="flex items-center gap-2">
                            <code className="text-xs bg-slate-800 text-green-400 px-2 py-1 rounded font-mono">
                                {item.imbData.substring(0, 20)}...
                            </code>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(item.imbData || '');
                                }}
                                className="text-slate-400 hover:text-indigo-600 p-1"
                            >
                                <Copy className="w-3 h-3" />
                            </button>
                        </div>
                    ) : '-'}
                  </td>
                </tr>
                {expandedRow === item.id && (
                    <tr className="bg-indigo-50/30">
                        <td colSpan={7} className="p-0">
                            <div className="p-6 border-t border-indigo-100">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Detailed Info */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-semibold text-indigo-900 uppercase tracking-wider">Address Components</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="text-slate-500">Street</div>
                                            <div className="font-medium">{item.street}</div>
                                            <div className="text-slate-500">City/State</div>
                                            <div className="font-medium">{item.city}, {item.state}</div>
                                            <div className="text-slate-500">ZIP Code</div>
                                            <div className="font-medium">{item.zip}</div>
                                            <div className="text-slate-500">+4 Code</div>
                                            <div className="font-medium text-indigo-600">{item.plus4}</div>
                                            <div className="text-slate-500">Delivery Point</div>
                                            <div className="font-medium">{item.deliveryPoint}</div>
                                        </div>
                                    </div>

                                    {/* IMB Details */}
                                    <div className="space-y-3 md:col-span-2">
                                        <h4 className="text-xs font-semibold text-indigo-900 uppercase tracking-wider">Intelligent Mail Barcode (IMB) Details</h4>
                                        <div className="bg-white p-4 rounded-lg border border-indigo-100 space-y-4">
                                            <div>
                                                <label className="text-xs text-slate-400 block mb-1">Full Data Payload (31 Digits)</label>
                                                <div className="font-mono text-lg tracking-widest text-slate-800 break-all selection:bg-indigo-100">
                                                    {item.imbData}
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                                <div>
                                                    <span className="block text-slate-400">Sequence #</span>
                                                    <span className="font-mono font-medium">{item.sequenceNumber}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-slate-400">Routing Code</span>
                                                    <span className="font-mono font-medium">{item.zip}{item.plus4}{item.deliveryPoint}</span>
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-slate-100">
                                                 <p className="text-[10px] text-slate-400">
                                                    * Visual representation of encoded bars requires specialized fonts (e.g., USPSIMBStandard) or rendering libraries not available in this preview.
                                                 </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};