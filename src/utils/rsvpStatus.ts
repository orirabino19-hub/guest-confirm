export interface RSVPStatusResult {
  open: boolean;
  reason: 'open' | 'disabled' | 'not_yet_open' | 'closed';
  openDate?: Date;
  closeDate?: Date;
}

export function isRSVPOpen(event: {
  rsvp_enabled?: boolean | null;
  rsvp_open_date?: string | null;
  rsvp_close_date?: string | null;
}): RSVPStatusResult {
  // If manually disabled
  if (event.rsvp_enabled === false) {
    return { open: false, reason: 'disabled' };
  }

  const now = new Date();

  // If open date is set and hasn't arrived yet
  if (event.rsvp_open_date) {
    const openDate = new Date(event.rsvp_open_date);
    if (openDate > now) {
      return { open: false, reason: 'not_yet_open', openDate };
    }
  }

  // If close date is set and has passed
  if (event.rsvp_close_date) {
    const closeDate = new Date(event.rsvp_close_date);
    if (closeDate < now) {
      return { open: false, reason: 'closed', closeDate };
    }
  }

  return { open: true, reason: 'open' };
}

export function formatRSVPStatusMessage(
  status: RSVPStatusResult,
  language: string = 'he'
): string {
  if (status.open) return '';

  switch (status.reason) {
    case 'disabled':
      return language === 'he'
        ? 'אישורי הגעה לאירוע זה אינם פעילים כרגע'
        : language === 'de'
        ? 'Die Anmeldung für diese Veranstaltung ist derzeit nicht aktiv'
        : 'RSVP for this event is currently not active';
    case 'not_yet_open':
      if (status.openDate) {
        const dateStr = status.openDate.toLocaleDateString(
          language === 'he' ? 'he-IL' : language === 'de' ? 'de-DE' : 'en-US',
          { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
        );
        return language === 'he'
          ? `אישורי הגעה ייפתחו בתאריך ${dateStr}`
          : language === 'de'
          ? `Die Anmeldung öffnet am ${dateStr}`
          : `RSVP will open on ${dateStr}`;
      }
      return language === 'he'
        ? 'אישורי הגעה טרם נפתחו'
        : language === 'de'
        ? 'Die Anmeldung ist noch nicht geöffnet'
        : 'RSVP is not yet open';
    case 'closed':
      return language === 'he'
        ? 'אישורי הגעה לאירוע זה נסגרו'
        : language === 'de'
        ? 'Die Anmeldung für diese Veranstaltung ist geschlossen'
        : 'RSVP for this event has closed';
    default:
      return '';
  }
}
