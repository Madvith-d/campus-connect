import QRCode from 'qrcode';
import CryptoJS from 'crypto-js';
import { config } from './config';

export interface QRCodeData {
  eventId: string;
  timestamp: string;
  hash: string;
  metadata: {
    eventTitle: string;
    clubName: string;
    location: string;
  };
}

export interface QRCodeValidationResult {
  isValid: boolean;
  eventId?: string;
  metadata?: QRCodeData['metadata'];
  error?: string;
}

// Secret key for QR code validation (from environment configuration)
const QR_SECRET_KEY = config.qrSecretKey;

/**
 * Generate a secure hash for QR code validation
 */
export function generateQRHash(eventId: string, timestamp: string): string {
  const data = `${eventId}-${timestamp}-${QR_SECRET_KEY}`;
  return CryptoJS.SHA256(data).toString();
}

/**
 * Validate QR code hash
 */
export function validateQRHash(eventId: string, timestamp: string, hash: string): boolean {
  const expectedHash = generateQRHash(eventId, timestamp);
  return expectedHash === hash;
}

/**
 * Check if QR code is within valid time window
 */
export function isWithinTimeWindow(timestamp: string, eventStartTime: string, eventEndTime: string): boolean {
  const now = new Date();
  const qrTime = new Date(timestamp);
  const startTime = new Date(eventStartTime);
  const endTime = new Date(eventEndTime);
  
  // QR code should be valid from 1 hour before event start to 1 hour after event end
  const validStart = new Date(startTime.getTime() - 60 * 60 * 1000); // 1 hour before
  const validEnd = new Date(endTime.getTime() + 60 * 60 * 1000); // 1 hour after
  
  return now >= validStart && now <= validEnd;
}

/**
 * Generate QR code data with security validation
 */
export function generateQRCodeData(eventId: string, eventTitle: string, clubName: string, location: string): QRCodeData {
  const timestamp = new Date().toISOString();
  const hash = generateQRHash(eventId, timestamp);
  
  return {
    eventId,
    timestamp,
    hash,
    metadata: {
      eventTitle,
      clubName,
      location,
    },
  };
}

/**
 * Generate QR code as base64 image
 */
export async function generateQRCodeImage(qrData: QRCodeData): Promise<string> {
  try {
    const jsonData = JSON.stringify(qrData);
    const qrCodeUrl = await QRCode.toDataURL(jsonData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });
    return qrCodeUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Parse and validate QR code data
 */
export function parseQRCodeData(qrString: string): QRCodeValidationResult {
  try {
    const qrData: QRCodeData = JSON.parse(qrString);
    
    // Validate required fields
    if (!qrData.eventId || !qrData.timestamp || !qrData.hash || !qrData.metadata) {
      return {
        isValid: false,
        error: 'Invalid QR code format',
      };
    }
    
    // Validate hash
    if (!validateQRHash(qrData.eventId, qrData.timestamp, qrData.hash)) {
      return {
        isValid: false,
        error: 'Invalid QR code signature',
      };
    }
    
    return {
      isValid: true,
      eventId: qrData.eventId,
      metadata: qrData.metadata,
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid QR code data',
    };
  }
}

/**
 * Generate a fresh QR code for an event
 */
export async function generateEventQRCode(
  eventId: string,
  eventTitle: string,
  clubName: string,
  location: string
): Promise<{ qrData: QRCodeData; qrImage: string }> {
  const qrData = generateQRCodeData(eventId, eventTitle, clubName, location);
  const qrImage = await generateQRCodeImage(qrData);
  
  return { qrData, qrImage };
}

/**
 * Validate QR code against event data
 */
export function validateEventQRCode(
  qrString: string,
  eventStartTime: string,
  eventEndTime: string
): QRCodeValidationResult {
  const parseResult = parseQRCodeData(qrString);
  
  if (!parseResult.isValid) {
    return parseResult;
  }
  
  // Additional time window validation
  const qrData: QRCodeData = JSON.parse(qrString);
  if (!isWithinTimeWindow(qrData.timestamp, eventStartTime, eventEndTime)) {
    return {
      isValid: false,
      error: 'QR code is outside valid time window',
    };
  }
  
  return parseResult;
}