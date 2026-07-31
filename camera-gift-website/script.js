const heartsContainer = document.getElementById("hearts");

const heartSvg = (fill) => `
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="${fill}" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
`;

const colors = ["#f472b6", "#e879f9", "#c084fc", "#fb7185", "#fda4af", "#f0abfc"];

function createHeart() {
  const heart = document.createElement("div");
  heart.className = "heart";

  const size = 12 + Math.random() * 22;
  const left = Math.random() * 100;
  const duration = 8 + Math.random() * 12;
  const delay = Math.random() * 4;
  const drift = (Math.random() - 0.5) * 80;
  const spin = (Math.random() - 0.5) * 360;
  const color = colors[Math.floor(Math.random() * colors.length)];

  heart.style.cssText = `
    left: ${left}%;
    width: ${size}px;
    height: ${size}px;
    animation-duration: ${duration}s;
    animation-delay: ${delay}s;
    --drift: ${drift}px;
    --spin: ${spin}deg;
    --peak-opacity: ${0.35 + Math.random() * 0.35};
  `;

  heart.innerHTML = heartSvg(color);
  heartsContainer.appendChild(heart);

  setTimeout(() => heart.remove(), (duration + delay) * 1000 + 500);
}

// Create floating hearts (optimized count for 60fps mobile performance)
function spawnHeart() {
  if (heartsContainer.children.length > 35) return;
  createHeart();
}

for (let i = 0; i < 25; i++) {
  setTimeout(spawnHeart, i * 220);
}
setInterval(spawnHeart, 380);

// Audio Player & Guaranteed Autoplay Logic
const bgMusic = document.getElementById("bg-music");
const musicToggleBtn = document.getElementById("music-toggle");
const playStateText = document.getElementById("play-state");
const autoplayBanner = document.getElementById("autoplay-banner");
let isUserPaused = false;

function updateAudioUI(isPlaying) {
  if (isPlaying) {
    if (musicToggleBtn) musicToggleBtn.classList.add("playing");
    if (playStateText) playStateText.textContent = "Playing 🎵";
    if (autoplayBanner) autoplayBanner.classList.add("hidden");
  } else {
    if (musicToggleBtn) musicToggleBtn.classList.remove("playing");
    if (playStateText) playStateText.textContent = "Paused";
  }
}

function startAudioNow() {
  if (!bgMusic || isUserPaused) return;

  bgMusic.muted = false;
  const promise = bgMusic.play();
  if (promise !== undefined) {
    promise.then(() => {
      updateAudioUI(true);
    }).catch(() => {
      // Browser blocked unmuted silent autoplay; pending first touch/scroll
      if (autoplayBanner && !isUserPaused) {
        autoplayBanner.classList.remove("hidden");
      }
    });
  }
}

if (bgMusic) {
  // Try instant unmuted autoplay on load
  startAudioNow();
  window.addEventListener("load", startAudioNow);
  document.addEventListener("DOMContentLoaded", startAudioNow);

  // Synchronous mobile user gesture trigger (first touch, tap, scroll anywhere)
  const triggerEvents = ["touchstart", "touchend", "click", "scroll", "pointerdown"];
  const onScreenGesture = (e) => {
    if (e && e.target && e.target.closest && e.target.closest("#music-toggle")) return;

    if (!isUserPaused && bgMusic.paused) {
      bgMusic.muted = false;
      bgMusic.play();
      updateAudioUI(true);
    }
  };

  triggerEvents.forEach(evt => {
    window.addEventListener(evt, onScreenGesture, { capture: true, passive: true });
    document.addEventListener(evt, onScreenGesture, { capture: true, passive: true });
  });

  // Track native audio state
  bgMusic.addEventListener("play", () => updateAudioUI(true));
  bgMusic.addEventListener("pause", () => updateAudioUI(false));

  // Music Pill Button: Pause / Play Toggle
  if (musicToggleBtn) {
    musicToggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();

      if (!bgMusic.paused) {
        isUserPaused = true;
        bgMusic.pause();
        updateAudioUI(false);
      } else {
        isUserPaused = false;
        bgMusic.muted = false;
        bgMusic.play().then(() => updateAudioUI(true));
      }
    });
  }
}

// Automatic Polaroid Swiping & Falling Memory Stack Logic
const polaroidCards = Array.from(document.querySelectorAll(".polaroid-card"));
let activeIndex = 0;
let isAnimating = false;

if (polaroidCards.length > 0) {
  function updateStackClasses() {
    const total = polaroidCards.length;
    polaroidCards.forEach((card, idx) => {
      card.classList.remove("active", "next", "next-2", "swipe-fall", "swipe-fall-left");

      const diff = (idx - activeIndex + total) % total;
      if (diff === 0) {
        card.classList.add("active");
      } else if (diff === 1) {
        card.classList.add("next");
      } else if (diff === 2) {
        card.classList.add("next-2");
      }
    });
  }

  function nextPolaroidCard(direction = "right") {
    if (isAnimating) return;
    isAnimating = true;

    const currentCard = polaroidCards[activeIndex];
    const fallClass = direction === "left" ? "swipe-fall-left" : "swipe-fall";
    currentCard.classList.add(fallClass);

    setTimeout(() => {
      activeIndex = (activeIndex + 1) % polaroidCards.length;
      updateStackClasses();
      isAnimating = false;
    }, 450);
  }

  // Initial stack setup
  updateStackClasses();

  // Switch memory flashcard automatically every 2 seconds (2000ms)
  setInterval(() => nextPolaroidCard("right"), 2000);

  // Touch & tap support for manual swiping if user taps
  const stackContainer = document.getElementById("polaroid-stack");
  if (stackContainer) {
    let startX = 0;
    stackContainer.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    stackContainer.addEventListener("touchend", (e) => {
      const endX = e.changedTouches[0].clientX;
      const diffX = endX - startX;
      if (Math.abs(diffX) > 35) {
        nextPolaroidCard(diffX < 0 ? "right" : "left");
      }
    });

    stackContainer.addEventListener("click", () => {
      nextPolaroidCard("right");
    });
  }
}
