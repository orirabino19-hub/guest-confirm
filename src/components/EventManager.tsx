import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  createdAt: string;
}

interface EventManagerProps {
  events: Event[];
  selectedEventId: string | null;
  onEventSelect: (eventId: string) => void;
  onEventCreate: (event: Omit<Event, 'id' | 'createdAt'>) => void;
  onEventDelete: (eventId: string) => void;
}

const EventManager = ({ 
  events, 
  selectedEventId, 
  onEventSelect, 
  onEventCreate, 
  onEventDelete 
}: EventManagerProps) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: "",
    description: "",
    date: ""
  });
  const { toast } = useToast();

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.name || !newEvent.date) {
      toast({
        title: "❌ שגיאה",
        description: "יש למלא את כל השדות הנדרשים",
        variant: "destructive"
      });
      return;
    }

    onEventCreate(newEvent);
    setNewEvent({ name: "", description: "", date: "" });
    setIsCreateOpen(false);
    toast({
      title: "✅ אירוע נוצר בהצלחה",
      description: `האירוע "${newEvent.name}" נוסף למערכת`
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>🎉 ניהול אירועים</CardTitle>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>הוסף אירוע חדש</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>יצירת אירוע חדש</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <Label htmlFor="event-name">שם האירוע *</Label>
                  <Input
                    id="event-name"
                    value={newEvent.name}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="לדוגמא: החתונה של שייקי ומיכל"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="event-description">תיאור האירוע</Label>
                  <Textarea
                    id="event-description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="תיאור קצר של האירוע..."
                  />
                </div>
                <div>
                  <Label htmlFor="event-date">תאריך האירוע *</Label>
                  <Input
                    id="event-date"
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    צור אירוע
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateOpen(false)}
                  >
                    ביטול
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              אין אירועים עדיין. צור אירוע ראשון!
            </div>
          ) : (
            events.map((event) => (
              <div 
                key={event.id} 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedEventId === event.id 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => onEventSelect(event.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{event.name}</h3>
                      {selectedEventId === event.id && (
                        <Badge variant="default">נבחר</Badge>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mb-1">
                        {event.description}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      📅 {new Date(event.date).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`האם אתה בטוח שברצונך למחוק את האירוע "${event.name}"?`)) {
                        onEventDelete(event.id);
                      }
                    }}
                  >
                    מחק
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventManager;