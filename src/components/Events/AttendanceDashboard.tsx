import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Users, Clock, Download, RefreshCw, QrCode, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAttendanceStats, AttendanceStats } from '@/lib/attendance-utils';
import QRDisplay from '@/components/QR/QRDisplay';
import AttendanceCheckIn from './AttendanceCheckIn';

interface AttendanceDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  clubName: string;
  location: string;
  startTime: string;
  endTime: string;
}

const AttendanceDashboard = ({ 
  isOpen, 
  onClose, 
  eventId, 
  eventTitle, 
  clubName, 
  location,
  startTime,
  endTime
}: AttendanceDashboardProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQRDisplayOpen, setIsQRDisplayOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);

  // Load attendance stats
  const loadStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const attendanceStats = await getAttendanceStats(eventId);
      if (attendanceStats) {
        setStats(attendanceStats);
      } else {
        setError('Failed to load attendance statistics');
      }
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('Failed to load attendance statistics');
    } finally {
      setIsLoading(false);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get method badge variant
  const getMethodBadgeVariant = (method: string) => {
    switch (method) {
      case 'self-scan': return 'default';
      case 'staff-scan': return 'secondary';
      case 'manual': return 'outline';
      default: return 'outline';
    }
  };

  // Check if event is currently active
  const isEventActive = () => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    return now >= start && now <= end;
  };

  // Export attendance data
  const exportAttendance = () => {
    if (!stats) return;

    const csvContent = [
      ['Name', 'USN', 'Check-in Time', 'Method'],
      ...stats.recentAttendees.map(attendee => [
        attendee.name,
        attendee.usn,
        formatTime(attendee.timestamp),
        attendee.method
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${eventTitle}-attendance-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Attendance data has been exported to CSV.",
    });
  };

  // Load stats when dialog opens
  useEffect(() => {
    if (isOpen && eventId) {
      loadStats();
    }
  }, [isOpen, eventId]);

  // Auto-refresh stats every 30 seconds when dialog is open and event is active
  useEffect(() => {
    if (!isOpen || !isEventActive()) return;

    const interval = setInterval(() => {
      loadStats();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isOpen, eventId]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Attendance Dashboard
            </DialogTitle>
            <DialogDescription>
              Real-time attendance tracking for {eventTitle}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="attendees">Attendees</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin mr-2" />
                  <p>Loading attendance data...</p>
                </div>
              ) : stats ? (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Registered</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.totalRegistered}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Attended</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.totalAttended}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
                        <Progress value={stats.attendanceRate} className="mt-2" />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Event Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Event Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Event Period:</span>
                        <span className="text-sm font-medium">
                          {formatTime(startTime)} - {formatTime(endTime)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Status:</span>
                        <Badge variant={isEventActive() ? "default" : "secondary"}>
                          {isEventActive() ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : null}
            </TabsContent>

            <TabsContent value="attendees" className="space-y-4">
              {stats && stats.recentAttendees.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Check-ins</CardTitle>
                    <CardDescription>
                      Latest attendees (showing last 10)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.recentAttendees.map((attendee) => (
                        <div key={attendee.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{attendee.name}</p>
                            <p className="text-sm text-muted-foreground">
                              USN: {attendee.usn}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={getMethodBadgeVariant(attendee.method)}>
                              {attendee.method.replace('-', ' ')}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTime(attendee.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Attendees Yet</h3>
                    <p className="text-muted-foreground">
                      Attendance records will appear here as people check in.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">QR Code</CardTitle>
                    <CardDescription>
                      Display or download the event QR code
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => setIsQRDisplayOpen(true)} className="w-full">
                      <QrCode className="h-4 w-4 mr-2" />
                      Show QR Code
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Manual Check-in</CardTitle>
                    <CardDescription>
                      Manually check in attendees or scan QR codes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => setIsCheckInOpen(true)} className="w-full">
                      <UserCheck className="h-4 w-4 mr-2" />
                      Check-in Students
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Export Data</CardTitle>
                    <CardDescription>
                      Download attendance data as CSV
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={exportAttendance} 
                      disabled={!stats || stats.totalAttended === 0}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Refresh Data</CardTitle>
                    <CardDescription>
                      Manually refresh attendance statistics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={loadStats} disabled={isLoading} className="w-full">
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <QRDisplay
        isOpen={isQRDisplayOpen}
        onClose={() => setIsQRDisplayOpen(false)}
        eventId={eventId}
        eventTitle={eventTitle}
        clubName={clubName}
        location={location}
        eventStartTime={startTime}
        eventEndTime={endTime}
      />

      <AttendanceCheckIn
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        eventId={eventId}
        eventTitle={eventTitle}
        onAttendanceLogged={loadStats}
      />
    </>
  );
};

export default AttendanceDashboard;