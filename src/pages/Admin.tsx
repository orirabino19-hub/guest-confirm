import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Guest {
  id: string;
  fullName: string;
  phone: string;
  menCount?: number;
  womenCount?: number;
  totalGuests?: number;
  confirmedAt?: string;
  status: 'pending' | 'confirmed';
}

const Admin = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Mock authentication - will be replaced with Supabase auth
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "123456") {
      setIsAuthenticated(true);
      loadGuestsData();
      toast({
        title: "✅ התחברות בהצלחה",
        description: "ברוכים הבאים למערכת הניהול"
      });
    } else {
      toast({
        title: "❌ שגיאת התחברות",
        description: "שם משתמש או סיסמא שגויים",
        variant: "destructive"
      });
    }
  };

  const loadGuestsData = async () => {
    setLoading(true);
    try {
      // Mock data - will be replaced with Supabase queries
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: Guest[] = [
        {
          id: "1",
          fullName: "משה כהן",
          phone: "0501234567",
          menCount: 2,
          womenCount: 3,
          totalGuests: 5,
          confirmedAt: new Date().toISOString(),
          status: 'confirmed'
        },
        {
          id: "2", 
          fullName: "שרה לוי",
          phone: "0527654321",
          status: 'pending'
        },
        {
          id: "3",
          fullName: "דוד ישראלי", 
          phone: "0543216789",
          menCount: 1,
          womenCount: 2,
          totalGuests: 3,
          confirmedAt: new Date(Date.now() - 86400000).toISOString(),
          status: 'confirmed'
        },
        {
          id: "4",
          fullName: "רחל אברהם",
          phone: "0556789123", 
          status: 'pending'
        }
      ];
      
      setGuests(mockData);
    } catch (error) {
      toast({
        title: "❌ שגיאה",
        description: "שגיאה בטעינת נתוני המוזמנים",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // This will be implemented with proper Excel parsing later
      toast({
        title: "📁 קובץ נטען",
        description: `הקובץ ${file.name} נטען בהצלחה (זמנית)`
      });
    }
  };

  const exportToExcel = () => {
    // This will be implemented with proper Excel export later
    const confirmedGuests = guests.filter(g => g.status === 'confirmed');
    const totalConfirmed = confirmedGuests.reduce((sum, g) => sum + (g.totalGuests || 0), 0);
    
    toast({
      title: "📊 ייצוא בהצלחה", 
      description: `יוצאו ${confirmedGuests.length} אישורים (${totalConfirmed} מוזמנים בסה"כ)`
    });
  };

  const copyInviteLink = (phone: string) => {
    const link = `${window.location.origin}/rsvp/${phone}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "🔗 הקישור הועתק",
      description: "הקישור הועתק ללוח"
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-center text-2xl">🔐 כניסת מנהל</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">שם משתמש</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">סיסמא</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                התחבר
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                דמו: admin / 123456
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const confirmedCount = guests.filter(g => g.status === 'confirmed').length;
  const pendingCount = guests.filter(g => g.status === 'pending').length;
  const totalConfirmedGuests = guests
    .filter(g => g.status === 'confirmed')
    .reduce((sum, g) => sum + (g.totalGuests || 0), 0);

  return (
    <div className="min-h-screen bg-background p-4" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gradient-card">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">🎭 מערכת ניהול אירועים</CardTitle>
                <p className="text-muted-foreground">ניהול אישורי הגעה</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setIsAuthenticated(false)}
              >
                התנתק
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{confirmedCount}</div>
                <p className="text-sm text-muted-foreground">אישרו הגעה</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">{pendingCount}</div>
                <p className="text-sm text-muted-foreground">ממתינים לאישור</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totalConfirmedGuests}</div>
                <p className="text-sm text-muted-foreground">סה"כ מוזמנים</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="guests" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="guests">רשימת מוזמנים</TabsTrigger>
            <TabsTrigger value="upload">העלאת קובץ</TabsTrigger>
            <TabsTrigger value="export">ייצוא נתונים</TabsTrigger>
          </TabsList>

          <TabsContent value="guests">
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
                ) : (
                  <div className="space-y-4">
                    {guests.map((guest) => (
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
          </TabsContent>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>📁 העלאת קובץ אקסל</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="excel-file">בחר קובץ אקסל (עם עמודות: שם מלא, טלפון)</Label>
                  <Input
                    id="excel-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="mt-2"
                  />
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">📝 הוראות:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• הקובץ צריך להכיל עמודה "שם מלא" ועמודה "טלפון"</li>
                    <li>• הטלפון צריך להיות במספר ספרות ישראלי</li>
                    <li>• לאחר העלאה, הקישורים ייווצרו אוטומטית</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export">
            <Card>
              <CardHeader>
                <CardTitle>📊 ייצוא נתונים</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={exportToExcel} className="h-20">
                    📥 ייצא אישורים לאקסל
                  </Button>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">📈 סיכום</h4>
                    <ul className="text-sm space-y-1">
                      <li>אישרו הגעה: {confirmedCount}</li>
                      <li>ממתינים: {pendingCount}</li>
                      <li>סה"כ מוזמנים: {totalConfirmedGuests}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;