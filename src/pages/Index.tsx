import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSelector from "@/components/LanguageSelector";

const Index = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-8 px-4" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
      <div className="max-w-md mx-auto space-y-8">
        {/* Language Selector */}
        <div className={`flex ${i18n.language === 'he' ? 'justify-start' : 'justify-end'} mb-4`}>
          <LanguageSelector />
        </div>

        {/* Admin Access Only */}
        <Card className="bg-gradient-card shadow-soft">
          <CardHeader>
            <CardTitle className="text-xl text-center">🔐 {t('index.adminAccess')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <div className="text-2xl">📊</div>
                <h3 className="font-semibold">{t('navigation.admin')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('index.adminDescription')}
                </p>
              </div>
              <Button 
                onClick={() => navigate('/admin')}
                variant="outline"
                className="w-full"
              >
                {t('index.goToAdmin')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Client Access */}
        <Card className="bg-gradient-card shadow-soft">
          <CardHeader>
            <CardTitle className="text-xl text-center">👤 גישת לקוח</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <div className="text-2xl">📈</div>
                <h3 className="font-semibold">צפייה בסטטיסטיקות</h3>
                <p className="text-sm text-muted-foreground">
                  התחבר בעזרת פרטי ההתחברות שקיבלת כדי לצפות בסטטיסטיקות האירוע שלך
                </p>
              </div>
              <Button 
                onClick={() => navigate('/client-login')}
                variant="outline"
                className="w-full"
              >
                התחבר כלקוח
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
