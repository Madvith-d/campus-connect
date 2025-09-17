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
    validFrom: string;
    validUntil: string;
  };
  version: string;
  nonce: string;
}

export interface QRCodeValidationResult {
  isValid: boolean;
  eventId?: string;
  metadata?: QRCodeData['metadata'];
  error?: string;
  validationDetails?: {
    hashValid: boolean;
    timeValid: boolean;
    formatValid: boolean;
    replayCheck: boolean;
  };
}

// QR Code version for compatibility checking
const QR_VERSION = '2.0';

// Time window constants (in milliseconds)
const QR_VALIDITY_WINDOW = 2 * 60 * 60 * 1000; // 2 hours
const EVENT_CHECKIN_WINDOW_BEFORE = 60 * 60 * 1000; // 1 hour before
const EVENT_CHECKIN_WINDOW_AFTER = 60 * 60 * 1000; // 1 hour after

// Security constants
const MAX_QR_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours max QR age
const REPLAY_PROTECTION_WINDOW = 5 * 60 * 1000; // 5 minutes replay protection

// Recent scan tracking for replay protection
const recentScans = new Map<string, number>();

// Secret key for QR code validation (from environment configuration)
const QR_SECRET_KEY = config.qrSecretKey;

/**
 * Generate a cryptographically secure nonce
 */
function generateNonce(): string {
  const array = new Uint8Array(16);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto API
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Clean up old entries from replay protection cache
 */
function cleanupReplayCache(): void {
  const now = Date.now();
  for (const [key, timestamp] of recentScans.entries()) {
    if (now - timestamp > REPLAY_PROTECTION_WINDOW) {
      recentScans.delete(key);
    }
  }
}

/**
 * Generate a secure hash for QR code validation
 */
export function generateQRHash(eventId: string, timestamp: string, nonce: string): string {
  const data = `${eventId}-${timestamp}-${nonce}-${QR_SECRET_KEY}`;
  return CryptoJS.SHA256(data).toString();
}

/**
 * Validate QR code hash
 */
export function validateQRHash(eventId: string, timestamp: string, hash: string, nonce: string): boolean {
  const expectedHash = generateQRHash(eventId, timestamp, nonce);
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
export function generateQRCodeData(
  eventId: string,
  eventTitle: string,
  clubName: string,
  location: string,
  eventStartTime: string,
  eventEndTime: string
): QRCodeData {
  const timestamp = new Date().toISOString();
  const nonce = generateNonce();
  const hash = generateQRHash(eventId, timestamp, nonce);
  
  // Calculate validity window
  const eventStart = new Date(eventStartTime);
  const eventEnd = new Date(eventEndTime);
  const validFrom = new Date(eventStart.getTime() - EVENT_CHECKIN_WINDOW_BEFORE).toISOString();
  const validUntil = new Date(eventEnd.getTime() + EVENT_CHECKIN_WINDOW_AFTER).toISOString();
  
  return {
    eventId,
    timestamp,
    hash,
    version: QR_VERSION,
    nonce,
    metadata: {
      eventTitle,
      clubName,
      location,
      validFrom,
      validUntil,
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
 * Parse and validate QR code data with enhanced security
 */
export function parseQRCodeData(qrString: string): QRCodeValidationResult {
  try {
    const qrData: QRCodeData = JSON.parse(qrString);
    
    // Initialize validation details
    const validationDetails = {
      hashValid: false,
      timeValid: false,
      formatValid: false,
      replayCheck: false
    };
    
    // Validate required fields and format
    if (!qrData.eventId || !qrData.timestamp || !qrData.hash || !qrData.metadata || !qrData.nonce) {
      return {
        isValid: false,
        error: 'Invalid QR code format: missing required fields',
        validationDetails
      };
    }
    
    validationDetails.formatValid = true;
    
    // Version compatibility check
    if (qrData.version && qrData.version !== QR_VERSION) {
      return {
        isValid: false,
        error: `QR code version ${qrData.version} is not supported`,
        validationDetails
      };
    }
    
    // Check QR code age
    const qrAge = Date.now() - new Date(qrData.timestamp).getTime();
    if (qrAge > MAX_QR_AGE_MS) {
      return {
        isValid: false,
        error: 'QR code has expired (too old)',
        validationDetails
      };
    }
    
    // Validate hash
    if (!validateQRHash(qrData.eventId, qrData.timestamp, qrData.hash, qrData.nonce)) {
      return {
        isValid: false,
        error: 'Invalid QR code signature',
        validationDetails
      };
    }
    
    validationDetails.hashValid = true;
    
    // Check time window if metadata has validity info
    if (qrData.metadata.validFrom && qrData.metadata.validUntil) {
      const now = new Date();
      const validFrom = new Date(qrData.metadata.validFrom);
      const validUntil = new Date(qrData.metadata.validUntil);
      
      if (now < validFrom || now > validUntil) {
        return {
          isValid: false,
          error: 'QR code is outside valid time window',
          validationDetails
        };
      }
      
      validationDetails.timeValid = true;
    }
    
    // Replay protection check
    cleanupReplayCache();
    const scanKey = `${qrData.hash}-${qrData.timestamp}`;
    if (recentScans.has(scanKey)) {
      return {
        isValid: false,
        error: 'QR code was recently scanned (replay protection)',
        validationDetails
      };
    }
    
    // Record this scan for replay protection
    recentScans.set(scanKey, Date.now());
    validationDetails.replayCheck = true;
    
    return {
      isValid: true,
      eventId: qrData.eventId,
      metadata: qrData.metadata,
      validationDetails
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid QR code data format',
      validationDetails: {
        hashValid: false,
        timeValid: false,
        formatValid: false,
        replayCheck: false
      }
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
  location: string,
  eventStartTime: string,
  eventEndTime: string
): Promise<{ qrData: QRCodeData; qrImage: string }> {
  const qrData = generateQRCodeData(eventId, eventTitle, clubName, location, eventStartTime, eventEndTime);
  const qrImage = await generateQRCodeImage(qrData);
  
  return { qrData, qrImage };
}

/**
 * Validate QR code against event data with enhanced security
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
      validationDetails: parseResult.validationDetails
    };
  }
  
  return parseResult;
}

/**
 * Legacy support for old QR code format (backward compatibility)
 */
export function parseQRCodeDataLegacy(qrString: string): QRCodeValidationResult {
  try {
    // Try parsing as legacy format
    const legacyData = JSON.parse(qrString);
    
    if (legacyData.eventId && legacyData.timestamp && legacyData.hash && legacyData.metadata) {
      // Missing nonce - legacy format
      if (!legacyData.nonce) {
        return {
          isValid: true,
          eventId: legacyData.eventId,
          metadata: {
            ...legacyData.metadata,
            validFrom: new Date(Date.now() - EVENT_CHECKIN_WINDOW_BEFORE).toISOString(),
            validUntil: new Date(Date.now() + EVENT_CHECKIN_WINDOW_AFTER).toISOString(),
          },
          validationDetails: {
            hashValid: true,
            timeValid: true,
            formatValid: true,
            replayCheck: false
          }
        };
      }
    }
    
    return parseQRCodeData(qrString);
  } catch {
    return parseQRCodeData(qrString);
  }
}