import {
  auth,
  db,
  collection,
  addDoc,
  serverTimestamp
   
} from "./config.js";


import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const PROVIDER_EMAIL = "asiyadavjani@gmail.com";

let currentUser = null;
let authReady = false;

// Active User Observer
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  authReady = true;
});

document.addEventListener('DOMContentLoaded', () => {
  // Service Category aur Provider Card Info Fill karein
  loadSelectedProvider();

  const bookingForm = document.getElementById('bookingForm');
  const datePicker = document.getElementById('bookingDate');

  if (datePicker) {
    datePicker.min = new Date().toISOString().split('T')[0];
  }

  if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!bookingForm.checkValidity()) {
        e.stopPropagation();
        bookingForm.classList.add('was-validated');
        return;
      }

      await submitBookingRequest();
    });
  }
});

// URL aur LocalStorage Data Read
function loadSelectedProvider() {
  const urlParams = new URLSearchParams(window.location.search);
  const localData = JSON.parse(localStorage.getItem('qs_selected_provider')) || {};

  const category = urlParams.get('category') || urlParams.get('service') || localData.category || "General Service";
  const name = urlParams.get('name') || localData.name || "Provider Name";
  const price = urlParams.get('price') || localData.price || "RS 1500/hr";
  const location = urlParams.get('location') || localData.location || "Karachi";
  const exp = urlParams.get('exp') || localData.exp || "5+ Yrs";

  // Service Type Input Auto-Fill
  const serviceInput = document.getElementById('serviceCategory');
  if (serviceInput) {
    serviceInput.value = category;
  }

  // Display UI Updates
  setText('prov-name', name);
  setText('prov-category', category);
  setText('prov-price', price);
  setText('prov-location', location);
  setText('prov-exp', exp);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
}

// Save Booking Logic
async function submitBookingRequest() {
  const submitBtn = document.querySelector('#bookingForm button[type="submit"]');

  if (!authReady) {
    await new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, () => {
        unsub();
        resolve();
      });
    });
  }

  const user = currentUser || auth.currentUser;

  if (!user) {
    alert("Booking Submit karne ke liye Login hona zaroori hai.");
    window.location.href = './login.html';
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving Booking...';
  }

  const serviceCategoryVal = document.getElementById('serviceCategory')?.value || "General Service";

  const bookingData = {
    bookingId: 'QS-' + Math.floor(10000 + Math.random() * 90000),
    service: serviceCategoryVal,
    category: serviceCategoryVal,
    providerName: document.getElementById('prov-name')?.innerText || "Assigned Provider",
    date: document.getElementById('bookingDate').value,
    time: document.getElementById('bookingTime').value,
    city: document.getElementById('customerCity').value,
    address: document.getElementById('serviceAddress').value,
    description: document.getElementById('serviceDescription').value,
    status: 'pending',

    // Customer ID Fields for Dashboard Display
    userId: user.uid,
    customerId: user.uid,
    userEmail: user.email,
    customerEmail: user.email,
    customerName: user.displayName || user.email.split('@')[0],
    providerEmail: PROVIDER_EMAIL,

    createdAt: serverTimestamp()
  };

  try {
    // 1. Firebase Firestore Save
    await addDoc(collection(db, "bookings"), bookingData);

    // 2. LocalStorage Sync Backup
    const localEntry = { ...bookingData, createdAt: new Date().toISOString() };
    let localBookings = JSON.parse(localStorage.getItem('quickserve_bookings')) || [];
    localBookings.push(localEntry);
    localStorage.setItem('quickserve_bookings', JSON.stringify(localBookings));

    alert(`Booking Confirm Ho Gayi!\nBooking ID: ${bookingData.bookingId}`);
    window.location.href = './customer-dashboard.html';

  } catch (error) {
    console.error("Booking Error:", error);
    alert("Booking process me error aaya: " + error.message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Confirm & Submit Booking';
    }
  }
}