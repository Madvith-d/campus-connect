import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getAttendanceStats } from '@/lib/attendance-utils';
import { BarChart3, Download, QrCode, UserCheck, Calendar, Clock, MapPin } from 'lucide-react';
import QRDisplay from '@/components/QR/QRDisplay';
import AttendanceCheckIn from '@/components/Events/AttendanceCheckIn';

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  location: string;
  start_time: string;
  end_time: string;
  is_team_event: boolean;
  club_id: string;
  clubs: { name: string };
}

const EventsAnalytics = () => {
  const { user, profile, loading } = useAuth();
  const { eventId } = useParams();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [attendees, setAttendees] = useState<Array<{ id: string; profile_id: string; name: string; usn: string; method: string; timestamp: string }>>([]);
  const [qrOpen, setQrOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!eventId) return;
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: evErr } = await supabase
          .from('events')
          .select('id, title, description, location, start_time, end_time, is_team_event, club_id, clubs(name)')
          .eq('id', eventId)
          .single();
        if (evErr) throw evErr;
        setEvent(data as any);

        const s = await getAttendanceStats(eventId);
        setStats(s);

        // Load full attendee list (logs + profiles)
        const { data: logs, error: logsErr } = await supabase
          .from('attendance_logs')
          .select('id, profile_id, method, timestamp')
          .eq('event_id', eventId)
          .order('timestamp', { ascending: false });
        if (logsErr) throw logsErr;
        const profileIds = Array.from(new Set((logs || []).map(l => l.profile_id)));
        let profileMap: Record<string, { name: string; usn: string }> = {};
        if (profileIds.length > 0) {
          const { data: profilesData, error: profilesErr } = await supabase
            .from('profiles')
            .select('user_id, name, usn')
            .in('user_id', profileIds);
          if (profilesErr) throw profilesErr;
          for (const p of profilesData || []) {
            profileMap[p.user_id] = { name: p.name, usn: p.usn };
          }
        }
        setAttendees((logs || []).map(l => ({
          id: l.id,
          profile_id: l.profile_id,
          name: profileMap[l.profile_id]?.name || 'Unknown',
          usn: profileMap[l.profile_id]?.usn || 'Unknown',
          method: l.method as any,
          timestamp: l.timestamp,
        })));
      } catch (e: any) {
        setError(e.message || 'Failed to load');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [eventId]);

  const refreshData = async () => {
    if (!eventId) return;
    const s = await getAttendanceStats(eventId);
    setStats(s);
    // Reload attendees list
    const { data: logs } = await supabase
      .from('attendance_logs')
      .select('id, profile_id, method, timestamp')
      .eq('event_id', eventId)
      .order('timestamp', { ascending: false });
    const profileIds = Array.from(new Set((logs || []).map((l: any) => l.profile_id)));
    let profileMap: Record<string, { name: string; usn: string }> = {};
    if (profileIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, name, usn')
        .in('user_id', profileIds);
      for (const p of profilesData || []) {
        profileMap[p.user_id] = { name: p.name, usn: p.usn };
      }
    }
    setAttendees((logs || []).map((l: any) => ({
      id: l.id,
      profile_id: l.profile_id,
      name: profileMap[l.profile_id]?.name || 'Unknown',
      usn: profileMap[l.profile_id]?.usn || 'Unknown',
      method: l.method as any,
      timestamp: l.timestamp,
    })));
  };

  const exportCsv = () => {
    const rows = [
      ['Name', 'USN', 'Method', 'Timestamp'],
      ...attendees.map(a => [a.name, a.usn, a.method, new Date(a.timestamp).toISOString()])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event?.title || 'event'}-attendance.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="flex items-center gap-2 text-xl sm:text-2xl"><BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" /> Analytics</h1>
            {event && (
              <p className="text-muted-foreground text-sm sm:text-base truncate">
                {event.clubs?.name} • {event.title}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQrOpen(true)}>
              <QrCode className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">QR</span>
            </Button>
            <Button size="sm" onClick={() => setCheckInOpen(true)}>
              <UserCheck className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Check-in</span>
            </Button>
          </div>
        </div>

        {isLoading && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">Loading analytics…</CardContent>
          </Card>
        )}

        {error && (
          <Card>
            <CardContent className="py-10 text-center text-red-500">{error}</CardContent>
          </Card>
        )}

        {event && (
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="truncate">{event.title}</span>
                <Badge variant={event.is_team_event ? 'secondary' : 'outline'} className="w-fit">
                  {event.is_team_event ? 'Team Event' : 'Individual Event'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center text-muted-foreground text-sm">
                <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{new Date(event.start_time).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center text-muted-foreground text-sm">
                <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{new Date(event.start_time).toLocaleTimeString()} - {new Date(event.end_time).toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center text-muted-foreground text-sm sm:col-span-2 lg:col-span-1">
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Registered</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl sm:text-3xl font-bold">{stats.totalRegistered}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Attended</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl sm:text-3xl font-bold">{stats.totalAttended}</div>
              </CardContent>
            </Card>
            <Card className="sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl sm:text-3xl font-bold">{stats.attendanceRate}%</div>
              </CardContent>
            </Card>
          </div>
        )}

        {stats && (
          <Card>
            <CardHeader><CardTitle>Recent Attendees</CardTitle></CardHeader>
            <CardContent>
              {stats.recentAttendees.length === 0 ? (
                <div className="text-sm text-muted-foreground">No attendance yet.</div>
              ) : (
                <div className="space-y-2">
                  {stats.recentAttendees.map((a: any) => (
                    <div key={a.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between border rounded-md px-3 py-2 gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{a.name} <span className="text-muted-foreground">({a.usn})</span></div>
                        <div className="text-xs text-muted-foreground">{new Date(a.timestamp).toLocaleString()}</div>
                      </div>
                      <Badge variant={a.method === 'self-scan' ? 'default' : a.method === 'staff-scan' ? 'secondary' : 'outline'} className="w-fit">
                        {a.method}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {attendees && (
          <Card>
            <CardHeader><CardTitle>All Attendees</CardTitle></CardHeader>
            <CardContent>
              {attendees.length === 0 ? (
                <div className="text-sm text-muted-foreground">No attendance logs yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="py-2 pr-2 sm:pr-4">Name</th>
                        <th className="py-2 pr-2 sm:pr-4 hidden sm:table-cell">USN</th>
                        <th className="py-2 pr-2 sm:pr-4">Method</th>
                        <th className="py-2 pr-2 sm:pr-4 hidden md:table-cell">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendees.map(a => (
                        <tr key={a.id} className="border-t">
                          <td className="py-2 pr-2 sm:pr-4">
                            <div className="truncate max-w-[120px] sm:max-w-none">
                              {a.name}
                              <div className="text-xs text-muted-foreground sm:hidden">{a.usn}</div>
                            </div>
                          </td>
                          <td className="py-2 pr-2 sm:pr-4 hidden sm:table-cell">{a.usn}</td>
                          <td className="py-2 pr-2 sm:pr-4">
                            <Badge variant={a.method === 'self-scan' ? 'default' : a.method === 'staff-scan' ? 'secondary' : 'outline'} className="text-xs">
                              {a.method}
                            </Badge>
                          </td>
                          <td className="py-2 pr-2 sm:pr-4 hidden md:table-cell">
                            <div className="text-xs">{new Date(a.timestamp).toLocaleString()}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <QRDisplay
          isOpen={qrOpen}
          onClose={() => setQrOpen(false)}
          eventId={event?.id || ''}
          eventTitle={event?.title || ''}
          clubName={event?.clubs?.name || ''}
          location={event?.location || ''}
          eventStartTime={event?.start_time || ''}
          eventEndTime={event?.end_time || ''}
        />

        <AttendanceCheckIn
          isOpen={checkInOpen}
          onClose={() => setCheckInOpen(false)}
          eventId={event?.id || ''}
          eventTitle={event?.title || ''}
          onAttendanceLogged={refreshData}
        />
      </div>
    </DashboardLayout>
  );
};

export default EventsAnalytics;


