import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Copy, ExternalLink, Key, Lock } from "lucide-react";

interface Event {
  id: string;
  title: string;
  client_username?: string;
  client_password?: string;
  client_access_enabled?: boolean;
}

interface ClientAuthManagerProps {
  selectedEvent: Event | null;
  onEventUpdate: () => void;
}

export const ClientAuthManager = ({ selectedEvent, onEventUpdate }: ClientAuthManagerProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [accessEnabled, setAccessEnabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedEvent) {
      setUsername(selectedEvent.client_username || '');
      setPassword(selectedEvent.client_password || '');
      setAccessEnabled(selectedEvent.client_access_enabled || false);
    } else {
      setUsername('');
      setPassword('');
      setAccessEnabled(false);
    }
  }, [selectedEvent]);

  const generateCredentials = () => {
    const eventCode = selectedEvent?.title.replace(/\s+/g, '').toLowerCase().slice(0, 8) || 'event';
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const generatedUsername = `${eventCode}_${randomSuffix}`;
    const generatedPassword = Math.random().toString(36).substring(2, 12);
    
    setUsername(generatedUsername);
    setPassword(generatedPassword);
  };

  const saveCredentials = async () => {
    if (!selectedEvent) return;
    
    if (!username.trim()) {
      toast({
        title: "שגיאה",
        description: "נא להזין שם משתמש",
        variant: "destructive",
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: "שגיאה", 
        description: "נא להזין סיסמא",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('events')
        .update({
          client_username: username.trim(),
          client_password: password.trim(),
          client_access_enabled: accessEnabled
        })
        .eq('id', selectedEvent.id);

      if (error) throw error;

      toast({
        title: "הצלחה",
        description: "פרטי התחברות נשמרו בהצלחה",
      });
      
      onEventUpdate();
    } catch (error: any) {
      console.error('Error saving client credentials:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בשמירת פרטי ההתחברות",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "הועתק",
      description: `${type} הועתק ללוח`,
    });
  };

  const copyLoginDetails = () => {
    const loginUrl = `${window.location.origin}/client-login`;
    const details = `פרטי התחברות לצפייה בסטטיסטיקות האירוע:\n\nקישור: ${loginUrl}\nשם משתמש: ${username}\nסיסמא: ${password}`;
    navigator.clipboard.writeText(details);
    toast({
      title: "הועתק",
      description: "פרטי ההתחברות הועתקו ללוח",
    });
  };

  const getClientDashboardUrl = () => {
    return selectedEvent ? `${window.location.origin}/client-dashboard/${selectedEvent.id}` : '';
  };

  if (!selectedEvent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            גישת לקוח
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              נא לבחור אירוע כדי לנהל גישת לקוח
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          גישת לקוח - {selectedEvent.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Access Status */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span className="font-medium">גישת לקוח פעילה</span>
            <Badge variant={accessEnabled ? "default" : "secondary"}>
              {accessEnabled ? "פעיל" : "לא פעיל"}
            </Badge>
          </div>
          <Switch
            checked={accessEnabled}
            onCheckedChange={setAccessEnabled}
          />
        </div>

        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="client-username">שם משתמש</Label>
          <div className="flex gap-2">
            <Input
              id="client-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="הזן שם משתמש"
              dir="ltr"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(username, 'שם המשתמש')}
              disabled={!username}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="client-password">סיסמא</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="client-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="הזן סיסמא"
                dir="ltr"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(password, 'הסיסמא')}
              disabled={!password}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={generateCredentials}
            variant="outline"
            size="sm"
          >
            יצר פרטי התחברות
          </Button>
          
          <Button
            onClick={saveCredentials}
            disabled={isLoading || !username.trim() || !password.trim()}
            size="sm"
          >
            {isLoading ? 'שומר...' : 'שמור'}
          </Button>
          
          <Button
            onClick={copyLoginDetails}
            variant="outline"
            size="sm"
            disabled={!username || !password}
          >
            <Copy className="w-4 h-4 ml-1" />
            העתק פרטים
          </Button>
        </div>

        {/* Links */}
        {username && password && accessEnabled && (
          <div className="space-y-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-700">
              <ExternalLink className="w-4 h-4" />
              <span className="font-medium">קישורים ללקוח</span>
            </div>
            
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span>דף התחברות:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open('/client-login', '_blank')}
                  className="text-green-600 hover:text-green-700"
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <span>לוח בקרה:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(getClientDashboardUrl(), '_blank')}
                  className="text-green-600 hover:text-green-700"
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};