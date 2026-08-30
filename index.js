document.addEventListener("DOMContentLoaded", () => {
  let currentSlide = 0;
  const slides = document.querySelectorAll(".hero-slide");
  const prevBtn = document.getElementById("prevSlide");
  const nextBtn = document.getElementById("nextSlide");

  if (!slides.length || !prevBtn || !nextBtn) return;

  const totalSlides = slides.length;

  function animateSlide(slideIndex) {
    slides.forEach((slide, index) => {
      if (index === slideIndex) {
        slide.style.display = "block";

        gsap.fromTo(
          slide.querySelector(".slide-title"),
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
        );

        gsap.fromTo(
          slide.querySelector(".slide-desc"),
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, delay: 0.15, ease: "power2.out" }
        );

        gsap.fromTo(
          slide.querySelector(".slide-btns"),
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, delay: 0.25, ease: "power2.out" }
        );

        const iconBox = slide.querySelector(".icon-illustration-box");
        if (iconBox) {
          gsap.fromTo(
            iconBox,
            { scale: 0.6, opacity: 0, rotation: -10 },
            { scale: 1, opacity: 1, rotation: 0, duration: 0.7, delay: 0.1, ease: "back.out(1.7)" }
          );
        }

      } else {
        slide.style.display = "none";
      }
    });
  }

  nextBtn.addEventListener("click", () => {
    currentSlide = (currentSlide + 1) % totalSlides;
    animateSlide(currentSlide);
  });

  prevBtn.addEventListener("click", () => {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    animateSlide(currentSlide);
  });

  setInterval(() => {
    currentSlide = (currentSlide + 1) % totalSlides;
    animateSlide(currentSlide);
  }, 6000);

  animateSlide(0);
});












// cardsssssssssssssssssssssss



// CDN Required: <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>

document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".qs-flip-card");

  cards.forEach((card) => {
    const cardInner = card.querySelector(".qs-card-inner");

    // Initialize 3D perspective
    gsap.set(cardInner, { transformStyle: "preserve-3d" });

    // Flip to back side on mouse enter
    card.addEventListener("mouseenter", () => {
      gsap.to(cardInner, {
        rotateY: 180,
        duration: 0.7,
        ease: "power2.inOut"
      });
    });

    // Flip back to front side on mouse leave
    card.addEventListener("mouseleave", () => {
      gsap.to(cardInner, {
        rotateY: 0,
        duration: 0.7,
        ease: "power2.inOut"
      });
    });
  });
});







// cards endddddddddddddddddddddddddddddddddddd



// footer
const backToTopBtn = document.getElementById("backToTopBtn");

window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    backToTopBtn.classList.add("show");
  } else {
    backToTopBtn.classList.remove("show");
  }
});

backToTopBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});


// footer end
