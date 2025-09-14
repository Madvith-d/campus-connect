import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ConfigStatus {
  isValid: boolean;
  url: string;
  hasAnonKey: boolean;
  connectionTest: 'pending' | 'success' | 'error';
  errorMessage?: string;
}

const ConfigSetup = () => {
  const [config, setConfig] = useState({
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  });
  
  const [status, setStatus] = useState<ConfigStatus>({
    isValid: false,
    url: config.url,
    hasAnonKey: !!config.anonKey,
    connectionTest: 'pending',
  });

  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    validateConfig();
  }, []);

  const validateConfig = () => {
    const isValid = !!(config.url && config.anonKey);
    setStatus(prev => ({
      ...prev,
      isValid,
      url: config.url,
      hasAnonKey: !!config.anonKey,
    }));
  };

  const testConnection = async () => {
    if (!config.url || !config.anonKey) {
      setStatus(prev => ({
        ...prev,
        connectionTest: 'error',
        errorMessage: 'Please provide both URL and API key',
      }));
      return;
    }

    setIsTesting(true);
    setStatus(prev => ({ ...prev, connectionTest: 'pending' }));

    try {
      // Test the connection
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        setStatus(prev => ({
          ...prev,
          connectionTest: 'error',
          errorMessage: error.message,
        }));
      } else {
        setStatus(prev => ({
          ...prev,
          connectionTest: 'success',
          errorMessage: undefined,
        }));
      }
    } catch (error: any) {
      setStatus(prev => ({
        ...prev,
        connectionTest: 'error',
        errorMessage: error.message || 'Connection failed',
      }));
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusIcon = () => {
    switch (status.connectionTest) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusMessage = () => {
    if (!status.isValid) {
      return 'Please configure your Supabase settings';
    }
    
    switch (status.connectionTest) {
      case 'success':
        return 'Connection successful! You can now use the application.';
      case 'error':
        return `Connection failed: ${status.errorMessage}`;
      default:
        return 'Click "Test Connection" to verify your settings';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">Campus Connect</h1>
          <p className="text-muted-foreground">Configuration Setup</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Supabase Configuration</CardTitle>
            <CardDescription>
              Configure your Supabase project settings to connect to the database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supabase-url">Supabase URL</Label>
                <Input
                  id="supabase-url"
                  type="url"
                  placeholder="https://your-project.supabase.co"
                  value={config.url}
                  onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground">
                  Your Supabase project URL from the project settings
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supabase-key">Supabase Anon Key</Label>
                <Input
                  id="supabase-key"
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={config.anonKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, anonKey: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground">
                  Your Supabase project anon/public key from the project settings
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button
                onClick={testConnection}
                disabled={isTesting || !status.isValid}
                className="flex items-center gap-2"
              >
                {isTesting ? 'Testing...' : 'Test Connection'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open Supabase Dashboard
              </Button>
            </div>

            <Alert className={status.connectionTest === 'error' ? 'border-red-200 bg-red-50' : 
                              status.connectionTest === 'success' ? 'border-green-200 bg-green-50' : 
                              'border-yellow-200 bg-yellow-50'}>
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <AlertDescription>
                  {getStatusMessage()}
                </AlertDescription>
              </div>
            </Alert>

            {status.connectionTest === 'success' && (
              <div className="text-center">
                <Button 
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  Continue to Application
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">1. Create a Supabase Project</h4>
              <p className="text-sm text-muted-foreground">
                Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">supabase.com/dashboard</a> and create a new project
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">2. Get Your Project Details</h4>
              <p className="text-sm text-muted-foreground">
                In your project settings, find the Project URL and anon/public key
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">3. Update Environment Variables</h4>
              <p className="text-sm text-muted-foreground">
                Update your <code className="bg-muted px-1 rounded">.env</code> file with the correct values:
              </p>
              <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here`}
              </pre>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">4. Run Database Migrations</h4>
              <p className="text-sm text-muted-foreground">
                Make sure to run the database migrations in the <code className="bg-muted px-1 rounded">supabase/migrations</code> folder
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConfigSetup;
