// Main system JavaScript
let currentLanguage = 'he';

// Language switching
function switchLanguage(lang) {
    currentLanguage = lang;
    
    // Update language selector buttons
    document.querySelectorAll('.language-selector .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // In a real implementation, this would update all text content
    showToast('שפה הוחלפה ל' + (lang === 'he' ? 'עברית' : 'אנגלית'), 'info');
}

// Guest access
function accessRSVP() {
    const phone = document.getElementById('guestPhone').value.trim();
    
    if (!phone) {
        showToast('יש להזין מספר טלפון', 'error');
        return;
    }
    
    if (!validatePhoneNumber(phone)) {
        showToast('יש להזין מספר טלפון ישראלי תקין', 'error');
        return;
    }
    
    // In real implementation, this would check if guest exists
    // For demo, redirect to demo page
    showToast('מעביר לעמוד אישור הגעה...', 'success');
    
    setTimeout(() => {
        window.location.href = `rsvp-demo.html?phone=${encodeURIComponent(phone)}`;
    }, 1000);
}

// Admin login
function adminLogin() {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    if (!username || !password) {
        showToast('יש למלא את כל השדות', 'error');
        return;
    }
    
    if (username === 'admin' && password === '123456') {
        showToast('התחברות בהצלחה - מעביר למערכת הניהול...', 'success');
        
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1000);
    } else {
        showToast('שם משתמש או סיסמה שגויים', 'error');
    }
}

// Phone number validation
function validatePhoneNumber(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    // Israeli phone: 10 digits starting with 05
    return cleanPhone.length === 10 && cleanPhone.startsWith('05');
}

// Toast notification system
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toastId = Date.now();
    
    const typeClasses = {
        'success': 'toast-success',
        'error': 'toast-error',
        'warning': 'toast-warning',
        'info': 'toast-info'
    };
    
    const toastHtml = `
        <div class="toast ${typeClasses[type] || 'toast-info'}" role="alert" id="toast-${toastId}">
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

// Enhanced form interactions
document.addEventListener('DOMContentLoaded', function() {
    // Enhanced phone input formatting
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.startsWith('972')) {
                value = '0' + value.substring(3);
            }
            if (value.length > 10) {
                value = value.substring(0, 10);
            }
            if (value.length > 3) {
                value = value.substring(0, 3) + '-' + value.substring(3);
            }
            e.target.value = value;
        });
    });
    
    // Enhanced file upload areas
    const uploadAreas = document.querySelectorAll('.upload-area');
    uploadAreas.forEach(area => {
        area.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });
        
        area.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
        });
        
        area.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                // Handle file drop
                showToast(`נבחר קובץ: ${files[0].name}`, 'info');
            }
        });
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Auto-hide alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
    alerts.forEach(alert => {
        setTimeout(() => {
            if (alert.parentNode) {
                alert.style.opacity = '0';
                setTimeout(() => {
                    alert.remove();
                }, 300);
            }
        }, 5000);
    });
    
    // Enhanced button click effects
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Create ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
});

// Add ripple animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .btn {
        position: relative;
        overflow: hidden;
    }
    
    .upload-area.dragover {
        border-color: var(--primary-color) !important;
        background: rgba(111, 66, 193, 0.1) !important;
        transform: scale(1.02);
    }
    
    .card:hover {
        transform: translateY(-2px);
        transition: all 0.3s ease;
    }
    
    .feature-card:hover .icon-circle {
        transform: scale(1.1);
        transition: all 0.3s ease;
    }
`;
document.head.appendChild(style);