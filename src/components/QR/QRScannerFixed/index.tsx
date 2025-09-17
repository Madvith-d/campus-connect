import { useState, useRef, useEffect, useCallback } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Camera, CameraOff, Scan, AlertCircle, CheckCircle, Wifi, WifiOff, Zap, RotateCw } from 'lucide-react';
import { parseQRCodeData, QRCodeValidationResult } from '@/lib/qr-utils';
import CameraHandler from './CameraHandler';
import PermissionManager from './PermissionManager';
import DeviceSelector from './DeviceSelector';
import ErrorBoundary from './ErrorBoundary';

interface QRScannerFixedProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (result: QRCodeValidationResult) => void;
  title?: string;
  description?: string;
  preferredCamera?: 'environment' | 'user';
}

interface CameraError {
  type: 'permission' | 'device' | 'network' | 'unknown';
  message: string;
  code?: string;
}

interface ScanState {
  isScanning: boolean;
  isPaused: boolean;
  isInitializing: boolean;
  lastScanTime: number;
}

const QRScannerFixed = ({ 
  isOpen, 
  onClose, 
  onScanSuccess, 
  title = "Scan QR Code",
  description = "Position the QR code within the camera view to scan",
  preferredCamera = 'environment'
}: QRScannerFixedProps) => {
  // Core state
  const [scanState, setScanState] = useState<ScanState>({
    isScanning: false,
    isPaused: false,
    isInitializing: false,
    lastScanTime: 0
  });
  
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<CameraError | null>(null);
  
  // Camera state
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [isHttps, setIsHttps] = useState<boolean | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  const [cameraInitAttempts, setCameraInitAttempts] = useState(0);
  
  // Refs
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scanDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Constants
  const MAX_RETRY_ATTEMPTS = 3;
  const SCAN_DEBOUNCE_MS = 1000;
  const RETRY_DELAY_MS = 2000;

  // Check if running on HTTPS
  const checkHttps = useCallback(() => {
    const isSecure = window.location.protocol === 'https:' || 
                     window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.includes('192.168.') ||
                     window.location.hostname.includes('10.0.') ||
                     window.location.hostname.includes('172.');
    setIsHttps(isSecure);
    return isSecure;
  }, []);

  // Get available cameras with enhanced error handling
  const getAvailableCameras = useCallback(async (): Promise<MediaDeviceInfo[]> => {
    try {
      // First check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        throw new Error('Camera enumeration not supported in this browser');
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      setDevices(videoDevices);
      console.log('📷 Available cameras:', videoDevices);
      
      if (videoDevices.length === 0) {
        throw new Error('No cameras found on this device');
      }
      
      return videoDevices;
    } catch (error) {
      console.error('Error getting camera devices:', error);
      setError({
        type: 'device',
        message: 'Failed to detect cameras. Please ensure a camera is connected.',
        code: 'CAMERA_ENUMERATION_FAILED'
      });
      return [];
    }
  }, []);

  // Handle QR code detection with debouncing
  const handleScan = useCallback((result: string) => {
    const now = Date.now();
    
    // Debounce scans to prevent duplicate processing
    if (now - scanState.lastScanTime < SCAN_DEBOUNCE_MS) {
      return;
    }

    console.log('✅ QR Code detected:', result);
    
    // Clear any existing debounce
    if (scanDebounceRef.current) {
      clearTimeout(scanDebounceRef.current);
    }

    // Update scan state
    setScanState(prev => ({
      ...prev,
      lastScanTime: now,
      isScanning: false
    }));
    
    setScanResult(result);
    
    // Parse and validate QR code
    scanDebounceRef.current = setTimeout(() => {
      const validationResult = parseQRCodeData(result);
      onScanSuccess(validationResult);
    }, 100);
  }, [scanState.lastScanTime, onScanSuccess]);

  // Handle scan errors with categorization
  const handleScanError = useCallback((error: Error) => {
    console.warn('QR Scanner error:', error);
    
    // Filter out common non-critical errors
    const ignoredErrors = [
      'NotFoundException',
      'No QR code found',
      'QR code parse error',
      'No MultiFormat Readers'
    ];
    
    const shouldIgnore = ignoredErrors.some(ignoredError => 
      error.message?.includes(ignoredError)
    );
    
    if (!shouldIgnore) {
      setError({
        type: 'unknown',
        message: `Scanner error: ${error.message}`,
        code: 'SCAN_ERROR'
      });
    }
  }, []);

  // Initialize camera with retry logic
  const initializeCamera = useCallback(async () => {
    if (!checkHttps()) {
      setError({
        type: 'network',
        message: 'Camera access requires HTTPS. Please access this site via HTTPS or localhost.',
        code: 'HTTPS_REQUIRED'
      });
      return false;
    }

    setScanState(prev => ({ ...prev, isInitializing: true }));
    
    try {
      const cameras = await getAvailableCameras();
      if (cameras.length === 0) {
        throw new Error('No cameras available');
      }

      // Auto-select preferred camera
      const preferredCam = cameras.find(camera => 
        camera.label.toLowerCase().includes(preferredCamera === 'environment' ? 'back' : 'front') ||
        camera.label.toLowerCase().includes(preferredCamera === 'environment' ? 'rear' : 'user')
      );
      
      if (preferredCam && !selectedDeviceId) {
        setSelectedDeviceId(preferredCam.deviceId);
      }

      setError(null);
      setPermissionGranted(true);
      return true;
    } catch (error) {
      console.error('Camera initialization failed:', error);
      
      if (cameraInitAttempts < MAX_RETRY_ATTEMPTS) {
        setCameraInitAttempts(prev => prev + 1);
        retryTimeoutRef.current = setTimeout(() => {
          initializeCamera();
        }, RETRY_DELAY_MS);
      } else {
        setError({
          type: 'device',
          message: 'Failed to initialize camera after multiple attempts. Please check your camera permissions and try again.',
          code: 'CAMERA_INIT_FAILED'
        });
        setPermissionGranted(false);
      }
      return false;
    } finally {
      setScanState(prev => ({ ...prev, isInitializing: false }));
    }
  }, [checkHttps, getAvailableCameras, preferredCamera, selectedDeviceId, cameraInitAttempts]);

  // Start scanning
  const startScanning = useCallback(async () => {
    console.log('🚀 Starting QR scan...');
    
    const success = await initializeCamera();
    if (success) {
      setScanState(prev => ({
        ...prev,
        isScanning: true,
        isPaused: false
      }));
      setError(null);
      setScanResult(null);
    }
  }, [initializeCamera]);

  // Stop scanning
  const stopScanning = useCallback(() => {
    console.log('🛑 Stopping QR scan...');
    setScanState(prev => ({
      ...prev,
      isScanning: false,
      isPaused: false
    }));
  }, []);

  // Toggle pause
  const togglePause = useCallback(() => {
    setScanState(prev => ({
      ...prev,
      isPaused: !prev.isPaused
    }));
  }, []);

  // Retry camera initialization
  const retryCamera = useCallback(() => {
    setCameraInitAttempts(0);
    setError(null);
    initializeCamera();
  }, [initializeCamera]);

  // Initialize on mount
  useEffect(() => {
    if (isOpen) {
      checkHttps();
      setCameraInitAttempts(0);
    }
  }, [isOpen, checkHttps]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (scanDebounceRef.current) {
        clearTimeout(scanDebounceRef.current);
      }
    };
  }, []);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setScanState({
        isScanning: false,
        isPaused: false,
        isInitializing: false,
        lastScanTime: 0
      });
      setError(null);
      setScanResult(null);
      setPermissionGranted(null);
      setCameraInitAttempts(0);
      setSelectedDeviceId(undefined);
      
      // Clear timeouts
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (scanDebounceRef.current) {
        clearTimeout(scanDebounceRef.current);
      }
    }
  }, [isOpen]);

  return (
    <ErrorBoundary>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Scan className="h-5 w-5 mr-2" />
                {title}
              </div>
              <div className="flex items-center space-x-2">
                {isHttps === true && (
                  <Badge variant="secondary" className="text-xs">
                    <Wifi className="h-3 w-3 mr-1" />
                    Secure
                  </Badge>
                )}
                {scanState.isScanning && (
                  <Badge variant="default" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                )}
              </div>
            </DialogTitle>
            <DialogDescription>
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Permission Manager */}
            <PermissionManager
              isHttps={isHttps}
              permissionGranted={permissionGranted}
              error={error}
              onRetry={retryCamera}
            />

            {/* Device Selector */}
            {devices.length > 1 && permissionGranted && (
              <DeviceSelector
                devices={devices}
                selectedDeviceId={selectedDeviceId}
                onDeviceChange={setSelectedDeviceId}
                preferredCamera={preferredCamera}
              />
            )}

            {/* Scan Result */}
            {scanResult && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  QR code scanned successfully! Processing...
                </AlertDescription>
              </Alert>
            )}

            {/* Camera Handler */}
            <CameraHandler
              isScanning={scanState.isScanning}
              isPaused={scanState.isPaused}
              isInitializing={scanState.isInitializing}
              selectedDeviceId={selectedDeviceId}
              permissionGranted={permissionGranted}
              preferredCamera={preferredCamera}
              onScan={handleScan}
              onError={handleScanError}
              onStartScanning={startScanning}
              onStopScanning={stopScanning}
              onTogglePause={togglePause}
            />

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
              {scanResult && (
                <Button 
                  onClick={() => {
                    setScanResult(null);
                    startScanning();
                  }} 
                  className="flex-1"
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  Scan Again
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
};

export default QRScannerFixed;