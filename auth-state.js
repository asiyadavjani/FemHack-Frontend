import { auth, signOut, onAuthStateChanged } from "./config.js";

document.addEventListener('DOMContentLoaded', () => {
  const authBtn = document.getElementById('authBtn');
  const signupBtn = document.getElementById('signupBtn');

  onAuthStateChanged(auth, (user) => {
    // if (user && authBtn) {
    //   // Logged in state
    //   authBtn.innerHTML = `<i class="bi bi-box-arrow-right me-1"></i> Logout`;
    //   authBtn.href = "#";

    //   // Purane click listeners hatane ke liye button clone karein
    //   const newAuthBtn = authBtn.cloneNode(true);
    //   authBtn.parentNode.replaceChild(newAuthBtn, authBtn);

    //   newAuthBtn.addEventListener('click', async (e) => {
    //     e.preventDefault();
    //     try {
    //       await signOut(auth);
    //       localStorage.removeItem('user');
    //       alert('Logged out successfully!');
    //       window.location.reload();
    //     } catch (error) {
    //       console.error("Signout Error:", error);
    //     }
    //   });

    //   if (signupBtn) signupBtn.style.display = 'none';
    // } else if (authBtn) {
    //   // Logged out state
    //   authBtn.innerHTML = `<i class="bi bi-box-arrow-in-right me-1"></i> Login`;
    //   authBtn.href = "./login.html";

    //   if (signupBtn) signupBtn.style.display = '';
    // }
  });
});