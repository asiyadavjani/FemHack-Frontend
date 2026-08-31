// document.addEventListener("DOMContentLoaded", () => {
//   document.addEventListener("click", (e) => {
//     const bookBtn = e.target.closest(".qs-book-btn");

//     if (bookBtn) {
//       e.preventDefault();
      
//       const card = bookBtn.closest(".card") || bookBtn.closest(".qs-card");

//       const providerData = {
//         name: bookBtn.getAttribute("data-name") || card?.querySelector("h3, h4, h5")?.innerText?.trim() || "Service Provider",
//         category: bookBtn.getAttribute("data-category") || bookBtn.getAttribute("data-service") || card?.querySelector(".badge")?.innerText?.trim() || "General Service",
//         price: bookBtn.getAttribute("data-price") || card?.querySelector(".price, .text-orange")?.innerText?.trim() || "RS 1500/hr",
//         location: bookBtn.getAttribute("data-location") || "Karachi",
//         exp: bookBtn.getAttribute("data-exp") || "5+ Yrs"
//       };

//       localStorage.setItem("qs_selected_provider", JSON.stringify(providerData));

//       const params = new URLSearchParams(providerData).toString();
//       window.location.href = `./bookservice.html?${params}`;
//     }
//   });
// });




document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("click", (e) => {
    // Check if clicked element is book button
    const bookBtn = e.target.closest(".qs-book-btn");
    if (!bookBtn) return;

    e.preventDefault();

    // Data collect from button attributes
    const providerData = {
      name: bookBtn.getAttribute("data-name") || "Bilal Khan",
      category: bookBtn.getAttribute("data-category") || "AC & Cooling Expert",
      price: bookBtn.getAttribute("data-price") || "RS 2000/hr",
      location: bookBtn.getAttribute("data-location") || "Islamabad",
      exp: bookBtn.getAttribute("data-exp") || "5+ Yrs",
      avatar: bookBtn.getAttribute("data-avatar") || ""
    };

    // Save & Redirect
    localStorage.setItem("qs_selected_provider", JSON.stringify(providerData));
    const params = new URLSearchParams(providerData).toString();
    window.location.href = `./bookservice.html?${params}`;
  });
});