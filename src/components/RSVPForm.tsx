import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import eventInvitation from "@/assets/event-invitation.jpg";

interface RSVPFormProps {
  guestName: string;
  phone: string;
}

const RSVPForm = ({ guestName, phone }: RSVPFormProps) => {
  const [menCount, setMenCount] = useState<number>(0);
  const [womenCount, setWomenCount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call - will be connected to Supabase later
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "✅ האישור נקלט בהצלחה!",
        description: `תודה ${guestName}, המקום שמור עבורכם`,
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
        title: "❌ שגיאה",
        description: "אירעה שגיאה בשליחת האישור. אנא נסו שוב.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalGuests = menCount + womenCount;

  return (
    <div className="min-h-screen bg-background py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-8">
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
              שלום {guestName}! 👋
            </CardTitle>
            <p className="text-muted-foreground text-lg">
              אנחנו מתכבדים להזמינכם לאירוע שלנו
            </p>
          </CardHeader>
        </Card>

        {/* RSVP Form */}
        <Card className="bg-gradient-card shadow-elegant border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-center text-primary">
              🎉 אישור הגעה
            </CardTitle>
            <p className="text-center text-muted-foreground">
              אנא אמתו את מספר המוזמנים
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Men Count */}
                <div className="space-y-2">
                  <Label htmlFor="menCount" className="text-sm font-medium">
                    👨 מספר גברים
                  </Label>
                  <Input
                    id="menCount"
                    type="number"
                    min="0"
                    max="10"
                    value={menCount}
                    onChange={(e) => setMenCount(Number(e.target.value))}
                    className="text-center text-lg border-border/50 focus:border-primary"
                  />
                </div>

                {/* Women Count */}
                <div className="space-y-2">
                  <Label htmlFor="womenCount" className="text-sm font-medium">
                    👩 מספר נשים
                  </Label>
                  <Input
                    id="womenCount"
                    type="number"
                    min="0"
                    max="10"
                    value={womenCount}
                    onChange={(e) => setWomenCount(Number(e.target.value))}
                    className="text-center text-lg border-border/50 focus:border-primary"
                  />
                </div>
              </div>

              {/* Total Display */}
              {totalGuests > 0 && (
                <div className="text-center p-4 bg-accent/50 rounded-lg border border-accent">
                  <p className="text-lg font-medium text-accent-foreground">
                    סה"כ מוזמנים: <span className="font-bold text-primary">{totalGuests}</span>
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
                    שולח...
                  </div>
                ) : (
                  "✅ אשר הגעה"
                )}
              </Button>

              {totalGuests === 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  אנא הזינו את מספר המוזמנים לפני האישור
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
                🕐 האירוע יתקיים בתאריך ובשעה שנקבעו
              </p>
              <p className="text-sm text-muted-foreground">
                📞 לשאלות: {phone}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RSVPForm;