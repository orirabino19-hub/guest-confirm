// Admin System JavaScript
class AdminSystem {
    constructor() {
        this.events = [
            {
                id: "1",
                name: "חתונת דוד ושרה",
                description: "חגיגה משפחתית מיוחדת",
                date: "2024-12-25",
                createdAt: new Date().toISOString(),
                invitationImage: null
            },
            {
                id: "2",
                name: "בר מצווה של יונתן",
                description: "חגיגת בר מצווה",
                date: "2024-11-15",
                createdAt: new Date().toISOString(),
                invitationImage: null
            }
        ];

        this.guests = [
            {
                id: "1",
                eventId: "1",
                fullName: "משה כהן",
                phone: "0501234567",
                menCount: 2,
                womenCount: 3,
                totalGuests: 5,
                status: 'confirmed',
                confirmedAt: new Date().toISOString()
            },
            {
                id: "2",
                eventId: "1",
                fullName: "שרה לוי",
                phone: "0507654321",
                status: 'pending'
            },
            {
                id: "3",
                eventId: "2",
                fullName: "דוד אברהם",
                phone: "0509876543",
                menCount: 1,
                womenCount: 2,
                totalGuests: 3,
                status: 'confirmed',
                confirmedAt: new Date().toISOString()
            }
        ];

        this.customLinks = [];
        this.selectedEventId = null;
        this.currentLanguage = 'he';

        this.initializeEventHandlers();
        this.loadEvents();
    }

    initializeEventHandlers() {
        // Create Event Form
        document.getElementById('createEventForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateEvent();
        });

