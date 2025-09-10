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
      console.log('🔍 [useShortCodes] Starting resolution for:', { eventCode, phone });
      
      // Try to resolve event by short code
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id, short_code')
        .eq('short_code', eventCode)
        .maybeSingle();

      console.log('📅 [useShortCodes] Event lookup result:', { 
        eventData, 
        eventError, 
        searchedFor: eventCode,
        queryType: 'by_short_code'
      });

      if (!eventData) {
        console.log('🔄 [useShortCodes] Event not found by short code, trying UUID fallback');
        // Fallback: check if eventCode is actually a UUID
        const { data: eventByUuid, error: uuidError } = await supabase
          .from('events')
          .select('id, short_code')
          .eq('id', eventCode)
          .maybeSingle();
        
        console.log('🆔 [useShortCodes] UUID lookup result:', { 
          eventByUuid, 
          uuidError,
          searchedFor: eventCode,
          queryType: 'by_uuid'
        });
        
        if (!eventByUuid) {
          console.log('❌ [useShortCodes] No event found at all, returning null');
          return null;
        }
        
        // If it's a UUID, check if phone exists in this event - using phone normalization
        const normalizedInputPhone = phone.replace(/\D/g, '');
        const { data: allGuestsUuid, error: phoneError } = await supabase
          .from('guests')
          .select('id, phone')
          .eq('event_id', eventByUuid.id);
        
        // Find guest by normalized phone matching
        const guestByPhone = allGuestsUuid?.find(guest => {
          const normalizedGuestPhone = (guest.phone || '').replace(/\D/g, '');
          return normalizedGuestPhone === normalizedInputPhone;
        });

        console.log('📱 [useShortCodes] Phone lookup result (UUID path):', { 
          guestByPhone, 
          phoneError, 
          searchedFor: phone,
          eventId: eventByUuid.id
        });

        if (guestByPhone) {
          const result = {
            eventCode: eventByUuid.short_code || eventCode,
            eventId: eventByUuid.id,
            guestCode: phone, // Use phone as guest code
            guestId: guestByPhone.id
          };
          console.log('✅ [useShortCodes] Successfully resolved (UUID path):', result);
          return result;
        }
        console.log('❌ [useShortCodes] No guest found for phone in UUID path');
        return null;
      }

      console.log('📞 [useShortCodes] Event found, now looking for guest by phone');
      // Look for guest by phone in this event - using phone normalization
      const normalizedInputPhone = phone.replace(/\D/g, '');
      const { data: allGuests, error: guestError } = await supabase
        .from('guests')
        .select('id, phone, full_name')
        .eq('event_id', eventData.id);
      
      // Find guest by normalized phone matching
      const guestData = allGuests?.find(guest => {
        const normalizedGuestPhone = (guest.phone || '').replace(/\D/g, '');
        return normalizedGuestPhone === normalizedInputPhone;
      });

      console.log('📱 [useShortCodes] Guest lookup by phone result:', { 
        guestData, 
        guestError, 
        searchedFor: phone,
        eventId: eventData.id
      });

      if (!guestData) {
        console.log('❌ [useShortCodes] No guest found for phone in this event');
        return null;
      }

      const result = {
        eventCode: eventData.short_code,
        eventId: eventData.id,
        guestCode: phone, // Use phone as guest code
        guestId: guestData.id
      };
      
      console.log('✅ [useShortCodes] Successfully resolved (normal path):', result);
      return result;

    } catch (err: any) {
      console.error('💥 [useShortCodes] Error resolving event code and phone:', err);
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
      // Get current domain
      const currentDomain = window.location.origin;
      
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
      return `${currentDomain}/rsvp/${eventData.short_code}/${phone}`;

    } catch (err: any) {
      console.error('Error generating short link:', err);
      // Fallback to old format
      const currentDomain = window.location.origin;
      return `${currentDomain}/rsvp/${eventId}/${phone}`;
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