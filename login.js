import { 
  auth, 
  db, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  getDoc, 
  doc, 
  setDoc, 
  serverTimestamp 
} from "./config.js";

const loginForm = document.getElementById('loginForm');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;

    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Firestore se user ka role check karein
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      alert("Logged in successfully!");

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.role === 'provider') {
          window.location.href = './provider-dashboard.html';
        } else {
          window.location.href = './index.html';
        }
      } else {
        window.location.href = './index.html';
      }

    } catch (error) {
      console.error("Login Error:", error);
      alert(error.message);
    }
  });
}

// Google Sign-In Integration
const googleBtn = document.getElementById('googleLoginBtn');
if (googleBtn) {
  googleBtn.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      // Agar new Google User ho to Firestore document create karein
      if (!userSnap.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName || '',
          email: user.email,
          role: 'user',
          profileImg: user.photoURL || '',
          createdAt: serverTimestamp()
        });
      }

      window.location.href = './index.html';
    } catch (error) {
      console.error("Google Auth Error:", error);
      alert(error.message);
    }
  });
}