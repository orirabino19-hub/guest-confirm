import { supabase } from '@/integrations/supabase/client';

export const activatePhoneNumberField = async (eventId: string) => {
  try {
    // Find and activate the Phone Number field for this event
    const { data: fields, error: fetchError } = await supabase
      .from('custom_fields_config')
      .select('*')
      .eq('event_id', eventId)
      .eq('label', 'Phone Number')
      .eq('is_active', false);

    if (fetchError) throw fetchError;

    if (!fields || fields.length === 0) {
      console.log('No inactive Phone Number field found');
      return { success: false, message: 'שדה לא נמצא' };
    }

    // Activate the field
    const { error: updateError } = await supabase
      .from('custom_fields_config')
      .update({ 
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', fields[0].id);

    if (updateError) throw updateError;

    console.log('✅ Phone Number field activated');
    return { success: true, message: 'השדה הופעל בהצלחה' };
  } catch (error: any) {
    console.error('Error activating field:', error);
    return { success: false, message: error.message };
  }
};
