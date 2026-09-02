const NOTES = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  Bb4: 466.16,
  C5: 523.25,
};

const MELODY = [
  { note: "C4", beats: 0.75, lyric: "Happy" },
  { note: "C4", beats: 0.25, lyric: "birthday" },
  { note: "D4", beats: 1, lyric: "to" },
  { note: "C4", beats: 1, lyric: "you" },
  { note: "F4", beats: 1, lyric: "Happy birthday to you" },
  { note: "E4", beats: 2, lyric: "Happy birthday to you" },
  { note: "C4", beats: 0.75, lyric: "Happy" },
  { note: "C4", beats: 0.25, lyric: "birthday" },
  { note: "D4", beats: 1, lyric: "to" },
  { note: "C4", beats: 1, lyric: "you" },
  { note: "G4", beats: 1, lyric: "Happy birthday to you" },
  { note: "F4", beats: 2, lyric: "Happy birthday to you" },
  { note: "C4", beats: 0.75, lyric: "Happy" },
  { note: "C4", beats: 0.25, lyric: "birthday" },
  { note: "C5", beats: 1, lyric: "dear" },
  { note: "A4", beats: 1, lyric: "Karena" },
  { note: "F4", beats: 1, lyric: "Karena" },
  { note: "E4", beats: 1, lyric: "Happy birthday dear Karena" },
  { note: "D4", beats: 2, lyric: "Happy birthday dear Karena" },
  { note: "Bb4", beats: 0.75, lyric: "Happy" },
  { note: "Bb4", beats: 0.25, lyric: "birthday" },
  { note: "A4", beats: 1, lyric: "to" },
  { note: "F4", beats: 1, lyric: "you" },
  { note: "G4", beats: 1, lyric: "Happy birthday to you" },
  { note: "F4", beats: 2.4, lyric: "Happy birthday to you" },
];

const BEAT = 0.42;
const PHOTOS = window.BIRTHDAY_PHOTOS || [];

const gate = document.getElementById("gate");
const card = document.getElementById("card");
const openBtn = document.getElementById("open-card");
const lyricsEl = document.getElementById("lyrics");
const musicBtn = document.getElementById("music-toggle");
const musicLabel = document.getElementById("music-label");
const gallery = document.getElementById("gallery");
const memories = document.getElementById("memories");
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxCaption = document.getElementById("lightbox-caption");
const canvas = document.getElementById("confetti");
const ctx = canvas.getContext("2d");

let audio;
let master;
let songTimer;
let paused = false;
let startAt = 0;
let elapsed = 0;
let pieces = [];

function resizeCanvas() {
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

function burstConfetti() {
  const colors = ["#e0b56a", "#f6d7d2", "#fff6ea", "#c45c6a", "#f3efe6"];
  for (let i = 0; i < 140; i += 1) {
    pieces.push({
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.28,
      vx: (Math.random() - 0.5) * 14,
      vy: Math.random() * -11 - 4,
      size: Math.random() * 7 + 3,
      color: colors[i % colors.length],
      rot: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.2,
      life: 180 + Math.random() * 80,
    });
  }
}

function tickConfetti() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  pieces = pieces.filter((p) => p.life > 0);
  pieces.forEach((p) => {
    p.vy += 0.18;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.spin;
    p.life -= 1;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = Math.max(p.life / 180, 0);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    ctx.restore();
  });
  requestAnimationFrame(tickConfetti);
}

function ensureAudio() {
  if (audio) return;
  audio = new AudioContext();
  master = audio.createGain();
  master.gain.value = 0.18;
  master.connect(audio.destination);
}

function playTone(freq, when, duration) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  const filter = audio.createBiquadFilter();
  osc.type = "triangle";
  osc.frequency.value = freq;
  filter.type = "lowpass";
  filter.frequency.value = 1800;
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(0.9, when + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  osc.start(when);
  osc.stop(when + duration + 0.05);
}

function scheduleSong(fromElapsed = 0) {
  clearTimeout(songTimer);
  ensureAudio();
  const now = audio.currentTime;
  startAt = now - fromElapsed;
  let t = 0;
  const events = [];

  for (let repeat = 0; repeat < 2; repeat += 1) {
    MELODY.forEach((step) => {
      const duration = step.beats * BEAT;
      events.push({ at: t, lyric: step.lyric, freq: NOTES[step.note], duration });
      t += duration;
    });
    t += 0.45;
  }

  events.forEach((event) => {
    const when = startAt + event.at;
    if (when < now - 0.02) return;
    playTone(event.freq, when, event.duration * 0.92);
  });

  function pulseLyrics() {
    if (paused) return;
    const current = audio.currentTime - startAt;
    const active = [...events].reverse().find((event) => current >= event.at);
    if (active) lyricsEl.textContent = active.lyric;
    if (current < t) {
      songTimer = setTimeout(pulseLyrics, 120);
    } else {
      lyricsEl.textContent = "Happy birthday, Karena";
      musicLabel.textContent = "Play again";
      musicBtn.classList.add("is-paused");
      paused = true;
    }
  }
  window.__pulseBirthdayLyrics = pulseLyrics;
  pulseLyrics();
}

function startMusic() {
  paused = false;
  elapsed = 0;
  musicBtn.classList.remove("is-paused");
  musicLabel.textContent = "Playing";
  if (audio && audio.state === "suspended") audio.resume();
  scheduleSong(0);
}

function toggleMusic() {
  ensureAudio();
  if (musicLabel.textContent === "Play again") {
    startMusic();
    return;
  }
  if (!paused) {
    paused = true;
    audio.suspend();
    musicBtn.classList.add("is-paused");
    musicLabel.textContent = "Play";
    return;
  }
  paused = false;
  musicBtn.classList.remove("is-paused");
  musicLabel.textContent = "Playing";
  audio.resume();
  if (window.__pulseBirthdayLyrics) window.__pulseBirthdayLyrics();
}

function renderPhotos() {
  if (!PHOTOS.length) {
    memories.hidden = true;
    return;
  }
  memories.hidden = false;
  document.querySelector(".note").textContent =
    "Today is yours. Here is a song, just for you, and the pictures of our time together.";
  gallery.replaceChildren();
  PHOTOS.forEach((photo, index) => {
    const button = document.createElement("button");
    button.className = "polaroid";
    button.type = "button";
    const img = document.createElement("img");
    img.src = photo.src;
    img.alt = photo.caption || `Memory ${index + 1}`;
    const caption = document.createElement("span");
    caption.textContent = photo.caption || "Our time together";
    button.append(img, caption);
    button.addEventListener("click", () => openLightbox(photo, img.alt));
    gallery.append(button);
  });
}

function openLightbox(photo, alt) {
  lightboxImage.src = photo.src;
  lightboxImage.alt = alt;
  lightboxCaption.textContent = photo.caption || "";
  lightbox.hidden = false;
}

function closeLightbox() {
  lightbox.hidden = true;
  lightboxImage.src = "";
}

function openCard() {
  gate.classList.add("is-opening");
  ensureAudio();
  audio.resume();
  window.setTimeout(() => {
    gate.hidden = true;
    card.hidden = false;
    burstConfetti();
    startMusic();
  }, 620);
}

openBtn.addEventListener("click", openCard);
musicBtn.addEventListener("click", toggleMusic);
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox || event.target.id === "lightbox-close") closeLightbox();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeLightbox();
});

resizeCanvas();
window.addEventListener("resize", resizeCanvas);
tickConfetti();
renderPhotos();
