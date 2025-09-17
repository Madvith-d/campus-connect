import { Scanner } from '@yudiel/react-qr-scanner';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Pause, Play, Loader2 } from 'lucide-react';

interface CameraHandlerProps {
  isScanning: boolean;
  isPaused: boolean;
  isInitializing: boolean;
  selectedDeviceId?: string;
  permissionGranted: boolean | null;
  preferredCamera: 'environment' | 'user';
  onScan: (result: string) => void;
  onError: (error: Error) => void;
  onStartScanning: () => void;
  onStopScanning: () => void;
  onTogglePause: () => void;
}

const CameraHandler = ({
  isScanning,
  isPaused,
  isInitializing,
  selectedDeviceId,
  permissionGranted,
  preferredCamera,
  onScan,
  onError,
  onStartScanning,
  onStopScanning,
  onTogglePause
}: CameraHandlerProps) => {
  // Camera constraints with proper structure
  const getCameraConstraints = () => {
    const baseConstraints = {
      video: {
        facingMode: { ideal: preferredCamera },
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        frameRate: { ideal: 30, min: 15 }
      }
    };

    // Add device ID if specific camera is selected
    if (selectedDeviceId) {
      return {
        video: {
          ...baseConstraints.video,
          deviceId: { exact: selectedDeviceId }
        }
      };
    }

    return baseConstraints;
  };

  if (isInitializing) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
        <p className="text-muted-foreground">Initializing camera...</p>
      </div>
    );
  }

  if (!isScanning) {
    return (
      <div className="text-center py-8">
        <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">
          {permissionGranted === false ? 
            'Camera access is required to scan QR codes' : 
            'Click "Start Scanning" to begin'
          }
        </p>
        <Button 
          onClick={onStartScanning} 
          className="w-full"
          disabled={permissionGranted === false}
        >
          <Camera className="h-4 w-4 mr-2" />
          Start Scanning
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Scanner
          onResult={(result) => {
            if (result && Array.isArray(result) && result.length > 0) {
              const qrResult = result[0];
              const text = qrResult?.rawValue || qrResult?.text || '';
              if (text) {
                onScan(text);
              }
            }
          }}
          onError={onError}
          constraints={getCameraConstraints()}
          styles={{
            container: {
              width: '100%',
              height: '400px',
              borderRadius: '8px',
              overflow: 'hidden',
              position: 'relative'
            },
            video: {
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }
          }}
          paused={isPaused}
          scanDelay={300}
        />
        
        {/* QR Code targeting overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white border-dashed rounded-lg opacity-70">
            {/* Corner markers */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-500"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-500"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-500"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-500"></div>
          </div>
          
          {/* Scan line animation */}
          {!isPaused && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-1 bg-green-500 opacity-80 animate-pulse"></div>
          )}
        </div>

        {/* Pause overlay */}
        {isPaused && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-center">
              <Pause className="h-12 w-12 mx-auto mb-2" />
              <p>Scanner Paused</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button 
          onClick={onStopScanning} 
          variant="outline" 
          className="flex-1"
        >
          <CameraOff className="h-4 w-4 mr-2" />
          Stop
        </Button>
        
        <Button 
          onClick={onTogglePause} 
          variant="outline" 
          className="flex-1"
        >
          {isPaused ? (
            <>
              <Play className="h-4 w-4 mr-2" />
              Resume
            </>
          ) : (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CameraHandler;