import { useState, useRef, useEffect, useCallback } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, CameraOff, Scan, AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { parseQRCodeData, QRCodeValidationResult } from '@/lib/qr-utils';

interface QRScannerYudielProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (result: QRCodeValidationResult) => void;
  title?: string;
  description?: string;
}

const QRScannerYudiel = ({ 
  isOpen, 
  onClose, 
  onScanSuccess, 
  title = "Scan QR Code",
  description = "Position the QR code within the camera view to scan"
}: QRScannerYudielProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [isHttps, setIsHttps] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  const [isPaused, setIsPaused] = useState(false);

  // Check if running on HTTPS
  const checkHttps = useCallback(() => {
    const isSecure = window.location.protocol === 'https:' || 
                     window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
    setIsHttps(isSecure);
    return isSecure;
  }, []);

  // Get available cameras
  const getAvailableCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      console.log('📷 Available cameras:', videoDevices);
      return videoDevices;
    } catch (error) {
      console.error('Error getting camera devices:', error);
      return [];
    }
  }, []);

  // Handle QR code detection
  const handleScan = useCallback((result: string) => {
    console.log('✅ QR Code detected:', result);
    setScanResult(result);
    setIsScanning(false);
    
    // Parse and validate QR code
    const validationResult = parseQRCodeData(result);
    
    // Call success callback
    onScanSuccess(validationResult);
  }, [onScanSuccess]);

  // Handle scan errors
  const handleError = useCallback((error: Error) => {
    console.warn('QR Scanner error:', error);
    // Most errors are just "not found" which is normal
    if (!error.message?.includes('NotFoundException') && 
        !error.message?.includes('No QR code found')) {
      setError(`Scanner error: ${error.message}`);
    }
  }, []);

  // Handle camera access
  const handleUserMedia = useCallback((stream: MediaStream) => {
    console.log('✅ Camera access granted:', stream);
    setPermissionGranted(true);
    setError(null);
    setCameraError(null);
  }, []);

  // Handle camera errors
  const handleUserMediaError = useCallback((error: string | DOMException) => {
    console.error('❌ Camera access error:', error);
    setPermissionGranted(false);
    
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and try again.');
        setCameraError('PERMISSION_DENIED');
      } else if (error.name === 'NotFoundError') {
        setError('No camera found. Please ensure a camera is connected.');
        setCameraError('NO_CAMERA');
      } else if (error.name === 'NotReadableError') {
        setError('Camera is already in use by another application. Please close other camera apps and try again.');
        setCameraError('CAMERA_IN_USE');
      } else {
        setError('Camera access failed. Please check your camera settings and try again.');
        setCameraError('UNKNOWN_ERROR');
      }
    } else {
      setError(`Camera error: ${error}`);
      setCameraError('UNKNOWN_ERROR');
    }
  }, []);

  // Start scanning
  const startScanning = useCallback(() => {
    console.log('🚀 Starting QR scan with @yudiel/react-qr-scanner...');
    setIsScanning(true);
    setError(null);
    setScanResult(null);
  }, []);

  // Stop scanning
  const stopScanning = useCallback(() => {
    console.log('🛑 Stopping QR scan...');
    setIsScanning(false);
  }, []);

  // Toggle pause
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (isOpen) {
      checkHttps();
      getAvailableCameras();
    }
  }, [isOpen, checkHttps, getAvailableCameras]);

  // Cleanup when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsScanning(false);
      setError(null);
      setScanResult(null);
      setPermissionGranted(null);
      setCameraError(null);
      setIsPaused(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Scan className="h-5 w-5 mr-2" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* HTTPS Status */}
          {isHttps === false && (
            <Alert variant="destructive">
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                Camera access requires HTTPS. Please access this site via HTTPS or localhost.
              </AlertDescription>
            </Alert>
          )}

          {/* Camera Permission Request */}
          {permissionGranted === false && cameraError === 'PERMISSION_DENIED' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Camera permission denied. Please allow camera access in your browser settings and try again.
              </AlertDescription>
            </Alert>
          )}

          {/* Camera Not Found */}
          {cameraError === 'NO_CAMERA' && (
            <Alert variant="destructive">
              <Camera className="h-4 w-4" />
              <AlertDescription>
                No camera found. Please ensure a camera is connected and try again.
              </AlertDescription>
            </Alert>
          )}

          {/* Camera In Use */}
          {cameraError === 'CAMERA_IN_USE' && (
            <Alert variant="destructive">
              <CameraOff className="h-4 w-4" />
              <AlertDescription>
                Camera is already in use by another application. Please close other camera apps and try again.
              </AlertDescription>
            </Alert>
          )}

          {/* General Error Display */}
          {error && !cameraError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Scan Result */}
          {scanResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                QR code scanned successfully! Processing attendance...
              </AlertDescription>
            </Alert>
          )}

          {/* Camera Selection */}
          {devices.length > 1 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Camera:</label>
              <select
                value={selectedDeviceId || ''}
                onChange={(e) => setSelectedDeviceId(e.target.value || undefined)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Default Camera</option>
                {devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Scanner Component */}
          <div className="space-y-4">
            {!isScanning && !scanResult && (
              <div className="text-center py-8">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  {permissionGranted === false ? 
                    'Camera access is required to scan QR codes' : 
                    'Click "Start Scanning" to begin'
                  }
                </p>
                <Button 
                  onClick={startScanning} 
                  className="w-full"
                  disabled={isHttps === false || permissionGranted === false}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {isHttps === false ? 'HTTPS Required' : 'Start Scanning'}
                </Button>
                {isHttps === true && (
                  <p className="text-xs text-green-600 mt-2 flex items-center justify-center">
                    <Wifi className="h-3 w-3 mr-1" />
                    Secure connection detected
                  </p>
                )}
              </div>
            )}

            {isScanning && (
              <div className="space-y-4">
                <div className="relative">
                  <Scanner
                    onResult={(result) => {
                      if (result) {
                        handleScan(result[0]?.rawValue || result[0]?.text || '');
                      }
                    }}
                    onError={handleError}
                    constraints={{
                      video: {
                        facingMode: 'environment', // Prefer back camera
                        deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
                      }
                    }}
                    styles={{
                      container: {
                        width: '100%',
                        height: '400px',
                        borderRadius: '8px',
                        overflow: 'hidden'
                      },
                      video: {
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }
                    }}
                    pause={isPaused}
                    scanDelay={300}
                  />
                  
                  {/* QR Code overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white border-dashed rounded-lg opacity-50"></div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={stopScanning} 
                    variant="outline" 
                    className="flex-1"
                  >
                    <CameraOff className="h-4 w-4 mr-2" />
                    Stop Scanning
                  </Button>
                  
                  <Button 
                    onClick={togglePause} 
                    variant="outline" 
                    className="flex-1"
                  >
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                </div>
              </div>
            )}
          </div>

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
                Scan Again
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRScannerYudiel;
