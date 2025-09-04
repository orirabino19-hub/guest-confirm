import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export interface RSVPSubmission {
  id: string;
  event_id: string;
  link_id?: string;
  guest_id?: string;
  full_name?: string;
  men_count: number;
  women_count: number;
  answers: Json;
  status: string;
  submitted_at: string;
  updated_at: string;
}

export const useRSVP = (eventId?: string) => {
  const [submissions, setSubmissions] = useState<RSVPSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      let query = supabase.from('rsvp_submissions').select('*');
      
      if (eventId) {
        query = query.eq('event_id', eventId);
      }
      
      const { data, error } = await query.order('submitted_at', { ascending: false });

      if (error) throw error;

      setSubmissions(data || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "❌ שגיאה בטעינת הגשות",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const submitRSVP = async (submissionData: {
    event_id: string;
    link_id?: string;
    guest_id?: string;
    full_name?: string;
    men_count: number;
    women_count: number;
    answers: Json;
  }) => {
    try {
      const { data, error } = await supabase
        .from('rsvp_submissions')
        .insert([submissionData])
        .select()
        .single();

      if (error) throw error;

      // Update guest if guest_id is provided
      if (submissionData.guest_id) {
        await supabase
          .from('guests')
          .update({
            men_count: submissionData.men_count,
            women_count: submissionData.women_count
          })
          .eq('id', submissionData.guest_id);
      }

      await fetchSubmissions();
      
      toast({
        title: "✅ אישור הגעה נשלח",
        description: "תודה על אישור ההגעה!"
      });

      return data;
    } catch (err: any) {
      toast({
        title: "❌ שגיאה בשליחת אישור",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchSubmissions();
    }
  }, [eventId]);

  return {
    submissions,
    loading,
    error,
    submitRSVP,
    refetch: fetchSubmissions
  };
};