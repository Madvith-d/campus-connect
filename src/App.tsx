import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Events from "./pages/Events";
import Clubs from "./pages/Clubs";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import EventsAnalytics from "./pages/EventsAnalytics";
import EventDetails from "./pages/EventDetails";
import ConfigSetup from "./components/ConfigSetup";
import ProtectedRoute from "@/components/Layout/ProtectedRoute";
import GradientDemo from "./components/Events/GradientDemo";

const queryClient = new QueryClient();

const App = () => {
  const [needsConfig, setNeedsConfig] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkConfiguration = async () => {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // Check if environment variables are properly set
      if (!url || !key || url.includes('localhost') || key === 'fallback_key') {
        setNeedsConfig(true);
        setIsChecking(false);
        return;
      }

      // Test connection
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { error } = await supabase.from('profiles').select('count').limit(1);
        
        if (error) {
          console.error('Configuration test failed:', error);
          setNeedsConfig(true);
        }
      } catch (error) {
        console.error('Configuration check error:', error);
        setNeedsConfig(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkConfiguration();
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-fadeIn">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Checking configuration...</p>
        </div>
      </div>
    );
  }

  if (needsConfig) {
    return <ConfigSetup />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events"
                element={
                  <ProtectedRoute>
                    <Events />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/:eventId"
                element={
                  <ProtectedRoute>
                    <EventDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/:eventId/analytics"
                element={
                  <ProtectedRoute>
                    <EventsAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clubs"
                element={
                  <ProtectedRoute>
                    <Clubs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/gradient-demo"
                element={
                  <ProtectedRoute>
                    <GradientDemo />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
