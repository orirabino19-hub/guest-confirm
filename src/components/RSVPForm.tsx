
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus } from "lucide-react";
import LanguageSelector from "@/components/LanguageSelector";
import eventInvitation from "@/assets/event-invitation.jpg";

interface CustomField {
  id: string;
  type: 'text' | 'select' | 'checkbox' | 'menCounter' | 'womenCounter';
  label: string;
  labelEn?: string;
  required: boolean;
  options?: string[];
}

interface RSVPFormProps {
  guestName: string;
  phone: string;
  eventName: string;
  customFields?: CustomField[];
}

const getInvitationForGuest = (phone: string, language: string) => {
  // Special invitation for Sarah Levy demo
  if (phone === "0527654321" && language === 'he') {
    return "/lovable-uploads/2ed7e50b-48f4-4be4-b874-a19830a05aaf.png";
  }
  // Default invitation for others
  return eventInvitation;
};

const RSVPForm = ({ guestName, phone, eventName, customFields = [] }: RSVPFormProps) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [menCount, setMenCount] = useState(0);
  const [womenCount, setWomenCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Check required fields
    const missingFields = customFields.filter(field => 
      field.required && (!formData[field.id] || formData[field.id] === '' || formData[field.id] === 0)
    );

    if (missingFields.length > 0) {
      toast({
        title: t('rsvp.error.title'),
        description: t('rsvp.error.requiredFields'),
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    // Simulate API call - will be connected to Supabase later
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: t('rsvp.success.title'),
        description: t('rsvp.success.description', { name: guestName }),
      });
      
      console.log("RSVP Submitted:", {
        guestName,
        phone,
        formData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      toast({
        title: t('rsvp.error.title'),
        description: t('rsvp.error.description'),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const incrementCounter = (fieldId: string) => {
    const currentValue = formData[fieldId] || 0;
    if (currentValue < 10) {
      handleInputChange(fieldId, currentValue + 1);
    }
  };

  const decrementCounter = (fieldId: string) => {
    const currentValue = formData[fieldId] || 0;
    if (currentValue > 0) {
      handleInputChange(fieldId, currentValue - 1);
    }
  };

  // Calculate total guests from default counters plus custom fields
  const customFieldsGuests = customFields
    .filter(field => field.type === 'menCounter' || field.type === 'womenCounter')
    .reduce((sum, field) => sum + (formData[field.id] || 0), 0);
  
  const totalGuests = menCount + womenCount + customFieldsGuests;

  const renderCustomField = (field: CustomField) => {
    const label = i18n.language === 'he' ? field.label : (field.labelEn || field.label);
    const value = formData[field.id] || '';

    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium">
              {label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={field.id}
              type="text"
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className="border-border/50 focus:border-primary"
              required={field.required}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium">
              {label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Select value={value} onValueChange={(val) => handleInputChange(field.id, val)}>
              <SelectTrigger>
                <SelectValue placeholder="בחר אפשרות" />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="flex items-center space-x-2 space-x-reverse">
            <Checkbox
              id={field.id}
              checked={value || false}
              onCheckedChange={(checked) => handleInputChange(field.id, checked)}
            />
            <Label htmlFor={field.id} className="text-sm font-medium">
              {label} {field.required && <span className="text-destructive">*</span>}
            </Label>
          </div>
        );

      case 'menCounter':
      case 'womenCounter':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium">
              {label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => decrementCounter(field.id)}
                disabled={!value || value <= 0}
                className="h-10 w-10 shrink-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id={field.id}
                type="number"
                min="0"
                max="10"
                value={value || 0}
                onChange={(e) => handleInputChange(field.id, Number(e.target.value))}
                className="text-center text-lg border-border/50 focus:border-primary"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => incrementCounter(field.id)}
                disabled={value >= 10}
                className="h-10 w-10 shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const hasRequiredFields = customFields.filter(field => field.required).every(field => {
    const value = formData[field.id];
    return value !== undefined && value !== '' && value !== 0;
  });

  return (
    <div className="min-h-screen bg-background py-8 px-4" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Event Invitation Image with Language Selector */}
        <div className="relative overflow-hidden rounded-lg shadow-elegant">
          <img 
            src={getInvitationForGuest(phone, i18n.language)} 
            alt={i18n.language === 'he' ? "הזמנה לאירוע" : "Event Invitation"} 
            className="w-full h-auto max-h-[90vh] object-contain bg-white"
          />
          
          {/* Language Selector - Top Right */}
          <div className="absolute top-4 right-4 z-10">
            <LanguageSelector />
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        </div>

        {/* Welcome Card */}
        <Card className="bg-gradient-card shadow-soft border-border/50">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl md:text-3xl font-bold text-foreground">
              {t('rsvp.welcome', { name: guestName })}
            </CardTitle>
            <p className="text-muted-foreground text-lg">
              {t('rsvp.eventInvitation', { eventName })}
            </p>
          </CardHeader>
        </Card>

        {/* RSVP Form */}
        <Card className="bg-gradient-card shadow-elegant border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-center text-primary">
              {t('rsvp.confirmTitle')}
            </CardTitle>
            <p className="text-center text-muted-foreground">
              {t('rsvp.confirmDescription')}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Default Guest Counters */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/30">
                <h3 className="font-medium text-center text-foreground mb-4">
                  {i18n.language === 'he' ? "מספר משתתפים" : "Number of Participants"}
                </h3>
                
                {/* Men Counter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {i18n.language === 'he' ? "גברים" : "Men"}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setMenCount(Math.max(0, menCount - 1))}
                      disabled={menCount <= 0}
                      className="h-10 w-10 shrink-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min="0"
                      max="20"
                      value={menCount}
                      onChange={(e) => setMenCount(Math.max(0, Number(e.target.value)))}
                      className="text-center text-lg border-border/50 focus:border-primary"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setMenCount(Math.min(20, menCount + 1))}
                      disabled={menCount >= 20}
                      className="h-10 w-10 shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Women Counter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {i18n.language === 'he' ? "נשים" : "Women"}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setWomenCount(Math.max(0, womenCount - 1))}
                      disabled={womenCount <= 0}
                      className="h-10 w-10 shrink-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min="0"
                      max="20"
                      value={womenCount}
                      onChange={(e) => setWomenCount(Math.max(0, Number(e.target.value)))}
                      className="text-center text-lg border-border/50 focus:border-primary"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setWomenCount(Math.min(20, womenCount + 1))}
                      disabled={womenCount >= 20}
                      className="h-10 w-10 shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Custom Fields */}
              {customFields.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {customFields.map(field => (
                    <div key={field.id} className="col-span-1">
                      {renderCustomField(field)}
                    </div>
                  ))}
                </div>
              )}

              {/* Total Display */}
              {totalGuests > 0 && (
                <div className="text-center p-4 bg-accent/50 rounded-lg border border-accent">
                  <p className="text-lg font-medium text-accent-foreground">
                    {t('rsvp.totalGuests', { count: totalGuests })}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={isSubmitting || (!hasRequiredFields && customFields.some(f => f.required))}
                className="w-full text-lg py-6 bg-gradient-primary hover:opacity-90 transition-all duration-300 shadow-elegant"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('rsvp.submitting')}
                  </div>
                ) : (
                  t('rsvp.submitButton')
                )}
              </Button>

              {customFields.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  {t('rsvp.noFieldsConfigured')}
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-muted/50 border-border/30">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {t('rsvp.eventTime')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('rsvp.contactInfo', { phone })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RSVPForm;
