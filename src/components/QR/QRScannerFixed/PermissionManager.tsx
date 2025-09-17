import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Camera, CameraOff, Wifi, WifiOff, RotateCw, ExternalLink } from 'lucide-react';

interface CameraError {
  type: 'permission' | 'device' | 'network' | 'unknown';
  message: string;
  code?: string;
}

interface PermissionManagerProps {
  isHttps: boolean | null;
  permissionGranted: boolean | null;
  error: CameraError | null;
  onRetry: () => void;
}

const PermissionManager = ({ 
  isHttps, 
  permissionGranted, 
  error, 
  onRetry 
}: PermissionManagerProps) => {
  // HTTPS requirement not met
  if (isHttps === false) {
    return (
      <Alert variant="destructive">
        <WifiOff className="h-4 w-4" />
        <AlertDescription className="space-y-2">
          <div>
            <strong>HTTPS Required:</strong> Camera access requires a secure connection.
          </div>
          <div className="text-sm">
            <p>To fix this issue:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Access this site via HTTPS (https://...)</li>
              <li>Use localhost for development</li>
              <li>Check with your administrator for SSL setup</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Camera permission errors
  if (error?.type === 'permission' || (permissionGranted === false && error?.code === 'PERMISSION_DENIED')) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="space-y-3">
          <div>
            <strong>Camera Permission Required:</strong> Please allow camera access to scan QR codes.
          </div>
          <div className="text-sm">
            <p>To enable camera access:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Click the camera icon in your browser's address bar</li>
              <li>Select "Allow" for camera permissions</li>
              <li>Refresh the page if needed</li>
            </ul>
          </div>
          <div className="flex gap-2 mt-3">
            <Button onClick={onRetry} variant="outline" size="sm">
              <RotateCw className="h-3 w-3 mr-1" />
              Try Again
            </Button>
            <Button 
              onClick={() => window.open('https://support.google.com/chrome/answer/2693767', '_blank')}
              variant="outline" 
              size="sm"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Help
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Camera device errors
  if (error?.type === 'device') {
    return (
      <Alert variant="destructive">
        <Camera className="h-4 w-4" />
        <AlertDescription className="space-y-3">
          <div>
            <strong>Camera Issue:</strong> {error.message}
          </div>
          <div className="text-sm">
            <p>Troubleshooting steps:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Ensure your camera is connected and working</li>
              <li>Close other applications using the camera</li>
              <li>Try refreshing the page</li>
              <li>Check camera privacy settings</li>
            </ul>
          </div>
          <Button onClick={onRetry} variant="outline" size="sm">
            <RotateCw className="h-3 w-3 mr-1" />
            Retry Camera
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Camera in use error
  if (error?.code === 'CAMERA_IN_USE') {
    return (
      <Alert variant="destructive">
        <CameraOff className="h-4 w-4" />
        <AlertDescription className="space-y-3">
          <div>
            <strong>Camera In Use:</strong> Your camera is being used by another application.
          </div>
          <div className="text-sm">
            <p>Please:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Close other camera applications (Zoom, Skype, etc.)</li>
              <li>Close other browser tabs using the camera</li>
              <li>Restart your browser if the issue persists</li>
            </ul>
          </div>
          <Button onClick={onRetry} variant="outline" size="sm">
            <RotateCw className="h-3 w-3 mr-1" />
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Network errors
  if (error?.type === 'network') {
    return (
      <Alert variant="destructive">
        <WifiOff className="h-4 w-4" />
        <AlertDescription className="space-y-3">
          <div>
            <strong>Network Issue:</strong> {error.message}
          </div>
          <div className="text-sm">
            <p>Please check:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Your internet connection</li>
              <li>Browser security settings</li>
              <li>Firewall or proxy settings</li>
            </ul>
          </div>
          <Button onClick={onRetry} variant="outline" size="sm">
            <RotateCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // General errors
  if (error?.type === 'unknown' || error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="space-y-3">
          <div>
            <strong>Scanner Error:</strong> {error.message}
          </div>
          <div className="text-sm">
            <p>If this problem persists:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Try refreshing the page</li>
              <li>Use a different browser</li>
              <li>Check for browser updates</li>
              <li>Contact support if needed</li>
            </ul>
          </div>
          <Button onClick={onRetry} variant="outline" size="sm">
            <RotateCw className="h-3 w-3 mr-1" />
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Success state - show secure connection indicator
  if (isHttps === true && permissionGranted !== false) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <Wifi className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="flex items-center justify-between">
            <span>Secure connection established</span>
            <span className="text-xs bg-green-100 px-2 py-1 rounded-full">Ready</span>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default PermissionManager;