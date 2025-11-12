import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, ExternalLink, Trash2, BarChart3 } from "lucide-react";

interface ShortURL {
  id: string;
  slug: string;
  target_url: string;
  is_active: boolean;
  clicks_count: number;
  created_at: string;
}

export const URLShortener = () => {
  const [slug, setSlug] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [shortUrls, setShortUrls] = useState<ShortURL[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadShortUrls = async () => {
    try {
      const { data, error } = await supabase
        .from("short_urls")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setShortUrls(data || []);
    } catch (error) {
      console.error("Error loading short URLs:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לטעון את הקיצורים",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadShortUrls();
  }, []);

  const createShortUrl = async () => {
    if (!slug.trim() || !targetUrl.trim()) {
      toast({
        title: "שגיאה",
        description: "יש למלא את כל השדות",
        variant: "destructive",
      });
      return;
    }

    // Validate slug (alphanumeric and hyphens only)
    if (!/^[a-zA-Z0-9-_]+$/.test(slug)) {
      toast({
        title: "שגיאה",
        description: "הקיצור יכול להכיל רק אותיות באנגלית, מספרים, מקף וקו תחתון",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("short_urls")
        .insert({
          slug: slug.trim(),
          target_url: targetUrl.trim(),
        });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "שגיאה",
            description: "הקיצור הזה כבר קיים במערכת",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "✅ נוצר בהצלחה!",
        description: `הלינק ${window.location.origin}/${slug} נוצר`,
      });

      setSlug("");
      setTargetUrl("");
      loadShortUrls();
    } catch (error) {
      console.error("Error creating short URL:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו ליצור את הקיצור",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = (slug: string) => {
    const fullUrl = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    toast({
      title: "✅ הועתק!",
      description: "הלינק הועתק ללוח",
    });
  };

  const deleteShortUrl = async (id: string) => {
    try {
      const { error } = await supabase
        .from("short_urls")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "✅ נמחק",
        description: "הקיצור נמחק בהצלחה",
      });

      loadShortUrls();
    } catch (error) {
      console.error("Error deleting short URL:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו למחוק את הקיצור",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("short_urls")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "✅ עודכן",
        description: currentStatus ? "הקיצור הושבת" : "הקיצור הופעל",
      });

      loadShortUrls();
    } catch (error) {
      console.error("Error toggling short URL:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לעדכן את הסטטוס",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔗 מערכת קיצור לינקים
        </CardTitle>
        <CardDescription>
          צור לינקים מקוצרים שמפנים לכל כתובת שתרצה
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create Form */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="space-y-2">
            <Label htmlFor="slug">קיצור (באנגלית)</Label>
            <div className="flex gap-2">
              <span className="flex items-center px-3 rounded-md border bg-background text-muted-foreground text-sm">
                {window.location.origin}/
              </span>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Mendel"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              לדוגמה: Mendel (רק אותיות באנגלית, מספרים, מקף וקו תחתון)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetUrl">כתובת יעד</Label>
            <Input
              id="targetUrl"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="/rsvp/8/open או https://..."
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              ניתן להזין כתובת יחסית (/) או מלאה (https://)
            </p>
          </div>

          <Button onClick={createShortUrl} disabled={loading} className="w-full">
            {loading ? "יוצר..." : "צור קיצור"}
          </Button>
        </div>

        {/* Short URLs List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">קיצורים קיימים ({shortUrls.length})</h3>
          
          {shortUrls.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              עדיין לא נוצרו קיצורים
            </p>
          ) : (
            <div className="space-y-2">
              {shortUrls.map((url) => (
                <div
                  key={url.id}
                  className={`p-3 border rounded-lg space-y-2 ${
                    !url.is_active ? "opacity-50 bg-muted/30" : "bg-background"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-mono font-semibold text-primary">
                          {window.location.origin}/{url.slug}
                        </code>
                        {!url.is_active && (
                          <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">
                            לא פעיל
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        ← {url.target_url}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" />
                          {url.clicks_count} לחיצות
                        </span>
                        <span>
                          {new Date(url.created_at).toLocaleDateString("he-IL")}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyUrl(url.slug)}
                        title="העתק"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(`/${url.slug}`, "_blank")}
                        title="פתח"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleActive(url.id, url.is_active)}
                        title={url.is_active ? "השבת" : "הפעל"}
                      >
                        {url.is_active ? "⏸️" : "▶️"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteShortUrl(url.id)}
                        title="מחק"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
