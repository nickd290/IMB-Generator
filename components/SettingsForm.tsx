import React from 'react';
import { IMBConfig } from '../types';
import { Settings, HelpCircle } from 'lucide-react';
import { SERVICE_TYPES } from '../services/imb';

interface Props {
  config: IMBConfig;
  onChange: (config: IMBConfig) => void;
}

export const SettingsForm: React.FC<Props> = ({ config, onChange }) => {
  const handleChange = (field: keyof IMBConfig, value: string | number) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
          <Settings className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800">IMB Configuration</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Mailer ID */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
            Mailer ID (MID)
            <span className="text-slate-400 cursor-help" title="6 or 9 digit ID assigned by USPS">
                <HelpCircle className="w-3 h-3" />
            </span>
          </label>
          <input
            type="text"
            maxLength={9}
            value={config.mailerId}
            onChange={(e) => handleChange('mailerId', e.target.value.replace(/\D/g, ''))}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-sm"
            placeholder="e.g. 123456"
          />
          <p className="text-xs text-slate-500">
            {config.mailerId.length === 6 ? 'Using 9-digit Serial Numbers' : 
             config.mailerId.length === 9 ? 'Using 6-digit Serial Numbers' : 
             'Must be 6 or 9 digits'}
          </p>
        </div>

        {/* Service Type ID */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
            Service Type ID (STID)
          </label>
          <select
            value={config.serviceTypeId}
            onChange={(e) => handleChange('serviceTypeId', e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
          >
            {SERVICE_TYPES.map(type => (
                <option key={type.id} value={type.id}>
                    {type.label}
                </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">3-digit class of mail</p>
        </div>

        {/* Barcode ID */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Barcode ID</label>
          <select
            value={config.barcodeId}
            onChange={(e) => handleChange('barcodeId', e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
          >
            <option value="00">00 - No OEL</option>
            <option value="20">20 - OEL</option>
            <option value="50">50 - Manual</option>
          </select>
           <p className="text-xs text-slate-500">Presort identification</p>
        </div>

        {/* Sequence Start */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Start Sequence #</label>
          <input
            type="number"
            value={config.startSequenceNumber}
            onChange={(e) => handleChange('startSequenceNumber', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-sm"
          />
           <p className="text-xs text-slate-500">Incrementing per record</p>
        </div>

      </div>
    </div>
  );
};