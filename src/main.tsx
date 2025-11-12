import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import i18n from './i18n'

// Wait for i18n to be initialized before rendering
const initApp = async () => {
  // Ensure i18n is initialized before rendering React
  if (!i18n.isInitialized) {
    await new Promise<void>((resolve) => {
      i18n.on('initialized', () => resolve());
    });
  }
  
  // Hide loading spinner and show content
  const loadingSpinner = document.querySelector('.i18n-loading');
  if (loadingSpinner) {
    loadingSpinner.remove();
  }
  
  const root = document.getElementById("root");
  if (root) {
    root.classList.add('i18n-ready');
  }
  
  createRoot(document.getElementById("root")!).render(<App />);
};

initApp();
