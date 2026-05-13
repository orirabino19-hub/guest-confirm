## הבעיה

כשלוחצים בניהול על "👶 הוסף מונה ילדים" השדה לא נשמר בפועל בדאטהבייס, ולכן גם לא מופיע בטופס ההזמנה (קישור פתוח). אותה בעיה תיאורטית קיימת גם למונה גברים/נשים, אבל ברוב האירועים הם כבר נטענו לדאטהבייס מהזרעה ישנה — לכן רק הילדים בולט.

## גורם השורש

ב-`src/components/OpenRSVPCustomFields.tsx`, הפונקציה `addQuickField` יוצרת אובייקט שדה ללא המאפיין `displayLocations`.

ב-`src/pages/Admin.tsx`, הפונקציה `handleCustomFieldsUpdate` מסננת לפי:
```
fields.filter(field => field.displayLocations?.openLink)
fields.filter(field => field.displayLocations?.personalLink)
```
מאחר ש-`displayLocations` הוא `undefined`, השדה החדש נשמט בשקט מהשמירה — לא נשמר ב-`custom_fields_config`. בטעינה הבאה הוא נעלם, וב-OpenRSVP הוא לא נרנדר (כי הוא לא קיים).

בנוסף, ב-`src/components/RSVPForm.tsx` (הטופס של ההזמנה האישית) המונה ילדים מקודד קשיח אבל יש סגירת `</div>` חסרה אחרי המונה נשים (שורה 696) — הילדים מרונדר בתוך ה-wrapper של הנשים. זה לא בהכרח מסתיר אותו אבל פוגע בעיצוב/יישור.

## התיקון

### 1. `src/components/OpenRSVPCustomFields.tsx`
ב-`addQuickField`, להוסיף `displayLocations` לכל שדות ה-quick (`menCounter`, `womenCounter`, `childrenCounter`, `fullName`, `guestName`, `phone`, `email`) עם:
```
displayLocations: { regularInvitation: true, openLink: true, personalLink: true }
```
כדי שיופיעו בכל שלושת המקומות וייכללו בלוגיקת השמירה.

### 2. `src/components/RSVPForm.tsx`
לתקן את סגירת ה-`</div>` החסרה של עוטף "מונה נשים" כדי שמונה הילדים יהיה אח שלו ולא ילד.

### 3. אימות
- ללחוץ "👶 הוסף מונה ילדים" באירוע קיים → לוודא שנשמר ב-`custom_fields_config` (link_type=open + personal).
- לפתוח את הקישור הפתוח (`/open/...`) ולוודא שהמונה ילדים מופיע.
- לפתוח קישור אישי ולוודא ששלושת המונים מיושרים נכון.

## למה זה קטן

זה תיקון נקודתי בשני קבצי frontend בלבד, ללא שינוי סכמה (`children_count` כבר קיים ב-DB), ללא משפיע על אירועים קיימים שיש להם כבר את המונים גברים/נשים שמורים.
