import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { QrCode, UserCheck, Search, CheckCircle, AlertCircle, Clock, Shield, Users, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRScannerFixed from '@/components/QR/QRScannerFixed';
import { processQRAttendance, manualAttendanceLog, getAttendanceStats, AttendanceResult, AttendanceStats } from '@/lib/attendance-utils';
import { QRCodeValidationResult } from '@/lib/qr-utils-enhanced';
import { supabase } from '@/integrations/supabase/client';

interface AttendanceCheckInEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  eventStartTime: string;
  eventEndTime: string;
  onAttendanceLogged?: () => void;
}

interface StudentProfile {
  user_id: string;
  name: string;
  usn: string;
  branch: string;
}

interface AttendanceRecord {
  id: string;
  studentName: string;
  studentUSN: string;
  method: string;
  timestamp: string;
  validationDetails?: {
    hashValid: boolean;
    timeValid: boolean;
    formatValid: boolean;
    replayCheck: boolean;
  };
}

const AttendanceCheckInEnhanced = ({ 
  isOpen, 
  onClose, 
  eventId, 
  eventTitle,
  eventStartTime,
  eventEndTime,
  onAttendanceLogged 
}: AttendanceCheckInEnhancedProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  // Scanner state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanResults, setScanResults] = useState<AttendanceRecord[]>([]);
  
  // Manual entry state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [searchResults, setSearchResults] = useState<StudentProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  
  // Statistics state
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Load attendance statistics
  const loadAttendanceStats = async () => {
    setIsLoadingStats(true);
    try {
      const stats = await getAttendanceStats(eventId);
      setAttendanceStats(stats);
    } catch (error) {
      console.error('Error loading attendance stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Handle QR scan success with enhanced validation
  const handleScanSuccess = async (result: QRCodeValidationResult) => {
    setIsScannerOpen(false);
    
    if (!result.isValid) {
      toast({
        title: \"Invalid QR Code\",
        description: result.error || \"The QR code is not valid for attendance.\",
        variant: \"destructive\",
      });
      return;
    }

    if (!profile) {
      toast({
        title: \"Error\",
        description: \"User profile not found.\",
        variant: \"destructive\",
      });
      return;
    }

    try {
      const attendanceResult: AttendanceResult = await processQRAttendance(
        JSON.stringify(result),
        profile.user_id,
        profile.role
      );

      if (attendanceResult.success) {
        // Add to scan results for display
        const newRecord: AttendanceRecord = {
          id: attendanceResult.attendanceId || Date.now().toString(),
          studentName: profile.name,
          studentUSN: profile.usn || 'N/A',
          method: profile.role === 'student' ? 'Self-Scan' : 'Staff-Scan',
          timestamp: new Date().toISOString(),
          validationDetails: attendanceResult.validationDetails
        };
        
        setScanResults(prev => [newRecord, ...prev]);
        
        toast({
          title: \"✅ Attendance Logged\",
          description: (
            <div className=\"space-y-2\">
              <p>Successfully checked in to {attendanceResult.eventTitle || eventTitle}.</p>
              {attendanceResult.validationDetails && (
                <div className=\"text-xs space-y-1\">
                  <div className=\"flex items-center space-x-2\">
                    <Shield className=\"h-3 w-3\" />
                    <span>Security validation passed</span>
                  </div>
                  <div className=\"grid grid-cols-2 gap-1 text-xs\">
                    <span className={attendanceResult.validationDetails.hashValid ? 'text-green-600' : 'text-red-600'}>
                      Hash: {attendanceResult.validationDetails.hashValid ? '✓' : '✗'}
                    </span>
                    <span className={attendanceResult.validationDetails.timeValid ? 'text-green-600' : 'text-red-600'}>
                      Time: {attendanceResult.validationDetails.timeValid ? '✓' : '✗'}
                    </span>
                    <span className={attendanceResult.validationDetails.formatValid ? 'text-green-600' : 'text-red-600'}>
                      Format: {attendanceResult.validationDetails.formatValid ? '✓' : '✗'}
                    </span>
                    <span className={attendanceResult.validationDetails.replayCheck ? 'text-green-600' : 'text-red-600'}>
                      Replay: {attendanceResult.validationDetails.replayCheck ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ),
        });
        
        loadAttendanceStats();
        onAttendanceLogged?.();
      } else {
        toast({
          title: \"Check-in Failed\",
          description: attendanceResult.error || \"Failed to log attendance.\",
          variant: \"destructive\",
        });
      }
    } catch (error) {
      console.error('Error processing attendance:', error);
      toast({
        title: \"Error\",
        description: \"An error occurred while processing attendance.\",
        variant: \"destructive\",
      });
    }
  };

  // Search for students
  const searchStudents = async (term: string) => {
    if (!term.trim() || term.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, usn, branch')
        .or(`name.ilike.%${term}%,usn.ilike.%${term}%`)
        .limit(10);

      if (error) throw error;

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching students:', error);
      toast({
        title: \"Search Error\",
        description: \"Failed to search for students.\",
        variant: \"destructive\",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Handle manual attendance logging
  const handleManualLog = async () => {
    if (!selectedStudent || !profile) return;

    setIsLogging(true);
    try {
      const result = await manualAttendanceLog(
        eventId,
        selectedStudent.user_id,
        profile.user_id
      );

      if (result.success) {
        // Add to scan results
        const newRecord: AttendanceRecord = {
          id: Date.now().toString(),
          studentName: selectedStudent.name,
          studentUSN: selectedStudent.usn,
          method: 'Manual Entry',
          timestamp: new Date().toISOString()
        };
        
        setScanResults(prev => [newRecord, ...prev]);
        
        toast({
          title: \"Attendance Logged\",
          description: `Successfully logged attendance for ${selectedStudent.name}.`,
        });
        
        setSelectedStudent(null);
        setSearchTerm('');
        setSearchResults([]);
        loadAttendanceStats();
        onAttendanceLogged?.();
      } else {
        toast({
          title: \"Failed to Log Attendance\",
          description: result.error || \"Failed to log attendance manually.\",
          variant: \"destructive\",
        });
      }
    } catch (error) {
      console.error('Error logging manual attendance:', error);
      toast({
        title: \"Error\",
        description: \"An error occurred while logging attendance.\",
        variant: \"destructive\",
      });
    } finally {
      setIsLogging(false);
    }
  };

  // Check if within check-in window
  const isWithinCheckInWindow = () => {
    const now = new Date();
    const start = new Date(eventStartTime);
    const end = new Date(eventEndTime);
    const checkInStart = new Date(start.getTime() - 60 * 60 * 1000); // 1 hour before
    const checkInEnd = new Date(end.getTime() + 60 * 60 * 1000); // 1 hour after
    
    return now >= checkInStart && now <= checkInEnd;
  };

  // Reset state when dialog closes
  const handleClose = () => {
    setScanResults([]);
    setSearchTerm('');
    setSelectedStudent(null);
    setSearchResults([]);
    setAttendanceStats(null);
    onClose();
  };

  // Load stats when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      loadAttendanceStats();
    }
  }, [isOpen]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className=\"sm:max-w-[700px] max-h-[85vh] overflow-y-auto\">
          <DialogHeader>
            <DialogTitle className=\"flex items-center justify-between\">
              <div className=\"flex items-center\">
                <UserCheck className=\"h-5 w-5 mr-2\" />
                Enhanced Event Check-in
              </div>
              <div className=\"flex items-center space-x-2\">
                {isWithinCheckInWindow() ? (
                  <Badge variant=\"default\" className=\"text-xs\">
                    <Clock className=\"h-3 w-3 mr-1\" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant=\"secondary\" className=\"text-xs\">
                    <Clock className=\"h-3 w-3 mr-1\" />
                    Outside Window
                  </Badge>
                )}
              </div>
            </DialogTitle>
            <DialogDescription>
              Secure attendance logging for {eventTitle}
            </DialogDescription>
          </DialogHeader>

          {/* Check-in window warning */}
          {!isWithinCheckInWindow() && (
            <Alert variant=\"destructive\">
              <AlertCircle className=\"h-4 w-4\" />
              <AlertDescription>
                Check-in is only available from 1 hour before the event start until 1 hour after the event ends.
              </AlertDescription>
            </Alert>
          )}

          {/* Attendance Statistics */}
          {attendanceStats && (
            <div className=\"grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg\">
              <div className=\"text-center\">
                <div className=\"text-2xl font-bold text-blue-600\">{attendanceStats.totalAttended}</div>
                <div className=\"text-xs text-muted-foreground\">Attended</div>
              </div>
              <div className=\"text-center\">
                <div className=\"text-2xl font-bold text-green-600\">{attendanceStats.totalRegistered}</div>
                <div className=\"text-xs text-muted-foreground\">Registered</div>
              </div>
              <div className=\"text-center\">
                <div className=\"text-2xl font-bold text-purple-600\">{attendanceStats.attendanceRate.toFixed(1)}%</div>
                <div className=\"text-xs text-muted-foreground\">Rate</div>
              </div>
            </div>
          )}

          <Tabs defaultValue=\"qr\" className=\"w-full\">
            <TabsList className=\"grid w-full grid-cols-3\">
              <TabsTrigger value=\"qr\" className=\"flex items-center\">
                <QrCode className=\"h-4 w-4 mr-2\" />
                QR Scan
              </TabsTrigger>
              <TabsTrigger value=\"manual\" className=\"flex items-center\">
                <Search className=\"h-4 w-4 mr-2\" />
                Manual
              </TabsTrigger>
              <TabsTrigger value=\"results\" className=\"flex items-center\">
                <TrendingUp className=\"h-4 w-4 mr-2\" />
                Results
              </TabsTrigger>
            </TabsList>

            <TabsContent value=\"qr\" className=\"space-y-4\">
              <div className=\"text-center py-6\">
                <QrCode className=\"h-12 w-12 text-muted-foreground mx-auto mb-4\" />
                <p className=\"text-muted-foreground mb-4\">
                  Scan the secure event QR code to check in
                </p>
                <div className=\"space-y-2\">
                  <Button 
                    onClick={() => setIsScannerOpen(true)}
                    disabled={!isWithinCheckInWindow()}
                    className=\"w-full\"
                  >
                    <QrCode className=\"h-4 w-4 mr-2\" />
                    Start Secure QR Scanner
                  </Button>
                  <p className=\"text-xs text-muted-foreground\">
                    Enhanced with security validation and replay protection
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value=\"manual\" className=\"space-y-4\">
              {profile?.role === 'student' ? (
                <Alert>
                  <AlertCircle className=\"h-4 w-4\" />
                  <AlertDescription>
                    Manual entry is only available for club administrators and staff.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className=\"space-y-4\">
                  <div className=\"space-y-2\">
                    <Label htmlFor=\"student-search\">Search Student</Label>
                    <Input
                      id=\"student-search\"
                      placeholder=\"Enter student name or USN...\"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        searchStudents(e.target.value);
                      }}
                    />
                  </div>

                  {isSearching && (
                    <p className=\"text-sm text-muted-foreground\">Searching...</p>
                  )}

                  {searchResults.length > 0 && (
                    <div className=\"space-y-2\">
                      <Label>Select Student</Label>
                      <Select 
                        value={selectedStudent?.user_id || ''} 
                        onValueChange={(value) => {
                          const student = searchResults.find(s => s.user_id === value);
                          setSelectedStudent(student || null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder=\"Choose a student...\" />
                        </SelectTrigger>
                        <SelectContent>
                          {searchResults.map((student) => (
                            <SelectItem key={student.user_id} value={student.user_id}>
                              {student.name} ({student.usn}) - {student.branch}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedStudent && (
                    <div className=\"bg-muted p-4 rounded-lg\">
                      <h4 className=\"font-semibold\">Selected Student:</h4>
                      <p>{selectedStudent.name}</p>
                      <p className=\"text-sm text-muted-foreground\">
                        USN: {selectedStudent.usn} • Branch: {selectedStudent.branch}
                      </p>
                    </div>
                  )}

                  <Button 
                    onClick={handleManualLog}
                    disabled={!selectedStudent || isLogging || !isWithinCheckInWindow()}
                    className=\"w-full\"
                  >
                    {isLogging ? \"Logging...\" : \"Log Attendance Manually\"}
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value=\"results\" className=\"space-y-4\">
              <div className=\"space-y-4\">
                <div className=\"flex items-center justify-between\">
                  <h4 className=\"font-semibold\">Recent Check-ins</h4>
                  <Badge variant=\"outline\">{scanResults.length} in session</Badge>
                </div>
                
                {scanResults.length === 0 ? (
                  <div className=\"text-center py-8 text-muted-foreground\">
                    <Users className=\"h-12 w-12 mx-auto mb-2 opacity-50\" />
                    <p>No check-ins recorded in this session</p>
                  </div>
                ) : (
                  <div className=\"space-y-2 max-h-60 overflow-y-auto\">
                    {scanResults.map((record) => (
                      <div key={record.id} className=\"flex items-center justify-between p-3 bg-muted rounded-lg\">
                        <div>
                          <p className=\"font-medium\">{record.studentName}</p>
                          <p className=\"text-sm text-muted-foreground\">
                            {record.studentUSN} • {record.method}
                          </p>
                        </div>
                        <div className=\"text-right\">
                          <p className=\"text-sm\">
                            {new Date(record.timestamp).toLocaleTimeString()}
                          </p>
                          {record.validationDetails && (
                            <div className=\"flex space-x-1 mt-1\">
                              <span className={`text-xs px-1 rounded ${record.validationDetails.hashValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                H
                              </span>
                              <span className={`text-xs px-1 rounded ${record.validationDetails.timeValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                T
                              </span>
                              <span className={`text-xs px-1 rounded ${record.validationDetails.formatValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                F
                              </span>
                              <span className={`text-xs px-1 rounded ${record.validationDetails.replayCheck ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                R
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className=\"flex gap-2 pt-4\">
            <Button variant=\"outline\" onClick={handleClose} className=\"flex-1\">
              Close
            </Button>
            <Button 
              onClick={loadAttendanceStats}
              variant=\"outline\"
              disabled={isLoadingStats}
              className=\"flex-1\"
            >
              {isLoadingStats ? \"Loading...\" : \"Refresh Stats\"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <QRScannerFixed
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title=\"Scan Secure Event QR Code\"
        description=\"Position the event QR code within the camera view for secure check-in\"
        preferredCamera=\"environment\"
      />
    </>
  );
};

export default AttendanceCheckInEnhanced;