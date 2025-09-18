import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Clock, BarChart3, QrCode, UserCheck, Pencil } from 'lucide-react';
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
  const imageUrl = posterUrl || event.event_image_url || '';
  const hasImage = Boolean(imageUrl);

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
        hover:shadow-lg transition-all duration-300 ease-out elevate-card overflow-hidden
      `}
    >
      {/* Poster or fallback banner */}
      <div className="relative w-full h-32 sm:h-40 md:h-48">
        {hasImage ? (
          <>
            <img
              src={imageUrl}
              alt={`${event.title} poster`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full bg-black flex items-end p-3 sm:p-4">
            <h3 className="text-white font-heading text-lg sm:text-xl md:text-2xl tracking-tight">
              {event.title}
            </h3>
          </div>
        )}
      </div>
      
      <CardHeader className="relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {hasImage && (
              <CardTitle className="text-lg text-foreground">
                {event.title}
              </CardTitle>
            )}
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
        
        <div className="flex flex-wrap gap-1 sm:gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails?.(event)}
            className="bg-white/90 text-foreground border-foreground/20 hover:bg-white/95 flex-1 sm:flex-none"
          >
            <span className="hidden sm:inline">View Details</span>
            <span className="sm:hidden">Details</span>
          </Button>
          
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit?.(event)}
              className="bg-white/90 text-foreground border-foreground/20 hover:bg-white/95 flex-1 sm:flex-none"
            >
              <Pencil className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          )}
          
          {canViewAnalytics && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewAnalytics?.(event)}
              className="bg-white/90 text-foreground border-foreground/20 hover:bg-white/95 flex-1 sm:flex-none"
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Analytics</span>
            </Button>
          )}
          
          {canCheckIn && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCheckIn?.(event)}
              className="bg-white/90 text-foreground border-foreground/20 hover:bg-white/95 flex-1 sm:flex-none"
            >
              <UserCheck className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Check In</span>
              <span className="sm:hidden">Check</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCard;
