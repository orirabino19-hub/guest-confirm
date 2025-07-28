import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import RSVPForm from "@/components/RSVPForm";
import { Card, CardContent } from "@/components/ui/card";

const RSVP = () => {
  const { eventId, phone } = useParams<{ eventId: string; phone: string }>();
  const [guestName, setGuestName] = useState<string>("");
  const [eventName, setEventName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      if (!phone || !eventId) {
        setError("קישור לא תקין - חסרים פרטים");
        setLoading(false);
        return;
      }

      try {
        // Simulate API call to fetch guest and event data
        // This will be connected to Supabase later
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock event data
        const mockEvents = {
          "1": "החתונה של שייקי ומיכל",
          "2": "יום הולדת 30 לדני"
        };
        
        // Mock guest data
        const mockGuests = {
          "0501234567": "משה כהן",
          "0527654321": "שרה לוי",
          "0543216789": "דוד ישראלי",
          "0556789123": "רחל אברהם"
        };

        const foundEvent = mockEvents[eventId as keyof typeof mockEvents];
        if (!foundEvent) {
          setError("האירוע לא נמצא במערכת");
          setLoading(false);
          return;
        }

        const cleanPhone = phone.replace(/\D/g, '');
        const foundGuest = mockGuests[cleanPhone as keyof typeof mockGuests];
        
        setEventName(foundEvent);
        setGuestName(foundGuest || "אורח יקר");
      } catch (err) {
        setError("שגיאה בטעינת נתוני המוזמן");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [phone, eventId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-lg text-muted-foreground">טוען נתונים...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-md mx-4 border-destructive/50">
          <CardContent className="text-center py-12">
            <div className="text-4xl mb-4">❌</div>
            <h2 className="text-xl font-semibold mb-2 text-destructive">שגיאה</h2>
            <p className="text-muted-foreground">{error}</p>
            <a 
              href="/" 
              className="inline-block mt-4 text-primary hover:underline"
            >
              חזור לעמוד הראשי
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <RSVPForm 
      guestName={guestName} 
      phone={phone || ""} 
      eventName={eventName}
    />
  );
};

export default RSVP;