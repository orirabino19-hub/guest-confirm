
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, Maximize2 } from "lucide-react";
import LanguageSelector from "@/components/LanguageSelector";
import eventInvitation from "@/assets/fleishman-peles-logo.png";
import { useRSVP } from "@/hooks/useRSVP";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface CustomField {
  id: string;
  type: 'text' | 'select' | 'checkbox' | 'email' | 'menCounter' | 'womenCounter';
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
  eventId?: string;
  getCustomText?: (key: string, language: string, defaultText: string) => string;
  isTextHidden?: (key: string) => boolean;
  onInvitationLoad?: (invitationUrl: string) => void;
}

const useEventInvitation = (eventId: string, language: string) => {
  const [invitationUrl, setInvitationUrl] = useState<string>(eventInvitation);
  const [invitationType, setInvitationType] = useState<'image' | 'pdf'>('image');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!eventId) {
        setInvitationUrl(eventInvitation);
        setInvitationType('image');
        setIsLoading(false);
        return;
      }

      try {
        // Try to fetch invitation image first, then PDF
        const imageFileName = `${language}-image`;
        const pdfFileName = `${language}-pdf`;
        
        // Check for image files with different extensions
        const extensions = ['jpg', 'jpeg', 'png', 'webp'];
        let foundUrl = null;
        let fileType: 'image' | 'pdf' = 'image';
        
        for (const ext of extensions) {
          try {
            const { data } = await supabase.storage
              .from('invitations')
              .getPublicUrl(`${eventId}/${imageFileName}.${ext}`);
            
            // Check if file actually exists
            const response = await fetch(data.publicUrl, { method: 'HEAD' });
            if (response.ok) {
              foundUrl = data.publicUrl;
              fileType = 'image';
              break;
            }
          } catch (error) {
            // Continue to next extension
          }
        }
        
        // If no image found, try PDF
        if (!foundUrl) {
          try {
            const { data } = await supabase.storage
              .from('invitations')
              .getPublicUrl(`${eventId}/${pdfFileName}.pdf`);
            
            const response = await fetch(data.publicUrl, { method: 'HEAD' });
            if (response.ok) {
              foundUrl = data.publicUrl;
              fileType = 'pdf';
            }
          } catch (error) {
            // Use default if PDF also not found
          }
        }
        
        setInvitationUrl(foundUrl || eventInvitation);
        setInvitationType(fileType);
      } catch (error) {
        console.error('Error fetching invitation:', error);
        setInvitationUrl(eventInvitation);
        setInvitationType('image');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvitation();
  }, [eventId, language]);

  return { invitationUrl, invitationType, isLoading };
};

