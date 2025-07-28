import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import eventInvitation from "@/assets/event-invitation.jpg";

const Index = () => {
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.trim()) {
      const cleanPhone = phone.replace(/\D/g, '');
      navigate(`/rsvp/${cleanPhone}`);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="relative overflow-hidden rounded-lg shadow-elegant max-w-2xl mx-auto">
            <img 
              src={eventInvitation} 
              alt="הזמנה לאירוע" 
              className="w-full h-64 md:h-80 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                🎭 מערכת אישורי הגעה
              </h1>
              <p className="text-lg opacity-90">
                ברוכים הבאים לאירוע המיוחד שלנו
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Guest Access */}
          <Card className="bg-gradient-card shadow-soft">
            <CardHeader>
              <CardTitle className="text-xl text-center">👋 למוזמנים</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="phone">הזן את מספר הטלפון שלך</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="050-1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="text-center text-lg"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  ✅ אשר הגעה
                </Button>
              </form>
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  💡 הזן את מספר הטלפון שבו קיבלת את ההזמנה
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Admin Access */}
          <Card className="bg-gradient-card shadow-soft">
            <CardHeader>
              <CardTitle className="text-xl text-center">🔐 למנהלי האירוע</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <div className="text-2xl">📊</div>
                  <h3 className="font-semibold">מערכת ניהול</h3>
                  <p className="text-sm text-muted-foreground">
                    העלאת רשימות, מעקב אישורים וייצוא נתונים
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/admin')}
                  variant="outline"
                  className="w-full"
                >
                  כניסה למערכת הניהול
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl mb-3">📱</div>
              <h3 className="font-semibold mb-2">נוח לשימוש</h3>
              <p className="text-sm text-muted-foreground">
                ממשק פשוט ונוח לאישור הגעה מהטלפון
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-semibold mb-2">מהיר ויעיל</h3>
              <p className="text-sm text-muted-foreground">
                אישור מהיר עם ספירת מוזמנים גברים ונשים
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl mb-3">📈</div>
              <h3 className="font-semibold mb-2">מעקב מלא</h3>
              <p className="text-sm text-muted-foreground">
                מערכת ניהול מתקדמת עם ייצוא לאקסל
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Demo Links */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="font-semibold text-lg">🎯 קישורי דמו</h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/rsvp/0501234567')}
                  className="flex-1 sm:flex-initial"
                >
                  דמו - משה כהן
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/rsvp/0527654321')}
                  className="flex-1 sm:flex-initial"
                >
                  דמו - שרה לוי
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                לצפייה במערכת ללא הרשמה
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
