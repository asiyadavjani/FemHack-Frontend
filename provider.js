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
  getDoc,
  updateDoc,
  serverTimestamp
} from "./config.js";

const ALLOWED_PROVIDER_EMAIL = "asiyadavjani@gmail.com";

const bookingsList = document.getElementById('bookingsList');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const notProviderState = document.getElementById('notProviderState');
const filterTabs = document.getElementById('filterTabs');
const statPending = document.getElementById('statPending');
const statActive = document.getElementById('statActive');
const statCompleted = document.getElementById('statCompleted');
const statRating = document.getElementById('statRating');
const statusLegend = document.getElementById('statusLegend');

// Bell Notification Elements
const bellBadge = document.getElementById('bellBadge');
const notificationList = document.getElementById('notificationList');

let allBookings = [];
let currentFilter = 'all';
let statsAnimated = false;
let statusChart = null;
let trendChart = null;
let bookingsUnsub = null;

const STATUS_LABELS = {
  'pending': 'Pending',
  'accepted': 'Accepted',
  'in-progress': 'In Progress',
  'completed': 'Completed',
  'rejected': 'Rejected'
};

const STATUS_COLORS = {
  'pending': '#ffc94d',
  'accepted': '#7db3ff',
  'in-progress': '#ff5722',
  'completed': '#6bdb9e',
  'rejected': '#ff8a95'
};

function hideLoading() {
  if (loadingState) loadingState.style.display = 'none';
}

// ----------------------------------------------------------------
// FIX: Pehle is file mein DO ALAG onAuthStateChanged listeners the
// (ek "security guard" ke liye, ek data load ke liye) — dono ek sath
// chalte the jo confusing/duplicate redirects create karta tha.
// Ab sirf EK listener hai jo guard bhi karta hai aur data bhi load
// karta hai.
// ----------------------------------------------------------------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("./index.html");
    return;
  }

  if (user.email !== ALLOWED_PROVIDER_EMAIL) {
    hideLoading();
    if (notProviderState) notProviderState.style.display = 'block';
    return;
  }

  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists() || userDocSnap.data().role !== "provider") {
      hideLoading();
      if (notProviderState) notProviderState.style.display = 'block';
      return;
    }

    loadBookings();
  } catch (error) {
    console.error("Auth Guard Error:", error);
    hideLoading();
    // Firestore user-doc read fail ho jaye tab bhi bookings load karne
    // ki koshish karte hain (email allowed to hai)
    loadBookings();
  }
});

// ----------------------------------------------------------------
// FIX: Pehle query "providerId" == uid (ek hardcoded UID string) se
// hoti thi. Agar wo hardcoded UID actual provider account ke real
// Firebase UID se match na kare (jo bohot common mistake hai), to
// provider ko booking KABHI dikhti hi nahi thi — sirf localStorage
// fallback chalta tha jo alag device/browser mein kaam nahi karta.
// Ab hum FIXED providerEmail field se match karte hain jo
// bookservice.js mein bhi hardcoded hai — is se hamesha match hoga.
// ----------------------------------------------------------------
function loadBookings() {
  if (bookingsUnsub) bookingsUnsub();

  const q = query(
    collection(db, "bookings"),
    where("providerEmail", "==", ALLOWED_PROVIDER_EMAIL)
  );

  bookingsUnsub = onSnapshot(q, (snapshot) => {
    hideLoading();
    if (!snapshot.empty) {
      allBookings = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      loadLocalBookings();
      return;
    }
    processBookingsData();
  }, (error) => {
    console.error("Firebase Snapshot Error, loading local:", error);
    hideLoading();
    loadLocalBookings();
  });
}

// ---- Local Storage Sync (fallback only, same browser/device) ----
function loadLocalBookings() {
  hideLoading();
  const localData = JSON.parse(localStorage.getItem('quickserve_bookings')) || [];
  allBookings = localData.map((b, index) => ({
    id: b.bookingId || `QS-${index + 100}`,
    bookingId: b.bookingId || `QS-${index + 100}`,
    service: b.category || b.service || 'General Service',
    customerName: b.customerName || 'Customer Request',
    date: b.date || '',
    time: b.time || '',
    location: b.city || b.address || 'Karachi',
    description: b.description || '',
    avatar: b.avatar || 'https://picsum.photos/150',
    status: (b.status || 'pending').toLowerCase(),
    rating: b.rating || (b.review ? b.review.rating : null),
    comment: b.comment || (b.review ? b.review.comment : ''),
    reviewed: b.reviewed || false,
    createdAt: b.createdAt || new Date().toLocaleString()
  }));

  processBookingsData();
}