const RSVPForm = ({ guestName, phone, eventName, customFields = [], eventId, getCustomText, isTextHidden, onInvitationLoad }: RSVPFormProps) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [menCount, setMenCount] = useState(0);
  const [womenCount, setWomenCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventTheme, setEventTheme] = useState<any>(null);
  const [isModernStyle, setIsModernStyle] = useState(false);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const { submitRSVP } = useRSVP();
  const { eventId: urlEventId } = useParams<{ eventId: string }>();
  
  // Use the hook to get the correct invitation
  const currentEventId = eventId || urlEventId || "";
  const { invitationUrl, invitationType, isLoading: invitationLoading } = useEventInvitation(currentEventId, i18n.language);

  // Notify parent about invitation load for meta tags
  useEffect(() => {
    if (!invitationLoading && invitationUrl && onInvitationLoad) {
      onInvitationLoad(invitationUrl);
    }
  }, [invitationUrl, invitationLoading, onInvitationLoad]);

  // Load event theme colors and modern style setting
  useEffect(() => {
    const loadEventTheme = async () => {
      if (!currentEventId) return;

      try {
        const { data, error } = await supabase
          .from('events')
          .select('theme, modern_style_enabled')
          .eq('id', currentEventId)
          .single();

        if (error) throw error;

        if (data?.theme) {
          const theme = typeof data.theme === 'string' ? JSON.parse(data.theme) : data.theme;
          setEventTheme(theme);
        }
        
        setIsModernStyle(data?.modern_style_enabled || false);
      } catch (error: any) {
        console.error('Error loading event theme:', error);
      }
    };

    loadEventTheme();
  }, [currentEventId]);

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

    // Submit to Supabase
    try {
      const currentEventId = eventId || urlEventId;
      if (!currentEventId) {
        throw new Error('Event ID is required');
      }

      const submissionData = {
        event_id: currentEventId,
        first_name: guestName.split(' ')[0] || '',
        last_name: guestName.split(' ').slice(1).join(' ') || '',
        men_count: menCount,
        women_count: womenCount,
        answers: formData
      };

      console.log('Submitting RSVP:', submissionData);
      
      await submitRSVP(submissionData);
      
      toast({
        title: t('rsvp.success.title'),
        description: t('rsvp.success.description', { name: guestName }),
      });
      
    } catch (error: any) {
      console.error('RSVP submission error:', error);
      toast({
        title: t('rsvp.error.title'),
        description: error.message || t('rsvp.error.description'),
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

    const modernInputClasses = isModernStyle
      ? "rounded-xl bg-white/80 border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all duration-200 shadow-sm placeholder:text-gray-400"
      : "border-border/50 focus:border-primary";

    const modernLabelClasses = isModernStyle
      ? "text-sm font-semibold text-gray-700"
      : "text-sm font-medium";

    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className={modernLabelClasses}>
              {label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={field.id}
              type="text"
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={modernInputClasses}
              required={field.required}
            />
          </div>
        );

      case 'email':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className={modernLabelClasses}>
              {label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={field.id}
              type="email"
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={modernInputClasses}
              required={field.required}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className={modernLabelClasses}>
              {label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Select value={value} onValueChange={(val) => handleInputChange(field.id, val)}>
              <SelectTrigger className={isModernStyle ? 'rounded-xl border-gray-200 focus:border-amber-400' : ''}>
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
        return isModernStyle ? (
          <label 
            key={field.id}
            htmlFor={field.id}
            className="flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 bg-white/60 hover:bg-white/80 hover:border-amber-300 transition-all duration-200 cursor-pointer group"
          >
            <Checkbox
              id={field.id}
              checked={formData[field.id] || false}
              onCheckedChange={(checked) => handleInputChange(field.id, checked)}
              className="mt-0.5 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                {label}
                {field.required && <span className="text-destructive mr-1">*</span>}
              </span>
            </div>
            {formData[field.id] && (
              <div className="flex-shrink-0">
                <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                  <svg className="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
          </label>
        ) : (
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
            <Label htmlFor={field.id} className={modernLabelClasses}>
              {label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => decrementCounter(field.id)}
                disabled={!value || value <= 0}
                className={`h-10 w-10 shrink-0 ${
                  isModernStyle ? 'rounded-xl border-gray-300 hover:border-amber-400 hover:bg-amber-50 transition-all' : ''
                }`}
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
                className={`text-center text-lg ${modernInputClasses}`}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => incrementCounter(field.id)}
                disabled={value >= 10}
                className={`h-10 w-10 shrink-0 ${
                  isModernStyle ? 'rounded-xl border-gray-300 hover:border-amber-400 hover:bg-amber-50 transition-all' : ''
                }`}
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

  // Apply custom theme styles
  const themeStyles = eventTheme ? {
    '--custom-bg': eventTheme.backgroundColor,
    '--custom-text': eventTheme.textColor,
    '--custom-primary': eventTheme.primaryColor,
    '--custom-secondary': eventTheme.secondaryColor,
    '--custom-card-bg': eventTheme.cardBackground,
  } as React.CSSProperties : {};

  // Modern style classes
  const bgClasses = isModernStyle
    ? "min-h-screen py-4 px-4 bg-gradient-to-br from-amber-50 via-rose-50 to-orange-50 font-sans"
    : "min-h-screen py-4 px-4";

  const imageCardClasses = isModernStyle
    ? "relative overflow-hidden rounded-2xl shadow-2xl bg-white"
    : "relative overflow-hidden rounded-lg bg-white";

  const formCardClasses = isModernStyle
    ? "shadow-2xl bg-white/90 backdrop-blur-sm border-0 rounded-2xl"
    : "shadow-elegant border-border/50";

  const inputClasses = isModernStyle
    ? "rounded-xl bg-white/80 border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all duration-200 shadow-sm placeholder:text-gray-400"
    : "border-border/50 focus:border-primary";

  const labelClasses = isModernStyle
    ? "text-sm font-semibold text-gray-700"
    : "text-sm font-medium";

  const sectionClasses = isModernStyle
    ? "space-y-3 p-6 rounded-2xl border-0 bg-gradient-to-r from-amber-50/50 to-rose-50/50"
    : "space-y-3 p-3 rounded-lg border";

  return (
    <div 
      className={bgClasses}
      dir={i18n.language === 'he' ? 'rtl' : 'ltr'}
      style={{
        backgroundColor: isModernStyle ? undefined : (eventTheme?.backgroundColor || 'hsl(var(--background))'),
        color: isModernStyle ? undefined : (eventTheme?.textColor || 'hsl(var(--foreground))'),
        ...(!isModernStyle ? themeStyles : {})
      }}
    >
      <div className="max-w-lg mx-auto space-y-8">
        {/* Event Invitation Image with Language Selector */}
        <div className={imageCardClasses}>
          {invitationLoading ? (
            <div className="w-full h-64 bg-muted flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {invitationType === 'pdf' ? (
                <div className="w-full h-[70vh] border border-border/30 rounded-lg bg-muted/50 flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="text-6xl mb-4">📄</div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {i18n.language === 'he' ? "הזמנה לאירוע" : "Event Invitation"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {i18n.language === 'he' ? "לחץ כדי לצפות בהזמנה" : "Click to view invitation"}
                  </p>
                  <a 
                    href={invitationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    {i18n.language === 'he' ? "פתח הזמנה" : "Open Invitation"}
                  </a>
                </div>
              ) : (
                <img 
                  src={invitationUrl} 
                  alt={i18n.language === 'he' ? "הזמנה לאירוע" : "Event Invitation"} 
                  className="w-full h-auto max-h-[75vh] object-contain rounded-xl"
                  onError={(e) => {
                    // Fallback to default invitation if image fails to load
                    e.currentTarget.src = eventInvitation;
                  }}
                />
              )}
            </>
          )}
          
          {/* Zoom Button - Top Left */}
          <div className="absolute top-4 left-4 z-10">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="bg-background/80 backdrop-blur-sm hover:bg-background/90 shadow-md"
                  aria-label={i18n.language === 'he' ? "הגדל הזמנה" : "Zoom invitation"}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] h-[95vh] p-4 flex flex-col">
                <div className="flex-1 min-h-0 flex items-center justify-center">
                  {invitationType === 'pdf' ? (
                    <iframe 
                      src={invitationUrl} 
                      className="w-full h-full rounded-lg"
                      title={i18n.language === 'he' ? "הזמנה לאירוע" : "Event Invitation"}
                    />
                  ) : (
                    <img 
                      src={invitationUrl} 
                      alt={i18n.language === 'he' ? "הזמנה לאירוע" : "Event Invitation"} 
                      className="max-w-full max-h-full object-contain rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = eventInvitation;
                      }}
                    />
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Language Selector - Top Right */}
          <div className="absolute top-4 right-4 z-10">
            <LanguageSelector eventId={eventId} />
          </div>
          
        </div>

        {/* Combined Welcome and RSVP Form */}
        <Card 
          className={formCardClasses}
          style={!isModernStyle ? {
            backgroundColor: eventTheme?.cardBackground || 'hsl(var(--card-background))',
            borderColor: eventTheme?.secondaryColor ? `${eventTheme.secondaryColor}50` : undefined
          } : undefined}
        >
          <CardHeader className="text-center pb-4">
            {!isTextHidden?.('rsvp.welcome') && (
              <CardTitle 
                className={`text-xl md:text-2xl font-bold mb-2 ${
                  isModernStyle ? 'bg-gradient-to-r from-amber-600 via-rose-600 to-orange-600 bg-clip-text text-transparent' : ''
                }`}
                style={!isModernStyle ? { color: eventTheme?.textColor || 'hsl(var(--foreground))' } : undefined}
              >
                {getCustomText ? getCustomText('rsvp.welcome', i18n.language, t('rsvp.welcome', { name: guestName })) : t('rsvp.welcome', { name: guestName })}
              </CardTitle>
            )}
            {!isTextHidden?.('rsvp.eventInvitation') && (
              <p 
                className={`mb-3 ${
                  isModernStyle ? 'text-gray-600 font-medium' : ''
                }`}
                style={!isModernStyle ? { color: eventTheme?.secondaryColor || 'hsl(var(--muted-foreground))' } : undefined}
              >
                {getCustomText ? getCustomText('rsvp.eventInvitation', i18n.language, t('rsvp.eventInvitation', { eventName })) : t('rsvp.eventInvitation', { eventName })}
              </p>
            )}
            <div className="border-t border-border/30 pt-4">
              {!isTextHidden?.('rsvp.confirmTitle') && (
                <CardTitle 
                  className={`text-lg font-semibold ${
                    isModernStyle ? 'text-amber-600' : ''
                  }`}
                  style={!isModernStyle ? { color: eventTheme?.primaryColor || 'hsl(var(--primary))' } : undefined}
                >
                  {getCustomText ? getCustomText('rsvp.confirmTitle', i18n.language, t('rsvp.confirmTitle')) : t('rsvp.confirmTitle')}
                </CardTitle>
              )}
              {!isTextHidden?.('rsvp.confirmDescription') && (
                <p 
                  className={`text-sm mt-1 ${
                    isModernStyle ? 'text-gray-600' : ''
                  }`}
                  style={!isModernStyle ? { color: eventTheme?.secondaryColor || 'hsl(var(--muted-foreground))' } : undefined}
                >
                  {getCustomText ? getCustomText('rsvp.confirmDescription', i18n.language, t('rsvp.confirmDescription')) : t('rsvp.confirmDescription')}
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* CRITICAL: Default Guest Counters - Always show for personal RSVP links */}
              <div 
                className={sectionClasses}
                style={!isModernStyle ? {
                  backgroundColor: eventTheme?.secondaryColor ? `${eventTheme.secondaryColor}10` : 'hsl(var(--muted) / 0.3)',
                  borderColor: eventTheme?.secondaryColor ? `${eventTheme.secondaryColor}30` : 'hsl(var(--border) / 0.3)'
                } : undefined}
              >
                <h3 
                  className={`font-medium text-center mb-4 ${
                    isModernStyle ? 'text-gray-800 font-bold text-lg' : ''
                  }`}
                  style={!isModernStyle ? { color: eventTheme?.textColor || 'hsl(var(--foreground))' } : undefined}
                >
                  {getCustomText ? getCustomText('rsvp.numberOfParticipants', i18n.language, i18n.language === 'he' ? "מספר משתתפים" : "Number of Participants") : (i18n.language === 'he' ? "מספר משתתפים" : "Number of Participants")}
                </h3>
                
                {/* Men Counter */}
                <div className="space-y-2">
                  <Label className={labelClasses}>
                    {getCustomText ? getCustomText('rsvp.menLabel', i18n.language, i18n.language === 'he' ? "גברים" : "Men") : (i18n.language === 'he' ? "גברים" : "Men")}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setMenCount(Math.max(0, menCount - 1))}
                      disabled={menCount <= 0}
                      className={`h-10 w-10 shrink-0 ${
                        isModernStyle ? 'rounded-xl border-gray-300 hover:border-amber-400 hover:bg-amber-50 transition-all' : ''
                      }`}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min="0"
                      max="20"
                      value={menCount}
                      onChange={(e) => setMenCount(Math.max(0, Number(e.target.value)))}
                      className={`text-center text-lg ${inputClasses}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setMenCount(Math.min(20, menCount + 1))}
                      disabled={menCount >= 20}
                      className={`h-10 w-10 shrink-0 ${
                        isModernStyle ? 'rounded-xl border-gray-300 hover:border-amber-400 hover:bg-amber-50 transition-all' : ''
                      }`}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Women Counter */}
                <div className="space-y-2">
                  <Label className={labelClasses}>
                    {getCustomText ? getCustomText('rsvp.womenLabel', i18n.language, i18n.language === 'he' ? "נשים" : "Women") : (i18n.language === 'he' ? "נשים" : "Women")}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setWomenCount(Math.max(0, womenCount - 1))}
                      disabled={womenCount <= 0}
                      className={`h-10 w-10 shrink-0 ${
                        isModernStyle ? 'rounded-xl border-gray-300 hover:border-amber-400 hover:bg-amber-50 transition-all' : ''
                      }`}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min="0"
                      max="20"
                      value={womenCount}
                      onChange={(e) => setWomenCount(Math.max(0, Number(e.target.value)))}
                      className={`text-center text-lg ${inputClasses}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setWomenCount(Math.min(20, womenCount + 1))}
                      disabled={womenCount >= 20}
                      className={`h-10 w-10 shrink-0 ${
                        isModernStyle ? 'rounded-xl border-gray-300 hover:border-amber-400 hover:bg-amber-50 transition-all' : ''
                      }`}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Custom Fields */}
              {customFields.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customFields.map(field => (
                    <div key={field.id} className="col-span-1">
                      {renderCustomField(field)}
                    </div>
                  ))}
                </div>
              )}

              {/* Total Display */}
              {totalGuests > 0 && (
                <div className={`text-center p-4 rounded-lg border ${
                  isModernStyle 
                    ? 'bg-gradient-to-r from-amber-50 to-rose-50 border-amber-200' 
                    : 'bg-accent/50 border-accent'
                }`}>
                  <p className={`text-lg font-medium ${
                    isModernStyle ? 'text-gray-800 font-bold' : 'text-accent-foreground'
                  }`}>
                    {t('rsvp.totalGuests', { count: totalGuests })}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={isSubmitting || (!hasRequiredFields && customFields.some(f => f.required)) || totalGuests === 0}
                className={`
                  w-full text-lg py-7 font-semibold
                  ${isModernStyle 
                    ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-orange-500 hover:from-amber-600 hover:via-rose-600 hover:to-orange-600' 
                    : 'hover:opacity-90'
                  }
                  hover:shadow-2xl hover:scale-[1.02] 
                  active:scale-[0.98]
                  transition-all duration-300 
                  shadow-lg
                  text-white
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  relative overflow-hidden
                  group
                `}
                style={!isModernStyle ? {
                  backgroundColor: eventTheme?.primaryColor || 'hsl(var(--primary))',
                  color: eventTheme?.cardBackground || 'hsl(var(--primary-foreground))',
                  background: eventTheme?.primaryColor ? eventTheme.primaryColor : undefined
                } : undefined}
              >
                {isModernStyle && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                )}
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('rsvp.submitting')}
                  </div>
                ) : (
                  !isTextHidden?.('rsvp.submitButton') && (getCustomText ? getCustomText('rsvp.submitButton', i18n.language, t('rsvp.submitButton')) : t('rsvp.submitButton'))
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
      </div>
    </div>
  );
};

export default RSVPForm;
