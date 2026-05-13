import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Guest } from "@/hooks/useGuests";
import { useShortCodes } from "@/hooks/useShortCodes";
import { useEffect } from "react";

interface GuestListProps {
  guests: Guest[];
  loading: boolean;
  selectedEventId: string | null;
  selectedEventSlug: string | null;
}

const GuestList = ({ guests, loading, selectedEventId, selectedEventSlug }: GuestListProps) => {
  const { toast } = useToast();
  const { generateShortLink, generateMissingCodes } = useShortCodes();

  // Generate missing codes when component mounts
  useEffect(() => {
    if (selectedEventId) {
      generateMissingCodes();
    }
  }, [selectedEventId]); // הסרת generateMissingCodes מהdependency array

  const copyInviteLink = async (phone: string) => {
    if (!selectedEventId) return;
    
    try {
      const shortLink = await generateShortLink(selectedEventId, phone);
      navigator.clipboard.writeText(shortLink);
      toast({
        title: "🔗 הקישור הועתק",
        description: "קישור קצר הועתק ללוח"
      });
    } catch (error) {
      // Fallback to old format
      const currentDomain = window.location.origin;
      const link = `${currentDomain}/rsvp/${selectedEventId}/${phone}`;
      navigator.clipboard.writeText(link);
      toast({
        title: "🔗 הקישור הועתק",
        description: "הקישור הועתק ללוח"
      });
    }
  };

  const filteredGuests = guests; // Already filtered in parent

  if (!selectedEventId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📋 רשימת מוזמנים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            בחר אירוע כדי לראות את רשימת המוזמנים
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>📋 רשימת מוזמנים</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p>טוען נתונים...</p>
          </div>
        ) : filteredGuests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            אין מוזמנים לאירוע זה עדיין
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGuests.map((guest) => (
              <div key={guest.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1 text-right">
                   <div className="flex items-center gap-2 mb-1 justify-end">
                     <Badge variant="secondary">אורח</Badge>
                     <h3 className="font-medium">
                       {guest.first_name || guest.last_name 
                         ? `${guest.first_name || ''} ${guest.last_name || ''}`.trim()
                         : guest.full_name || 'אורח'
                       }
                     </h3>
                   </div>
                   <p className="text-sm text-muted-foreground">📞 {guest.phone}</p>
                   {(guest.men_count > 0 || guest.women_count > 0 || (guest.children_count || 0) > 0) && (
                     <p className="text-sm text-green-600">
                       👥 {guest.men_count + guest.women_count + (guest.children_count || 0)} מוזמנים ({guest.men_count} גברים, {guest.women_count} נשים{(guest.children_count || 0) > 0 ? `, ${guest.children_count} ילדים` : ''})
                     </p>
                   )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyInviteLink(guest.phone)}
                >
                  העתק קישור
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GuestList;