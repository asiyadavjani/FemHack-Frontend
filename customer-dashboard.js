import {
  auth,
  db,
  signOut,
  onAuthStateChanged,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp
} from "./config.js";

let userBookings = [];
let currentFilter = 'all';
let selectedRating = 0;
let activeUnsubscribers = [];
let bookingsMap = new Map();

function hideLoading() {
  const loadingState = document.getElementById('loadingState');
  if (loadingState) loadingState.style.display = 'none';
}

// ---- AUTH GUARD & DATA LOAD ----
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("./login.html");
    return;
  }
  setupReviewModalLogic();
  setupTabFilters();
  loadCustomerBookings(user);
});

// ---- LOAD CUSTOMER BOOKINGS ----
// Ye function 4 alag Firestore listeners lagata hai (customerId, userId,
// customerEmail, userEmail se) taake purani/nayi bookings dono mil jayen,
// aur unhe ek Map mein doc-id se merge karta hai (duplicate na banein).
// Har user sirf apni hi booking dekhta hai kyunke query hamesha
// current logged-in user ke uid/email se filter hoti hai.
function loadCustomerBookings(user) {
  activeUnsubscribers.forEach(unsub => unsub());
  activeUnsubscribers = [];
  bookingsMap = new Map();

  const fieldsToTry = [
    { field: "customerId", value: user.uid },
    { field: "userId", value: user.uid },
  ];
  if (user.email) {
    fieldsToTry.push({ field: "customerEmail", value: user.email });
    fieldsToTry.push({ field: "userEmail", value: user.email });
  }

  let loadedCount = 0;
  let anyError = false;

  fieldsToTry.forEach(({ field, value }) => {
    const q = query(collection(db, "bookings"), where(field, "==", value));

    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(change => {
        if (change.type === "removed") {
          bookingsMap.delete(change.doc.id);
        } else {
          bookingsMap.set(change.doc.id, { id: change.doc.id, ...change.doc.data() });
        }
      });

      hideLoading();
      userBookings = Array.from(bookingsMap.values());
      renderCustomerBookings();
    }, (error) => {
      console.error(`Error loading bookings by ${field}:`, error);
      anyError = true;
      loadedCount++;
      hideLoading();
      // Sirf tab local fallback dikhayen jab Firestore se kuch bhi na mila ho
      if (anyError && loadedCount === fieldsToTry.length && bookingsMap.size === 0) {
        loadLocalBookings(user);
      }
    });

    activeUnsubscribers.push(unsub);
  });
}

function loadLocalBookings(user) {
  const localData = JSON.parse(localStorage.getItem('quickserve_bookings')) || [];
  userBookings = localData.filter(b =>
    b.userId === user.uid ||
    b.customerId === user.uid ||
    b.customerEmail === user.email ||
    b.userEmail === user.email
  );
  renderCustomerBookings();
}

// ---- TAB FILTER SETUP ----
// FIX: pehle yahan fuzzy text matching thi (button ka text ya
// data-filter check karke "includes('accept')" jaisa logic) jo
// "Accepted" tab click karne par "in-progress" bookings bhi dikha
// deti thi aur "Accepted" status kabhi alag se filter nahi hota tha.
// Ab hum seedha data-filter ki exact value use karte hain, jo
// customer-dashboard.html mein status strings se match karti hai.
function setupTabFilters() {
  const filterBtns = document.querySelectorAll('#filterTabs [data-filter]');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      currentFilter = e.currentTarget.getAttribute('data-filter') || 'all';

      filterBtns.forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');

      renderCustomerBookings();
    });
  });
}

