import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QRScannerWebcam from '@/components/QR/QRScannerWebcam';
import QRScannerYudiel from '@/components/QR/QRScannerYudiel';
import QRScannerBarcode from '@/components/QR/QRScannerBarcode';
import QRScannerSimple from '@/components/QR/QRScannerSimple';
import QRTestGenerator from '@/components/QR/QRTestGenerator';
import { QRCodeValidationResult } from '@/lib/qr-utils';

const QRTest = () => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeScanner, setActiveScanner] = useState<'webcam' | 'yudiel' | 'barcode' | 'simple'>('simple');
  const [lastScanResult, setLastScanResult] = useState<QRCodeValidationResult | null>(null);

  const handleScanSuccess = (result: QRCodeValidationResult) => {
    console.log('QR Scan Result:', result);
    setLastScanResult(result);
    setIsScannerOpen(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code Generator */}
        <QRTestGenerator />

        {/* QR Scanner Test */}
        <Card>
          <CardHeader>
            <CardTitle>QR Scanner Test</CardTitle>
            <CardDescription>
              Test different QR scanner implementations to find the best one
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={activeScanner} onValueChange={(value) => setActiveScanner(value as any)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="simple">Simple</TabsTrigger>
                <TabsTrigger value="yudiel">@yudiel</TabsTrigger>
                <TabsTrigger value="barcode">Barcode</TabsTrigger>
                <TabsTrigger value="webcam">Webcam</TabsTrigger>
              </TabsList>
              
              <TabsContent value="simple" className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <strong>react-qr-scanner:</strong> Simple and reliable QR scanner component
                </div>
                <div className="flex gap-4">
                  <Button onClick={() => setIsScannerOpen(true)}>
                    Test Simple Scanner
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setLastScanResult(null)}
                  >
                    Clear Results
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="yudiel" className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <strong>@yudiel/react-qr-scanner:</strong> Modern React component with pause/resume features
                </div>
                <div className="flex gap-4">
                  <Button onClick={() => setIsScannerOpen(true)}>
                    Test @yudiel Scanner
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setLastScanResult(null)}
                  >
                    Clear Results
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="barcode" className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <strong>react-qr-barcode-scanner:</strong> Supports both QR codes and barcodes
                </div>
                <div className="flex gap-4">
                  <Button onClick={() => setIsScannerOpen(true)}>
                    Test Barcode Scanner
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setLastScanResult(null)}
                  >
                    Clear Results
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="webcam" className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <strong>react-webcam + qr-scanner:</strong> Custom implementation with react-webcam
                </div>
                <div className="flex gap-4">
                  <Button onClick={() => setIsScannerOpen(true)}>
                    Test Webcam Scanner
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setLastScanResult(null)}
                  >
                    Clear Results
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {lastScanResult && (
              <div className="p-4 border rounded-lg bg-muted">
                <h3 className="font-semibold mb-2">Last Scan Result:</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Scanner:</strong> {activeScanner}</p>
                  <p><strong>Valid:</strong> {lastScanResult.isValid ? 'Yes' : 'No'}</p>
                  {lastScanResult.eventId && (
                    <p><strong>Event ID:</strong> {lastScanResult.eventId}</p>
                  )}
                  {lastScanResult.metadata && (
                    <div>
                      <p><strong>Event Title:</strong> {lastScanResult.metadata.eventTitle}</p>
                      <p><strong>Club Name:</strong> {lastScanResult.metadata.clubName}</p>
                      <p><strong>Location:</strong> {lastScanResult.metadata.location}</p>
                    </div>
                  )}
                  {lastScanResult.error && (
                    <p className="text-red-600"><strong>Error:</strong> {lastScanResult.error}</p>
                  )}
                </div>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              <h4 className="font-medium mb-2">Test Instructions:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Generate a QR code using the form on the left</li>
                <li>Try each scanner implementation to see which works best</li>
                <li>Check the browser console for detailed logs</li>
                <li>Test on both mobile and desktop if possible</li>
                <li>Note which scanner gives the best camera access and scanning performance</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conditional Scanner Rendering */}
      {activeScanner === 'simple' && (
        <QRScannerSimple
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
          title="Test Simple QR Scanner"
          description="Test the react-qr-scanner implementation"
        />
      )}
      
      {activeScanner === 'yudiel' && (
        <QRScannerYudiel
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
          title="Test @yudiel QR Scanner"
          description="Test the @yudiel/react-qr-scanner implementation"
        />
      )}
      
      {activeScanner === 'barcode' && (
        <QRScannerBarcode
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
          title="Test Barcode QR Scanner"
          description="Test the react-qr-barcode-scanner implementation"
        />
      )}
      
      {activeScanner === 'webcam' && (
        <QRScannerWebcam
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
          title="Test Webcam QR Scanner"
          description="Test the react-webcam based QR scanner"
        />
      )}
    </div>
  );
};

export default QRTest;
