import { IMBConfig } from '../types';

export const SERVICE_TYPES = [
  { id: '300', label: 'First-Class Mail - No Services (300)' },
  { id: '301', label: 'First-Class Mail - Manual Correction (301)' },
  { id: '310', label: 'First-Class Mail - Electronic Service (310)' },
  { id: '311', label: 'First-Class Mail - Auto-Correction (311)' },
  { id: '261', label: 'Marketing Mail - No Services (261)' },
  { id: '271', label: 'Marketing Mail - Manual Correction (271)' },
  { id: '080', label: 'Priority Mail - No Services (080)' },
  { id: '081', label: 'Priority Mail - Manual Correction (081)' },
  { id: '700', label: 'Periodicals - No Services (700)' },
  { id: '701', label: 'Periodicals - Manual Correction (701)' },
  { id: '000', label: 'Custom / Other' }
];

/**
 * Constructs the 31-digit Intelligent Mail Barcode Data Payload.
 * Note: This does NOT generate the encoded bars (which requires complex Reed-Solomon encoding),
 * but generates the correct data string required for the barcode.
 * 
 * Structure:
 * - Barcode ID: 2 digits
 * - Service Type ID: 3 digits
 * - Mailer ID: 6 or 9 digits
 * - Serial Number: 6 or 9 digits (determined by Mailer ID length)
 * - Routing Code: 0, 5, 9, or 11 digits
 */
export const generateIMBData = (
  config: IMBConfig,
  sequenceNumber: number,
  zip: string,
  plus4: string = '0000',
  deliveryPoint: string = '00'
): string => {
  const { barcodeId, serviceTypeId, mailerId } = config;
  
  // 1. Validate IDs
  const cleanBarcodeId = barcodeId.padStart(2, '0').slice(0, 2);
  const cleanSTID = serviceTypeId.padStart(3, '0').slice(0, 3);
  const cleanMailerId = mailerId.replace(/\D/g, '');

  // 2. Determine Serial Number length
  let serialLength = 0;
  if (cleanMailerId.length === 6) {
    serialLength = 9;
  } else if (cleanMailerId.length === 9) {
    serialLength = 6;
  } else {
    // Fallback/Error handling: Assume 9 digit mailer if invalid length, giving 6 digit serial
    serialLength = 6; 
  }

  const cleanSequence = sequenceNumber.toString().padStart(serialLength, '0').slice(-serialLength);

  // 3. Construct Routing Code
  // Standard IMB uses 11 digit routing code (5 zip + 4 add-on + 2 delivery point)
  const cleanZip = zip.replace(/\D/g, '').padStart(5, '0');
  const cleanPlus4 = plus4.replace(/\D/g, '').padStart(4, '0');
  const cleanDeliveryPoint = deliveryPoint.replace(/\D/g, '').padStart(2, '0');
  
  const routingCode = `${cleanZip}${cleanPlus4}${cleanDeliveryPoint}`;

  // 4. Assemble
  // Barcode ID (2) + STID (3) + Mailer ID (6/9) + Serial (9/6) + Routing (11) = 31 digits
  return `${cleanBarcodeId}${cleanSTID}${cleanMailerId}${cleanSequence}${routingCode}`;
};

/**
 * A simplified visualizer helper.
 * Real IMB uses 4-state bars (Ascender, Descender, Tracker, Full).
 * Without a heavy library, we can't generate the exact Reed-Solomon encoded bars.
 * We will simulate the "look" for the UI mock, but warn the user.
 */
export const getPseudoBarcodeVisual = (dataString: string) => {
    // This is purely for UI aesthetic to show where the barcode goes.
    // It is NOT scanable.
    return dataString.split('').map((char, index) => {
        const val = parseInt(char, 10);
        if (val % 4 === 0) return 'F'; // Full
        if (val % 4 === 1) return 'A'; // Ascender
        if (val % 4 === 2) return 'D'; // Descender
        return 'T'; // Tracker
    }).join('');
}