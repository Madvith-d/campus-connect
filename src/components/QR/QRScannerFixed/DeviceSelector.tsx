import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Camera, Smartphone, Monitor } from 'lucide-react';

interface DeviceSelectorProps {
  devices: MediaDeviceInfo[];
  selectedDeviceId?: string;
  onDeviceChange: (deviceId: string | undefined) => void;
  preferredCamera: 'environment' | 'user';
}

const DeviceSelector = ({ 
  devices, 
  selectedDeviceId, 
  onDeviceChange, 
  preferredCamera 
}: DeviceSelectorProps) => {
  if (devices.length <= 1) {
    return null;
  }

  // Categorize cameras
  const categorizeCamera = (device: MediaDeviceInfo) => {
    const label = device.label.toLowerCase();
    
    if (label.includes('back') || label.includes('rear') || label.includes('environment')) {
      return { type: 'back', icon: Camera, label: 'Back Camera' };
    }
    
    if (label.includes('front') || label.includes('user') || label.includes('selfie')) {
      return { type: 'front', icon: Smartphone, label: 'Front Camera' };
    }
    
    if (label.includes('usb') || label.includes('external')) {
      return { type: 'external', icon: Monitor, label: 'External Camera' };
    }
    
    return { type: 'unknown', icon: Camera, label: 'Camera' };
  };

  // Get display name for device
  const getDeviceDisplayName = (device: MediaDeviceInfo) => {
    if (!device.label) {
      return `Camera ${device.deviceId.slice(0, 8)}`;
    }
    
    const category = categorizeCamera(device);
    return device.label.length > 30 ? 
      `${category.label} (${device.deviceId.slice(0, 4)})` : 
      device.label;
  };

  // Check if device is recommended
  const isRecommended = (device: MediaDeviceInfo) => {
    const category = categorizeCamera(device);
    return (preferredCamera === 'environment' && category.type === 'back') ||
           (preferredCamera === 'user' && category.type === 'front');
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center">
        <Camera className="h-4 w-4 mr-2" />
        Select Camera
        <span className="text-xs text-muted-foreground ml-2">
          ({devices.length} available)
        </span>
      </Label>
      
      <Select 
        value={selectedDeviceId || ''} 
        onValueChange={(value) => onDeviceChange(value || undefined)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose camera..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">
            <div className="flex items-center">
              <Camera className="h-4 w-4 mr-2" />
              Auto-select (Recommended)
            </div>
          </SelectItem>
          
          {devices.map((device) => {
            const category = categorizeCamera(device);
            const Icon = category.icon;
            const recommended = isRecommended(device);
            
            return (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <Icon className="h-4 w-4 mr-2" />
                    <span className="truncate max-w-[200px]">
                      {getDeviceDisplayName(device)}
                    </span>
                  </div>
                  {recommended && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Recommended
                    </Badge>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      
      {selectedDeviceId && (
        <div className="text-xs text-muted-foreground">
          <span>Selected: </span>
          {getDeviceDisplayName(devices.find(d => d.deviceId === selectedDeviceId) || devices[0])}
        </div>
      )}
    </div>
  );
};

export default DeviceSelector;