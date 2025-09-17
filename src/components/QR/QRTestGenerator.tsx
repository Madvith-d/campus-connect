import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { generateEventQRCode } from '@/lib/qr-utils';

const QRTestGenerator = () => {
  const [eventId, setEventId] = useState('test-event-123');
  const [eventTitle, setEventTitle] = useState('Test Event');
  const [clubName, setClubName] = useState('Test Club');
  const [location, setLocation] = useState('Test Location');
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateTestQR = async () => {
    setIsGenerating(true);
    try {
      // Generate test event times (1 hour from now to 3 hours from now)
      const eventStartTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const eventEndTime = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
      
      const { qrImage: image } = await generateEventQRCode(
        eventId,
        eventTitle,
        clubName,
        location,
        eventStartTime,
        eventEndTime
      );
      setQrImage(image);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Test QR Code</CardTitle>
        <CardDescription>
          Generate a QR code for testing the scanner
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="eventId">Event ID</Label>
            <Input
              id="eventId"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="eventTitle">Event Title</Label>
            <Input
              id="eventTitle"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clubName">Club Name</Label>
            <Input
              id="clubName"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        <Button 
          onClick={generateTestQR} 
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? 'Generating...' : 'Generate QR Code'}
        </Button>

        {qrImage && (
          <div className="text-center space-y-4">
            <div className="bg-white p-4 rounded-lg inline-block">
              <img 
                src={qrImage} 
                alt="Test QR Code" 
                className="w-64 h-64 mx-auto"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Use this QR code to test the scanner
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QRTestGenerator;
