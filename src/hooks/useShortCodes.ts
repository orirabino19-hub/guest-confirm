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

  // Resolve event code and phone to actual IDs
  const resolveShortCodes = async (eventCode: string, phone: string): Promise<ShortCodeMapping | null> => {
    try {
      console.log('🔍 Resolving event code and phone:', eventCode, phone);
      
      // Try to resolve event by short code
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id, short_code')
        .eq('short_code', eventCode)
        .maybeSingle();

      console.log('📅 Event lookup result:', { eventData, eventError, searchedFor: eventCode });

      if (!eventData) {
        // Fallback: check if eventCode is actually a UUID
        const { data: eventByUuid, error: uuidError } = await supabase
          .from('events')
          .select('id, short_code')
          .eq('id', eventCode)
          .maybeSingle();
        
        console.log('🆔 UUID lookup result:', eventByUuid, uuidError);
        
        if (!eventByUuid) return null;
        
        // If it's a UUID, check if phone exists in this event
        const { data: guestByPhone, error: phoneError } = await supabase
          .from('guests')
          .select('id, phone')
          .eq('event_id', eventByUuid.id)
          .eq('phone', phone)
          .maybeSingle();

        console.log('📱 Phone lookup result:', guestByPhone, phoneError);

        if (guestByPhone) {
          return {
            eventCode: eventByUuid.short_code || eventCode,
            eventId: eventByUuid.id,
            guestCode: phone, // Use phone as guest code
            guestId: guestByPhone.id
          };
        }
        return null;
      }

      // Look for guest by phone in this event
      const { data: guestData, error: guestError } = await supabase
        .from('guests')
        .select('id, phone')
        .eq('event_id', eventData.id)
        .eq('phone', phone)
        .maybeSingle();

      console.log('📱 Guest lookup by phone result:', { guestData, guestError, searchedFor: phone });

      if (!guestData) return null;

      const result = {
        eventCode: eventData.short_code,
        eventId: eventData.id,
        guestCode: phone, // Use phone as guest code
        guestId: guestData.id
      };
      
      console.log('✅ Successfully resolved event code and phone:', result);
      return result;

    } catch (err: any) {
      console.error('Error resolving event code and phone:', err);
      return null;
    }
  };

  // Get guest name by event code and phone
  const getGuestNameByEventCodeAndPhone = async (eventCode: string, phone: string): Promise<string | null> => {
    try {
      const mapping = await resolveShortCodes(eventCode, phone);
      if (!mapping) return null;

      const { data: guestData } = await supabase
        .from('guests')
        .select('full_name')
        .eq('id', mapping.guestId)
        .maybeSingle();

      return guestData?.full_name || null;

    } catch (err: any) {
      console.error('Error getting guest name by event code and phone:', err);
      return null;
    }
  };

  // Generate link using event short code and phone
  const generateShortLink = async (eventId: string, phone: string): Promise<string> => {
    try {
      // Get event short code
      const { data: eventData } = await supabase
        .from('events')
        .select('short_code')
        .eq('id', eventId)
        .maybeSingle();

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

      // Use phone directly instead of guest code
      return `https://fp-pro.info/rsvp/${eventData.short_code}/${phone}`;

    } catch (err: any) {
      console.error('Error generating short link:', err);
      // Fallback to old format
      return `https://fp-pro.info/rsvp/${eventId}/${phone}`;
    }
  };

  return {
    loading,
    error,
    generateMissingCodes,
    resolveShortCodes,
    getGuestNameByEventCodeAndPhone,
    generateShortLink
  };
};