function processBookingsData() {
  hideLoading();
  allBookings.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  renderStats();
  renderCharts();
  renderBookings();
  renderNotifications();

  if (!statsAnimated) {
    statsAnimated = true;
    runEntranceAnimations();
  }
}

// ---- Notification Drawer Render ----
function renderNotifications() {
  const pendingOrders = allBookings.filter(b => b.status === 'pending');

  if (bellBadge) {
    if (pendingOrders.length > 0) {
      bellBadge.textContent = pendingOrders.length;
      bellBadge.style.display = 'inline-block';
    } else {
      bellBadge.style.display = 'none';
    }
  }

  if (!notificationList) return;

  if (pendingOrders.length === 0) {
    notificationList.innerHTML = `
      <div class="text-center py-4 text-muted">
        <i class="bi bi-check-circle fs-2 mb-2"></i>
        <p class="mb-0">No new pending requests.</p>
      </div>`;
    return;
  }

  notificationList.innerHTML = pendingOrders.map(b => {
    const avatarUrl = b.avatar || 'https://picsum.photos/100';
    return `
    <div class="card bg-secondary bg-opacity-10 border-secondary p-3 rounded-3 text-white">
      <div class="d-flex align-items-center gap-3 mb-2">
        <img src="${avatarUrl}" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=Service&background=ff5722&color=fff';" class="rounded-circle" width="45" height="45" style="object-fit:cover;" alt="Avatar">
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between align-items-center">
            <span class="badge bg-warning text-dark">${b.bookingId}</span>
            <span class="small text-muted">${b.date || 'Today'}</span>
          </div>
          <h6 class="fw-bold mb-0 mt-1">${escapeHtml(b.service)}</h6>
        </div>
      </div>
      <p class="small text-white-50 mb-1"><i class="bi bi-person me-1"></i>${escapeHtml(b.customerName)}</p>
      <p class="small text-white-50 mb-2"><i class="bi bi-geo-alt me-1"></i>${escapeHtml(b.location)}</p>
      <div class="d-flex gap-2 mt-2">
        <button class="btn btn-sm btn-primary flex-fill accept-notif-btn" data-id="${b.id}">
          <i class="bi bi-check-lg me-1"></i>Accept
        </button>
        <button class="btn btn-sm btn-outline-danger flex-fill reject-notif-btn" data-id="${b.id}">
          Reject
        </button>
      </div>
    </div>
    `;
  }).join('');

  document.querySelectorAll('.accept-notif-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      updateStatus(id, 'accepted');
    });
  });

  document.querySelectorAll('.reject-notif-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      updateStatus(id, 'rejected');
    });
  });
}

// ---- Stats Render (With Rating Calculation) ----
function renderStats() {
  const pending = allBookings.filter(b => b.status === 'pending').length;
  const active = allBookings.filter(b => b.status === 'accepted' || b.status === 'in-progress').length;
  const completed = allBookings.filter(b => b.status === 'completed').length;

  const ratings = allBookings
    .filter(b => (b.rating || (b.review && b.review.rating)))
    .map(b => Number(b.rating || b.review.rating));

  const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;

  if (statPending) animateCounter(statPending, pending);
  if (statActive) animateCounter(statActive, active);
  if (statCompleted) animateCounter(statCompleted, completed);
  if (statRating) statRating.textContent = avg ? `${avg} ★` : '-';
}

function animateCounter(el, target) {
  const from = { val: parseInt(el.dataset.target || '0', 10) };
  el.dataset.target = target;

  if (typeof gsap === 'undefined') {
    el.textContent = target;
    return;
  }

  gsap.to(from, {
    val: target,
    duration: 0.8,
    ease: 'power2.out',
    onUpdate: () => { el.textContent = Math.round(from.val); }
  });
}

// ---- Charts Render ----
function renderCharts() {
  renderStatusChart();
  renderTrendChart();
}

