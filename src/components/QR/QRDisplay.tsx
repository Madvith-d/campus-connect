import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QrCode, Download, RefreshCw, CheckCircle } from 'lucide-react';
import { generateEventQRCode, QRCodeData } from '@/lib/qr-utils';

interface QRDisplayProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  clubName: string;
  location: string;
  eventStartTime: string;
  eventEndTime: string;
}

const QRDisplay = ({ 
  isOpen, 
  onClose, 
  eventId, 
  eventTitle, 
  clubName, 
  location,
  eventStartTime,
  eventEndTime
}: QRDisplayProps) => {
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate QR code
  const generateQR = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const { qrData: newQrData, qrImage: newQrImage } = await generateEventQRCode(
        eventId,
        eventTitle,
        clubName,
        location,
        eventStartTime,
        eventEndTime
      );
      
      setQrData(newQrData);
      setQrImage(newQrImage);
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError('Failed to generate QR code. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download QR code
  const downloadQR = () => {
    if (!qrImage) return;
    
    const link = document.createElement('a');
    link.href = qrImage;
    link.download = `${eventTitle}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate QR on open
  useEffect(() => {
    if (isOpen && eventId) {
      generateQR();
    }
  }, [isOpen, eventId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <QrCode className="h-5 w-5 mr-2" />
            Event QR Code
          </DialogTitle>
          <DialogDescription>
            Display this QR code for attendees to scan for check-in
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Event Info */}
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold">{eventTitle}</h3>
            <p className="text-sm text-muted-foreground">{clubName}</p>
            <p className="text-sm text-muted-foreground">{location}</p>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* QR Code Display */}
          {isGenerating ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin" />
              <p className="ml-2">Generating QR code...</p>
            </div>
          ) : qrImage ? (
            <div className="text-center space-y-4">
              <div className="bg-white p-4 rounded-lg inline-block">
                <img 
                  src={qrImage} 
                  alt="Event QR Code" 
                  className="w-64 h-64 mx-auto"
                />
              </div>
              
              {qrData && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    QR code generated at {new Date(qrData.timestamp).toLocaleString()}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            {qrImage && (
              <>
                <Button onClick={downloadQR} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button onClick={generateQR} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRDisplay;