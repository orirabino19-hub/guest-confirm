import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Settings, ArrowUp, ArrowDown } from 'lucide-react';
import { CustomField } from './EventManager';
import { supabase } from '@/integrations/supabase/client';

interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

interface OpenRSVPCustomFieldsProps {
  selectedEventId: string | null;
  customFields: CustomField[];
  onCustomFieldsUpdate: (fields: CustomField[]) => void;
}

const OpenRSVPCustomFields = ({ selectedEventId, customFields, onCustomFieldsUpdate }: OpenRSVPCustomFieldsProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [eventLanguages, setEventLanguages] = useState<LanguageConfig[]>([]);
  const [loadingLanguages, setLoadingLanguages] = useState(false);
  const [newField, setNewField] = useState<Partial<CustomField>>({
    type: 'text',
    label: '',
    labelEn: '',
    options: [],
    required: false,
    displayLocations: {
      regularInvitation: true,
      openLink: false,
      personalLink: false
    }
  });
  const { toast } = useToast();

  // Load event languages
  useEffect(() => {
    const loadEventLanguages = async () => {
      if (!selectedEventId) {
        setEventLanguages([]);
        return;
      }

      setLoadingLanguages(true);
      try {
        // Get event languages
        const { data: eventLangs, error: eventError } = await supabase
          .from('event_languages')
          .select('locale')
          .eq('event_id', selectedEventId);

        if (eventError) throw eventError;

        if (!eventLangs || eventLangs.length === 0) {
          // Default to he and en
          setEventLanguages([
            { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' },
            { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' }
          ]);
          return;
        }

        const locales = eventLangs.map(l => l.locale);

        // Get language details from system_languages
        const { data: systemLangs, error: systemError } = await supabase
          .from('system_languages')
          .select('code, name, native_name, flag')
          .in('code', locales);

        if (systemError) throw systemError;

        const languages = systemLangs?.map(lang => ({
          code: lang.code,
          name: lang.name,
          nativeName: lang.native_name,
          flag: lang.flag || '🌐'
        })) || [];

        setEventLanguages(languages);
      } catch (error) {
        console.error('Error loading languages:', error);
        // Fallback to default
        setEventLanguages([
          { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' },
          { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' }
        ]);
      } finally {
        setLoadingLanguages(false);
      }
    };

    loadEventLanguages();
  }, [selectedEventId]);

  const fieldTypes = [
    { value: 'text', label: 'טקסט חופשי', labelEn: 'Text Input' },
    { value: 'textarea', label: 'טקסט ארוך', labelEn: 'Long Text' },
    { value: 'select', label: 'בחירה מרשימה', labelEn: 'Select List' },
    { value: 'checkbox', label: 'תיבת סימון', labelEn: 'Checkbox' },
    { value: 'menCounter', label: 'מונה גברים', labelEn: 'Men Counter' },
    { value: 'womenCounter', label: 'מונה נשים', labelEn: 'Women Counter' },
    { value: 'fullName', label: 'שם מלא', labelEn: 'Full Name' },
    { value: 'guestName', label: 'שם אורח', labelEn: 'Guest Name' },
    { value: 'phone', label: 'טלפון', labelEn: 'Phone Number' },
    { value: 'email', label: 'אימייל', labelEn: 'Email Address' }
  ];


  const addQuickField = (type: 'fullName' | 'guestName' | 'phone' | 'email' | 'menCounter' | 'womenCounter') => {
    const quickFields = {
      fullName: {
        id: 'fullName',
        type: 'text' as const,
        label: 'שם מלא',
        labelEn: 'Full Name',
        required: true
      },
      guestName: {
        id: 'guestName',
        type: 'text' as const,
        label: 'שם האורח',
        labelEn: 'Guest Name',
        required: true
      },
      phone: {
        id: 'phone',
        type: 'text' as const,
        label: 'מספר טלפון',
        labelEn: 'Phone Number',
        required: false
      },
      email: {
        id: 'email',
        type: 'text' as const,
        label: 'כתובת אימייל',
        labelEn: 'Email Address',
        required: false
      },
      menCounter: {
        id: 'menCounter',
        type: 'menCounter' as const,
        label: '👨 מספר גברים',
        labelEn: '👨 Number of Men',
        required: false
      },
      womenCounter: {
        id: 'womenCounter',
        type: 'womenCounter' as const,
        label: '👩 מספר נשים',
        labelEn: '👩 Number of Women',
        required: false
      }
    };

    const fieldToAdd = quickFields[type];
    
    // Check if field already exists
    if (customFields.some(field => field.id === fieldToAdd.id)) {
      toast({
        title: "שדה כבר קיים",
        description: "השדה הזה כבר נמצא ברשימה",
        variant: "destructive"
      });
      return;
    }

    const updatedFields = [...customFields, fieldToAdd];
    onCustomFieldsUpdate(updatedFields);
    
    toast({
      title: "שדה נוסף",
      description: `נוסף שדה: ${fieldToAdd.label}`
    });
  };

  const resetForm = () => {
    setNewField({
      type: 'text',
      label: '',
      labelEn: '',
      options: [],
      required: false,
      displayLocations: {
        regularInvitation: true,
        openLink: true,  // ברירת מחדל - שדה יופיע בלינק פתוח
        personalLink: true  // ברירת מחדל - שדה יופיע בלינק אישי
      }
    });
    setEditingField(null);
  };

  const handleSaveField = () => {
    // Handle predefined field types with automatic labels
    const predefinedFields = {
      fullName: { label: 'שם מלא', labelEn: 'Full Name', required: true },
      guestName: { label: 'שם האורח', labelEn: 'Guest Name', required: true },
      phone: { label: 'מספר טלפון', labelEn: 'Phone Number', required: false },
      email: { label: 'כתובת אימייל', labelEn: 'Email Address', required: false }
    };

    let fieldLabel = newField.label;
    let fieldLabelEn = newField.labelEn;
    let fieldRequired = newField.required;

    // If it's a predefined field type, use the predefined labels
    if (newField.type && predefinedFields[newField.type as keyof typeof predefinedFields]) {
      const predefined = predefinedFields[newField.type as keyof typeof predefinedFields];
      fieldLabel = predefined.label;
      fieldLabelEn = predefined.labelEn;
      fieldRequired = predefined.required;
    } else {
      // Validate only the languages that are configured for this event
      const hasHebrew = eventLanguages.some(lang => lang.code === 'he');
      const hasEnglish = eventLanguages.some(lang => lang.code === 'en');
      
      const missingLanguages = [];
      
      if (hasHebrew && !newField.label?.trim()) {
        missingLanguages.push('עברית');
      }
      
      if (hasEnglish && !newField.labelEn?.trim()) {
        missingLanguages.push('אנגלית');
      }
      
      if (missingLanguages.length > 0) {
        toast({
          title: "שגיאה",
          description: `יש למלא את השדה ב${missingLanguages.join(' וב')}`,
          variant: "destructive"
        });
        return;
      }
      
      // Save the entered values
      fieldLabel = newField.label || '';
      fieldLabelEn = newField.labelEn || '';
    }

    // Collect all language labels - save all that were entered, even if not required
    const labels: Record<string, string> = {};
    eventLanguages.forEach(lang => {
      if (lang.code !== 'he' && lang.code !== 'en') {
        const labelValue = (newField as any)[`label_${lang.code}`];
        if (labelValue?.trim()) {
          labels[lang.code] = labelValue;
        }
      }
    });

    // Use entered values or fallback to empty string to preserve data
    const finalLabel = fieldLabel || newField.label || '';
    const finalLabelEn = fieldLabelEn || newField.labelEn || '';

    const fieldData: CustomField = {
      id: editingField?.id || (predefinedFields[newField.type as keyof typeof predefinedFields] ? newField.type : Date.now().toString()),
      type: newField.type as CustomField['type'],
      label: finalLabel,
      labelEn: finalLabelEn,
      labels: Object.keys(labels).length > 0 ? labels : undefined,
      options: newField.type === 'select' ? newField.options : undefined,
      required: fieldRequired || false,
      displayLocations: newField.displayLocations || {
        regularInvitation: true,
        openLink: true,  // ברירת מחדל - שדה יופיע בלינק פתוח
        personalLink: true  // ברירת מחדל - שדה יופיע בלינק אישי
      }
    };

    let updatedFields: CustomField[];
    
    if (editingField) {
      updatedFields = customFields.map(field => 
        field.id === editingField.id ? fieldData : field
      );
    } else {
      updatedFields = [...customFields, fieldData];
    }

    onCustomFieldsUpdate(updatedFields);
    
    toast({
      title: editingField ? "שדה עודכן" : "שדה נוסף",
      description: editingField ? "השדה עודכן בהצלחה" : "השדה נוסף בהצלחה"
    });

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEditField = (field: CustomField) => {
    setEditingField(field);
    const newFieldData: any = {
      type: field.type,
      label: field.label,
      labelEn: field.labels?.en || field.labelEn, // Get English from labels.en if exists
      options: field.options || [],
      required: field.required,
      displayLocations: field.displayLocations || {
        regularInvitation: true,
        openLink: true,
        personalLink: true
      }
    };
    
    // Add additional language labels (skip 'en' as it's already in labelEn)
    if (field.labels) {
      Object.entries(field.labels).forEach(([langCode, labelValue]) => {
        if (langCode !== 'en') {
          newFieldData[`label_${langCode}`] = labelValue;
        }
      });
    }
    
    setNewField(newFieldData);
    setIsDialogOpen(true);
  };

  const handleDeleteField = (fieldId: string) => {
    const updatedFields = customFields.filter(field => field.id !== fieldId);
    onCustomFieldsUpdate(updatedFields);
    
    toast({
      title: "שדה נמחק",
      description: "השדה הוסר בהצלחה"
    });
  };

  const moveFieldUp = (fieldId: string) => {
    const currentIndex = customFields.findIndex(field => field.id === fieldId);
    if (currentIndex > 0) {
      const updatedFields = [...customFields];
      [updatedFields[currentIndex - 1], updatedFields[currentIndex]] = 
        [updatedFields[currentIndex], updatedFields[currentIndex - 1]];
      onCustomFieldsUpdate(updatedFields);
      
      toast({
        title: "הסדר שונה",
        description: "השדה הועבר למעלה"
      });
    }
  };

  const moveFieldDown = (fieldId: string) => {
    const currentIndex = customFields.findIndex(field => field.id === fieldId);
    if (currentIndex < customFields.length - 1) {
      const updatedFields = [...customFields];
      [updatedFields[currentIndex], updatedFields[currentIndex + 1]] = 
        [updatedFields[currentIndex + 1], updatedFields[currentIndex]];
      onCustomFieldsUpdate(updatedFields);
      
      toast({
        title: "הסדר שונה",
        description: "השדה הועבר למטה"
      });
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...(newField.options || [])];
    updatedOptions[index] = value;
    setNewField(prev => ({ ...prev, options: updatedOptions }));
  };

  const addOption = () => {
    setNewField(prev => ({
      ...prev,
      options: [...(prev.options || []), '']
    }));
  };

  const removeOption = (index: number) => {
    const updatedOptions = (newField.options || []).filter((_, i) => i !== index);
    setNewField(prev => ({ ...prev, options: updatedOptions }));
  };

  if (!selectedEventId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            שדות מותאמים אישית
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            בחר אירוע כדי להגדיר שדות מותאמים אישית
          </div>
        </CardContent>
      </Card>
    );
  }

  const counterFields = customFields.filter(field => field.type === 'menCounter' || field.type === 'womenCounter');
  const otherFields = customFields.filter(field => field.type !== 'menCounter' && field.type !== 'womenCounter');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          שדות מותאמים אישית
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="text-sm text-muted-foreground">
          הגדר שדות שיופיעו בטופס RSVP של האירוע
        </div>

        {/* Counter Fields Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">שדות ברירת מחדל</h3>
            <p className="text-sm text-muted-foreground">
              שדות לספירת מוזמנים
            </p>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {!customFields.some(f => f.id === 'menCounter') && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => addQuickField('menCounter')}
                className="text-xs"
              >
                👨 הוסף מונה גברים
              </Button>
            )}
            {!customFields.some(f => f.id === 'womenCounter') && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => addQuickField('womenCounter')}
                className="text-xs"
              >
                👩 הוסף מונה נשים
              </Button>
            )}
          </div>

          {/* Display existing counter fields */}
          {counterFields.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                מונים פעילים ({counterFields.length})
              </div>
              {counterFields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveFieldUp(field.id)}
                      disabled={index === 0}
                      title="העבר למעלה"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveFieldDown(field.id)}
                      disabled={index === counterFields.length - 1}
                      title="העבר למטה"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="default">
                        {field.type === 'menCounter' ? 'מונה גברים' : 'מונה נשים'}
                      </Badge>
                      {field.required && (
                        <Badge variant="destructive" className="text-xs">
                          חובה
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      {eventLanguages.map(lang => {
                        const labelValue = lang.code === 'he' ? field.label :
                                          lang.code === 'en' ? field.labelEn :
                                          field.labels?.[lang.code];
                        if (!labelValue) return null;
                        return (
                          <p key={lang.code} className="text-sm">
                            <span className="font-medium">{lang.flag} {lang.nativeName}:</span> {labelValue}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditField(field)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteField(field.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom Fields Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">שדות מותאמים אישית</h3>
            <div className="flex gap-2">
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="h-4 w-4 ml-1" />
                    הוסף שדה מותאם
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingField ? 'עריכת שדה' : 'הוספת שדה חדש'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>סוג השדה</Label>
                      <Select 
                        value={newField.type} 
                        onValueChange={(value) => setNewField(prev => ({ ...prev, type: value as CustomField['type'] }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Dynamic language fields */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">תוויות בשפות ({eventLanguages.length})</Label>
                      {eventLanguages.map((lang) => (
                        <div key={lang.code} className="space-y-2">
                          <Label className="text-sm flex items-center gap-2">
                            {lang.flag} {lang.nativeName}
                          </Label>
                          <Input
                            value={
                              lang.code === 'he' ? newField.label :
                              lang.code === 'en' ? newField.labelEn :
                              (newField as any)[`label_${lang.code}`] || ''
                            }
                            onChange={(e) => {
                              if (lang.code === 'he') {
                                setNewField(prev => ({ ...prev, label: e.target.value }));
                              } else if (lang.code === 'en') {
                                setNewField(prev => ({ ...prev, labelEn: e.target.value }));
                              } else {
                                setNewField(prev => ({ ...prev, [`label_${lang.code}`]: e.target.value }));
                              }
                            }}
                            placeholder={`תווית ב${lang.nativeName}`}
                            dir={lang.code === 'he' || lang.code === 'ar' ? 'rtl' : 'ltr'}
                          />
                        </div>
                      ))}
                    </div>

                    {newField.type === 'select' && (
                      <div className="space-y-2">
                        <Label>אפשרויות</Label>
                        <div className="space-y-2">
                          {(newField.options || []).map((option, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                value={option}
                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                placeholder={`אפשרות ${index + 1}`}
                              />
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => removeOption(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={addOption}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 ml-1" />
                            הוסף אפשרות
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="required"
                        checked={newField.required}
                        onCheckedChange={(checked) => setNewField(prev => ({ ...prev, required: !!checked }))}
                      />
                      <Label htmlFor="required">שדה חובה</Label>
                    </div>

                    {/* Display Locations */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">היכן השדה יוצג?</Label>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="regular-invitation"
                            checked={newField.displayLocations?.regularInvitation}
                            onCheckedChange={(checked) => 
                              setNewField(prev => ({
                                ...prev,
                                displayLocations: {
                                  ...prev.displayLocations,
                                  regularInvitation: !!checked
                                }
                              }))
                            }
                          />
                          <Label htmlFor="regular-invitation" className="text-sm">דף הזמנה רגיל</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="open-link"
                            checked={newField.displayLocations?.openLink}
                            onCheckedChange={(checked) => 
                              setNewField(prev => ({
                                ...prev,
                                displayLocations: {
                                  ...prev.displayLocations,
                                  openLink: !!checked
                                }
                              }))
                            }
                          />
                          <Label htmlFor="open-link" className="text-sm">קישור פתוח</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="personal-link"
                            checked={newField.displayLocations?.personalLink}
                            onCheckedChange={(checked) => 
                              setNewField(prev => ({
                                ...prev,
                                displayLocations: {
                                  ...prev.displayLocations,
                                  personalLink: !!checked
                                }
                              }))
                            }
                          />
                          <Label htmlFor="personal-link" className="text-sm">קישור עם שם</Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleSaveField} className="flex-1">
                        {editingField ? 'עדכן' : 'הוסף'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)}
                        className="flex-1"
                      >
                        ביטול
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Display existing custom fields (non-counter fields) */}
          {otherFields.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                שדות מותאמים פעילים ({otherFields.length})
              </div>
              {otherFields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveFieldUp(field.id)}
                      disabled={index === 0}
                      title="העבר למעלה"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveFieldDown(field.id)}
                      disabled={index === otherFields.length - 1}
                      title="העבר למטה"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={field.id === 'fullName' || field.id === 'guestName' ? 'default' : 'outline'}>
                        {field.id === 'fullName' || field.id === 'guestName' ? 'שדה בסיסי' : 
                         fieldTypes.find(t => t.value === field.type)?.label}
                      </Badge>
                      {field.required && (
                        <Badge variant="destructive" className="text-xs">
                          חובה
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      {eventLanguages.map(lang => {
                        const labelValue = lang.code === 'he' ? field.label :
                                          lang.code === 'en' ? (field.labels?.en || field.labelEn) :
                                          field.labels?.[lang.code];
                        if (!labelValue) return null;
                        return (
                          <p key={lang.code} className="text-sm">
                            <span className="font-medium">{lang.flag} {lang.nativeName}:</span> {labelValue}
                          </p>
                        );
                      })}
                    </div>
                    {field.options && field.options.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        אפשרויות: {field.options.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditField(field)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteField(field.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {customFields.length === 0 && (
          <div className="text-center py-6 text-muted-foreground space-y-2">
            <p>לא הוגדרו שדות עדיין</p>
            <p className="text-xs">לחץ על "הוסף שדה מותאם" כדי להתחיל</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OpenRSVPCustomFields;