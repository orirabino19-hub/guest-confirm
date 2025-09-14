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
      console.log('🔍 Attempting login with:', { username, password });
      
      // First, let's check what events exist with this username
      const { data: allWithUsername, error: usernameError } = await supabase
        .from('events')
        .select('id, title, client_username, client_password, client_access_enabled')
        .eq('client_username', username);
      
      console.log('🔍 Events with matching username:', allWithUsername);
      
      // Now check with both username and password
      const { data: withPassword, error: passwordError } = await supabase
        .from('events')
        .select('id, title, client_username, client_password, client_access_enabled')
        .eq('client_username', username)
        .eq('client_password', password);
      
      console.log('🔍 Events with matching username and password:', withPassword);
      
      // Finally, check with all conditions
      const { data, error } = await supabase
        .from('events')
        .select('id, title, client_access_enabled')
        .eq('client_username', username)
        .eq('client_password', password)
        .eq('client_access_enabled', true)
        .single();

      console.log('🔍 Final database response:', { data, error });

      if (error || !data) {
        console.log('🔍 Login failed - no matching event found');
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