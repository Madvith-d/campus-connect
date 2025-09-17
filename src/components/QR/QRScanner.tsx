import { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType, Html5QrcodeSupportedFormats, Html5Qrcode } from 'html5-qrcode';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, CameraOff, Scan, AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';
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
  const [isHttps, setIsHttps] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
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
    supportedFormats: [
      Html5QrcodeSupportedFormats.QR_CODE,
      Html5QrcodeSupportedFormats.AZTEC,
      Html5QrcodeSupportedFormats.CODABAR,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.CODE_93,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.DATA_MATRIX,
      Html5QrcodeSupportedFormats.MAXICODE,
      Html5QrcodeSupportedFormats.ITF,
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.PDF_417,
      Html5QrcodeSupportedFormats.RSS_14,
      Html5QrcodeSupportedFormats.RSS_EXPANDED,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
      Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION
    ],
  };

  // Check if running on HTTPS
  const checkHttps = () => {
    const isSecure = window.location.protocol === 'https:' || 
                     window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
    setIsHttps(isSecure);
    return isSecure;
  };

  // Get available cameras
  const getAvailableCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Error getting camera devices:', error);
      return [];
    }
  };

  // Get preferred camera (back camera on mobile, any camera on desktop)
  const getPreferredCamera = async () => {
    const cameras = await getAvailableCameras();
    if (cameras.length === 0) return null;

    // On mobile, prefer back camera (environment facing)
    const backCamera = cameras.find(camera => 
      camera.label.toLowerCase().includes('back') || 
      camera.label.toLowerCase().includes('rear') ||
      camera.label.toLowerCase().includes('environment')
    );
    
    if (backCamera) return backCamera;
    
    // Fallback to first available camera
    return cameras[0];
  };

  // Initialize scanner
  const initializeScanner = async () => {
    console.log('🔍 Starting camera initialization...');
    
    if (!scannerElementRef.current) {
      console.error('❌ Scanner element ref not available');
      setError('Scanner container not ready. Please try again.');
      return;
    }
    
    if (scannerRef.current) {
      console.log('⚠️ Scanner already exists, cleaning up first...');
      cleanupScanner();
    }

    try {
      // Check HTTPS requirement
      console.log('🔒 Checking HTTPS requirement...');
      if (!checkHttps()) {
        console.error('❌ HTTPS required but not available');
        setError('Camera access requires HTTPS. Please access this site via HTTPS or localhost.');
        setCameraError('HTTPS_REQUIRED');
        return;
      }
      console.log('✅ HTTPS check passed');

      // Check if getUserMedia is supported
      console.log('🌐 Checking browser support...');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('❌ getUserMedia not supported');
        setError('Camera access is not supported in this browser. Please use a modern browser.');
        setCameraError('NOT_SUPPORTED');
        return;
      }
      console.log('✅ Browser support check passed');

      // Get available cameras
      console.log('📷 Getting available cameras...');
      const cameras = await getAvailableCameras();
      console.log('📷 Available cameras:', cameras);
      
      if (cameras.length === 0) {
        console.error('❌ No cameras found');
        setError('No cameras found. Please ensure a camera is connected and try again.');
        setCameraError('NO_CAMERAS');
        return;
      }
      console.log(`✅ Found ${cameras.length} camera(s)`);

      // Get preferred camera and set constraints
      console.log('🎯 Getting preferred camera...');
      const preferredCamera = await getPreferredCamera();
      console.log('🎯 Preferred camera:', preferredCamera);
      
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' }, // Prefer back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
          ...(preferredCamera && { deviceId: { exact: preferredCamera.deviceId } })
        }
      };
      console.log('📹 Camera constraints:', constraints);

      try {
        console.log('🔐 Requesting camera permissions...');
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('✅ Camera permissions granted, stream:', stream);
        setPermissionGranted(true);
        setError(null);
        setCameraError(null);
        
        // Stop the test stream
        stream.getTracks().forEach(track => track.stop());
        console.log('🛑 Test stream stopped');
      } catch (permissionError) {
        console.error('❌ Camera permission error:', permissionError);
        setPermissionGranted(false);
        
        if (permissionError.name === 'NotAllowedError') {
          setError('Camera permission denied. Please allow camera access and try again.');
          setCameraError('PERMISSION_DENIED');
        } else if (permissionError.name === 'NotFoundError') {
          setError('No camera found. Please ensure a camera is connected.');
          setCameraError('NO_CAMERA');
        } else if (permissionError.name === 'NotReadableError') {
          setError('Camera is already in use by another application. Please close other camera apps and try again.');
          setCameraError('CAMERA_IN_USE');
        } else {
          setError('Camera access failed. Please check your camera settings and try again.');
          setCameraError('UNKNOWN_ERROR');
        }
        return;
      }

      // Wait a bit for DOM to be ready
      console.log('⏳ Waiting for DOM to be ready...');
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create scanner with better error handling
      console.log('🎬 Creating Html5QrcodeScanner...');
      const scanner = new Html5QrcodeScanner(
        "qr-scanner-container",
        scannerConfig,
        false
      );
      console.log('✅ Scanner created');

      console.log('🎥 Rendering scanner...');
      scanner.render(
        (decodedText) => {
          console.log('✅ QR Code detected:', decodedText);
          // Success callback
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Error callback - most errors are just "not found" which is normal
          if (!errorMessage.includes('NotFoundException') && 
              !errorMessage.includes('No QR code found') &&
              !errorMessage.includes('QR code parse error')) {
            console.warn('⚠️ QR Scanner error:', errorMessage);
          }
        }
      );
      console.log('✅ Scanner rendered');

      scannerRef.current = scanner;
      setIsScanning(true);
      console.log('🎉 Scanner initialization complete!');
    } catch (err) {
      console.error('❌ Scanner initialization error:', err);
      setError('Failed to initialize camera. Please refresh the page and try again.');
      setCameraError('INIT_ERROR');
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
  const cleanupScanner = async () => {
    console.log('🧹 Cleaning up scanner...');
    
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
        scannerRef.current = null;
        console.log('✅ Scanner cleared');
      } catch (error) {
        console.error('❌ Error clearing scanner:', error);
      }
    }
    
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
        console.log('✅ Direct scanner cleared');
      } catch (error) {
        console.error('❌ Error clearing direct scanner:', error);
      }
    }
    
    setIsScanning(false);
    setScanResult(null);
    setError(null);
    setCameraError(null);
  };

  // Alternative scanner using Html5Qrcode directly
  const initializeDirectScanner = async () => {
    console.log('🔄 Trying direct Html5Qrcode initialization...');
    
    try {
      if (!scannerElementRef.current) {
        throw new Error('Scanner container not available');
      }

      // Clear any existing scanner
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      }

      // Create new Html5Qrcode instance
      const html5QrCode = new Html5Qrcode("qr-scanner-container");
      html5QrCodeRef.current = html5QrCode;

      // Get camera devices with better error handling
      let devices;
      try {
        devices = await Html5Qrcode.getCameras();
        console.log('📷 Available devices from Html5Qrcode:', devices);
      } catch (deviceError) {
        console.warn('⚠️ Html5Qrcode.getCameras() failed, trying alternative method:', deviceError);
        
        // Fallback: use navigator.mediaDevices.enumerateDevices
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        devices = mediaDevices
          .filter(device => device.kind === 'videoinput')
          .map(device => ({ id: device.deviceId, label: device.label }));
        console.log('📷 Available devices from enumerateDevices:', devices);
      }

      if (devices.length === 0) {
        throw new Error('No cameras found');
      }

      // Try to find the best camera (back camera on mobile)
      let selectedCamera = devices[0];
      
      // Look for back camera on mobile
      const backCamera = devices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment') ||
        device.label.toLowerCase().includes('facing back')
      );
      
      if (backCamera) {
        selectedCamera = backCamera;
        console.log('🎯 Found back camera:', selectedCamera);
      } else {
        console.log('🎯 Using first available camera:', selectedCamera);
      }

      // Start scanning with the selected camera
      await html5QrCode.start(
        selectedCamera.id,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false
        },
        (decodedText) => {
          console.log('✅ QR Code detected:', decodedText);
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Most errors are just "not found" which is normal
          if (!errorMessage.includes('NotFoundException') && 
              !errorMessage.includes('No QR code found') &&
              !errorMessage.includes('QR code parse error')) {
            console.warn('⚠️ QR Scanner error:', errorMessage);
          }
        }
      );

      setIsScanning(true);
      console.log('✅ Direct scanner started successfully with camera:', selectedCamera.label);
    } catch (error) {
      console.error('❌ Direct scanner failed:', error);
      setError(`Scanner failed: ${error.message}`);
      setCameraError('DIRECT_FAILED');
    }
  };

  // Alternative simple camera initialization
  const initializeSimpleCamera = async () => {
    console.log('🔄 Trying simple camera initialization...');
    
    try {
      // Basic camera access test
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log('✅ Simple camera access successful');
      
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
      
      // Try direct scanner instead of the complex one
      await initializeDirectScanner();
    } catch (error) {
      console.error('❌ Simple camera access failed:', error);
      setError('Camera access failed. Please check your camera permissions and try again.');
      setCameraError('SIMPLE_FAILED');
    }
  };

  // Start scanning with retry mechanism
  const startScanning = async () => {
    console.log('🚀 Starting scan process...');
    setError(null);
    setScanResult(null);
    setCameraError(null);
    
    // Try direct scanner first (more reliable)
    try {
      console.log('🎯 Trying direct scanner first...');
      await initializeDirectScanner();
    } catch (error) {
      console.error('Direct scanner failed, trying fallback:', error);
      
      // Try the original scanner as fallback
      try {
        await initializeScanner();
      } catch (scannerError) {
        console.error('Original scanner also failed:', scannerError);
        
        // Try simple camera access as last resort
        console.log('🔄 Trying simple camera access as last resort...');
        await initializeSimpleCamera();
      }
    }
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
      setCameraError(null);
      setIsHttps(null);
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

          {/* Browser Not Supported */}
          {cameraError === 'NOT_SUPPORTED' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Camera access is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.
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

          {/* Scanner Container */}
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
                <div className="space-y-2">
                  <Button 
                    onClick={startScanning} 
                    className="w-full"
                    disabled={isHttps === false}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {isHttps === false ? 'HTTPS Required' : 'Start Scanning'}
                  </Button>
                  
                  {/* Debug buttons for troubleshooting */}
                  <div className="space-y-1">
                    <Button 
                      onClick={async () => {
                        console.log('🔧 Debug: Testing camera access...');
                        try {
                          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                          console.log('✅ Debug: Camera access successful', stream);
                          stream.getTracks().forEach(track => track.stop());
                          alert('Camera access test successful! Check console for details.');
                        } catch (error) {
                          console.error('❌ Debug: Camera access failed', error);
                          alert(`Camera access failed: ${error.message}`);
                        }
                      }}
                      variant="outline"
                      className="w-full text-xs"
                    >
                      🔧 Test Camera Access
                    </Button>
                    
                    <Button 
                      onClick={async () => {
                        console.log('🔧 Debug: Testing direct scanner...');
                        try {
                          await initializeDirectScanner();
                          alert('Direct scanner test successful! Check console for details.');
                        } catch (error) {
                          console.error('❌ Debug: Direct scanner failed', error);
                          alert(`Direct scanner failed: ${error.message}`);
                        }
                      }}
                      variant="outline"
                      className="w-full text-xs"
                    >
                      🎯 Test Direct Scanner
                    </Button>
                    
                    <Button 
                      onClick={async () => {
                        console.log('🔧 Debug: Testing basic video stream...');
                        try {
                          const stream = await navigator.mediaDevices.getUserMedia({ 
                            video: { 
                              facingMode: 'environment',
                              width: { ideal: 1280 },
                              height: { ideal: 720 }
                            } 
                          });
                          
                          // Create a simple video element to test camera
                          const video = document.createElement('video');
                          video.srcObject = stream;
                          video.autoplay = true;
                          video.style.width = '100%';
                          video.style.height = '300px';
                          video.style.border = '2px solid green';
                          
                          // Add to scanner container
                          const container = document.getElementById('qr-scanner-container');
                          if (container) {
                            container.innerHTML = '';
                            container.appendChild(video);
                            container.appendChild(document.createElement('p')).textContent = 'Camera working! Video stream active.';
                          }
                          
                          console.log('✅ Basic video stream working:', stream);
                          alert('Basic video stream test successful! You should see video in the scanner area.');
                          
                          // Clean up after 5 seconds
                          setTimeout(() => {
                            stream.getTracks().forEach(track => track.stop());
                            if (container) {
                              container.innerHTML = '';
                            }
                          }, 5000);
                          
                        } catch (error) {
                          console.error('❌ Debug: Basic video stream failed', error);
                          alert(`Basic video stream failed: ${error.message}`);
                        }
                      }}
                      variant="outline"
                      className="w-full text-xs"
                    >
                      📹 Test Video Stream
                    </Button>
                  </div>
                </div>
                {isHttps === true && (
                  <p className="text-xs text-green-600 mt-2 flex items-center justify-center">
                    <Wifi className="h-3 w-3 mr-1" />
                    Secure connection detected
                  </p>
                )}
                <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted rounded-lg">
                  <p className="font-medium mb-1">Camera Tips:</p>
                  <ul className="text-left space-y-1">
                    <li>• Allow camera permissions when prompted</li>
                    <li>• Ensure good lighting for better scanning</li>
                    <li>• Hold the QR code steady within the frame</li>
                    <li>• On mobile: Use the back camera for best results</li>
                  </ul>
                </div>
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