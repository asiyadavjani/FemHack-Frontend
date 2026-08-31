import { 
  auth, 
  db, 
  signInWithEmailAndPassword, 
  doc, 
  getDoc,
  setDoc,
  serverTimestamp
} from "./config.js";

const loginForm = document.getElementById('loginForm');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;

    try {
      console.log("1. Logging in...");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("2. Logged in UID:", user.uid);

      console.log("3. Fetching user document from Firestore...");
      const userDocRef = doc(db, "users", user.uid);
      let userSnap = await getDoc(userDocRef);

      // Agar Firestore mein user doc na mile (Naya Customer)
      if (!userSnap.exists()) {
        console.warn("4. No document found! Creating default customer document...");
        
        const newUserData = {
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email.split('@')[0],
          role: 'customer',
          createdAt: serverTimestamp()
        };

        await setDoc(userDocRef, newUserData);
        userSnap = await getDoc(userDocRef); // Fresh snap reload
      }

      const data = userSnap.data();
      console.log("5. User Data found:", data);

      if (data && data.role === 'provider') {
        console.log("6. Role is provider. Redirecting to provider.html...");
        window.location.href = './provider.html';
      } else {
        console.log("6. Role is customer. Redirecting to index.html...");
        window.location.href = './index.html';
      }

    } catch (error) {
      console.error("Login Error:", error);
      alert("Error: " + error.message);
    }
  });
}