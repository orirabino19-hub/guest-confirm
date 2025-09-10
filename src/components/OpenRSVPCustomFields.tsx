import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import { CustomField } from './EventManager';

interface OpenRSVPCustomFieldsProps {
  selectedEventId: string | null;
  customFields: CustomField[];
  onCustomFieldsUpdate: (fields: CustomField[]) => void;
}

const OpenRSVPCustomFields = ({ selectedEventId, customFields, onCustomFieldsUpdate }: OpenRSVPCustomFieldsProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
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

  const fieldTypes = [
    { value: 'text', label: 'טקסט חופשי', labelEn: 'Text Input' },
    { value: 'textarea', label: 'טקסט ארוך', labelEn: 'Long Text' },
    { value: 'select', label: 'בחירה מרשימה', labelEn: 'Select List' },
    { value: 'checkbox', label: 'תיבת סימון', labelEn: 'Checkbox' },
    { value: 'menCounter', label: 'מונה גברים', labelEn: 'Men Counter' },
    { value: 'womenCounter', label: 'מונה נשים', labelEn: 'Women Counter' }
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
        openLink: false,
        personalLink: false
      }
    });
    setEditingField(null);
  };

  const handleSaveField = () => {
    if (!newField.label?.trim() || !newField.labelEn?.trim()) {
      toast({
        title: "שגיאה",
        description: "יש למלא את השדה בעברית ובאנגלית",
        variant: "destructive"
      });
      return;
    }

    const fieldData: CustomField = {
      id: editingField?.id || Date.now().toString(),
      type: newField.type as CustomField['type'],
      label: newField.label!,
      labelEn: newField.labelEn!,
      options: newField.type === 'select' ? newField.options : undefined,
      required: newField.required || false,
      displayLocations: newField.displayLocations || {
        regularInvitation: true,
        openLink: false,
        personalLink: false
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
    setNewField({
      type: field.type,
      label: field.label,
      labelEn: field.labelEn,
      options: field.options || [],
      required: field.required,
      displayLocations: field.displayLocations || {
        regularInvitation: true,
        openLink: false,
        personalLink: false
      }
    });
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
              {counterFields.map((field) => (
                <div key={field.id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
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
                    <p className="font-medium">{field.label}</p>
                    <p className="text-sm text-muted-foreground">{field.labelEn}</p>
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
              {/* Quick Add Buttons for basic fields */}
              <div className="flex gap-1 flex-wrap">
                {!customFields.some(f => f.id === 'fullName') && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addQuickField('fullName')}
                    className="text-xs"
                  >
                    שם מלא
                  </Button>
                )}
                {!customFields.some(f => f.id === 'guestName') && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addQuickField('guestName')}
                    className="text-xs"
                  >
                    שם אורח
                  </Button>
                )}
                {!customFields.some(f => f.id === 'phone') && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addQuickField('phone')}
                    className="text-xs"
                  >
                    טלפון
                  </Button>
                )}
                {!customFields.some(f => f.id === 'email') && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addQuickField('email')}
                    className="text-xs"
                  >
                    אימייל
                  </Button>
                )}
              </div>
              
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

                    <div className="space-y-2">
                      <Label>תווית בעברית *</Label>
                      <Input
                        value={newField.label}
                        onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                        placeholder="לדוגמא: האם אתה צריך הסעה?"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>תווית באנגלית *</Label>
                      <Input
                        value={newField.labelEn}
                        onChange={(e) => setNewField(prev => ({ ...prev, labelEn: e.target.value }))}
                        placeholder="Example: Do you need transportation?"
                      />
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
              {otherFields.map((field) => (
                <div key={field.id} className="flex items-center gap-3 p-3 border rounded-lg">
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
                    <p className="font-medium">{field.label}</p>
                    <p className="text-sm text-muted-foreground">{field.labelEn}</p>
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
            <p className="text-xs">לחץ על "שם מלא" כדי להתחיל</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OpenRSVPCustomFields;