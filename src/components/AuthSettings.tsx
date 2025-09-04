import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const AuthSettings = () => {
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Load current username from localStorage
    const username = localStorage.getItem('adminUsername') || 'admin';
    setCurrentUsername(username);
  }, []);

  const handleUpdateCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUsername.trim() || !newPassword.trim()) {
      toast({
        title: "❌ שגיאה",
        description: "יש למלא את כל השדות",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "❌ שגיאה",
        description: "הסיסמאות אינן תואמות",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 4) {
      toast({
        title: "❌ שגיאה",
        description: "הסיסמא חייבת להכיל לפחות 4 תווים",
        variant: "destructive"
      });
      return;
    }

    // Save new credentials to localStorage
    localStorage.setItem('adminUsername', newUsername);
    localStorage.setItem('adminPassword', newPassword);
    
    setCurrentUsername(newUsername);
    setNewUsername("");
    setNewPassword("");
    setConfirmPassword("");

    toast({
      title: "✅ עודכן בהצלחה",
      description: "פרטי ההתחברות עודכנו בהצלחה"
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔐 ניהול פרטי התחברות</CardTitle>
        <p className="text-sm text-muted-foreground">
          עדכן את שם המשתמש והסיסמא למערכת הניהול
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current credentials display */}
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">פרטי התחברות נוכחיים:</h3>
          <p className="text-sm">
            <span className="font-medium">שם משתמש:</span> {currentUsername}
          </p>
          <p className="text-sm">
            <span className="font-medium">סיסמא:</span> ••••••••
          </p>
        </div>

        {/* Update form */}
        <form onSubmit={handleUpdateCredentials} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-username">שם משתמש חדש</Label>
            <Input
              id="new-username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="הכנס שם משתמש חדש"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="new-password">סיסמא חדשה</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="הכנס סיסמא חדשה"
              required
              minLength={4}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-password">אישור סיסמא</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="הכנס את הסיסמא שנית"
              required
              minLength={4}
            />
          </div>

          <Button type="submit" className="w-full">
            עדכן פרטי התחברות
          </Button>
        </form>

        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800">
            <strong>⚠️ שים לב:</strong> שינוי פרטי ההתחברות יחייב אותך להתחבר מחדש במפגש הבא.
            וודא שאתה זוכר את הפרטים החדשים!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthSettings;