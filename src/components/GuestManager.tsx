import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Phone, User, Copy, Trash2 } from 'lucide-react';
import { Guest } from '@/hooks/useGuests';
import { useShortCodes } from '@/hooks/useShortCodes';

interface GuestManagerProps {
  selectedEventId: string | null;
  selectedEventSlug: string | null;
  guests: Guest[];
  onGuestAdd: (guest: {
    eventId: string;
    fullName: string;
    phone: string;
  }) => void;
  onGuestDelete: (guestId: string) => void;
}

const GuestManager = ({ selectedEventId, selectedEventSlug, guests, onGuestAdd, onGuestDelete }: GuestManagerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newGuest, setNewGuest] = useState({
    fullName: '',
    phone: ''
  });
  const { toast } = useToast();
  const { generateShortLink, generateMissingCodes } = useShortCodes();

  // Generate missing codes when component mounts
  useEffect(() => {
    if (selectedEventId) {
      generateMissingCodes();
    }
  }, [selectedEventId]); // הסרת generateMissingCodes מהdependency array

  const validatePhoneNumber = (phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length === 10 && cleanPhone.startsWith('05');
  };

  const normalizePhoneNumber = (phone: string): string => {
    return phone.replace(/\D/g, '');
  };

  const handleAddGuest = () => {
    if (!selectedEventId) {
      toast({
        title: "⚠️ שגיאה",
        description: "יש לבחור אירוע",
        variant: "destructive"
      });
      return;
    }

    if (!newGuest.fullName.trim() || !newGuest.phone.trim()) {
      toast({
        title: "⚠️ שגיאה",
        description: "יש למלא את כל השדות",
        variant: "destructive"
      });
      return;
    }

    if (!validatePhoneNumber(newGuest.phone)) {
      toast({
        title: "⚠️ מספר טלפון לא תקין",
        description: "יש להזין מספר טלפון ישראלי תקין (10 ספרות, מתחיל ב-05)",
        variant: "destructive"
      });
      return;
    }

    const normalizedPhone = normalizePhoneNumber(newGuest.phone);
    
    // Check if guest with same phone already exists for this event
    const existingGuest = guests.find(
      g => g.event_id === selectedEventId && g.phone === normalizedPhone
    );

    if (existingGuest) {
      toast({
        title: "⚠️ אורח כבר קיים",
        description: "אורח עם מספר טלפון זה כבר קיים באירוע",
        variant: "destructive"
      });
      return;
    }

    const guestData = {
      eventId: selectedEventId,
      fullName: newGuest.fullName.trim(),
      phone: normalizedPhone
    };

    onGuestAdd(guestData);

    toast({
      title: "✅ אורח נוסף בהצלחה",
      description: `נוסף אורח: ${newGuest.fullName}`
    });

    setNewGuest({ fullName: '', phone: '' });
    setIsDialogOpen(false);
  };

  const copyInviteLink = async (phone: string) => {
    if (!selectedEventId) return;
    
    try {
      console.log('Generating short link for:', { eventId: selectedEventId, phone });
      const shortLink = await generateShortLink(selectedEventId, phone);
      console.log('Generated short link:', shortLink);
      navigator.clipboard.writeText(shortLink);
      toast({
        title: "🔗 הקישור הועתק",
        description: "קישור קצר הועתק ללוח"
      });
    } catch (error) {
      console.error('Error generating short link:', error);
      // Fallback to old format
      const link = `https://051bd908-619c-4c76-b223-2a29b67f0ecf.sandbox.lovable.dev/rsvp/${selectedEventId}/${phone}`;
      navigator.clipboard.writeText(link);
      toast({
        title: "🔗 הקישור הועתק",
        description: "הקישור הועתק ללוח"
      });
    }
  };

  const handleDeleteGuest = (guestId: string, guestName: string) => {
    onGuestDelete(guestId);
    toast({
      title: "🗑️ אורח נמחק",
      description: `האורח ${guestName} הוסר מהרשימה`
    });
  };

  const filteredGuests = selectedEventId 
    ? guests.filter(g => g.event_id === selectedEventId)
    : [];

  if (!selectedEventId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            ניהול אורחים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            בחר אירוע כדי לנהל אורחים
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          ניהול אורחים
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Guest Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <UserPlus className="h-4 w-4 ml-2" />
              הוסף אורח חדש
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>הוספת אורח חדש</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guest-name">שם מלא</Label>
                <Input
                  id="guest-name"
                  value={newGuest.fullName}
                  onChange={(e) => setNewGuest(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="הכנס שם מלא..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guest-phone">מספר טלפון</Label>
                <Input
                  id="guest-phone"
                  value={newGuest.phone}
                  onChange={(e) => setNewGuest(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="05X-XXXXXXX"
                  dir="ltr"
                />
                <p className="text-sm text-muted-foreground">
                  מספר טלפון ישראלי - 10 ספרות מתחיל ב-05
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddGuest} className="flex-1">
                  <UserPlus className="h-4 w-4 ml-2" />
                  הוסף אורח
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  ביטול
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Guests List */}
        {filteredGuests.length > 0 ? (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">אורחים באירוע ({filteredGuests.length})</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredGuests.map((guest) => (
                <div key={guest.id} className="flex items-center gap-2 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{guest.full_name}</span>
                      <Badge variant="secondary">אורח</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span className="font-mono">{guest.phone}</span>
                      {guest.men_count > 0 || guest.women_count > 0 ? (
                        <span className="text-green-600 font-medium">
                          • {guest.men_count + guest.women_count} מוזמנים
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyInviteLink(guest.phone)}
                      title="העתק קישור"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteGuest(guest.id, guest.full_name || 'אורח לא ידוע')}
                      className="text-red-500 hover:text-red-700"
                      title="מחק אורח"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            אין אורחים באירוע זה עדיין
          </div>
        )}

        {/* Quick Stats */}
        {filteredGuests.length > 0 && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredGuests.filter(g => g.men_count > 0 || g.women_count > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">עם נתונים</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredGuests.reduce((sum, g) => sum + g.men_count + g.women_count, 0)}
              </div>
              <div className="text-sm text-muted-foreground">סה"כ מוזמנים</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GuestManager;