import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Clock, BarChart3, QrCode, UserCheck, Pencil } from 'lucide-react';
import { getGradientFromPoster, extractColorsFromImage, generateGradient } from '@/lib/color-extraction';
import { saveGradientColors, loadGradientColors } from '@/lib/gradient-persistence';
import { format } from 'date-fns';

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string;
  start_time: string;
  end_time: string;
  capacity: number;
  is_team_event: boolean;
  club_id: string;
  event_image_url?: string | null;
  gradient_colors?: any;
  gradient_css?: string | null;
  clubs: {
    name: string;
  };
  registrations: Array<{
    id: string;
    profile_id: string;
  }>;
}

interface EventCardProps {
  event: Event;
  posterUrl?: string | null;
  onViewDetails?: (event: Event) => void;
  onEdit?: (event: Event) => void;
  onViewAnalytics?: (event: Event) => void;
  onCheckIn?: (event: Event) => void;
  canEdit?: boolean;
  canViewAnalytics?: boolean;
  canCheckIn?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  posterUrl,
  onViewDetails,
  onEdit,
  onViewAnalytics,
  onCheckIn,
  canEdit = false,
  canViewAnalytics = false,
  canCheckIn = false,
}) => {
  const [gradientBackground, setGradientBackground] = useState<string>('');
  const [isLoadingGradient, setIsLoadingGradient] = useState(true);

  useEffect(() => {
    const loadGradient = async () => {
      setIsLoadingGradient(true);
      try {
        // First, try to use cached gradient
        if (event.gradient_css) {
          setGradientBackground(event.gradient_css);
          setIsLoadingGradient(false);
          return;
        }

        // If no cached gradient, try to load from database
        const { gradientCss } = await loadGradientColors(event.id);
        if (gradientCss) {
          setGradientBackground(gradientCss);
          setIsLoadingGradient(false);
          return;
        }

        // If no cached gradient exists, extract from image and save
        const imageUrl = posterUrl || event.event_image_url;
        if (imageUrl) {
          const colors = await extractColorsFromImage(imageUrl);
          const gradient = generateGradient(colors);
          
          // Save to database for future use
          try {
            await saveGradientColors(event.id, colors, gradient);
          } catch (saveError) {
            console.warn('Failed to save gradient colors:', saveError);
          }
          
          setGradientBackground(gradient);
        } else {
          // No image available, use fallback
          setGradientBackground('linear-gradient(135deg, hsl(222.2 47.4% 11.2% / 0.8), hsl(210 40% 96.1% / 0.8))');
        }
      } catch (error) {
        console.warn('Failed to load gradient for event:', event.title, error);
        // Set fallback gradient
        setGradientBackground('linear-gradient(135deg, hsl(222.2 47.4% 11.2% / 0.8), hsl(210 40% 96.1% / 0.8))');
      } finally {
        setIsLoadingGradient(false);
      }
    };

    loadGradient();
  }, [posterUrl, event.event_image_url, event.id, event.gradient_css]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'h:mm a');
    } catch {
      return 'Invalid time';
    }
  };

  const isEventFull = event.registrations.length >= event.capacity;

  return (
    <Card 
      className={`
        hover:shadow-lg transition-all duration-300 ease-out elevate-card event-card-gradient
        ${isLoadingGradient ? 'opacity-90' : ''}
      `}
      style={{
        background: gradientBackground,
        backgroundBlendMode: 'multiply',
      }}
    >
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/80 to-background/90 rounded-lg pointer-events-none" />
      
      <CardHeader className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg text-foreground drop-shadow-sm">
              {event.title}
            </CardTitle>
            <CardDescription className="mt-1 text-foreground/80">
              {event.clubs.name}
            </CardDescription>
          </div>
          <Badge 
            variant={event.is_team_event ? 'secondary' : 'outline'}
            className="bg-white/90 text-foreground border-foreground/20"
          >
            {event.is_team_event ? 'Team' : 'Individual'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 relative z-10">
        {event.description && (
          <p className="text-sm text-foreground/90 line-clamp-2">
            {event.description}
          </p>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center text-sm text-foreground/80">
            <Calendar className="h-4 w-4 mr-2" />
            {formatDate(event.start_time)}
          </div>
          
          <div className="flex items-center text-sm text-foreground/80">
            <Clock className="h-4 w-4 mr-2" />
            {formatTime(event.start_time)} - {formatTime(event.end_time)}
          </div>
          
          <div className="flex items-center text-sm text-foreground/80">
            <MapPin className="h-4 w-4 mr-2" />
            {event.location}
          </div>
          
          <div className="flex items-center text-sm text-foreground/80">
            <Users className="h-4 w-4 mr-2" />
            {event.registrations.length}/{event.capacity} registered
            {isEventFull && (
              <Badge variant="destructive" className="ml-2 text-xs">
                Full
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails?.(event)}
            className="bg-white/90 text-foreground border-foreground/20 hover:bg-white/95"
          >
            View Details
          </Button>
          
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit?.(event)}
              className="bg-white/90 text-foreground border-foreground/20 hover:bg-white/95"
            >
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
          
          {canViewAnalytics && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewAnalytics?.(event)}
              className="bg-white/90 text-foreground border-foreground/20 hover:bg-white/95"
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Analytics
            </Button>
          )}
          
          {canCheckIn && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCheckIn?.(event)}
              className="bg-white/90 text-foreground border-foreground/20 hover:bg-white/95"
            >
              <UserCheck className="h-4 w-4 mr-1" />
              Check In
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCard;
