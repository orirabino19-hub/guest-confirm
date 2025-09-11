import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Palette, Eye, RotateCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import eventInvitation from "@/assets/event-invitation.jpg";

interface ColorTheme {
  eventId: string;
  backgroundColor: string;
  textColor: string;
  primaryColor: string;
  secondaryColor: string;
  cardBackground: string;
  inputBackground: string;
}

interface ColorManagerProps {
  selectedEventId: string | null;
  eventName?: string;
}

const ColorManager = ({ selectedEventId, eventName }: ColorManagerProps) => {
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState("colors");
  
  // Event invitation state
  const [invitationUrl, setInvitationUrl] = useState<string>(eventInvitation);
  const [invitationType, setInvitationType] = useState<'image' | 'pdf'>('image');
  const [isLoadingInvitation, setIsLoadingInvitation] = useState(true);

  // Load event invitation when selectedEventId changes
  useEffect(() => {
    const fetchInvitation = async () => {
      if (!selectedEventId) {
        setInvitationUrl(eventInvitation);
        setInvitationType('image');
        setIsLoadingInvitation(false);
        return;
      }

      try {
        // Try to fetch invitation image first, then PDF
        const imageFileName = `${i18n.language}-image`;
        const pdfFileName = `${i18n.language}-pdf`;
        
        // Check for image files with different extensions
        const extensions = ['jpg', 'jpeg', 'png', 'webp'];
        let foundUrl = null;
        let fileType: 'image' | 'pdf' = 'image';
        
        for (const ext of extensions) {
          try {
            const { data } = await supabase.storage
              .from('invitations')
              .getPublicUrl(`${selectedEventId}/${imageFileName}.${ext}`);
            
            // Check if file actually exists
            const response = await fetch(data.publicUrl, { method: 'HEAD' });
            if (response.ok) {
              foundUrl = data.publicUrl;
              fileType = 'image';
              break;
            }
          } catch (error) {
            // Continue to next extension
          }
        }
        
        // If no image found, try PDF
        if (!foundUrl) {
          try {
            const { data } = await supabase.storage
              .from('invitations')
              .getPublicUrl(`${selectedEventId}/${pdfFileName}.pdf`);
            
            const response = await fetch(data.publicUrl, { method: 'HEAD' });
            if (response.ok) {
              foundUrl = data.publicUrl;
              fileType = 'pdf';
            }
          } catch (error) {
            // Use default if PDF also not found
          }
        }
        
        setInvitationUrl(foundUrl || eventInvitation);
        setInvitationType(fileType);
      } catch (error) {
        console.error('Error fetching invitation:', error);
        setInvitationUrl(eventInvitation);
        setInvitationType('image');
      } finally {
        setIsLoadingInvitation(false);
      }
    };

    fetchInvitation();
  }, [selectedEventId, i18n.language]);
  
  // Color themes state
  const [colorThemes, setColorThemes] = useState<ColorTheme[]>([]);
  const [loadingTheme, setLoadingTheme] = useState(false);

  // Default theme values
  const defaultTheme = {
    eventId: selectedEventId || "",
    backgroundColor: "#faf9f7",  // matches system background
    textColor: "#302921",        // matches system foreground
    primaryColor: "#d4910b",     // matches system primary
    secondaryColor: "#7a6f63",   // matches system muted-foreground
    cardBackground: "#ffffff",    // white background for form card
    inputBackground: "#ffffff"   // white background for input fields
  };

  const currentTheme = colorThemes.find(theme => theme.eventId === selectedEventId) || defaultTheme;
  const [tempTheme, setTempTheme] = useState<ColorTheme>(currentTheme);

  // Load theme from database when selectedEventId changes
  useEffect(() => {
    const loadEventTheme = async () => {
      if (!selectedEventId) return;

      setLoadingTheme(true);
      try {
        const { data, error } = await supabase
          .from('events')
          .select('theme')
          .eq('id', selectedEventId)
          .single();

        if (error) throw error;

        if (data?.theme) {
          // Parse theme from database
          const dbTheme = typeof data.theme === 'string' ? JSON.parse(data.theme) : data.theme;
          const themeWithEventId = { ...dbTheme, eventId: selectedEventId };
          
          // Update color themes state
          setColorThemes(prev => {
            const existing = prev.findIndex(theme => theme.eventId === selectedEventId);
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = themeWithEventId;
              return updated;
            } else {
              return [...prev, themeWithEventId];
            }
          });
          
          // Update temp theme for editing
          setTempTheme(themeWithEventId);
        } else {
          // No theme in database, use default
          setTempTheme(defaultTheme);
        }
      } catch (error: any) {
        console.error('Error loading theme:', error);
        // Use default theme on error
        setTempTheme(defaultTheme);
      } finally {
        setLoadingTheme(false);
      }
    };

    loadEventTheme();
  }, [selectedEventId]);

  // Update tempTheme when currentTheme changes
  useEffect(() => {
    setTempTheme(currentTheme);
  }, [currentTheme]);

  const handleColorChange = (colorType: keyof ColorTheme, value: string) => {
    if (colorType === 'eventId') return;
    setTempTheme(prev => ({
      ...prev,
      [colorType]: value
    }));
  };

  const handleSave = async () => {
    if (!selectedEventId) return;

    const updatedTheme = { ...tempTheme, eventId: selectedEventId };
    
    try {
      // Save to database
      const { error } = await supabase
        .from('events')
        .update({ theme: updatedTheme })
        .eq('id', selectedEventId);

      if (error) throw error;

      // Update local state
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
        description: `הצבעים עבור ${eventName} עודכנו בהצלחה במסד הנתונים`
      });
    } catch (error: any) {
      toast({
        title: "❌ שגיאה בשמירת צבעים",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleReset = () => {
    setTempTheme(defaultTheme);
    
    toast({
      title: "🔄 צבעים אופסו",
      description: "הצבעים חזרו לברירת המחדל"
    });
  };

  const handlePreview = () => {
    // Switch to preview tab to show the actual preview
    setActiveTab("preview");
    toast({
      title: "👁️ תצוגה מקדימה",
      description: "מעבר לכרטיסיית התצוגה המקדימה"
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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

                {/* Card Background Color */}
                <div className="space-y-2">
                  <Label>רקע כרטיס הטופס</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={tempTheme.cardBackground}
                      onChange={(e) => handleColorChange('cardBackground', e.target.value)}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={tempTheme.cardBackground}
                      onChange={(e) => handleColorChange('cardBackground', e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">צבע רקע הכרטיס של טופס ההזמנה</p>
                </div>

                {/* Input Background Color */}
                <div className="space-y-2">
                  <Label>צבע רקע שדות input</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={tempTheme.inputBackground}
                      onChange={(e) => handleColorChange('inputBackground', e.target.value)}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={tempTheme.inputBackground}
                      onChange={(e) => handleColorChange('inputBackground', e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">צבע רקע שדות הקלט בטופס</p>
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
                    {isLoadingInvitation ? (
                      <div className="w-full h-64 bg-muted flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                      </div>
                    ) : (
                      <>
                        {invitationType === 'pdf' ? (
                          <div className="w-full h-[30vh] border border-border/30 rounded-lg bg-muted/50 flex flex-col items-center justify-center text-center p-8 space-y-4">
                            <div className="text-4xl mb-2">📄</div>
                            <h3 className="text-lg font-semibold" style={{ color: tempTheme.textColor }}>
                              {i18n.language === 'he' ? "הזמנה לאירוע" : "Event Invitation"}
                            </h3>
                            <p className="text-sm" style={{ color: tempTheme.secondaryColor }}>
                              {i18n.language === 'he' ? "לחץ כדי לצפות בהזמנה" : "Click to view invitation"}
                            </p>
                            <a 
                              href={invitationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 rounded-lg text-white font-medium"
                              style={{ backgroundColor: tempTheme.primaryColor }}
                            >
                              {i18n.language === 'he' ? "פתח הזמנה" : "Open Invitation"}
                            </a>
                          </div>
                        ) : (
                          <img 
                            src={invitationUrl} 
                            alt="הזמנה לאירוע" 
                            className="w-full h-auto max-h-[30vh] object-contain"
                            style={{ backgroundColor: tempTheme.backgroundColor }}
                            onError={(e) => {
                              // Fallback to default invitation if image fails to load
                              e.currentTarget.src = eventInvitation;
                            }}
                          />
                        )}
                      </>
                    )}
                    {invitationType !== 'pdf' && !isLoadingInvitation && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                    )}
                  </div>

                  {/* Combined Welcome and RSVP Form */}
                  <div 
                    className="rounded-lg shadow-lg border p-6"
                    style={{ 
                      backgroundColor: tempTheme.cardBackground,
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
                        backgroundColor: tempTheme.cardBackground + '20', 
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
                                backgroundColor: tempTheme.inputBackground,
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
                                backgroundColor: tempTheme.inputBackground,
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