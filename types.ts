export interface IMBConfig {
  barcodeId: string; // Usually '00', '01', etc.
  serviceTypeId: string; // 3 digits (e.g., '300' for First-Class)
  mailerId: string; // 6 or 9 digits
  startSequenceNumber: number;
}

export interface AddressData {
  id: string;
  original: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  plus4: string;
  deliveryPoint: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  imbData?: string; // The 31-digit payload
  sequenceNumber?: number;
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED'
}