function renderStatusChart() {
  const counts = { pending: 0, accepted: 0, 'in-progress': 0, completed: 0, rejected: 0 };
  allBookings.forEach(b => { if (counts[b.status] !== undefined) counts[b.status]++; });

  const labels = Object.keys(counts).filter(k => counts[k] > 0);
  const data = labels.map(k => counts[k]);
  const colors = labels.map(k => STATUS_COLORS[k]);

  if (statusLegend) {
    statusLegend.innerHTML = Object.keys(counts).map(k => `
      <span class="me-2"><span class="legend-dot" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${STATUS_COLORS[k]}"></span>
      <span>${STATUS_LABELS[k]} (${counts[k]})</span></span>
    `).join('');
  }

  const ctx = document.getElementById('statusChart');
  if (!ctx || typeof Chart === 'undefined') return;

  const hasData = data.length > 0;
  const chartLabels = hasData ? labels.map(k => STATUS_LABELS[k]) : ['No bookings yet'];
  const chartData = hasData ? data : [1];
  const chartColors = hasData ? colors : ['rgba(255,255,255,0.08)'];

  if (statusChart) statusChart.destroy();
  statusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: chartLabels,
      datasets: [{
        data: chartData,
        backgroundColor: chartColors,
        borderColor: 'rgba(0,0,0,0.4)',
        borderWidth: 2,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: hasData }
      }
    }
  });
}

function renderTrendChart() {
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }), key: d.toDateString(), count: 0 });
  }

  allBookings.forEach(b => {
    let bDate = null;
    if (b.createdAt && typeof b.createdAt.toDate === 'function') {
      bDate = b.createdAt.toDate();
    } else if (b.createdAt) {
      bDate = new Date(b.createdAt);
    }
    if (bDate && !isNaN(bDate.getTime())) {
      const key = bDate.toDateString();
      const day = days.find(d => d.key === key);
      if (day) day.count++;
    }
  });

  const ctx = document.getElementById('trendChart');
  if (!ctx || typeof Chart === 'undefined') return;

  if (trendChart) trendChart.destroy();
  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: days.map(d => d.label),
      datasets: [{
        label: 'Bookings',
        data: days.map(d => d.count),
        borderColor: '#ff5722',
        backgroundColor: 'rgba(255,87,34,0.15)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#ff5722',
        pointBorderColor: '#0a0a0a',
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#e0e0e0' }, grid: { color: 'rgba(255,255,255,0.06)' } },
        y: {
          ticks: { color: '#e0e0e0', precision: 0 },
          grid: { color: 'rgba(255,255,255,0.06)' },
          beginAtZero: true
        }
      }
    }
  });
}

// ---- Render Main Bookings List ----
function renderBookings() {
  if (!bookingsList) return;
  const filtered = currentFilter === 'all'
    ? allBookings
    : allBookings.filter(b => b.status === currentFilter);

  bookingsList.innerHTML = '';

  if (filtered.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    return;
  }
  if (emptyState) emptyState.style.display = 'none';

  filtered.forEach(booking => {
    bookingsList.appendChild(renderCard(booking));
  });

  if (typeof gsap !== 'undefined') {
    gsap.fromTo(
      '#bookingsList .booking-card',
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.06 }
    );
  }
}

