import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getGradientFromPoster, extractColorsFromImage } from '@/lib/color-extraction';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';

const GradientDemo: React.FC = () => {
  const [imageUrl, setImageUrl] = useState('');
  const [gradientBackground, setGradientBackground] = useState('');
  const [extractedColors, setExtractedColors] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleExtractGradient = async () => {
    if (!imageUrl.trim()) return;

    setIsLoading(true);
    try {
      // Extract colors and generate gradient
      const colors = await extractColorsFromImage(imageUrl);
      const gradient = await getGradientFromPoster(imageUrl);
      
      setExtractedColors(colors);
      setGradientBackground(gradient);
    } catch (error) {
      console.error('Failed to extract gradient:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const demoEvent = {
    id: 'demo-1',
    title: 'Sample Event with Gradient',
    description: 'This is a demo event showcasing the gradient background extracted from the uploaded poster image.',
    location: 'Main Auditorium',
    start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
    capacity: 100,
    is_team_event: false,
    club_id: 'demo-club',
    clubs: { name: 'Demo Club' },
    registrations: [],
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Event Gradient Demo</h1>
        <p className="text-muted-foreground">
          Upload a poster image URL to see how gradient backgrounds are extracted and applied to event cards.
        </p>
      </div>

      {/* Image URL Input */}
      <Card>
        <CardHeader>
          <CardTitle>Extract Gradient from Image</CardTitle>
          <CardDescription>
            Enter an image URL to extract colors and generate a gradient background
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image-url">Image URL</Label>
            <Input
              id="image-url"
              placeholder="https://example.com/poster.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
          <Button onClick={handleExtractGradient} disabled={isLoading || !imageUrl.trim()}>
            {isLoading ? 'Extracting...' : 'Extract Gradient'}
          </Button>
        </CardContent>
      </Card>

      {/* Extracted Colors Display */}
      {extractedColors && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Colors</CardTitle>
            <CardDescription>Colors extracted from the image</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(extractedColors).map(([key, color]) => (
                color && (
                  <div key={key} className="text-center">
                    <div 
                      className="w-16 h-16 rounded-lg mx-auto mb-2 border"
                      style={{ backgroundColor: color as string }}
                    />
                    <p className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="text-xs text-muted-foreground">{color as string}</p>
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event Card with Gradient */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-center">Event Card with Extracted Gradient</h2>
        <div className="max-w-md mx-auto">
          <Card 
            className="hover:shadow-lg transition-all duration-300 ease-out elevate-card event-card-gradient"
            style={{
              background: gradientBackground || 'linear-gradient(135deg, hsl(222.2 47.4% 11.2% / 0.8), hsl(210 40% 96.1% / 0.8))',
              backgroundBlendMode: 'multiply',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/80 to-background/90 rounded-lg pointer-events-none" />
            
            <CardHeader className="relative z-10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg text-foreground drop-shadow-sm">
                    {demoEvent.title}
                  </CardTitle>
                  <CardDescription className="mt-1 text-foreground/80">
                    {demoEvent.clubs.name}
                  </CardDescription>
                </div>
                <Badge 
                  variant={demoEvent.is_team_event ? 'secondary' : 'outline'}
                  className="bg-white/90 text-foreground border-foreground/20"
                >
                  {demoEvent.is_team_event ? 'Team' : 'Individual'}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4 relative z-10">
              <p className="text-sm text-foreground/90 line-clamp-2">
                {demoEvent.description}
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm text-foreground/80">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(demoEvent.start_time).toLocaleDateString()}
                </div>
                
                <div className="flex items-center text-sm text-foreground/80">
                  <Clock className="h-4 w-4 mr-2" />
                  {new Date(demoEvent.start_time).toLocaleTimeString()} - {new Date(demoEvent.end_time).toLocaleTimeString()}
                </div>
                
                <div className="flex items-center text-sm text-foreground/80">
                  <MapPin className="h-4 w-4 mr-2" />
                  {demoEvent.location}
                </div>
                
                <div className="flex items-center text-sm text-foreground/80">
                  <Users className="h-4 w-4 mr-2" />
                  {demoEvent.registrations.length}/{demoEvent.capacity} registered
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/90 text-foreground border-foreground/20 hover:bg-white/95"
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">1. Color Extraction</h3>
            <p className="text-sm text-muted-foreground">
              The system uses node-vibrant to extract dominant colors from the poster image, 
              identifying vibrant, muted, and other color swatches.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">2. Gradient Generation</h3>
            <p className="text-sm text-muted-foreground">
              Two complementary colors are selected to create a smooth 135-degree linear gradient 
              that serves as the card background.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">3. Accessibility</h3>
            <p className="text-sm text-muted-foreground">
              A semi-transparent overlay ensures text remains readable while preserving the 
              visual impact of the gradient background.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">4. Persistence</h3>
            <p className="text-sm text-muted-foreground">
              Extracted colors and generated gradients are cached in the database to avoid 
              re-processing the same images on subsequent loads.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GradientDemo;
