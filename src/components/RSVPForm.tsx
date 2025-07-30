
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, Palette } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import LanguageSelector from "@/components/LanguageSelector";
import eventInvitation from "@/assets/event-invitation.jpg";

interface RSVPFormProps {
  guestName: string;
  phone: string;
  eventName: string;
}

const getInvitationForGuest = (phone: string, language: string) => {
  // Special invitation for Sarah Levy demo
  if (phone === "0527654321" && language === 'he') {
    return "/lovable-uploads/2ed7e50b-48f4-4be4-b874-a19830a05aaf.png";
  }
  // Default invitation for others
  return eventInvitation;
};

const RSVPForm = ({ guestName, phone, eventName }: RSVPFormProps) => {
  const [menCount, setMenCount] = useState<number>(0);
  const [womenCount, setWomenCount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#000000");
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

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
        menCount,
        womenCount,
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

  const incrementMen = () => {
    if (menCount < 10) {
      setMenCount(menCount + 1);
    }
  };

  const decrementMen = () => {
    if (menCount > 0) {
      setMenCount(menCount - 1);
    }
  };

  const incrementWomen = () => {
    if (womenCount < 10) {
      setWomenCount(womenCount + 1);
    }
  };

  const decrementWomen = () => {
    if (womenCount > 0) {
      setWomenCount(womenCount - 1);
    }
  };

  const totalGuests = menCount + womenCount;

  return (
    <div 
      className="min-h-screen py-8 px-4 transition-colors duration-300" 
      dir={i18n.language === 'he' ? 'rtl' : 'ltr'}
      style={{ backgroundColor }}
    >
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Event Invitation Image with overlaid controls */}
        <div className="relative overflow-hidden rounded-lg shadow-elegant">
          <img 
            src={getInvitationForGuest(phone, i18n.language)} 
            alt={i18n.language === 'he' ? "הזמנה לאירוע" : "Event Invitation"} 
            className="w-full h-auto object-contain bg-white"
          />
          
          {/* Language Selector - Top Right */}
          <div className="absolute top-4 right-4 z-10">
            <LanguageSelector />
          </div>
          
          {/* Color Controls - Top Left */}
          <div className="absolute top-4 left-4 z-10">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 bg-white/90 backdrop-blur-sm hover:bg-white/95"
                >
                  <Palette className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {i18n.language === 'he' ? 'צבעים' : 'Colors'}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-4">
                  <h4 className="font-medium">
                    {i18n.language === 'he' ? 'התאמת צבעים' : 'Color Customization'}
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="bg-color">
                        {i18n.language === 'he' ? 'צבע רקע' : 'Background Color'}
                      </Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="bg-color"
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="w-16 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          placeholder="#ffffff"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="text-color">
                        {i18n.language === 'he' ? 'צבע טקסט' : 'Text Color'}
                      </Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="text-color"
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-16 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          placeholder="#000000"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setBackgroundColor("#ffffff");
                          setTextColor("#000000");
                        }}
                      >
                        {i18n.language === 'he' ? 'איפוס' : 'Reset'}
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        </div>

        {/* Welcome Card */}
        <Card className="bg-gradient-card shadow-soft border-border/50" style={{ color: textColor }}>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl md:text-3xl font-bold" style={{ color: textColor }}>
              {t('rsvp.welcome', { name: guestName })}
            </CardTitle>
            <p className="text-lg opacity-80" style={{ color: textColor }}>
              {t('rsvp.eventInvitation', { eventName })}
            </p>
          </CardHeader>
        </Card>

        {/* RSVP Form */}
        <Card className="bg-gradient-card shadow-elegant border-border/50" style={{ color: textColor }}>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-center text-primary" style={{ color: textColor }}>
              {t('rsvp.confirmTitle')}
            </CardTitle>
            <p className="text-center opacity-80" style={{ color: textColor }}>
              {t('rsvp.confirmDescription')}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Men Count */}
                <div className="space-y-2">
                  <Label htmlFor="menCount" className="text-sm font-medium" style={{ color: textColor }}>
                    {t('rsvp.menCount')}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={decrementMen}
                      disabled={menCount <= 0}
                      className="h-10 w-10 shrink-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="menCount"
                      type="number"
                      min="0"
                      max="10"
                      value={menCount}
                      onChange={(e) => setMenCount(Number(e.target.value))}
                      className="text-center text-lg border-border/50 focus:border-primary"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={incrementMen}
                      disabled={menCount >= 10}
                      className="h-10 w-10 shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Women Count */}
                <div className="space-y-2">
                  <Label htmlFor="womenCount" className="text-sm font-medium" style={{ color: textColor }}>
                    {t('rsvp.womenCount')}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={decrementWomen}
                      disabled={womenCount <= 0}
                      className="h-10 w-10 shrink-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="womenCount"
                      type="number"
                      min="0"
                      max="10"
                      value={womenCount}
                      onChange={(e) => setWomenCount(Number(e.target.value))}
                      className="text-center text-lg border-border/50 focus:border-primary"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={incrementWomen}
                      disabled={womenCount >= 10}
                      className="h-10 w-10 shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Total Display */}
              {totalGuests > 0 && (
                <div className="text-center p-4 bg-accent/50 rounded-lg border border-accent">
                  <p className="text-lg font-medium" style={{ color: textColor }}>
                    {t('rsvp.totalGuests', { count: totalGuests })}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={isSubmitting || totalGuests === 0}
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

              {totalGuests === 0 && (
                <p className="text-center text-sm opacity-70" style={{ color: textColor }}>
                  {t('rsvp.pleaseEnterGuests')}
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-muted/50 border-border/30" style={{ color: textColor }}>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm opacity-70" style={{ color: textColor }}>
                {t('rsvp.eventTime')}
              </p>
              <p className="text-sm opacity-70" style={{ color: textColor }}>
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