// ---- Render Booking Card (service image / avatar shown) ----
function renderCard(booking) {
  const col = document.createElement('div');
  col.className = 'col-12 col-md-6 col-lg-4 mb-3';

  const statusClass = `status-${booking.status}`;
  const dateStr = booking.date || '';
  const timeStr = booking.time || '';

  const ratingValue = Number(booking.rating || (booking.review && booking.review.rating) || 0);
  const reviewComment = booking.comment || (booking.review && booking.review.comment) || '';
  const isReviewed = booking.reviewed || (booking.review ? true : false) || ratingValue > 0;

  const avatarUrl = booking.serviceImage || booking.avatar || 'https://picsum.photos/150';

  col.innerHTML = `
    <div class="card booking-card m-0 h-100 p-3" style="background:#1a1a1a; border: 1px solid #333; border-radius: 12px; color: #fff;">
      <div class="card-body p-0">
        <!-- Header with Avatar Image -->
        <div class="d-flex align-items-center gap-3 mb-3">
          <img src="${avatarUrl}" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(booking.service || 'Service')}&background=ff5722&color=fff';" class="rounded-circle border border-secondary" width="55" height="55" style="object-fit:cover;" alt="Service Avatar">
          <div class="flex-grow-1 overflow-hidden">
            <div class="d-flex justify-content-between align-items-center">
              <h6 class="mb-0 text-white fw-bold text-truncate">${escapeHtml(booking.service || 'Service')}</h6>
              <span class="badge ${statusClass}">${STATUS_LABELS[booking.status] || booking.status}</span>
            </div>
            <p class="small mb-0 text-warning text-truncate"><i class="bi bi-person me-1"></i>${escapeHtml(booking.customerName || 'Customer')}</p>
          </div>
        </div>

        <p class="small mb-1"><i class="bi bi-calendar-event me-1 text-muted"></i>${escapeHtml(dateStr)} ${timeStr ? '· ' + escapeHtml(timeStr) : ''}</p>
        <p class="small mb-1"><i class="bi bi-geo-alt me-1 text-muted"></i>${escapeHtml(booking.location || booking.address || '-')}</p>
        <p class="small mb-2"><i class="bi bi-hash me-1 text-muted"></i>${escapeHtml(booking.bookingId || booking.id)}</p>

        ${booking.description ? `<p class="small fst-italic mb-2 text-white-50 bg-dark p-2 rounded border border-secondary">"${escapeHtml(booking.description)}"</p>` : ''}

        ${isReviewed ? `
          <div class="border-top border-secondary pt-2 mt-2">
            <div class="d-flex align-items-center justify-content-between mb-1">
              <span class="small fw-semibold text-warning"><i class="bi bi-star-fill me-1"></i>Customer Rating:</span>
              <span class="small" style="color:#ffc107;">${'★'.repeat(ratingValue)}${'☆'.repeat(Math.max(0, 5 - ratingValue))}</span>
            </div>
            ${reviewComment ? `<p class="small fst-italic mb-0 text-light bg-dark p-2 rounded border border-secondary">"${escapeHtml(reviewComment)}"</p>` : '<p class="small text-muted mb-0 fst-italic">(No comment provided)</p>'}
          </div>
        ` : ''}

        <div class="d-flex gap-2 mt-3 action-buttons"></div>
      </div>
    </div>
  `;

  const actionsDiv = col.querySelector('.action-buttons');
  buildActionButtons(booking, actionsDiv);

  return col;
}

function buildActionButtons(booking, container) {
  if (booking.status === 'pending') {
    container.appendChild(makeBtn('Accept', 'btn-primary', () => updateStatus(booking.id, 'accepted')));
    container.appendChild(makeBtn('Reject', 'btn-outline-danger', () => updateStatus(booking.id, 'rejected')));
  } else if (booking.status === 'accepted') {
    container.appendChild(makeBtn('Start Progress', 'btn-warning', () => updateStatus(booking.id, 'in-progress')));
  } else if (booking.status === 'in-progress') {
    container.appendChild(makeBtn('Mark Completed', 'btn-success', () => updateStatus(booking.id, 'completed')));
  }
}

function makeBtn(label, cls, onClick) {
  const btn = document.createElement('button');
  btn.className = `btn btn-sm ${cls} flex-fill`;
  btn.textContent = label;
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = '...';
    try {
      await onClick();
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  });
  return btn;
}

const VALID_TRANSITIONS = {
  'pending': ['accepted', 'rejected'],
  'accepted': ['in-progress'],
  'in-progress': ['completed'],
  'completed': [],
  'rejected': []
};

async function updateStatus(bookingId, newStatus) {
  const booking = allBookings.find(b => b.id === bookingId);
  if (!booking) return;

  const allowed = VALID_TRANSITIONS[booking.status] || [];
  if (!allowed.includes(newStatus)) {
    alert(`Cannot move booking from "${booking.status}" to "${newStatus}".`);
    return;
  }

  let localBookings = JSON.parse(localStorage.getItem('quickserve_bookings')) || [];
  localBookings = localBookings.map(b => {
    if (b.bookingId === bookingId || b.id === bookingId) {
      b.status = newStatus;
    }
    return b;
  });
  localStorage.setItem('quickserve_bookings', JSON.stringify(localBookings));

  try {
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.warn("Firebase update skipped/fallback:", error.message);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function runEntranceAnimations() {
  if (typeof gsap === 'undefined') return;

  gsap.fromTo('[data-anim="stat"]',
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.1 }
  );
  gsap.fromTo('[data-anim="chart"]',
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.12, delay: 0.25 }
  );
}

// ---- Filter Event Listener ----
if (filterTabs) {
  filterTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-filter]');
    if (!btn) return;
    currentFilter = btn.dataset.filter;
    [...filterTabs.querySelectorAll('button')].forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderBookings();
  });
}

// ---- Logout Handler ----
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      if (auth) await signOut(auth);
      window.location.href = './login.html';
    } catch (error) {
      console.error("Logout Error:", error);
      window.location.href = './login.html';
    }
  });
}