        // Add Guest Form
        document.getElementById('addGuestForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddGuest();
        });

        // Image upload handler
        document.getElementById('eventImage').addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });
    }

    loadEvents() {
        const container = document.getElementById('eventsContainer');
        if (this.events.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-4 text-muted">
                    אין אירועים עדיין. צור אירוע ראשון!
                </div>
            `;
            return;
        }

        container.innerHTML = this.events.map(event => `
            <div class="col-md-6 col-lg-4">
                <div class="event-card ${this.selectedEventId === event.id ? 'selected' : ''}" 
                     onclick="adminSystem.selectEvent('${event.id}')">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="fw-bold mb-0">${event.name}</h6>
                        ${this.selectedEventId === event.id ? '<span class="badge bg-primary">נבחר</span>' : ''}
                    </div>
                    ${event.description ? `<p class="text-muted small mb-2">${event.description}</p>` : ''}
                    <p class="text-muted small mb-2">
                        <i class="bi bi-calendar3 me-1"></i>
                        ${new Date(event.date).toLocaleDateString('he-IL')}
                    </p>
                    <div class="d-flex justify-content-end">
                        <button class="btn btn-outline-danger btn-sm" 
                                onclick="event.stopPropagation(); adminSystem.deleteEvent('${event.id}')">
                            <i class="bi bi-trash me-1"></i>
                            מחק
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    selectEvent(eventId) {
        this.selectedEventId = eventId;
        const selectedEvent = this.events.find(e => e.id === eventId);
        
        // Update UI
        document.getElementById('selectedEventName').textContent = 
            selectedEvent ? selectedEvent.name : 'אדמין';
        
        // Show statistics
        this.updateStatistics();
        
        // Update all tabs
        this.updateGuestsTab();
        this.updateImportTab();
        this.updateLinksTab();
        this.updateInvitationsTab();
        this.updateColorsTab();
        this.updateExportTab();
        
        // Reload events to show selection
        this.loadEvents();
    }

    updateStatistics() {
        const statsContainer = document.getElementById('statsContainer');
        if (!this.selectedEventId) {
            statsContainer.style.display = 'none';
            return;
        }

        const eventGuests = this.guests.filter(g => g.eventId === this.selectedEventId);
        const confirmedGuests = eventGuests.filter(g => g.status === 'confirmed');
        const pendingGuests = eventGuests.filter(g => g.status === 'pending');
        const totalConfirmedGuests = confirmedGuests.reduce((sum, g) => sum + (g.totalGuests || 0), 0);

        document.getElementById('confirmedCount').textContent = confirmedGuests.length;
        document.getElementById('pendingCount').textContent = pendingGuests.length;
        document.getElementById('totalGuestsCount').textContent = totalConfirmedGuests;

        statsContainer.style.display = 'block';
    }

    handleCreateEvent() {
        const name = document.getElementById('eventName').value;
        const description = document.getElementById('eventDescription').value;
        const date = document.getElementById('eventDate').value;
        const imageFile = document.getElementById('eventImage').files[0];

        if (!name || !date) {
            this.showToast('יש למלא את כל השדות הנדרשים', 'error');
            return;
        }

        let invitationImage = null;
        if (imageFile) {
            // In real implementation, upload to server
            invitationImage = URL.createObjectURL(imageFile);
        }

        const newEvent = {
            id: Date.now().toString(),
            name,
            description,
            date,
            createdAt: new Date().toISOString(),
            invitationImage
        };

        this.events.push(newEvent);
        this.selectedEventId = newEvent.id;
        
        // Reset form
        document.getElementById('createEventForm').reset();
        this.clearImagePreview();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('createEventModal'));
        modal.hide();
        
        this.showToast(`האירוע "${name}" נוצר בהצלחה`, 'success');
        this.loadEvents();
        this.updateStatistics();
    }

    deleteEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        if (confirm(`האם אתה בטוח שברצונך למחוק את האירוע "${event.name}"?`)) {
            this.events = this.events.filter(e => e.id !== eventId);
            this.guests = this.guests.filter(g => g.eventId !== eventId);
            
            if (this.selectedEventId === eventId) {
                this.selectedEventId = null;
                document.getElementById('selectedEventName').textContent = 'אדמין';
            }
            
            this.showToast('האירוע נמחק בהצלחה', 'success');
            this.loadEvents();
            this.updateStatistics();
        }
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            this.showToast('גודל הקובץ חייב להיות עד 5MB', 'error');
            event.target.value = '';
            return;
        }

        if (!file.type.startsWith('image/')) {
            this.showToast('יש להעלות קובץ תמונה בלבד', 'error');
            event.target.value = '';
            return;
        }

        this.showImagePreview(file);
    }

    showImagePreview(file) {
        const preview = document.getElementById('imagePreview');
        const imageName = document.getElementById('imageName');
        const imageSize = document.getElementById('imageSize');

        imageName.textContent = file.name;
        imageSize.textContent = `גודל: ${(file.size / 1024 / 1024).toFixed(2)} MB`;
        preview.style.display = 'block';
    }

    clearImagePreview() {
        document.getElementById('imagePreview').style.display = 'none';
        document.getElementById('eventImage').value = '';
    }

    updateGuestsTab() {
        const guestManagerContent = document.getElementById('guestManagerContent');
        const guestListContent = document.getElementById('guestListContent');

        if (!this.selectedEventId) {
            guestManagerContent.innerHTML = '<div class="text-center py-4 text-muted">בחר אירוע כדי לנהל אורחים</div>';
            guestListContent.innerHTML = '<div class="text-center py-4 text-muted">בחר אירוע כדי לראות את רשימת המוזמנים</div>';
            return;
        }

        const eventGuests = this.guests.filter(g => g.eventId === this.selectedEventId);
        const confirmedGuests = eventGuests.filter(g => g.status === 'confirmed');
        const pendingGuests = eventGuests.filter(g => g.status === 'pending');

        // Guest Manager
        guestManagerContent.innerHTML = `
            <div class="row g-3 mb-3">
                <div class="col-6 text-center">
                    <div class="h4 text-success mb-0">${confirmedGuests.length}</div>
                    <small class="text-muted">אישרו</small>
                </div>
                <div class="col-6 text-center">
                    <div class="h4 text-warning mb-0">${pendingGuests.length}</div>
                    <small class="text-muted">ממתינים</small>
                </div>
            </div>
            ${eventGuests.length === 0 ? 
                '<div class="text-center py-3 text-muted">אין אורחים באירוע זה עדיין</div>' : 
                '<div class="small text-muted">סה"כ ' + eventGuests.length + ' אורחים באירוע</div>'
            }
        `;

        // Guest List
        if (eventGuests.length === 0) {
            guestListContent.innerHTML = '<div class="text-center py-4 text-muted">אין מוזמנים לאירוע זה עדיין</div>';
        } else {
            guestListContent.innerHTML = `
                <div class="guest-list" style="max-height: 400px; overflow-y: auto;">
                    ${eventGuests.map(guest => `
                        <div class="guest-card mb-2">
                            <div class="d-flex justify-content-between align-items-start">
                                <div class="flex-grow-1">
                                    <div class="d-flex align-items-center gap-2 mb-1">
                                        <strong>${guest.fullName}</strong>
                                        <span class="badge ${guest.status === 'confirmed' ? 'badge-confirmed' : 'badge-pending'}">
                                            ${guest.status === 'confirmed' ? 'אישר' : 'ממתין'}
                                        </span>
                                    </div>
                                    <div class="text-muted small">
                                        <i class="bi bi-telephone me-1"></i>
                                        ${guest.phone}
                                    </div>
                                    ${guest.status === 'confirmed' && guest.totalGuests ? 
                                        `<div class="text-success small">
                                            <i class="bi bi-people me-1"></i>
                                            ${guest.totalGuests} מוזמנים (${guest.menCount} גברים, ${guest.womenCount} נשים)
                                        </div>` : ''
                                    }
                                </div>
                                <div class="d-flex gap-1">
                                    <button class="btn btn-outline-primary btn-sm" 
                                            onclick="adminSystem.copyInviteLink('${guest.phone}')" 
                                            title="העתק קישור">
                                        <i class="bi bi-copy"></i>
                                    </button>
                                    <button class="btn btn-outline-danger btn-sm" 
                                            onclick="adminSystem.deleteGuest('${guest.id}')" 
                                            title="מחק אורח">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>  
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    handleAddGuest() {
        if (!this.selectedEventId) {
            this.showToast('יש לבחור אירוע', 'error');
            return;
        }

        const fullName = document.getElementById('guestName').value;
        const phone = document.getElementById('guestPhone').value;

        if (!fullName || !phone) {
            this.showToast('יש למלא את כל השדות', 'error');
            return;
        }

        if (!this.validatePhoneNumber(phone)) {
            this.showToast('יש להזין מספר טלפון ישראלי תקין (10 ספרות, מתחיל ב-05)', 'error');
            return;
        }

        const normalizedPhone = this.normalizePhoneNumber(phone);
        
        // Check if guest already exists
        const existingGuest = this.guests.find(
            g => g.eventId === this.selectedEventId && g.phone === normalizedPhone
        );

        if (existingGuest) {
            this.showToast('אורח עם מספר טלפון זה כבר קיים באירוע', 'error');
            return;
        }

        const newGuest = {
            id: Date.now().toString(),
            eventId: this.selectedEventId,
            fullName,
            phone: normalizedPhone,
            status: 'pending'
        };

        this.guests.push(newGuest);
        
        // Reset form
        document.getElementById('addGuestForm').reset();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addGuestModal'));
        modal.hide();
        
        this.showToast(`נוסף אורח: ${fullName}`, 'success');
        this.updateGuestsTab();
        this.updateStatistics();
    }

    deleteGuest(guestId) {
        const guest = this.guests.find(g => g.id === guestId);
        if (!guest) return;

        if (confirm(`האם אתה בטוח שברצונך למחוק את האורח "${guest.fullName}"?`)) {
            this.guests = this.guests.filter(g => g.id !== guestId);
            this.showToast(`האורח ${guest.fullName} הוסר מהרשימה`, 'success');
            this.updateGuestsTab();
            this.updateStatistics();
        }
    }

    copyInviteLink(phone) {
        const link = `${window.location.origin}/rsvp/${this.selectedEventId}/${phone}`;
        navigator.clipboard.writeText(link);
        this.showToast('הקישור הועתק ללוח', 'success');
    }

    updateImportTab() {
        const content = document.getElementById('importContent');
        
        if (!this.selectedEventId) {
            content.innerHTML = '<div class="text-center py-4 text-muted">בחר אירוע כדי להעלות קובץ אורחים</div>';
            return;
        }

        content.innerHTML = `
            <div class="alert alert-info">
                <h6 class="alert-heading">
                    <i class="bi bi-info-circle me-2"></i>
                    דרישות הקובץ:
                </h6>
                <ul class="mb-0">
                    <li>הקובץ חייב להכיל עמודות: "שם מלא" ו"טלפון"</li>
                    <li>מספרי הטלפון חייבים להיות ישראליים (10 ספרות, מתחיל ב-05)</li>
                    <li>פורמטים נתמכים: .xlsx, .xls</li>
                </ul>
            </div>
            
            <div class="upload-area" onclick="document.getElementById('excelFile').click()">
                <i class="bi bi-file-excel display-4 text-primary mb-3"></i>
                <h5>בחר קובץ Excel</h5>
                <p class="text-muted">גרור קובץ לכאן או לחץ לבחירה</p>
                <input type="file" id="excelFile" accept=".xlsx,.xls" style="display: none;" 
                       onchange="adminSystem.handleExcelImport(event)">
            </div>
            
            <div id="importPreview" class="mt-3" style="display: none;">
                <h6>תצוגה מקדימה:</h6>
                <div id="previewTable"></div>
                <button class="btn btn-primary mt-2" onclick="adminSystem.confirmImport()">
                    אישור יבוא
                </button>
            </div>
        `;
    }

    handleExcelImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                this.previewImportData(jsonData);
            } catch (error) {
                this.showToast('שגיאה בקריאת הקובץ', 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    }

    previewImportData(data) {
        if (data.length === 0) {
            this.showToast('הקובץ ריק או לא מכיל נתונים', 'error');
            return;
        }

        // Validate structure
        const firstRow = data[0];
        const hasHebrewColumns = 'שם מלא' in firstRow && 'טלפון' in firstRow;
        const hasEnglishColumns = 'Full Name' in firstRow && 'Phone' in firstRow;

        if (!hasHebrewColumns && !hasEnglishColumns) {
            this.showToast('הקובץ חייב להכיל עמודות: "שם מלא" ו"טלפון"', 'error');
            return;
        }

        // Process and validate
        this.importData = [];
        const errors = [];

        data.forEach((row, index) => {
            const fullName = row['שם מלא'] || row['Full Name'] || '';
            const phone = row['טלפון'] || row['Phone'] || '';

            if (!fullName.trim()) {
                errors.push(`שורה ${index + 2}: שדה "שם מלא" ריק`);
                return;
            }

            if (!phone.toString().trim()) {
                errors.push(`שורה ${index + 2}: שדה "טלפון" ריק`);
                return;
            }

            const phoneStr = phone.toString().trim();
            if (!this.validatePhoneNumber(phoneStr)) {
                errors.push(`שורה ${index + 2}: מספר טלפון לא תקין - ${phoneStr}`);
                return;
            }

            this.importData.push({
                fullName: fullName.trim(),
                phone: this.normalizePhoneNumber(phoneStr)
            });
        });

        if (errors.length > 0) {
            const errorMsg = errors.slice(0, 5).join('\n') + (errors.length > 5 ? `\n...ועוד ${errors.length - 5} שגיאות` : '');
            this.showToast(errorMsg, 'error');
            return;
        }

        // Show preview
        const previewContainer = document.getElementById('importPreview');
        const previewTable = document.getElementById('previewTable');
        
        previewTable.innerHTML = `
            <div class="table-responsive">
                <table class="table table-sm table-bordered">
                    <thead class="table-light">
                        <tr>
                            <th>שם מלא</th>
                            <th>טלפון</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.importData.slice(0, 5).map(guest => `
                            <tr>
                                <td>${guest.fullName}</td>
                                <td>${guest.phone}</td>
                            </tr>
                        `).join('')}
                        ${this.importData.length > 5 ? 
                            `<tr><td colspan="2" class="text-center text-muted">...ועוד ${this.importData.length - 5} רשומות</td></tr>` : 
                            ''
                        }
                    </tbody>
                </table>
            </div>
            <div class="alert alert-success">
                <strong>מוכן לייבוא:</strong> ${this.importData.length} אורחים תקינים
            </div>
        `;
        
        previewContainer.style.display = 'block';
    }

    confirmImport() {
        if (!this.importData || this.importData.length === 0) return;

        const newGuests = this.importData.map(guest => ({
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            eventId: this.selectedEventId,
            fullName: guest.fullName,
            phone: guest.phone,
            status: 'pending'
        }));

        this.guests.push(...newGuests);
        this.showToast(`נוספו ${newGuests.length} אורחים מהקובץ`, 'success');
        
        // Reset import
        this.importData = null;
        document.getElementById('importPreview').style.display = 'none';
        document.getElementById('excelFile').value = '';
        
        this.updateGuestsTab();
        this.updateStatistics();
    }

    updateLinksTab() {
        const content = document.getElementById('linksContent');
        
        if (!this.selectedEventId) {
            content.innerHTML = '<div class="text-center py-4 text-muted">בחר אירוע כדי לנהל קישורים</div>';
            return;
        }

        content.innerHTML = `
            <div class="row g-3 mb-4">
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">
                                <i class="bi bi-person me-2"></i>
                                קישור לפי שם
                            </h6>
                        </div>
                        <div class="card-body">
                            <div class="mb-2">
                                <input type="text" class="form-control" id="customName" placeholder="הכנס שם...">
                            </div>
                            <button class="btn btn-primary btn-sm w-100" onclick="adminSystem.generateNameLink()">
                                צור קישור
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">
                                <i class="bi bi-people me-2"></i>
                                קישור פתוח
                            </h6>
                        </div>
                        <div class="card-body">
                            <p class="small text-muted">האורח יזין את פרטיו בעצמו</p>
                            <button class="btn btn-secondary btn-sm w-100" onclick="adminSystem.generateOpenLink()">
                                צור קישור פתוח
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">
                                <i class="bi bi-hash me-2"></i>
                                קישורים ממוספרים
                            </h6>
                        </div>
                        <div class="card-body">
                            <div class="mb-2">
                                <input type="number" class="form-control" id="numberedCount" value="5" min="1" max="100">
                            </div>
                            <button class="btn btn-info btn-sm w-100" onclick="adminSystem.generateNumberedLinks()">
                                צור קישורים
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="generatedLinks" class="mt-4">
                ${this.renderGeneratedLinks()}
            </div>
        `;
    }

    generateNameLink() {
        const name = document.getElementById('customName').value.trim();
        if (!name) {
            this.showToast('יש להזין שם', 'error');
            return;
        }

        const encodedName = encodeURIComponent(name);
        const url = `${window.location.origin}/rsvp/${this.selectedEventId}/name/${encodedName}`;
        
        const newLink = {
            id: Date.now().toString(),
            type: 'name',
            value: name,
            url: url,
            createdAt: new Date().toISOString()
        };

        this.customLinks.push(newLink);
        document.getElementById('customName').value = '';
        
        this.showToast(`נוצר קישור עבור: ${name}`, 'success');
        this.updateLinksTab();
    }

    generateOpenLink() {
        const url = `${window.location.origin}/rsvp/${this.selectedEventId}/open`;
        
        const newLink = {
            id: Date.now().toString(),
            type: 'open',
            value: 'קישור פתוח',
            url: url,
            createdAt: new Date().toISOString()
        };

        this.customLinks.push(newLink);
        this.showToast('נוצר קישור פתוח', 'success');
        this.updateLinksTab();
    }

    generateNumberedLinks() {
        const count = parseInt(document.getElementById('numberedCount').value);
        if (!count || count < 1 || count > 100) {
            this.showToast('יש להזין מספר בין 1-100', 'error');
            return;
        }

        for (let i = 1; i <= count; i++) {
            const paddedNumber = i.toString().padStart(2, '0');
            const url = `${window.location.origin}/rsvp/${this.selectedEventId}/${paddedNumber}`;
            
            this.customLinks.push({
                id: `${Date.now()}_${i}`,
                type: 'numbered',
                value: paddedNumber,
                url: url,
                createdAt: new Date().toISOString()
            });
        }

        this.showToast(`נוצרו ${count} קישורים ממוספרים`, 'success');
        this.updateLinksTab();
    }

    renderGeneratedLinks() {
        const eventLinks = this.customLinks.filter(link => 
            link.url.includes(this.selectedEventId)
        );

        if (eventLinks.length === 0) {
            return '<div class="text-center py-4 text-muted">לא נוצרו קישורים מותאמים עדיין</div>';
        }

        return `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="mb-0">קישורים שנוצרו (${eventLinks.length})</h6>
                <button class="btn btn-outline-primary btn-sm" onclick="adminSystem.copyAllLinks()">
                    <i class="bi bi-copy me-1"></i>
                    העתק הכל
                </button>
            </div>
            <div class="list-group">
                ${eventLinks.map(link => `
                    <div class="list-group-item">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="flex-grow-1">
                                <div class="d-flex align-items-center gap-2 mb-1">
                                    <span class="badge ${this.getLinkBadgeClass(link.type)}">${this.getLinkTypeText(link.type)}</span>
                                    <strong>${link.value}</strong>
                                </div>
                                <div class="link-url small">${link.url}</div>
                            </div>
                            <div class="d-flex gap-1">
                                <button class="btn btn-outline-primary btn-sm" 
                                        onclick="adminSystem.copyLink('${link.url}', '${link.value}')" 
                                        title="העתק קישור">
                                    <i class="bi bi-copy"></i>
                                </button>
                                <button class="btn btn-outline-danger btn-sm" 
                                        onclick="adminSystem.deleteLink('${link.id}')" 
                                        title="מחק קישור">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getLinkBadgeClass(type) {
        switch (type) {
            case 'name': return 'bg-primary';
            case 'open': return 'bg-secondary';
            case 'numbered': return 'bg-info';
            default: return 'bg-secondary';
        }
    }

    getLinkTypeText(type) {
        switch (type) {
            case 'name': return 'שם';
            case 'open': return 'פתוח';
            case 'numbered': return 'ממוספר';
            default: return 'אחר';
        }
    }

    copyLink(url, description) {
        navigator.clipboard.writeText(url);
        this.showToast(`הועתק: ${description}`, 'success');
    }

    copyAllLinks() {
        const eventLinks = this.customLinks.filter(link => 
            link.url.includes(this.selectedEventId)
        );
        
        const linksList = eventLinks.map(link => 
            `${link.value}: ${link.url}`
        ).join('\n');

        navigator.clipboard.writeText(linksList);
        this.showToast(`הועתקו ${eventLinks.length} קישורים ללוח`, 'success');
    }

    deleteLink(linkId) {
        this.customLinks = this.customLinks.filter(link => link.id !== linkId);
        this.showToast('קישור נמחק', 'success');
        document.getElementById('generatedLinks').innerHTML = this.renderGeneratedLinks();
    }

    updateInvitationsTab() {
        const content = document.getElementById('invitationsContent');
        
        if (!this.selectedEventId) {
            content.innerHTML = '<div class="text-center py-4 text-muted">בחר אירוע כדי לנהל הזמנות</div>';
            return;
        }

        content.innerHTML = `
            <div class="row g-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">
                                <i class="bi bi-image me-2"></i>
                                הזמנות בעברית
                            </h6>
                        </div>
                        <div class="card-body">
                            <div class="upload-area mb-3" onclick="document.getElementById('hebrewImage').click()">
                                <i class="bi bi-image fs-2 text-primary"></i>
                                <p class="mb-0">העלה תמונת הזמנה</p>
                                <input type="file" id="hebrewImage" accept="image/*" style="display: none;">
                            </div>
                            <div class="upload-area" onclick="document.getElementById('hebrewPdf').click()">
                                <i class="bi bi-file-pdf fs-2 text-danger"></i>
                                <p class="mb-0">העלה PDF הזמנה</p>
                                <input type="file" id="hebrewPdf" accept=".pdf" style="display: none;">
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">
                                <i class="bi bi-image me-2"></i>
                                הזמנות באנגלית
                            </h6>
                        </div>
                        <div class="card-body">
                            <div class="upload-area mb-3" onclick="document.getElementById('englishImage').click()">
                                <i class="bi bi-image fs-2 text-primary"></i>
                                <p class="mb-0">Upload Invitation Image</p>
                                <input type="file" id="englishImage" accept="image/*" style="display: none;">
                            </div>
                            <div class="upload-area" onclick="document.getElementById('englishPdf').click()">
                                <i class="bi bi-file-pdf fs-2 text-danger"></i>
                                <p class="mb-0">Upload Invitation PDF</p>
                                <input type="file" id="englishPdf" accept=".pdf" style="display: none;">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mt-4">
                <h6>הזמנות קיימות</h6>
                <div class="text-muted">לא הועלו הזמנות עדיין</div>
            </div>
        `;
    }

    updateColorsTab() {
        const content = document.getElementById('colorsContent');
        
        if (!this.selectedEventId) {
            content.innerHTML = '<div class="text-center py-4 text-muted">בחר אירוע כדי לערוך צבעים</div>';
            return;
        }

        content.innerHTML = `
            <div class="row g-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">
                                <i class="bi bi-palette me-2"></i>
                                עריכת צבעים
                            </h6>
                        </div>
                        <div class="card-body">
                            <div class="row g-3">
                                <div class="col-6">
                                    <label class="form-label">צבע רקע</label>
                                    <input type="color" class="color-picker form-control-color w-100" value="#ffffff">
                                </div>
                                <div class="col-6">
                                    <label class="form-label">צבע טקסט</label>
                                    <input type="color" class="color-picker form-control-color w-100" value="#212529">
                                </div>
                                <div class="col-6">
                                    <label class="form-label">צבע ראשי</label>
                                    <input type="color" class="color-picker form-control-color w-100" value="#6f42c1">
                                </div>
                                <div class="col-6">
                                    <label class="form-label">צבע משני</label>
                                    <input type="color" class="color-picker form-control-color w-100" value="#fd7e14">
                                </div>
                            </div>
                            <div class="mt-3 d-flex gap-2">
                                <button class="btn btn-primary">שמור שינויים</button>
                                <button class="btn btn-outline-secondary">איפוס</button>
                                <button class="btn btn-outline-info">תצוגה מקדימה</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">
                                <i class="bi bi-eye me-2"></i>
                                תצוגה מקדימה
                            </h6>
                        </div>
                        <div class="card-body">
                            <div class="preview-area p-3 border rounded" style="background: #ffffff; color: #212529;">
                                <h5 style="color: #6f42c1;">כותרת לדוגמא</h5>
                                <p>זהו טקסט לדוגמא שמציג את הצבעים שנבחרו</p>
                                <button class="btn" style="background: #fd7e14; color: white; border: none;">כפתור לדוגמא</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    updateExportTab() {
        const content = document.getElementById('exportContent');
        
        if (!this.selectedEventId) {
            content.innerHTML = '<div class="text-center py-4 text-muted">בחר אירוע כדי לייצא את הנתונים</div>';
            return;
        }

        const eventGuests = this.guests.filter(g => g.eventId === this.selectedEventId);
        const confirmedGuests = eventGuests.filter(g => g.status === 'confirmed');
        const pendingGuests = eventGuests.filter(g => g.status === 'pending');
        const totalConfirmedGuests = confirmedGuests.reduce((sum, g) => sum + (g.totalGuests || 0), 0);
        const selectedEvent = this.events.find(e => e.id === this.selectedEventId);

        content.innerHTML = `
            <div class="row g-4">
                <div class="col-md-4">
                    <div class="card bg-success text-white">
                        <div class="card-body text-center">
                            <div class="display-6 fw-bold">${confirmedGuests.length}</div>
                            <p class="mb-0">אישרו הגעה</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-warning text-dark">
                        <div class="card-body text-center">
                            <div class="display-6 fw-bold">${pendingGuests.length}</div>
                            <p class="mb-0">ממתינים לתשובה</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-info text-white">
                        <div class="card-body text-center">
                            <div class="display-6 fw-bold">${eventGuests.length}</div>
                            <p class="mb-0">סה"כ מוזמנים</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row g-4 mt-2">
                <div class="col-md-6">
                    <button class="btn btn-primary btn-lg w-100" onclick="adminSystem.exportToExcel()">
                        <i class="bi bi-file-excel me-2"></i>
                        ייצא לקובץ Excel
                    </button>
                </div>
                <div class="col-md-6">
                    <button class="btn btn-outline-primary btn-lg w-100" onclick="adminSystem.copyAllGuestLinks()">
                        <i class="bi bi-link me-2"></i>
                        העתק את כל הקישורים
                    </button>
                </div>
            </div>
            
            <div class="mt-4">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">פרטי הייצוא</h6>
                    </div>
                    <div class="card-body">
                        <p><strong>הקובץ יכלול:</strong></p>
                        <ul class="mb-0">
                            <li>רשימת אורחים מלאה עם קישורים אישיים</li>
                            <li>סיכום סטטיסטיקות</li>
                            <li>פירוט מספר מוזמנים לפי מגדר</li>
                            <li>תאריכי אישור הגעה</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    exportToExcel() {
        if (!this.selectedEventId) return;

        const eventGuests = this.guests.filter(g => g.eventId === this.selectedEventId);
        const selectedEvent = this.events.find(e => e.id === this.selectedEventId);

        if (eventGuests.length === 0) {
            this.showToast('אין אורחים לייצוא', 'warning');
            return;
        }

        // Prepare data
        const exportData = eventGuests.map((guest, index) => ({
            'מס רשומה': index + 1,
            'שם מלא': guest.fullName,
            'טלפון': guest.phone,
            'סטטוס': guest.status === 'confirmed' ? 'אישר הגעה' : 'ממתין לתשובה',
            'גברים': guest.menCount || 0,
            'נשים': guest.womenCount || 0,
            'סה"כ מוזמנים': guest.totalGuests || 0,
            'תאריך אישור': guest.confirmedAt ? new Date(guest.confirmedAt).toLocaleDateString('he-IL') : '',
            'קישור אישי': `${window.location.origin}/rsvp/${this.selectedEventId}/${guest.phone}`
        }));

        // Create workbook
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        
        // Set column widths
        worksheet['!cols'] = [
            { wch: 8 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, 
            { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 15 }, { wch: 50 }
        ];

        XLSX.utils.book_append_sheet(workbook, worksheet, 'רשימת אורחים');

        // Add summary sheet
        const confirmedGuests = eventGuests.filter(g => g.status === 'confirmed');
        const totalConfirmedMen = confirmedGuests.reduce((sum, g) => sum + (g.menCount || 0), 0);
        const totalConfirmedWomen = confirmedGuests.reduce((sum, g) => sum + (g.womenCount || 0), 0);
        const totalConfirmedGuests = confirmedGuests.reduce((sum, g) => sum + (g.totalGuests || 0), 0);

        const summaryData = [
            { 'פרטי האירוע': 'שם האירוע', 'ערך': selectedEvent?.name || 'לא צוין' },
            { 'פרטי האירוע': 'תאריך הייצוא', 'ערך': new Date().toLocaleDateString('he-IL') },
            { 'פרטי האירוע': '', 'ערך': '' },
            { 'פרטי האירוע': 'סה"כ מוזמנים במערכת', 'ערך': eventGuests.length },
            { 'פרטי האירוע': 'אישרו הגעה', 'ערך': confirmedGuests.length },
            { 'פרטי האירוע': 'ממתינים לתשובה', 'ערך': eventGuests.length - confirmedGuests.length },
            { 'פרטי האירוע': '', 'ערך': '' },
            { 'פרטי האירוע': 'גברים', 'ערך': totalConfirmedMen },
            { 'פרטי האירוע': 'נשים', 'ערך': totalConfirmedWomen },
            { 'פרטי האירוע': 'סה"כ מוזמנים שיגיעו', 'ערך': totalConfirmedGuests },
        ];

        const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
        summaryWorksheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'סיכום');

        // Generate filename and save
        const currentDate = new Date().toISOString().split('T')[0];
        const filename = `אורחים_${selectedEvent?.name || 'אירוע'}_${currentDate}.xlsx`;
        XLSX.writeFile(workbook, filename);

        this.showToast(`הקובץ "${filename}" הורד למחשב`, 'success');
    }

    copyAllGuestLinks() {
        if (!this.selectedEventId) return;

        const eventGuests = this.guests.filter(g => g.eventId === this.selectedEventId);
        const links = eventGuests.map(guest => 
            `${guest.fullName}: ${window.location.origin}/rsvp/${this.selectedEventId}/${guest.phone}`
        ).join('\n');

        navigator.clipboard.writeText(links);
        this.showToast(`הועתקו ${eventGuests.length} קישורים ללוח`, 'success');
    }

    // Utility functions
    validatePhoneNumber(phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        return cleanPhone.length === 10 && cleanPhone.startsWith('05');
    }

    normalizePhoneNumber(phone) {
        return phone.replace(/\D/g, '');
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toastId = Date.now();
        
        const toastHtml = `
            <div class="toast toast-${type}" role="alert" id="toast-${toastId}">
                <div class="toast-body d-flex justify-content-between align-items-center">
                    <span>${message}</span>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        const toast = new bootstrap.Toast(document.getElementById(`toast-${toastId}`));
        toast.show();
        
        // Auto remove after toast is hidden
        document.getElementById(`toast-${toastId}`).addEventListener('hidden.bs.toast', function() {
            this.remove();
        });
    }
}

// Global functions
function logout() {
    if (confirm('האם אתה בטוח שברצונך להתנתק?')) {
        window.location.href = 'index.html';
    }
}

function removeImage() {
    adminSystem.clearImagePreview();
}

// Initialize the admin system
let adminSystem;
document.addEventListener('DOMContentLoaded', function() {
    adminSystem = new AdminSystem();
});