import React, { useState, useEffect, useCallback } from 'react';
import { Mail, ShieldCheck, Zap } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { SettingsForm } from './components/SettingsForm';
import { ResultsTable } from './components/ResultsTable';
import { standardizeAddress } from './services/gemini';
import { generateIMBData } from './services/imb';
import { AddressData, IMBConfig, ProcessingStatus } from './types';

const DEFAULT_CONFIG: IMBConfig = {
  barcodeId: '00',
  serviceTypeId: '300',
  mailerId: '123456',
  startSequenceNumber: 1,
};

const App: React.FC = () => {
  const [config, setConfig] = useState<IMBConfig>(DEFAULT_CONFIG);
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);

  // Process queue
  const processQueue = useCallback(async () => {
    const pendingItems = addresses.filter(a => a.status === 'pending');
    if (pendingItems.length === 0) {
      setStatus(ProcessingStatus.COMPLETED);
      return;
    }

    setStatus(ProcessingStatus.PROCESSING);

    // Process in batches of 3 to avoid rate limits but maintain speed
    const batchSize = 3;
    const batch = pendingItems.slice(0, batchSize);

    await Promise.all(batch.map(async (item) => {
      // Update to processing
      setAddresses(prev => prev.map(a => a.id === item.id ? { ...a, status: 'processing' } : a));

      try {
        // 1. Standardize with Gemini
        const stdData = await standardizeAddress(item.original);
        
        // 2. Generate IMB
        const imbData = generateIMBData(
            config, 
            item.sequenceNumber || 0,
            stdData.zip,
            stdData.plus4,
            stdData.deliveryPoint
        );

        // 3. Update Success
        setAddresses(prev => prev.map(a => a.id === item.id ? {
            ...a,
            status: 'completed',
            ...stdData,
            imbData
        } : a));

      } catch (error) {
        console.error("Processing error", error);
        setAddresses(prev => prev.map(a => a.id === item.id ? { ...a, status: 'error' } : a));
      }
    }));

    // Check if we need to continue
    const remaining = addresses.filter(a => a.status === 'pending').length - batch.length; // Note: local calculation might be off due to async state, better to rely on effect re-trigger or recursion
  }, [addresses, config]);


  // Effect to trigger processing when pending items exist and status isn't processing
  // However, to avoid infinite loops with the dependency array, we use a more controlled recursion or simple check.
  // Simplification: The FileUpload triggers data loading which sets pending.
  // We'll use a useEffect that watches `addresses` and triggers processing if IDLE or PROCESSING but has pending.
  
  useEffect(() => {
      const hasPending = addresses.some(a => a.status === 'pending');
      const isProcessing = addresses.some(a => a.status === 'processing');

      if (hasPending && !isProcessing) {
          processQueue();
      } else if (!hasPending && !isProcessing && addresses.length > 0 && status !== ProcessingStatus.COMPLETED) {
          setStatus(ProcessingStatus.COMPLETED);
      }
  }, [addresses, processQueue, status]);


  const handleDataLoaded = (rawAddresses: string[]) => {
    let currentSeq = config.startSequenceNumber;
    
    const newAddresses: AddressData[] = rawAddresses.map((addr, index) => ({
      id: `addr-${Date.now()}-${index}`,
      original: addr,
      street: '',
      city: '',
      state: '',
      zip: '',
      plus4: '',
      deliveryPoint: '',
      status: 'pending',
      sequenceNumber: currentSeq++,
    }));

    setAddresses(newAddresses);
    setStatus(ProcessingStatus.PROCESSING);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Mail className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              IMB Address Architect
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Secure Processing</span>
            </div>
            <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>AI Powered</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-8 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Mass Address Verification & Barcoding</h2>
            <p className="text-slate-500 text-lg">
                Upload your address list to automatically standardize formats, finding missing ZIP+4 codes, 
                and generate compliant Intelligent Mail Barcode (IMB) data strings.
            </p>
        </div>

        <SettingsForm config={config} onChange={setConfig} />
        
        <FileUpload 
            onDataLoaded={handleDataLoaded} 
            isProcessing={status === ProcessingStatus.PROCESSING} 
        />

        <ResultsTable data={addresses} status={status} />
        
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
            <p>© 2024 IMB Address Architect. For demonstration purposes.</p>
            <p className="mt-2 text-xs max-w-lg mx-auto">
                Disclaimer: This tool uses AI for address estimation. It is not CASS™ certified by the USPS®. 
                Always verify critical mailings with official USPS tools.
            </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
