import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Palette, Eye, RotateCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ColorTheme {
  eventId: string;
  backgroundColor: string;
  textColor: string;
  primaryColor: string;
  secondaryColor: string;
}

interface ColorManagerProps {
  selectedEventId: string | null;
  eventName?: string;
}

const ColorManager = ({ selectedEventId, eventName }: ColorManagerProps) => {
  const { toast } = useToast();
  
  // Mock data - in real app this would come from backend
  const [colorThemes, setColorThemes] = useState<ColorTheme[]>([
    {
      eventId: "1",
      backgroundColor: "#ffffff",
      textColor: "#000000", 
      primaryColor: "#3b82f6",
      secondaryColor: "#64748b"
    }
  ]);

  const currentTheme = colorThemes.find(theme => theme.eventId === selectedEventId) || {
    eventId: selectedEventId || "",
    backgroundColor: "#ffffff",
    textColor: "#000000",
    primaryColor: "#3b82f6", 
    secondaryColor: "#64748b"
  };

  const [tempTheme, setTempTheme] = useState<ColorTheme>(currentTheme);

  const handleColorChange = (colorType: keyof ColorTheme, value: string) => {
    if (colorType === 'eventId') return;
    setTempTheme(prev => ({
      ...prev,
      [colorType]: value
    }));
  };

  const handleSave = () => {
    if (!selectedEventId) return;

    const updatedTheme = { ...tempTheme, eventId: selectedEventId };
    
    setColorThemes(prev => {
      const existing = prev.findIndex(theme => theme.eventId === selectedEventId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = updatedTheme;
        return updated;
      } else {
        return [...prev, updatedTheme];
      }
    });

    toast({
      title: "✅ ערכת צבעים נשמרה",
      description: `הצבעים עבור ${eventName} עודכנו בהצלחה`
    });
  };

  const handleReset = () => {
    const defaultTheme = {
      eventId: selectedEventId || "",
      backgroundColor: "#ffffff",
      textColor: "#000000",
      primaryColor: "#3b82f6",
      secondaryColor: "#64748b"
    };
    setTempTheme(defaultTheme);
    
    toast({
      title: "🔄 צבעים אופסו",
      description: "הצבעים חזרו לברירת המחדל"
    });
  };

  const handlePreview = () => {
    // In real app, this would open a preview of the RSVP page with the selected colors
    toast({
      title: "👁️ תצוגה מקדימה",
      description: "פותח תצוגה מקדימה של דף ההזמנה עם הצבעים החדשים"
    });
  };

  if (!selectedEventId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            ניהול צבעים ועיצוב
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            בחר אירוע כדי לנהל צבעים ועיצוב
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          ניהול צבעים ועיצוב - {eventName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="colors" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="colors">צבעים</TabsTrigger>
            <TabsTrigger value="preview">תצוגה מקדימה</TabsTrigger>
          </TabsList>

          <TabsContent value="colors">
            <div className="space-y-6">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm">
                  התאם את צבעי דף ההזמנה עבור האירוע. השינויים יחולו על כל המוזמנים לאירוע זה.
                </p>
              </div>

              {/* Color Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Background Color */}
                <div className="space-y-2">
                  <Label>צבע רקע עיקרי</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={tempTheme.backgroundColor}
                      onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={tempTheme.backgroundColor}
                      onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">רקע הדף הראשי</p>
                </div>

                {/* Text Color */}
                <div className="space-y-2">
                  <Label>צבע טקסט עיקרי</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={tempTheme.textColor}
                      onChange={(e) => handleColorChange('textColor', e.target.value)}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={tempTheme.textColor}
                      onChange={(e) => handleColorChange('textColor', e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">צבע הטקסט הראשי</p>
                </div>

                {/* Primary Color */}
                <div className="space-y-2">
                  <Label>צבע ראשי (כפתורים)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={tempTheme.primaryColor}
                      onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={tempTheme.primaryColor}
                      onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">צבע הכפתורים והאלמנטים הפעילים</p>
                </div>

                {/* Secondary Color */}
                <div className="space-y-2">
                  <Label>צבע משני</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={tempTheme.secondaryColor}
                      onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={tempTheme.secondaryColor}
                      onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                      placeholder="#64748b"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">צבע טקסט משני ואלמנטים פחות חשובים</p>
                </div>
              </div>

              {/* Color Preview */}
              <div className="p-6 rounded-lg border-2" style={{ 
                backgroundColor: tempTheme.backgroundColor,
                color: tempTheme.textColor,
                borderColor: tempTheme.primaryColor + '40'
              }}>
                <h3 className="text-xl font-bold mb-2" style={{ color: tempTheme.textColor }}>
                  תצוגה מקדימה
                </h3>
                <p className="mb-4" style={{ color: tempTheme.secondaryColor }}>
                  כך ייראה הטקסט המשני בדף ההזמנה
                </p>
                <div className="flex gap-2">
                  <div 
                    className="px-4 py-2 rounded text-white text-sm font-medium"
                    style={{ backgroundColor: tempTheme.primaryColor }}
                  >
                    כפתור ראשי
                  </div>
                  <div 
                    className="px-4 py-2 rounded border text-sm"
                    style={{ 
                      borderColor: tempTheme.primaryColor,
                      color: tempTheme.primaryColor
                    }}
                  >
                    כפתור משני
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button onClick={handleSave} className="flex-1">
                  💾 שמור צבעים
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  איפוס
                </Button>
                <Button variant="outline" onClick={handlePreview}>
                  <Eye className="h-4 w-4 mr-1" />
                  תצוגה מקדימה
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">תצוגה מקדימה של דף ההזמנה</h4>
                <p className="text-sm text-muted-foreground">
                  כאן תוכל לראות איך יראה דף ההזמנה עם הצבעים שבחרת
                </p>
              </div>
              
              {/* Mock RSVP Preview */}
              <div 
                className="border-2 rounded-lg p-8 space-y-6"
                style={{ 
                  backgroundColor: tempTheme.backgroundColor,
                  color: tempTheme.textColor,
                  borderColor: tempTheme.primaryColor + '40'
                }}
              >
                {/* Mock Welcome Message */}
                <div className="text-center space-y-4">
                  <h1 className="text-3xl font-bold" style={{ color: tempTheme.textColor }}>
                    שלום דינה ממן! 👋
                  </h1>
                  <h2 className="text-xl" style={{ color: tempTheme.textColor }}>
                    אנחנו מתכבדים להזמינכם לחתונה של מאיר ובסי
                  </h2>
                </div>

                {/* Mock Form */}
                <div className="space-y-4 max-w-md mx-auto">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: tempTheme.secondaryColor }}>
                      האם תגיעו לאירוע?
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <div 
                          className="w-4 h-4 rounded-full border-2"
                          style={{ borderColor: tempTheme.primaryColor, backgroundColor: tempTheme.primaryColor }}
                        />
                        <span style={{ color: tempTheme.textColor }}>כן, אני משתתף/ת</span>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <div 
                          className="w-4 h-4 rounded-full border-2"
                          style={{ borderColor: tempTheme.secondaryColor }}
                        />
                        <span style={{ color: tempTheme.textColor }}>לא, לא אוכל להגיע</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: tempTheme.secondaryColor }}>
                      מספר משתתפים
                    </label>
                    <div 
                      className="w-full px-3 py-2 border rounded-md"
                      style={{ 
                        borderColor: tempTheme.primaryColor + '60',
                        backgroundColor: tempTheme.backgroundColor,
                        color: tempTheme.textColor
                      }}
                    >
                      2
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: tempTheme.secondaryColor }}>
                      הערות (אופציונלי)
                    </label>
                    <div 
                      className="w-full px-3 py-2 border rounded-md h-20"
                      style={{ 
                        borderColor: tempTheme.primaryColor + '60',
                        backgroundColor: tempTheme.backgroundColor,
                        color: tempTheme.textColor
                      }}
                    >
                    </div>
                  </div>

                  <button 
                    className="w-full px-6 py-3 rounded-lg text-white font-medium transition-colors"
                    style={{ backgroundColor: tempTheme.primaryColor }}
                  >
                    שלח אישור הגעה
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ColorManager;