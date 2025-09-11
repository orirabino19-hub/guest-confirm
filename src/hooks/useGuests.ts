import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Guest {
  id: string;
  event_id: string;
  full_name?: string; // Keep for backward compatibility
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  group_name?: string;
  language?: string;
  notes?: string;
  men_count: number;
  women_count: number;
  created_at: string;
  updated_at: string;
}

export const useGuests = (eventId?: string) => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchGuests = async () => {
    try {
      setLoading(true);
      let query = supabase.from('guests').select('*');
      
      if (eventId) {
        query = query.eq('event_id', eventId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setGuests(data || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "❌ שגיאה בטעינת אורחים",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createGuest = async (guestData: {
    event_id: string;
    first_name?: string;
    last_name?: string;
    full_name?: string; // Keep for backward compatibility
    phone?: string;
    email?: string;
    men_count?: number;
    women_count?: number;
  }) => {
    try {
      const { error } = await supabase
        .from('guests')
        .insert([
          {
            ...guestData,
            men_count: guestData.men_count || 0,
            women_count: guestData.women_count || 0,
          },
        ]);

      if (error) throw error;

      await fetchGuests();
      
      const guestName = guestData.full_name || `${guestData.first_name || ''} ${guestData.last_name || ''}`.trim();
      toast({
        title: "✅ אורח נוסף בהצלחה",
        description: `נוסף אורח: ${guestName}`
      });

      return;
    } catch (err: any) {
      toast({
        title: "❌ שגיאה בהוספת אורח",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  };

  const updateGuest = async (guestId: string, updates: Partial<Guest>) => {
    try {
      const { error } = await supabase
        .from('guests')
        .update(updates)
        .eq('id', guestId);

      if (error) throw error;

      await fetchGuests();
      
      toast({
        title: "✅ אורח עודכן",
        description: "פרטי האורח עודכנו בהצלחה"
      });
    } catch (err: any) {
      toast({
        title: "❌ שגיאה בעדכון אורח",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  };

  const deleteGuest = async (guestId: string) => {
    try {
      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', guestId);

      if (error) throw error;

      await fetchGuests();
      
      toast({
        title: "🗑️ אורח נמחק",
        description: "האורח הוסר מהרשימה"
      });
    } catch (err: any) {
      toast({
        title: "❌ שגיאה במחיקת אורח",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchGuests();
  }, [eventId]);

  return {
    guests,
    loading,
    error,
    createGuest,
    updateGuest,
    deleteGuest,
    refetch: fetchGuests
  };
};