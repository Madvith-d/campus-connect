import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, UserCheck, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRScanner from '@/components/QR/QRScanner';
import { processQRAttendance, manualAttendanceLog } from '@/lib/attendance-utils';
import { QRCodeValidationResult } from '@/lib/qr-utils';
import { supabase } from '@/integrations/supabase/client';

interface AttendanceCheckInProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  onAttendanceLogged?: () => void;
}

interface StudentProfile {
  user_id: string;
  name: string;
  usn: string;
  branch: string;
}

const AttendanceCheckIn = ({ 
  isOpen, 
  onClose, 
  eventId, 
  eventTitle,
  onAttendanceLogged 
}: AttendanceCheckInProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  // Scanner state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  
  // Manual entry state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [searchResults, setSearchResults] = useState<StudentProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLogging, setIsLogging] = useState(false);

  // Handle QR scan success
  const handleScanSuccess = async (result: QRCodeValidationResult) => {
    setIsScannerOpen(false);
    
    if (!result.isValid) {
      toast({
        title: "Invalid QR Code",
        description: result.error || "The QR code is not valid for attendance.",
        variant: "destructive",
      });
      return;
    }

    if (!profile) {
      toast({
        title: "Error",
        description: "User profile not found.",
        variant: "destructive",
      });
      return;
    }

    try {
      const attendanceResult = await processQRAttendance(
        JSON.stringify(result),
        profile.user_id,
        profile.role
      );

      if (attendanceResult.success) {
        toast({
          title: "Attendance Logged",
          description: `Successfully checked in to ${attendanceResult.eventTitle || 'the event'}.`,
        });
        setScanResult(`✓ Checked in to ${attendanceResult.eventTitle}`);
        onAttendanceLogged?.();
      } else {
        toast({
          title: "Check-in Failed",
          description: attendanceResult.error || "Failed to log attendance.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing attendance:', error);
      toast({
        title: "Error",
        description: "An error occurred while processing attendance.",
        variant: "destructive",
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
        title: "Search Error",
        description: "Failed to search for students.",
        variant: "destructive",
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
        toast({
          title: "Attendance Logged",
          description: `Successfully logged attendance for ${selectedStudent.name}.`,
        });
        setSelectedStudent(null);
        setSearchTerm('');
        setSearchResults([]);
        onAttendanceLogged?.();
      } else {
        toast({
          title: "Failed to Log Attendance",
          description: result.error || "Failed to log attendance manually.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error logging manual attendance:', error);
      toast({
        title: "Error",
        description: "An error occurred while logging attendance.",
        variant: "destructive",
      });
    } finally {
      setIsLogging(false);
    }
  };

  // Reset state when dialog closes
  const handleClose = () => {
    setScanResult(null);
    setSearchTerm('');
    setSelectedStudent(null);
    setSearchResults([]);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <UserCheck className="h-5 w-5 mr-2" />
              Check-in to Event
            </DialogTitle>
            <DialogDescription>
              Log attendance for {eventTitle}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="qr" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qr" className="flex items-center">
                <QrCode className="h-4 w-4 mr-2" />
                QR Scan
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center">
                <Search className="h-4 w-4 mr-2" />
                Manual Entry
              </TabsTrigger>
            </TabsList>

            <TabsContent value="qr" className="space-y-4">
              <div className="text-center py-6">
                {scanResult ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{scanResult}</AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Scan the event QR code to check in
                    </p>
                    <Button onClick={() => setIsScannerOpen(true)}>
                      <QrCode className="h-4 w-4 mr-2" />
                      Start QR Scanner
                    </Button>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              {profile?.role === 'student' ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Manual entry is only available for club administrators.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-search">Search Student</Label>
                    <Input
                      id="student-search"
                      placeholder="Enter student name or USN..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        searchStudents(e.target.value);
                      }}
                    />
                  </div>

                  {isSearching && (
                    <p className="text-sm text-muted-foreground">Searching...</p>
                  )}

                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      <Label>Select Student</Label>
                      <Select 
                        value={selectedStudent?.user_id || ''} 
                        onValueChange={(value) => {
                          const student = searchResults.find(s => s.user_id === value);
                          setSelectedStudent(student || null);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a student..." />
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
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-semibold">Selected Student:</h4>
                      <p>{selectedStudent.name}</p>
                      <p className="text-sm text-muted-foreground">
                        USN: {selectedStudent.usn} • Branch: {selectedStudent.branch}
                      </p>
                    </div>
                  )}

                  <Button 
                    onClick={handleManualLog}
                    disabled={!selectedStudent || isLogging}
                    className="w-full"
                  >
                    {isLogging ? "Logging..." : "Log Attendance"}
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <QRScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title="Scan Event QR Code"
        description="Position the event QR code within the camera view"
      />
    </>
  );
};

export default AttendanceCheckIn;