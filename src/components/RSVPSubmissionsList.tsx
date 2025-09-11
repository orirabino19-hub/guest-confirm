import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CalendarDays, Users, User, Edit, Trash2 } from "lucide-react";
import { RSVPSubmission } from "@/hooks/useRSVP";
import { supabase } from "@/integrations/supabase/client";

interface RSVPSubmissionsListProps {
  submissions: RSVPSubmission[];
  loading?: boolean;
  onDeleteSubmission?: (submissionId: string) => void;
  onUpdateSubmission?: (submissionId: string, updates: { 
    first_name?: string; 
    last_name?: string;
    men_count?: number; 
    women_count?: number; 
  }) => void;
}

const RSVPSubmissionsList = ({ submissions, loading, onDeleteSubmission, onUpdateSubmission }: RSVPSubmissionsListProps) => {
  const [editingSubmission, setEditingSubmission] = useState<RSVPSubmission | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    men_count: 0,
    women_count: 0
  });
  const [customFieldsMap, setCustomFieldsMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchCustomFields = async () => {
      if (submissions.length === 0) return;
      
      // Get unique event IDs from submissions
      const eventIds = [...new Set(submissions.map(s => s.event_id))];
      
      try {
        const { data: customFields } = await supabase
          .from('custom_fields_config')
          .select('key, label, event_id')
          .in('event_id', eventIds);

        if (customFields) {
          const fieldsMap: Record<string, string> = {};
          customFields.forEach(field => {
            fieldsMap[field.key] = field.label;
          });
          setCustomFieldsMap(fieldsMap);
        }
      } catch (error) {
        console.error('Error fetching custom fields:', error);
      }
    };

    fetchCustomFields();
  }, [submissions]);

  const getFieldLabel = (fieldKey: string): string => {
    return customFieldsMap[fieldKey] || fieldKey;
  };

  const getDisplayName = (submission: RSVPSubmission): string => {
    if (submission.first_name || submission.last_name) {
      return `${submission.first_name || ''} ${submission.last_name || ''}`.trim();
    }
    return submission.full_name || "אורח";
  };

  const handleEditClick = (submission: RSVPSubmission) => {
    setEditingSubmission(submission);
    setEditForm({
      first_name: submission.first_name || (submission.full_name ? submission.full_name.split(' ')[0] : ''),
      last_name: submission.last_name || (submission.full_name ? submission.full_name.split(' ').slice(1).join(' ') : ''),
      men_count: submission.men_count,
      women_count: submission.women_count
    });
  };

  const handleSaveEdit = () => {
    if (editingSubmission && onUpdateSubmission) {
      onUpdateSubmission(editingSubmission.id, editForm);
      setEditingSubmission(null);
    }
  };

  const handleDeleteClick = (submissionId: string) => {
    if (onDeleteSubmission) {
      onDeleteSubmission(submissionId);
    }
  };

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
                  <span className="font-medium">{getDisplayName(submission)}</span>
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
                          <span className="font-medium">{getFieldLabel(key)}:</span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-xs text-muted-foreground">
                  {new Date(submission.submitted_at).toLocaleDateString('he-IL', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className="flex gap-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(submission)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>עריכת אישור הגעה</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="first_name">שם פרטי</Label>
                          <Input
                            id="first_name"
                            value={editForm.first_name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="last_name">שם משפחה</Label>
                          <Input
                            id="last_name"
                            value={editForm.last_name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="men_count">מספר גברים</Label>
                          <Input
                            id="men_count"
                            type="number"
                            min="0"
                            value={editForm.men_count}
                            onChange={(e) => setEditForm(prev => ({ ...prev, men_count: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="women_count">מספר נשים</Label>
                          <Input
                            id="women_count"
                            type="number"
                            min="0"
                            value={editForm.women_count}
                            onChange={(e) => setEditForm(prev => ({ ...prev, women_count: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setEditingSubmission(null)}>
                            ביטול
                          </Button>
                          <Button onClick={handleSaveEdit}>
                            שמירה
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>מחיקת אישור הגעה</AlertDialogTitle>
                        <AlertDialogDescription>
                          האם אתה בטוח שברצונך למחוק את אישור ההגעה של {getDisplayName(submission)}?
                          פעולה זו לא ניתנת לביטול.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteClick(submission.id)}>
                          מחק
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RSVPSubmissionsList;