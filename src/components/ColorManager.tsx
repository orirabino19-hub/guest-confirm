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
      backgroundColor: "#faf9f7", // hsl(42, 15%, 98%) - matches system background
      textColor: "#302921",       // hsl(25, 25%, 15%) - matches system foreground  
      primaryColor: "#d4910b",    // hsl(38, 85%, 45%) - matches system primary
      secondaryColor: "#7a6f63"   // hsl(25, 15%, 45%) - matches system muted-foreground
    }
  ]);

  const currentTheme = colorThemes.find(theme => theme.eventId === selectedEventId) || {
    eventId: selectedEventId || "",
    backgroundColor: "#faf9f7",  // matches system background
    textColor: "#302921",        // matches system foreground
    primaryColor: "#d4910b",     // matches system primary
    secondaryColor: "#7a6f63"    // matches system muted-foreground
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
      backgroundColor: "#faf9f7",  // matches system background
      textColor: "#302921",        // matches system foreground
      primaryColor: "#d4910b",     // matches system primary
      secondaryColor: "#7a6f63"    // matches system muted-foreground
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
              
              {/* Exact RSVP Page Preview */}
              <div 
                className="min-h-screen py-4 px-4 rounded-lg border-2"
                style={{ 
                  backgroundColor: tempTheme.backgroundColor,
                  borderColor: tempTheme.primaryColor + '40'
                }}
              >
                <div className="max-w-lg mx-auto space-y-4">
                  {/* Event Invitation Image */}
                  <div className="relative overflow-hidden rounded-lg shadow-lg">
                    <img 
                      src="/src/assets/event-invitation.jpg" 
                      alt="הזמנה לאירוע" 
                      className="w-full h-auto max-h-[30vh] object-contain"
                      style={{ backgroundColor: tempTheme.backgroundColor }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                  </div>

                  {/* Combined Welcome and RSVP Form */}
                  <div 
                    className="rounded-lg shadow-lg border p-6"
                    style={{ 
                      backgroundColor: tempTheme.backgroundColor,
                      borderColor: tempTheme.primaryColor + '30'
                    }}
                  >
                    {/* Header */}
                    <div className="text-center pb-4">
                      <h1 className="text-xl md:text-2xl font-bold mb-2" style={{ color: tempTheme.textColor }}>
                        שלום דינה ממן! 👋
                      </h1>
                      <p className="mb-3" style={{ color: tempTheme.secondaryColor }}>
                        אנחנו מתכבדים להזמינכם לחתונה של מאיר ובסי
                      </p>
                      <div 
                        className="border-t pt-4"
                        style={{ borderColor: tempTheme.primaryColor + '30' }}
                      >
                        <h2 className="text-lg font-semibold" style={{ color: tempTheme.primaryColor }}>
                          🎉 אישור הגעה
                        </h2>
                        <p className="text-sm mt-1" style={{ color: tempTheme.secondaryColor }}>
                          אנא אשרו את הגעתכם לאירוע
                        </p>
                      </div>
                    </div>

                    {/* Form Content */}
                    <div className="space-y-4">
                      {/* Guest Counters */}
                      <div 
                        className="space-y-3 p-3 rounded-lg border"
                        style={{ 
                          backgroundColor: tempTheme.backgroundColor + '20',
                          borderColor: tempTheme.primaryColor + '30'
                        }}
                      >
                        <h3 className="font-medium text-center mb-4" style={{ color: tempTheme.textColor }}>
                          מספר משתתפים
                        </h3>
                        
                        {/* Men Counter */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium" style={{ color: tempTheme.textColor }}>
                            גברים
                          </label>
                          <div className="flex items-center gap-2">
                            <button 
                              className="h-10 w-10 rounded border flex items-center justify-center"
                              style={{ 
                                borderColor: tempTheme.primaryColor,
                                color: tempTheme.primaryColor,
                                backgroundColor: tempTheme.backgroundColor
                              }}
                            >
                              -
                            </button>
                            <div 
                              className="flex-1 text-center text-lg py-2 border rounded"
                              style={{ 
                                borderColor: tempTheme.primaryColor + '60',
                                backgroundColor: tempTheme.backgroundColor,
                                color: tempTheme.textColor
                              }}
                            >
                              1
                            </div>
                            <button 
                              className="h-10 w-10 rounded border flex items-center justify-center"
                              style={{ 
                                borderColor: tempTheme.primaryColor,
                                color: tempTheme.primaryColor,
                                backgroundColor: tempTheme.backgroundColor
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Women Counter */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium" style={{ color: tempTheme.textColor }}>
                            נשים
                          </label>
                          <div className="flex items-center gap-2">
                            <button 
                              className="h-10 w-10 rounded border flex items-center justify-center"
                              style={{ 
                                borderColor: tempTheme.primaryColor,
                                color: tempTheme.primaryColor,
                                backgroundColor: tempTheme.backgroundColor
                              }}
                            >
                              -
                            </button>
                            <div 
                              className="flex-1 text-center text-lg py-2 border rounded"
                              style={{ 
                                borderColor: tempTheme.primaryColor + '60',
                                backgroundColor: tempTheme.backgroundColor,
                                color: tempTheme.textColor
                              }}
                            >
                              1
                            </div>
                            <button 
                              className="h-10 w-10 rounded border flex items-center justify-center"
                              style={{ 
                                borderColor: tempTheme.primaryColor,
                                color: tempTheme.primaryColor,
                                backgroundColor: tempTheme.backgroundColor
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Total Guests Display */}
                      <div 
                        className="text-center py-3 rounded-lg"
                        style={{ 
                          backgroundColor: tempTheme.primaryColor + '10',
                          color: tempTheme.primaryColor
                        }}
                      >
                        <span className="font-medium">סה״כ משתתפים: 2</span>
                      </div>

                      {/* Submit Button */}
                      <button 
                        className="w-full px-6 py-3 rounded-lg text-white font-medium transition-colors"
                        style={{ backgroundColor: tempTheme.primaryColor }}
                      >
                        שלח אישור הגעה
                      </button>
                    </div>
                  </div>
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