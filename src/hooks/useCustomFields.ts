import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CustomFieldConfig {
  id: string;
  event_id: string;
  link_type: 'open' | 'personal';
  key: string;
  label: string;
  field_type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea';
  required: boolean;
  options?: any;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useCustomFields = (eventId?: string, linkType?: 'open' | 'personal') => {
  const [fields, setFields] = useState<CustomFieldConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchFields = async () => {
    if (!eventId) {
      setFields([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('custom_fields_config')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true);
      
      if (linkType) {
        query = query.eq('link_type', linkType);
      }
      
      const { data, error } = await query.order('order_index', { ascending: true });

      if (error) throw error;

      setFields(data || []);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "❌ שגיאה בטעינת שדות",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFields = async (updatedFields: Partial<CustomFieldConfig>[]) => {
    try {
      if (!eventId || !linkType) return;

      // First, deactivate all existing fields for this event and link type
      await supabase
        .from('custom_fields_config')
        .update({ is_active: false })
        .eq('event_id', eventId)
        .eq('link_type', linkType);

      // Then insert or update the new fields
      const fieldsToUpsert = updatedFields.map((field, index) => ({
        event_id: eventId,
        link_type: linkType,
        key: field.key || `field_${index}`,
        label: field.label || 'שדה',
        field_type: field.field_type || 'text',
        required: field.required || false,
        options: field.options,
        order_index: index,
        is_active: true
      }));

      const { error } = await supabase
        .from('custom_fields_config')
        .upsert(fieldsToUpsert, {
          onConflict: 'event_id, link_type, key'
        });

      if (error) throw error;

      await fetchFields();
      
      toast({
        title: "✅ שדות עודכנו",
        description: "השדות המותאמים אישית עודכנו בהצלחה"
      });
    } catch (err: any) {
      toast({
        title: "❌ שגיאה בעדכון שדות",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchFields();
  }, [eventId, linkType]);

  return {
    fields,
    loading,
    error,
    updateFields,
    refetch: fetchFields
  };
};