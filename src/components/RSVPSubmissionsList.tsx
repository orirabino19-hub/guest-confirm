import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users, User } from "lucide-react";
import { RSVPSubmission } from "@/hooks/useRSVP";

interface RSVPSubmissionsListProps {
  submissions: RSVPSubmission[];
  loading?: boolean;
}

const RSVPSubmissionsList = ({ submissions, loading }: RSVPSubmissionsListProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            אישורי הגעה
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (submissions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            אישורי הגעה
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>עדיין לא נתקבלו אישורי הגעה</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          אישורי הגעה ({submissions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{submission.full_name || "אורח"}</span>
                  <Badge variant="outline" className="text-xs">
                    {submission.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>גברים: {submission.men_count}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>נשים: {submission.women_count}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>סה"כ: {submission.men_count + submission.women_count}</span>
                  </div>
                </div>
                {Object.keys(submission.answers as any || {}).length > 0 && (
                  <div className="mt-2 p-2 bg-background rounded border">
                    <div className="text-xs text-muted-foreground mb-1">תשובות נוספות:</div>
                    <div className="text-sm">
                      {Object.entries(submission.answers as any || {}).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="font-medium">{key}:</span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground text-left">
                {new Date(submission.submitted_at).toLocaleDateString('he-IL', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RSVPSubmissionsList;