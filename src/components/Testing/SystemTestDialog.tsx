import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TestTube, CheckCircle, XCircle, RefreshCw, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateEventQRCode, parseQRCodeData } from '@/lib/qr-utils-enhanced';
import { errorHandler, ErrorType } from '@/lib/error-handler';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  details?: string;
}

interface SystemTestDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SystemTestDialog = ({ isOpen, onClose }: SystemTestDialogProps) => {
  const { toast } = useToast();
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const updateTest = useCallback((name: string, result: Partial<TestResult>) => {
    setTests(prev => prev.map(test => 
      test.name === name ? { ...test, ...result } : test
    ));
  }, []);

  const runTest = useCallback(async (name: string, testFn: () => Promise<TestResult>) => {
    updateTest(name, { status: 'running' });
    const startTime = Date.now();
    
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      updateTest(name, { ...result, duration, status: result.status || 'passed' });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateTest(name, { status: 'failed', duration, error: errorMessage });
      return { name, status: 'failed' as const, error: errorMessage };
    }
  }, [updateTest]);

  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    
    const testList: TestResult[] = [
      { name: 'HTTPS Detection', status: 'pending' },
      { name: 'Camera Access', status: 'pending' },
      { name: 'QR Generation', status: 'pending' },
      { name: 'QR Validation', status: 'pending' },
      { name: 'Error Handling', status: 'pending' },
      { name: 'Database Connection', status: 'pending' }
    ];
    
    setTests(testList);
    
    const testFunctions = [
      // HTTPS Detection
      async () => {
        const isSecure = window.location.protocol === 'https:' || 
                         window.location.hostname === 'localhost';
        return {
          name: 'HTTPS Detection',
          status: isSecure ? 'passed' : 'failed',
          details: isSecure ? 'Secure connection' : 'HTTPS required'
        };
      },
      
      // Camera Access
      async () => {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const cameras = devices.filter(d => d.kind === 'videoinput');
          return {
            name: 'Camera Access',
            status: cameras.length > 0 ? 'passed' : 'failed',
            details: `Found ${cameras.length} camera(s)`
          };
        } catch (error) {
          return {
            name: 'Camera Access',
            status: 'failed',
            error: error instanceof Error ? error.message : 'Camera access failed'
          };
        }
      },
      
      // QR Generation
      async () => {
        try {
          const eventStart = new Date(Date.now() + 60 * 60 * 1000).toISOString();
          const eventEnd = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
          
          await generateEventQRCode(
            'test-event-id',
            'Test Event',
            'Test Club',
            'Test Location',
            eventStart,
            eventEnd
          );
          
          return {
            name: 'QR Generation',
            status: 'passed',
            details: 'QR code generated with security features'
          };
        } catch (error) {
          return {
            name: 'QR Generation',
            status: 'failed',
            error: error instanceof Error ? error.message : 'Generation failed'
          };
        }
      },
      
      // QR Validation
      async () => {
        const invalidResult = parseQRCodeData('invalid-json');
        return {
          name: 'QR Validation',
          status: !invalidResult.isValid ? 'passed' : 'failed',
          details: !invalidResult.isValid ? 'Invalid QR rejected' : 'Security issue'
        };
      },
      
      // Error Handling
      async () => {
        await errorHandler.logError('Test error', ErrorType.CAMERA);
        const stats = errorHandler.getErrorStats();
        return {
          name: 'Error Handling',
          status: 'passed',
          details: `Error logged, queue: ${stats.queueLength}`
        };
      },
      
      // Database Connection
      async () => {
        try {
          const { error } = await supabase.from('profiles').select('count').limit(1);
          return {
            name: 'Database Connection',
            status: !error ? 'passed' : 'failed',
            details: !error ? 'Connection successful' : error.message
          };
        } catch (error) {
          return {
            name: 'Database Connection',
            status: 'failed',
            error: error instanceof Error ? error.message : 'Connection failed'
          };
        }
      }
    ];
    
    try {
      for (let i = 0; i < testFunctions.length; i++) {
        await runTest(testList[i].name, testFunctions[i]);
        setProgress(((i + 1) / testFunctions.length) * 100);
      }
      
      toast({
        title: \"✅ Test Suite Complete\",
        description: \"All system tests have been executed.\",
      });
    } catch (error) {
      toast({
        title: \"❌ Test Suite Failed\",
        description: \"Some tests encountered critical errors.\",
        variant: \"destructive\",
      });
    } finally {
      setIsRunning(false);
    }
  }, [runTest, toast]);

  const stats = {
    total: tests.length,
    passed: tests.filter(t => t.status === 'passed').length,
    failed: tests.filter(t => t.status === 'failed').length,
    pending: tests.filter(t => t.status === 'pending').length
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className=\"sm:max-w-[600px] max-h-[80vh] overflow-y-auto\">
        <DialogHeader>
          <DialogTitle className=\"flex items-center\">
            <TestTube className=\"h-5 w-5 mr-2\" />
            System Validation & Testing
          </DialogTitle>
          <DialogDescription>
            Comprehensive testing of QR scanner and security systems
          </DialogDescription>
        </DialogHeader>

        <div className=\"space-y-6\">
          <Card>
            <CardHeader>
              <CardTitle className=\"flex items-center justify-between\">
                <span>Test Execution</span>
                <div className=\"flex items-center space-x-2\">
                  <Badge variant={stats.failed > 0 ? 'destructive' : stats.passed > 0 ? 'default' : 'secondary'}>
                    {stats.passed}/{stats.total} Passed
                  </Badge>
                  {isRunning && <Zap className=\"h-4 w-4 animate-pulse\" />}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className=\"space-y-4\">
              <Progress value={progress} className=\"w-full\" />
              
              <div className=\"grid grid-cols-4 gap-4 text-center\">
                <div>
                  <div className=\"text-2xl font-bold text-blue-600\">{stats.total}</div>
                  <div className=\"text-xs text-muted-foreground\">Total</div>
                </div>
                <div>
                  <div className=\"text-2xl font-bold text-green-600\">{stats.passed}</div>
                  <div className=\"text-xs text-muted-foreground\">Passed</div>
                </div>
                <div>
                  <div className=\"text-2xl font-bold text-red-600\">{stats.failed}</div>
                  <div className=\"text-xs text-muted-foreground\">Failed</div>
                </div>
                <div>
                  <div className=\"text-2xl font-bold text-gray-600\">{stats.pending}</div>
                  <div className=\"text-xs text-muted-foreground\">Pending</div>
                </div>
              </div>
              
              <Button 
                onClick={runAllTests} 
                disabled={isRunning}
                className=\"w-full\"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className=\"h-4 w-4 mr-2 animate-spin\" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <TestTube className=\"h-4 w-4 mr-2\" />
                    Run All Tests
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>Individual test outcomes and details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className=\"space-y-2\">
                {tests.map((test) => (
                  <div key={test.name} className=\"flex items-center justify-between p-3 border rounded\">
                    <div className=\"flex items-center space-x-2\">
                      {test.status === 'passed' && <CheckCircle className=\"h-4 w-4 text-green-600\" />}
                      {test.status === 'failed' && <XCircle className=\"h-4 w-4 text-red-600\" />}
                      {test.status === 'running' && <RefreshCw className=\"h-4 w-4 text-blue-600 animate-spin\" />}
                      {test.status === 'pending' && <div className=\"h-4 w-4 rounded-full bg-gray-300\" />}
                      
                      <span className=\"font-medium\">{test.name}</span>
                    </div>
                    
                    <div className=\"text-right text-sm\">
                      {test.duration && <div className=\"text-muted-foreground\">{test.duration}ms</div>}
                      {test.error && <div className=\"text-red-600 text-xs max-w-48 truncate\">{test.error}</div>}
                      {test.details && <div className=\"text-green-600 text-xs max-w-48 truncate\">{test.details}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className=\"flex gap-2 pt-4\">
          <Button variant=\"outline\" onClick={onClose} className=\"flex-1\">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SystemTestDialog;