// ---- RENDER BOOKINGS ----
function renderCustomerBookings() {
  const bookingsList = document.getElementById('bookingsList');
  const emptyState = document.getElementById('emptyState');

  if (!bookingsList) return;
  bookingsList.innerHTML = '';

  const filteredBookings = userBookings.filter(b => {
    const status = (b.status || 'pending').toLowerCase().trim();
    if (currentFilter === 'all') return true;
    return status === currentFilter;
  });

  if (filteredBookings.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    return;
  }
  if (emptyState) emptyState.style.display = 'none';

  filteredBookings.forEach(booking => {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4 mb-3';

    const status = (booking.status || 'pending').toLowerCase().trim();
    const ratingVal = Number((booking.review && booking.review.rating) || booking.rating || 0);
    const commentVal = (booking.review && booking.review.comment) || booking.comment || '';
    const isReviewed = !!booking.review || !!booking.reviewed;

    let badgeClass = 'bg-warning text-dark';
    if (status === 'completed') badgeClass = 'bg-success text-white';
    if (status === 'in-progress' || status === 'accepted') badgeClass = 'bg-info text-dark';
    if (status === 'rejected') badgeClass = 'bg-danger text-white';

    const displayStatus = status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1);
    const serviceImg = booking.serviceImage || booking.avatar;

    col.innerHTML = `
      <div class="card bg-dark text-white border-secondary p-3 h-100 rounded-3">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h6 class="fw-bold mb-0">${escapeHtml(booking.service || booking.category || 'Service')}</h6>
          <span class="badge ${badgeClass} text-capitalize">${escapeHtml(displayStatus)}</span>
        </div>
        ${serviceImg ? `<img src="${serviceImg}" onerror="this.style.display='none'" class="rounded-3 mb-2" style="width:100%;height:110px;object-fit:cover;" alt="Service">` : ''}
        <p class="small text-white-50 mb-1"><i class="bi bi-person me-1"></i>${escapeHtml(booking.providerName || 'Provider')}</p>
        <p class="small text-white-50 mb-1"><i class="bi bi-geo-alt me-1"></i>${escapeHtml(booking.location || booking.address || '-')}</p>
        <p class="small text-white-50 mb-1"><i class="bi bi-calendar me-1"></i>${escapeHtml(booking.date || '')} ${booking.time ? '· ' + escapeHtml(booking.time) : ''}</p>
        <p class="small text-white-50 mb-2"><i class="bi bi-hash me-1"></i>${escapeHtml(booking.bookingId || booking.id)}</p>

        ${isReviewed ? `
          <div class="border-top border-secondary pt-2 mt-2">
            <span class="small text-warning fw-semibold">Your Rating:</span>
            <div style="color:#ffc107;">${'★'.repeat(ratingVal)}${'☆'.repeat(Math.max(0, 5 - ratingVal))}</div>
            ${commentVal ? `<p class="small fst-italic text-white-50 mt-1 mb-0">"${escapeHtml(commentVal)}"</p>` : ''}
          </div>
        ` : (status === 'completed' ? `
          <button class="btn btn-sm btn-outline-warning w-100 mt-2 open-review-btn" 
            data-id="${booking.id}" 
            data-bs-toggle="modal" 
            data-bs-target="#reviewModal">
            <i class="bi bi-star me-1"></i>Leave Review
          </button>
        ` : '')}
      </div>
    `;

    bookingsList.appendChild(col);
  });

  document.querySelectorAll('.open-review-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idInput = document.getElementById('reviewBookingId');
      if (idInput) idInput.value = e.currentTarget.getAttribute('data-id');
    });
  });
}

// ---- INTERACTIVE STAR SELECTION & SUBMIT LOGIC ----
function setupReviewModalLogic() {
  const stars = document.querySelectorAll('#starContainer .star-rate');
  const modalEl = document.getElementById('reviewModal');
  const submitBtn = document.getElementById('submitReviewBtn');

  if (modalEl) {
    modalEl.addEventListener('show.bs.modal', () => {
      selectedRating = 0;
      const commentBox = document.getElementById('reviewComment');
      if (commentBox) commentBox.value = '';

      stars.forEach(s => {
        s.classList.remove('active', 'bi-star-fill', 'hovered');
        s.classList.add('bi-star');
      });
    });
  }

  stars.forEach((star, index) => {
    star.addEventListener('mouseenter', () => {
      stars.forEach((s, i) => {
        if (i <= index) {
          s.classList.add('hovered', 'bi-star-fill');
          s.classList.remove('bi-star');
        } else {
          s.classList.remove('hovered', 'bi-star-fill');
          s.classList.add('bi-star');
        }
      });
    });

    star.addEventListener('mouseleave', () => {
      stars.forEach((s, i) => {
        s.classList.remove('hovered');
        if (i < selectedRating) {
          s.classList.add('active', 'bi-star-fill');
          s.classList.remove('bi-star');
        } else {
          s.classList.remove('active', 'bi-star-fill');
          s.classList.add('bi-star');
        }
      });
    });

    star.addEventListener('click', () => {
      selectedRating = index + 1;
      stars.forEach((s, i) => {
        if (i < selectedRating) {
          s.classList.add('active', 'bi-star-fill');
          s.classList.remove('bi-star');
        } else {
          s.classList.remove('active', 'bi-star-fill');
          s.classList.add('bi-star');
        }
      });
    });
  });

  if (submitBtn) {
    submitBtn.onclick = async () => {
      const bookingDocId = document.getElementById('reviewBookingId')?.value;
      const comment = document.getElementById('reviewComment')?.value.trim();

      if (!bookingDocId) {
        alert("No booking selected.");
        return;
      }

      if (!selectedRating) {
        alert("Please select a star rating!");
        return;
      }

      const booking = userBookings.find(b => b.id === bookingDocId);
      if (!booking) {
        alert("Booking not found.");
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Submitting...`;

        const docRef = doc(db, "bookings", bookingDocId);
        await updateDoc(docRef, {
          review: {
            rating: selectedRating,
            comment: comment || "",
            createdAt: new Date().toISOString()
          },
          reviewed: true,
          rating: selectedRating,
          comment: comment || "",
          updatedAt: serverTimestamp()
        });

        if (modalEl) {
          const bsModal = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
          if (bsModal) bsModal.hide();
        }

        setTimeout(() => {
          document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
          document.body.classList.remove('modal-open');
          document.body.style.overflow = '';
          document.body.style.paddingRight = '';
        }, 300);

        alert("Review submitted successfully!");

      } catch (err) {
        console.error("Submit Review Error:", err);
        alert("Could not submit review: " + err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "Submit Review";
      }
    };
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = './login.html';
  });
}