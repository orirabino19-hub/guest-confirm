import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CustomField {
  id: string;
  type: 'text' | 'select' | 'checkbox' | 'textarea' | 'menCounter' | 'womenCounter';
  label: string;
  labelEn: string;
  options?: string[];
  required: boolean;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  event_date?: string;
  location?: string;
  theme?: any;
  created_at: string;
  updated_at: string;
  languages?: string[];
  customFields?: CustomField[];
}

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setEvents(data || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "❌ שגיאה בטעינת אירועים",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (eventData: {
    title: string;
    description?: string;
    event_date?: string;
    location?: string;
    languages?: string[];
  }) => {
    try {
      // Separate languages from event data
      const { languages, ...eventFields } = eventData;
      
      // Generate a unique slug based on the title
      const baseSlug = eventData.title
        .toLowerCase()
        .replace(/[^\u0590-\u05FFa-z0-9\s]/g, '') // Keep Hebrew, English, numbers, spaces
        .trim()
        .replace(/\s+/g, '-')
        .substring(0, 50); // Limit length
      
      let slug = baseSlug;
      let slugExists = true;
      let counter = 1;
      
      // Check if slug already exists and increment if necessary
      while (slugExists) {
        const { data: existingEvent } = await supabase
          .from('events')
          .select('id')
          .eq('slug', slug)
          .single();
        
        if (!existingEvent) {
          slugExists = false;
        } else {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
      }
      
      const { data, error } = await supabase
        .from('events')
        .insert([{ ...eventFields, slug }])
        .select()
        .single();

      if (error) throw error;

      // Handle languages separately if provided
      if (languages && languages.length > 0) {
        const languageRecords = languages.map((locale, index) => ({
          event_id: data.id,
          locale,
          is_default: index === 0
        }));

        await supabase
          .from('event_languages')
          .insert(languageRecords);
      }

      // Add default custom fields for the new event
      const defaultFields = [
        {
          event_id: data.id,
          link_type: 'personal' as const,
          key: 'menCounter',
          label: '👨 מספר גברים',
          field_type: 'number' as const,
          required: false,
          order_index: 0
        },
        {
          event_id: data.id,
          link_type: 'personal' as const,
          key: 'womenCounter',
          label: '👩 מספר נשים',
          field_type: 'number' as const,
          required: false,
          order_index: 1
        },
        {
          event_id: data.id,
          link_type: 'open' as const,
          key: 'fullName',
          label: 'שם מלא',
          field_type: 'text' as const,
          required: true,
          order_index: 0
        },
        {
          event_id: data.id,
          link_type: 'open' as const,
          key: 'menCounter',
          label: '👨 מספר גברים',
          field_type: 'number' as const,
          required: false,
          order_index: 1
        },
        {
          event_id: data.id,
          link_type: 'open' as const,
          key: 'womenCounter',
          label: '👩 מספר נשים',
          field_type: 'number' as const,
          required: false,
          order_index: 2
        }
      ];

      await supabase
        .from('custom_fields_config')
        .insert(defaultFields);

      await fetchEvents();
      
      toast({
        title: "✅ אירוע נוצר בהצלחה",
        description: `האירוע "${eventData.title}" נוצר בהצלחה`
      });

      return data;
    } catch (err: any) {
      toast({
        title: "❌ שגיאה ביצירת אירוע",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  };

  const updateEvent = async (eventId: string, updates: Partial<Event>) => {
    try {
      const { error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', eventId);

      if (error) throw error;

      await fetchEvents();
      
      toast({
        title: "✅ אירוע עודכן",
        description: "האירוע עודכן בהצלחה"
      });
    } catch (err: any) {
      toast({
        title: "❌ שגיאה בעדכון אירוע",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      await fetchEvents();
      
      toast({
        title: "✅ אירוע נמחק",
        description: "האירוע וכל המוזמנים שלו נמחקו"
      });
    } catch (err: any) {
      toast({
        title: "❌ שגיאה במחיקת אירוע",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents
  };
};