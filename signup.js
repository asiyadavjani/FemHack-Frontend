import { 
  auth, 
  db, 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  setDoc, 
  doc, 
  serverTimestamp 
} from "./config.js";

const signupForm = document.getElementById('signupForm');

if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = signupForm.querySelector('button[type="submit"]');
    if(submitBtn) submitBtn.disabled = true;

    const name = document.getElementById('signupName')?.value.trim();
    const email = document.getElementById('signupEmail')?.value.trim();
    const password = document.getElementById('signupPassword')?.value;
    const roleSelect = document.getElementById('signupRole');
    const role = roleSelect?.value;

    if (!name || !email || !password || !role) {
      alert("Please fill in all required fields, including Account Type.");
      if(submitBtn) submitBtn.disabled = false;
      return;
    }

    try {
      // 1. User Creation
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Save User Document to Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        role: role.toLowerCase(), // Normalize role string
        isActive: true,
        createdAt: serverTimestamp()
      });

      // 3. Email Verification
      await sendEmailVerification(user);
      alert("Account created successfully! Verification email sent.");

      // 4. Smooth Redirect according to Role
      if (role.toLowerCase() === 'provider') {
        window.location.replace('./provider.html');
      } else {
        window.location.replace('./customer-dashboard.html');
      }

    } catch (error) {
      console.error("Signup Error:", error);
      alert(error.message);
      if(submitBtn) submitBtn.disabled = false;
    }
  });
}