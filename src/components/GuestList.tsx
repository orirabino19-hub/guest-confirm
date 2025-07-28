import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export interface Guest {
  id: string;
  eventId: string;
  fullName: string;
  phone: string;
  menCount?: number;
  womenCount?: number;
  totalGuests?: number;
  confirmedAt?: string;
  status: 'pending' | 'confirmed';
}

interface GuestListProps {
  guests: Guest[];
  loading: boolean;
  selectedEventId: string | null;
}

const GuestList = ({ guests, loading, selectedEventId }: GuestListProps) => {
  const { toast } = useToast();

  const copyInviteLink = (phone: string) => {
    const link = `${window.location.origin}/rsvp/${selectedEventId}/${phone}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "🔗 הקישור הועתק",
      description: "הקישור הועתק ללוח"
    });
  };

  const filteredGuests = selectedEventId 
    ? guests.filter(g => g.eventId === selectedEventId)
    : [];

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
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{guest.fullName}</h3>
                    <Badge variant={guest.status === 'confirmed' ? 'default' : 'secondary'}>
                      {guest.status === 'confirmed' ? 'אישר' : 'ממתין'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">📞 {guest.phone}</p>
                  {guest.status === 'confirmed' && (
                    <p className="text-sm text-green-600">
                      👥 {guest.totalGuests} מוזמנים ({guest.menCount} גברים, {guest.womenCount} נשים)
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