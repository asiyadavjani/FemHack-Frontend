import { 
  auth, 
  db, 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  setDoc, 
  doc, 
  serverTimestamp ,
  GoogleAuthProvider, signInWithPopup
} from "./config.js";

const signupForm = document.getElementById('signupForm');

if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('signupName')?.value.trim();
    const email = document.getElementById('signupEmail')?.value.trim();
    const password = document.getElementById('signupPassword')?.value;
    const role = document.getElementById('signupRole')?.value || 'user';

    if (!name || !email || !password || !role) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      // 1. Firebase Authentication User Create Karein
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Firestore Document mein Data Save Karein
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        role: role,
        isActive: true,
        createdAt: serverTimestamp()
      });

      // 3. Email Verification Link Bheinjen
      await sendEmailVerification(user);
      alert("Account created successfully! Please check your email inbox to verify your account.");

      // 4. Role-based Redirection
      if (role === 'provider') {
        window.location.href = './provider-dashboard.html';
      } else {
        window.location.href = './index.html';
      }

    } catch (error) {
      console.error("Signup Error:", error);
      alert(error.message);
    }
  });
}

const googleSignupBtn = document.getElementById('googleSignupBtn');
if (googleSignupBtn) {
  googleSignupBtn.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName || '',
          email: user.email,
          role: 'user',
          isActive: true,
          createdAt: serverTimestamp()
        });
      }
      window.location.href = './index.html';
    } catch (error) {
      console.error("Google Signup Error:", error);
      alert(error.message);
    }
  });
}