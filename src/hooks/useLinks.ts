import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Link {
  id: string;
  event_id: string;
  type: 'open' | 'personal';
  slug: string;
  is_active: boolean;
  max_uses?: number;
  uses_count: number;
  expires_at?: string;
  guest_id?: string;
  settings?: any;
  created_at: string;
  updated_at: string;
}

export const useLinks = (eventId?: string) => {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchLinks = async () => {
    try {
      setLoading(true);
      let query = supabase.from('links').select('*');
      
      if (eventId) {
        query = query.eq('event_id', eventId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setLinks(data || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "❌ שגיאה בטעינת קישורים",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createLink = async (linkData: {
    event_id: string;
    type: 'open' | 'personal';
    slug: string;
    guest_id?: string;
    max_uses?: number;
    expires_at?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('links')
        .insert([linkData])
        .select()
        .single();

      if (error) throw error;

      await fetchLinks();
      
      toast({
        title: "✅ קישור נוצר בהצלחה",
        description: "הקישור החדש זמין לשימוש"
      });

      return data;
    } catch (err: any) {
      toast({
        title: "❌ שגיאה ביצירת קישור",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  };

  const updateLink = async (linkId: string, updates: Partial<Link>) => {
    try {
      const { error } = await supabase
        .from('links')
        .update(updates)
        .eq('id', linkId);

      if (error) throw error;

      await fetchLinks();
      
      toast({
        title: "✅ קישור עודכן",
        description: "הקישור עודכן בהצלחה"
      });
    } catch (err: any) {
      toast({
        title: "❌ שגיאה בעדכון קישור",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  };

  const deleteLink = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      await fetchLinks();
      
      toast({
        title: "🗑️ קישור נמחק",
        description: "הקישור הוסר מהמערכת"
      });
    } catch (err: any) {
      toast({
        title: "❌ שגיאה במחיקת קישור",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchLinks();
    }
  }, [eventId]);

  return {
    links,
    loading,
    error,
    createLink,
    updateLink,
    deleteLink,
    refetch: fetchLinks
  };
};