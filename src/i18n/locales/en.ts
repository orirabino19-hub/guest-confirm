export const en = {
  common: {
    loading: "Loading...",
    error: "Error",
    submit: "Submit",
    cancel: "Cancel",
    yes: "Yes",
    no: "No",
    back: "Back",
    next: "Next",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    confirm: "Confirm",
    close: "Close"
  },
  navigation: {
    home: "Home",
    admin: "Admin",
    rsvp: "RSVP"
  },
  index: {
    title: "Event Management & Invitation System",
    subtitle: "Welcome to the advanced system for event management and RSVP confirmation",
    guestAccess: "Guest Access",
    guestDescription: "To confirm attendance, enter your phone number:",
    phoneLabel: "Phone Number",
    phonePlaceholder: "123-456-7890",
    confirmAttendance: "Confirm Attendance",
    adminAccess: "Admin Access",
    adminDescription: "Event management and guest list viewing",
    goToAdmin: "Go to Admin",
    features: {
      title: "What makes our system special?",
      easy: {
        title: "Easy to Use",
        description: "Simple and intuitive interface for quick RSVP confirmation"
      },
      fast: {
        title: "Fast & Efficient",
        description: "Confirm attendance in less than a minute"
      },
      tracking: {
        title: "Advanced Tracking",
        description: "Track all confirmations in one place"
      }
    },
    demo: {
      title: "Sample Guests",
      description: "Click the links to try the system:",
      guests: {
        moshe: "Moshe Cohen",
        sarah: "Sarah Levy",
        david: "David Israeli",
        rachel: "Rachel Abraham"
      }
    }
  },
  rsvp: {
    welcome: "Hello {{name}}! 👋",
    eventInvitation: "We are honored to invite you to {{eventName}}",
    confirmTitle: "RSVP Confirmation",
    confirmDescription: "Please confirm the number of guests",
    menCount: "👨 Number of Men",
    womenCount: "👩 Number of Women",
    totalGuests: "Total Guests: {{count}}",
    submitButton: "✅ Confirm Attendance",
    submitting: "Submitting...",
    pleaseEnterGuests: "Please enter the number of guests before confirming",
    eventTime: "🕐 The event will take place on the scheduled date and time",
    contactInfo: "📞 For questions: {{phone}}",
    selectGender: "Select Gender",
    male: "Male",
    female: "Female",
    personalDetails: "Personal Details",
    pleaseSelectGender: "Please select gender",
    genderSelectionNote: "",
    success: {
      title: "✅ Confirmation received successfully!",
      description: "Thank you {{name}}, your spot is reserved"
    },
    error: {
      title: "❌ Error",
      description: "An error occurred while submitting the confirmation. Please try again."
    },
    errors: {
      invalidLink: "Invalid link - missing details",
      eventNotFound: "Event not found in system",
      guestDataError: "Error loading guest data",
      returnHome: "Return to Home"
    }
  },
  notFound: {
    title: "404",
    message: "Oops! Page not found",
    returnHome: "Return to Home"
  }
};