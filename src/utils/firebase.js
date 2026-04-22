import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize reCAPTCHA
let recaptchaVerifier;

export const initializeRecaptcha = () => {
  try {
    // Clear any existing reCAPTCHA first
    clearRecaptcha();
    
    // Ensure the container exists
    const container = document.getElementById('recaptcha-container');
    if (!container) {
      console.warn('reCAPTCHA container not found, creating one');
      const newContainer = document.createElement('div');
      newContainer.id = 'recaptcha-container';
      newContainer.style.display = 'none';
      document.body.appendChild(newContainer);
    }
    
    recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: (response) => {
        console.log('reCAPTCHA solved');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
      }
    });
    
    return recaptchaVerifier;
  } catch (error) {
    console.error('Error initializing reCAPTCHA:', error);
    // Return a mock verifier for development
    return {
      verify: () => Promise.resolve(),
      clear: () => {},
      render: () => Promise.resolve()
    };
  }
};

export const clearRecaptcha = () => {
  try {
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }
    
    // Remove the container if it exists
    const container = document.getElementById('recaptcha-container');
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  } catch (error) {
    console.error('Error clearing reCAPTCHA:', error);
  }
};

export default app;
