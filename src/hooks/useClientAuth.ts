import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface ClientAuthState {
  isAuthenticated: boolean;
  eventId: string | null;
  username: string | null;
  loading: boolean;
}

export const useClientAuth = () => {
  const [authState, setAuthState] = useState<ClientAuthState>({
    isAuthenticated: false,
    eventId: null,
    username: null,
    loading: true
  });

  useEffect(() => {
    // Check if there's a stored client session
    const storedSession = localStorage.getItem('client_session');
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        const now = new Date().getTime();
        
        // Check if session is still valid (24 hours)
        if (session.expires > now) {
          setAuthState({
            isAuthenticated: true,
            eventId: session.eventId,
            username: session.username,
            loading: false
          });
          return;
        } else {
          // Session expired
          localStorage.removeItem('client_session');
        }
      } catch (error) {
        console.error('Error parsing client session:', error);
        localStorage.removeItem('client_session');
      }
    }
    
    setAuthState(prev => ({ ...prev, loading: false }));
  }, []);

  const login = async (username: string, password: string) => {
    try {
      // Verify credentials against the events table
      const { data, error } = await supabase
        .from('events')
        .select('id, title')
        .eq('client_username', username)
        .eq('client_password', password)
        .eq('client_access_enabled', true)
        .single();

      if (error || !data) {
        throw new Error('שם משתמש או סיסמא שגויים');
      }

      // Create session that expires in 24 hours
      const session = {
        eventId: data.id,
        username: username,
        expires: new Date().getTime() + (24 * 60 * 60 * 1000) // 24 hours
      };

      localStorage.setItem('client_session', JSON.stringify(session));
      
      setAuthState({
        isAuthenticated: true,
        eventId: data.id,
        username: username,
        loading: false
      });

      return { success: true, eventId: data.id };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('client_session');
    setAuthState({
      isAuthenticated: false,
      eventId: null,
      username: null,
      loading: false
    });
  };

  return {
    ...authState,
    login,
    logout
  };
};