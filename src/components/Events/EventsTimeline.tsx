import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin } from 'lucide-react';

interface TimelineEvent {
  id: string;
  title: string;
  description: string | null;
  location: string;
  start_time: string;
  end_time: string;
  clubs: {
    name: string;
  } | null;
}

const formatDateRange = (startIso: string, endIso: string) => {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
  const datePart = start.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const startTime = start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const endTime = end.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return sameDay ? `${datePart} • ${startTime} – ${endTime}` : `${datePart} ${startTime} → ${end.toLocaleDateString()} ${endTime}`;
};

const getRelative = (iso: string) => {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Started';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const SkeletonItem = () => (
  <div className="relative pl-8">
    <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
    <div className="absolute left-2.5 top-2 h-3 w-3 rounded-full bg-muted" />
    <div className="mb-6">
      <div className="h-5 w-40 bg-muted rounded mb-2" />
      <div className="h-4 w-64 bg-muted rounded mb-1" />
      <div className="h-4 w-52 bg-muted rounded" />
    </div>
  </div>
);

const EmptyState = () => (
  <div className="text-center py-8 text-muted-foreground">
    <Calendar className="mx-auto h-8 w-8 mb-2 opacity-70" />
    <p>No upcoming events</p>
  </div>
);

const EventsTimeline = () => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, description, location, start_time, end_time, clubs(name)')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(12);
      if (error) throw error;
      setEvents((data as any) || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const decorated = useMemo(() => events.map((ev, idx) => ({ ...ev, idx })), [events]);

  return (
    <Card className="elevate-card">
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>
            <SkeletonItem />
            <SkeletonItem />
            <SkeletonItem />
          </div>
        ) : error ? (
          <div className="text-sm text-destructive">{error}</div>
        ) : decorated.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
            <ul className="space-y-6">
              {decorated.map((ev) => (
                <li key={ev.id} className="relative pl-8">
                  <div
                    className={`absolute left-2 top-1.5 h-4 w-4 rounded-full ring-2 ring-background
                    ${ev.idx % 3 === 0 ? 'bg-primary' : ev.idx % 3 === 1 ? 'bg-secondary' : 'bg-accent'}`}
                  />
                  <div className="rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold leading-tight">{ev.title}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {ev.clubs?.name && (
                            <Badge variant="outline" className="text-[11px]">{ev.clubs.name}</Badge>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {getRelative(ev.start_time)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDateRange(ev.start_time, ev.end_time)}
                          </span>
                          {ev.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {ev.location}
                            </span>
                          )}
                        </div>
                        {ev.description && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{ev.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EventsTimeline;


