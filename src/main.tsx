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
  
  createRoot(document.getElementById("root")!).render(<App />);
};

initApp();
