

## תוכנית: שליטה בזמן פתיחת אישורי הגעה

### מה יקרה
הוספת אפשרות לשלוט מתי אישורי ההגעה פתוחים - דרך מתג ידני (פתוח/סגור) ודרך תאריכי פתיחה/סגירה אופציונליים. ברירת המחדל: פתוח.

### שינויים

#### 1. מסד נתונים - Migration חדש
הוספת 3 עמודות לטבלת `events`:
- `rsvp_enabled` (boolean, default: **true**) - מתג ידני
- `rsvp_open_date` (timestamptz, nullable) - מתי לפתוח (אופציונלי)
- `rsvp_close_date` (timestamptz, nullable) - מתי לסגור (אופציונלי)

#### 2. פונקציית עזר חדשה - `src/utils/rsvpStatus.ts`
פונקציה `isRSVPOpen(event)` שמחזירה `{ open, reason }`:
- אם `rsvp_enabled = false` --> סגור (כובה ידנית)
- אם `rsvp_open_date` מוגדר ועדיין לא הגיע --> עוד לא נפתח
- אם `rsvp_close_date` מוגדר ועבר --> נסגר
- אחרת --> פתוח

#### 3. ממשק ניהול - `src/components/EventManager.tsx`
הוספה לטופס עריכת אירוע:
- מתג (Switch) "אישורי הגעה פתוחים" - ברירת מחדל: פועל
- שדה תאריך+שעה לפתיחה (אופציונלי)
- שדה תאריך+שעה לסגירה (אופציונלי)
- תצוגת סטטוס נוכחי עם Badge צבעוני

#### 4. דף RSVP אישי - `src/pages/RSVP.tsx`
- שליפת שדות `rsvp_enabled`, `rsvp_open_date`, `rsvp_close_date` מהאירוע
- בדיקה עם `isRSVPOpen` - אם סגור, הצגת הודעה ידידותית במקום הטופס

#### 5. דף RSVP פתוח - `src/pages/OpenRSVP.tsx`
- אותה לוגיקה כמו בדף האישי - חסימת הטופס כשאישורים סגורים

#### 6. עדכון `useEvents.ts` ו-`EventManager` types
- הוספת השדות החדשים ל-interface של Event
- העברתם דרך `onEventUpdate`

---

### פרטים טכניים

**SQL Migration:**
```sql
ALTER TABLE events
  ADD COLUMN rsvp_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN rsvp_open_date timestamptz,
  ADD COLUMN rsvp_close_date timestamptz;
```

**הודעות למשתמש כשסגור:**
- כובה ידנית: "אישורי הגעה לאירוע זה אינם פעילים כרגע"
- טרם נפתח: "אישורי הגעה ייפתחו בתאריך [תאריך]"
- נסגר: "אישורי הגעה לאירוע זה נסגרו"

**קבצים שישתנו:**
1. `supabase/migrations/` - migration חדש
2. `src/utils/rsvpStatus.ts` - קובץ חדש
3. `src/components/EventManager.tsx` - ממשק ניהול
4. `src/hooks/useEvents.ts` - עדכון interface
5. `src/pages/RSVP.tsx` - חסימת טופס
6. `src/pages/OpenRSVP.tsx` - חסימת טופס

