import { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, CameraOff, Scan, AlertCircle, CheckCircle } from 'lucide-react';
import { parseQRCodeData, QRCodeValidationResult } from '@/lib/qr-utils';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (result: QRCodeValidationResult) => void;
  title?: string;
  description?: string;
}

const QRScanner = ({ 
  isOpen, 
  onClose, 
  onScanSuccess, 
  title = "Scan QR Code",
  description = "Position the QR code within the camera view to scan"
}: QRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerElementRef = useRef<HTMLDivElement>(null);

  // Scanner configuration
  const scannerConfig = {
    fps: 10,
    qrbox: {
      width: 250,
      height: 250,
    },
    aspectRatio: 1.0,
    disableFlip: false,
    supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
    showTorchButtonIfSupported: true,
    showZoomSliderIfSupported: true,
    defaultZoomValueIfSupported: 2,
  };

  // Initialize scanner
  const initializeScanner = async () => {
    if (!scannerElementRef.current || scannerRef.current) return;

    try {
      // Check camera permissions
      await navigator.mediaDevices.getUserMedia({ video: true });
      setPermissionGranted(true);
      setError(null);

      const scanner = new Html5QrcodeScanner(
        "qr-scanner-container",
        scannerConfig,
        false
      );

      scanner.render(
        (decodedText) => {
          // Success callback
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Error callback - most errors are just "not found" which is normal
          if (!errorMessage.includes('NotFoundException')) {
            console.warn('QR Scanner error:', errorMessage);
          }
        }
      );

      scannerRef.current = scanner;
      setIsScanning(true);
    } catch (err) {
      console.error('Camera permission denied or not available:', err);
      setPermissionGranted(false);
      setError('Camera access is required to scan QR codes. Please allow camera permissions and try again.');
    }
  };

  // Handle successful scan
  const handleScanSuccess = (qrString: string) => {
    setScanResult(qrString);
    setIsScanning(false);
    
    // Parse and validate QR code
    const validationResult = parseQRCodeData(qrString);
    
    // Call success callback
    onScanSuccess(validationResult);
    
    // Stop scanner
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
  };

  // Cleanup scanner
  const cleanupScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    setIsScanning(false);
    setScanResult(null);
    setError(null);
  };

  // Start scanning
  const startScanning = () => {
    setError(null);
    setScanResult(null);
    initializeScanner();
  };

  // Stop scanning
  const stopScanning = () => {
    cleanupScanner();
  };

  // Effect to handle dialog state changes
  useEffect(() => {
    if (isOpen && !isScanning) {
      // Reset state when dialog opens
      setError(null);
      setScanResult(null);
      setPermissionGranted(null);
    } else if (!isOpen) {
      // Cleanup when dialog closes
      cleanupScanner();
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupScanner();
    };
  }, []);

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
          {/* Camera Permission Request */}
          {permissionGranted === false && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Camera access is required to scan QR codes. Please allow camera permissions in your browser settings and refresh the page.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Display */}
          {error && (
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

          {/* Scanner Container */}
          <div className="space-y-4">
            {!isScanning && !scanResult && permissionGranted !== false && (
              <div className="text-center py-8">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Click "Start Scanning" to begin
                </p>
                <Button onClick={startScanning} className="w-full">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Scanning
                </Button>
              </div>
            )}

            {isScanning && (
              <div className="space-y-4">
                <div 
                  id="qr-scanner-container" 
                  ref={scannerElementRef}
                  className="w-full"
                />
                <Button 
                  onClick={stopScanning} 
                  variant="outline" 
                  className="w-full"
                >
                  <CameraOff className="h-4 w-4 mr-2" />
                  Stop Scanning
                </Button>
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

export default QRScanner;