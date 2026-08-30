// Function to trigger booking page with provider parameters from index.html cards
function handleBookClick(name, category, price, location, exp, avatar) {
  const providerData = {
    name: name,
    category: category,
    price: price,
    location: location,
    exp: exp,
    avatar: avatar
  };
  
  // Save selected provider in localStorage to transfer data between pages
  localStorage.setItem('qs_selected_provider', JSON.stringify(providerData));
  
  // Redirect to bookservice.html
  window.location.href = 'bookservice.html';
}

document.addEventListener('DOMContentLoaded', () => {
  const bookingForm = document.getElementById('bookingForm');

  if (bookingForm) {
    // 1. Load details of selected provider
    loadSelectedProvider();

    // 2. Set min date to Today (Customer cannot pick past dates)
    const datePicker = document.getElementById('bookingDate');
    if (datePicker) {
      datePicker.min = new Date().toISOString().split('T')[0];
    }

    // 3. Form Validation & Submission Logic
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!bookingForm.checkValidity()) {
        e.stopPropagation();
        bookingForm.classList.add('was-validated');
        return;
      }

      submitBookingRequest();
    });
  }
});

// Load Provider Info into UI
function loadSelectedProvider() {
  const data = JSON.parse(localStorage.getItem('qs_selected_provider'));

  // Default fallback if opened directly
  const provider = data || {
    name: "Ali Raza",
    category: "Master Electrician",
    price: "RS 1500/hr",
    location: "Karachi",
    exp: "6+ Yrs",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=300&auto=format&fit=crop"
  };

  document.getElementById('prov-name').innerText = provider.name;
  document.getElementById('prov-category').innerText = provider.category;
  document.getElementById('prov-price').innerText = provider.price;
  document.getElementById('prov-location').innerText = provider.location;
  document.getElementById('prov-exp').innerText = provider.exp;
  document.getElementById('prov-avatar').src = provider.avatar;
  
  // Set readonly input value
  document.getElementById('serviceCategory').value = provider.category;
}

// Generate Unique Booking ID (e.g. QS-74892)
function generateBookingID() {
  return 'QS-' + Math.floor(10000 + Math.random() * 90000);
}

// Process and save booking data with state management
function submitBookingRequest() {
  const provider = JSON.parse(localStorage.getItem('qs_selected_provider')) || {};

  const newBooking = {
    bookingId: generateBookingID(), // Business Rule: Unique ID
    providerName: provider.name || "Assigned Provider",
    category: document.getElementById('serviceCategory').value,
    date: document.getElementById('bookingDate').value,
    time: document.getElementById('bookingTime').value,
    city: document.getElementById('customerCity').value,
    address: document.getElementById('serviceAddress').value,
    description: document.getElementById('serviceDescription').value,
    status: 'Pending', // Initial status required by Hackathon Workflow
    rating: null,
    review: null,
    createdAt: new Date().toLocaleString()
  };

  // Business Rule: Data persistence (localStorage or Firebase sync)
  let existingBookings = JSON.parse(localStorage.getItem('quickserve_bookings')) || [];
  existingBookings.push(newBooking);
  localStorage.setItem('quickserve_bookings', JSON.stringify(existingBookings));

  alert(`Booking Successfully Placed!\nBooking ID: ${newBooking.bookingId}`);
  
  // Redirect to Customer Dashboard to track status
  window.location.href = 'customer-dashboard.html';
}