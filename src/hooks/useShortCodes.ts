import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ShortCodeMapping {
  eventCode: string;
  eventId: string;
  guestCode: string;
  guestId: string;
}

export const useShortCodes = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Generate short codes for existing events/guests that don't have them
  const generateMissingCodes = async () => {
    try {
      setLoading(true);
      
      // Generate codes for events without short_code
      const { data: eventsWithoutCodes } = await supabase
        .from('events')
        .select('id')
        .is('short_code', null);

      for (const event of eventsWithoutCodes || []) {
        const { data: newCode } = await supabase
          .rpc('generate_event_code');
        
        if (newCode) {
          await supabase
            .from('events')
            .update({ short_code: newCode })
            .eq('id', event.id);
        }
      }

      // Generate codes for guests without short_code
      const { data: guestsWithoutCodes } = await supabase
        .from('guests')
        .select('id, event_id')
        .is('short_code', null);

      for (const guest of guestsWithoutCodes || []) {
        const { data: newCode } = await supabase
          .rpc('generate_guest_code', { p_event_id: guest.event_id });
        
        if (newCode) {
          await supabase
            .from('guests')
            .update({ short_code: newCode })
            .eq('id', guest.id);
        }
      }

    } catch (err: any) {
      console.error('Error generating short codes:', err);
      setError(err.message);
      toast({
        title: "❌ שגיאה ביצירת קודים",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Resolve short codes to actual IDs
  const resolveShortCodes = async (eventCode: string, guestCode: string): Promise<ShortCodeMapping | null> => {
    try {
      // First try to resolve by short codes
      const { data: eventData } = await supabase
        .from('events')
        .select('id, short_code')
        .eq('short_code', eventCode)
        .single();

      if (!eventData) {
        // Fallback: check if eventCode is actually a UUID
        const { data: eventByUuid } = await supabase
          .from('events')
          .select('id, short_code')
          .eq('id', eventCode)
          .single();
        
        if (!eventByUuid) return null;
        
        // If it's a UUID, check if guest code is a phone number
        const { data: guestByPhone } = await supabase
          .from('guests')
          .select('id, short_code, phone')
          .eq('event_id', eventByUuid.id)
          .eq('phone', guestCode)
          .single();

        if (guestByPhone) {
          return {
            eventCode: eventByUuid.short_code || eventCode,
            eventId: eventByUuid.id,
            guestCode: guestByPhone.short_code || guestCode,
            guestId: guestByPhone.id
          };
        }
        return null;
      }

      // Look for guest by short code in this event
      const { data: guestData } = await supabase
        .from('guests')
        .select('id, short_code')
        .eq('event_id', eventData.id)
        .eq('short_code', guestCode)
        .single();

      if (!guestData) return null;

      return {
        eventCode: eventData.short_code,
        eventId: eventData.id,
        guestCode: guestData.short_code,
        guestId: guestData.id
      };

    } catch (err: any) {
      console.error('Error resolving short codes:', err);
      return null;
    }
  };

  // Get guest name by event and guest codes
  const getGuestNameByCodes = async (eventCode: string, guestCode: string): Promise<string | null> => {
    try {
      const mapping = await resolveShortCodes(eventCode, guestCode);
      if (!mapping) return null;

      const { data: guestData } = await supabase
        .from('guests')
        .select('full_name')
        .eq('id', mapping.guestId)
        .single();

      return guestData?.full_name || null;

    } catch (err: any) {
      console.error('Error getting guest name by codes:', err);
      return null;
    }
  };

  // Generate link using short codes
  const generateShortLink = async (eventId: string, phone: string): Promise<string> => {
    try {
      // Get event short code
      const { data: eventData } = await supabase
        .from('events')
        .select('short_code')
        .eq('id', eventId)
        .single();

      if (!eventData?.short_code) {
        // Generate code if missing
        const { data: newEventCode } = await supabase
          .rpc('generate_event_code');
        
        if (newEventCode) {
          await supabase
            .from('events')
            .update({ short_code: newEventCode })
            .eq('id', eventId);
          eventData.short_code = newEventCode;
        }
      }

      // Get guest short code
      const { data: guestData } = await supabase
        .from('guests')
        .select('short_code')
        .eq('event_id', eventId)
        .eq('phone', phone)
        .single();

      if (!guestData?.short_code) {
        // Generate code if missing
        const { data: newGuestCode } = await supabase
          .rpc('generate_guest_code', { p_event_id: eventId });
        
        if (newGuestCode) {
          await supabase
            .from('guests')
            .update({ short_code: newGuestCode })
            .eq('event_id', eventId)
            .eq('phone', phone);
          guestData.short_code = newGuestCode;
        }
      }

      return `${window.location.origin}/rsvp/${eventData.short_code}/${guestData.short_code}`;

    } catch (err: any) {
      console.error('Error generating short link:', err);
      // Fallback to old format
      return `${window.location.origin}/rsvp/${eventId}/${phone}`;
    }
  };

  return {
    loading,
    error,
    generateMissingCodes,
    resolveShortCodes,
    getGuestNameByCodes,
    generateShortLink
  };
};