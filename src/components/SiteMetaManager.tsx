import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SiteMetaManagerProps {
  eventId: string;
}

const SiteMetaManager = ({ eventId }: SiteMetaManagerProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [siteTitle, setSiteTitle] = useState("");
  const [siteDescription, setSiteDescription] = useState("");

  useEffect(() => {
    loadSiteMeta();
  }, [eventId]);

  const loadSiteMeta = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('site_title, site_description')
        .eq('id', eventId)
        .single();

      if (error) throw error;

      if (data) {
        setSiteTitle(data.site_title || 'אישור הגעה לאירוע');
        setSiteDescription(data.site_description || 'מערכת אישור הגעה מתקדמת לאירועים. הזמינו אורחים בקלות ונהלו את רשימת המוזמנים');
      }
    } catch (error) {
      console.error('Error loading site meta:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('events')
        .update({
          site_title: siteTitle,
          site_description: siteDescription
        })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "✅ נשמר בהצלחה",
        description: "כותרת ותיאור האתר עודכנו"
      });
    } catch (error: any) {
      console.error('Error saving site meta:', error);
      toast({
        title: "❌ שגיאה",
        description: error.message || "שגיאה בשמירת הנתונים",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🌐 כותרת ותיאור האתר</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="site-title">כותרת האתר</Label>
          <Input
            id="site-title"
            value={siteTitle}
            onChange={(e) => setSiteTitle(e.target.value)}
            placeholder="אישור הגעה לאירוע"
            dir="rtl"
          />
          <p className="text-sm text-muted-foreground">
            הכותרת שתופיע בטאב הדפדפן ובשיתופים ברשתות חברתיות
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="site-description">תיאור האתר</Label>
          <Textarea
            id="site-description"
            value={siteDescription}
            onChange={(e) => setSiteDescription(e.target.value)}
            placeholder="מערכת אישור הגעה מתקדמת לאירועים. הזמינו אורחים בקלות ונהלו את רשימת המוזמנים"
            rows={3}
            dir="rtl"
          />
          <p className="text-sm text-muted-foreground">
            התיאור שיופיע בתוצאות חיפוש ובשיתופים ברשתות חברתיות
          </p>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? "שומר..." : "💾 שמור שינויים"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SiteMetaManager;
