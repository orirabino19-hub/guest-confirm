
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus } from "lucide-react";
import LanguageSelector from "@/components/LanguageSelector";
import eventInvitation from "@/assets/event-invitation.jpg";

interface RSVPFormProps {
  guestName: string;
  phone: string;
  eventName: string;
}

const RSVPForm = ({ guestName, phone, eventName }: RSVPFormProps) => {
  const [menCount, setMenCount] = useState<number>(0);
  const [womenCount, setWomenCount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    <div className="min-h-screen bg-background py-8 px-4" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Language Selector */}
        <div className={`flex ${i18n.language === 'he' ? 'justify-start' : 'justify-end'} mb-4`}>
          <LanguageSelector />
        </div>

        {/* Event Invitation Image */}
        <div className="relative overflow-hidden rounded-lg shadow-elegant">
          <img 
            src={eventInvitation} 
            alt="הזמנה לאירוע" 
            className="w-full h-64 md:h-80 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Men Count */}
                <div className="space-y-2">
                  <Label htmlFor="menCount" className="text-sm font-medium">
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
                  <Label htmlFor="womenCount" className="text-sm font-medium">
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
                  <p className="text-lg font-medium text-accent-foreground">
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
                <p className="text-center text-sm text-muted-foreground">
                  {t('rsvp.pleaseEnterGuests')}
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
