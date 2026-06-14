/* =============================================================
   PrésencePlus — interactions & motion
   ============================================================= */

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

/* ---------------------------------------------------------------
   Données
   --------------------------------------------------------------- */
const priceMap = {
  entretien: 26,
  jardinage: 28,
  bricolage: 30,
  garde: 32,
  soutien: 34,
  courses: 24,
};

const testimonials = [
  {
    text: "Service impeccable et équipe très humaine. Notre maison est toujours parfaite.",
    author: "Camille, Vernouillet — Entretien de la maison",
  },
  {
    text: "Une aide précieuse pour la garde de nos enfants. Confiance totale.",
    author: "Rachid, Triel-sur-Seine — Garde d'enfants",
  },
  {
    text: "Rapide et efficace pour le petit bricolage. Je recommande.",
    author: "Isabelle, Verneuil — Petit bricolage",
  },
];

const storageKeys = {
  simulator: "presenceplus_simulator",
  contact: "presenceplus_contact",
};

/* ---------------------------------------------------------------
   Références DOM
   --------------------------------------------------------------- */
const simForm = document.getElementById("simulatorForm");
const simService = document.getElementById("simService");
const simHours = document.getElementById("simHours");
const simFrequency = document.getElementById("simFrequency");
const simBrut = document.getElementById("simBrut");
const simCredit = document.getElementById("simCredit");
const simNet = document.getElementById("simNet");

const contactForm = document.getElementById("contactForm");
const contactSummary = document.getElementById("contactSummary");
const copySummaryBtn = document.getElementById("copySummary");

const header = document.getElementById("siteHeader");
const navToggle = document.querySelector(".nav-toggle");
const backToTop = document.getElementById("backToTop");

const testimonialText = document.getElementById("testimonialText");
const testimonialAuthor = document.getElementById("testimonialAuthor");
const prevTestimonial = document.getElementById("prevTestimonial");
const nextTestimonial = document.getElementById("nextTestimonial");
const testimonialDots = document.getElementById("testimonialDots");

/* ---------------------------------------------------------------
   Simulateur de budget
   --------------------------------------------------------------- */
function formatCurrency(value) {
  return `${value.toFixed(2).replace(".", ",")} €`;
}

function updateSimulator() {
  const serviceKey = simService.value;
  const hours = Number(simHours.value || 0);
  const price = priceMap[serviceKey] || 0;
  const brut = hours * price;
  const credit = brut * 0.5;
  const net = brut - credit;

  simBrut.textContent = formatCurrency(brut);
  simCredit.textContent = formatCurrency(credit);
  simNet.textContent = formatCurrency(net);

  localStorage.setItem(
    storageKeys.simulator,
    JSON.stringify({
      service: serviceKey,
      hours,
      frequency: simFrequency.value,
    })
  );
}

function loadSimulator() {
  const saved = localStorage.getItem(storageKeys.simulator);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      if (data.service) simService.value = data.service;
      if (data.hours) simHours.value = data.hours;
      if (data.frequency) simFrequency.value = data.frequency;
    } catch (error) {
      localStorage.removeItem(storageKeys.simulator);
    }
  }
  updateSimulator();
}

/* ---------------------------------------------------------------
   Formulaire de contact + récapitulatif
   --------------------------------------------------------------- */
function generateSummary(formData) {
  const slots = formData.getAll("slots");
  const days = formData.getAll("days");
  return [
    `Nom : ${formData.get("lastName") || "—"}`,
    `Prénom : ${formData.get("firstName") || "—"}`,
    `Email : ${formData.get("email") || "—"}`,
    `Téléphone : ${formData.get("phone") || "—"}`,
    `Service souhaité : ${formData.get("service") || "—"}`,
    `Fréquence : ${formData.get("frequency") || "—"}`,
    `Créneaux préférés : ${slots.length ? slots.join(", ") : "—"}`,
    `Jours préférés : ${days.length ? days.join(", ") : "—"}`,
    `Message : ${formData.get("message") || "—"}`,
  ].join("\n");
}

function updateContactSummary() {
  const formData = new FormData(contactForm);
  contactSummary.textContent = generateSummary(formData);

  const data = Object.fromEntries(formData);
  data.slots = formData.getAll("slots");
  data.days = formData.getAll("days");
  localStorage.setItem(storageKeys.contact, JSON.stringify(data));
}

function loadContactForm() {
  const saved = localStorage.getItem(storageKeys.contact);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      Object.entries(data).forEach(([key, value]) => {
        if (key === "slots" || key === "days") return;
        const field = contactForm.elements[key];
        if (!field || field instanceof RadioNodeList || Array.isArray(field)) {
          return;
        }
        field.value = value;
      });
      restoreChecks("slots", data.slots);
      restoreChecks("days", data.days);
    } catch (error) {
      localStorage.removeItem(storageKeys.contact);
    }
  }
  updateContactSummary();
}

function restoreChecks(name, values) {
  const selected = [].concat(values || []);
  contactForm
    .querySelectorAll(`input[name="${name}"]`)
    .forEach((checkbox) => {
      checkbox.checked = selected.includes(checkbox.value);
    });
}

/* ---------------------------------------------------------------
   Filtres de services
   --------------------------------------------------------------- */
function setupFilters() {
  const buttons = document.querySelectorAll(".filter-btn");
  const cards = document.querySelectorAll(".service-card");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.dataset.filter;
      cards.forEach((card) => {
        const match = filter === "all" || card.dataset.category === filter;
        card.style.display = match ? "flex" : "none";
      });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  });
}

/* ---------------------------------------------------------------
   Témoignages
   --------------------------------------------------------------- */
function setupTestimonials() {
  let index = 0;
  let timer;

  testimonials.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", `Témoignage ${i + 1}`);
    dot.addEventListener("click", () => go(i));
    testimonialDots.appendChild(dot);
  });
  const dots = testimonialDots.querySelectorAll("button");

  function render() {
    const item = testimonials[index];
    if (!prefersReducedMotion && window.gsap) {
      gsap.fromTo(
        ".testimonial-content",
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
      );
    }
    testimonialText.textContent = item.text;
    testimonialAuthor.textContent = item.author;
    dots.forEach((d, i) => d.classList.toggle("active", i === index));
  }

  function go(i) {
    index = (i + testimonials.length) % testimonials.length;
    render();
    restart();
  }

  function restart() {
    clearInterval(timer);
    timer = setInterval(() => go(index + 1), 6000);
  }

  nextTestimonial.addEventListener("click", () => go(index + 1));
  prevTestimonial.addEventListener("click", () => go(index - 1));
  render();
  restart();
}

/* ---------------------------------------------------------------
   Navigation (menu mobile)
   --------------------------------------------------------------- */
function setupNavigation() {
  const backdrop = document.querySelector(".nav-backdrop");

  const setMenu = (open) => {
    header.classList.toggle("menu-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute(
      "aria-label",
      open ? "Fermer le menu" : "Ouvrir le menu"
    );
    document.body.classList.toggle("no-scroll", open);
  };

  navToggle.addEventListener("click", () =>
    setMenu(!header.classList.contains("menu-open"))
  );

  if (backdrop) backdrop.addEventListener("click", () => setMenu(false));

  header.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setMenu(false);
  });
}

/* ---------------------------------------------------------------
   En-tête au scroll + back to top
   --------------------------------------------------------------- */
function setupScrollUI() {
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 20);
    backToTop.classList.toggle("visible", y > 500);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  backToTop.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  });
}

/* ---------------------------------------------------------------
   Boutons magnétiques
   --------------------------------------------------------------- */
function setupMagnetic() {
  if (prefersReducedMotion) return;
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      el.style.transform = `translate(${dx * 0.18}px, ${dy * 0.3}px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
    });
  });
}

/* ---------------------------------------------------------------
   Animations GSAP (avec repli)
   --------------------------------------------------------------- */
function revealAllNow() {
  document
    .querySelectorAll(".reveal")
    .forEach((el) => el.classList.add("is-visible"));
}

function splitWords(el) {
  const frag = document.createDocumentFragment();
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (part.trim() === "") {
          frag.appendChild(document.createTextNode(part));
        } else {
          const w = document.createElement("span");
          w.className = "word";
          w.textContent = part;
          frag.appendChild(w);
        }
      });
    } else {
      const wrap = document.createElement("span");
      wrap.className = "word";
      wrap.appendChild(node.cloneNode(true));
      frag.appendChild(wrap);
    }
  });
  el.textContent = "";
  el.appendChild(frag);
  return el.querySelectorAll(".word");
}

function setupMotion() {
  const hasGSAP = window.gsap && window.ScrollTrigger;

  if (prefersReducedMotion || !hasGSAP) {
    revealAllNow();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Héros : ken burns + cascade du contenu
  gsap.to("[data-hero-img]", {
    scale: 1,
    duration: 2.6,
    ease: "power2.out",
  });
  gsap.from("[data-hero-el]", {
    opacity: 0,
    y: 40,
    duration: 1,
    ease: "power3.out",
    stagger: 0.12,
    delay: 0.15,
    clearProps: "opacity,transform",
  });

  // Filet de sécurité (hors GSAP) : si le ticker est en pause au chargement
  // (onglet en arrière-plan), garantir que le héros ne reste pas invisible.
  setTimeout(() => {
    document.querySelectorAll("[data-hero-el]").forEach((el) => {
      if (parseFloat(getComputedStyle(el).opacity) < 0.95) {
        el.style.opacity = "1";
        el.style.transform = "none";
      }
    });
  }, 3200);

  // Parallaxe de l'image héros
  gsap.to("[data-hero-img]", {
    yPercent: 12,
    ease: "none",
    scrollTrigger: {
      trigger: "#accueil",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
  });

  // Reveals en cascade
  gsap.utils.toArray(".reveal").forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: "top 86%",
      once: true,
      onEnter: () => el.classList.add("is-visible"),
    });
  });

  // Manifeste : révélation mot à mot
  const headline = document.querySelector(".manifesto-headline");
  if (headline) {
    const words = splitWords(headline);
    gsap.set(words, { yPercent: 110, opacity: 0 });
    gsap.to(words, {
      yPercent: 0,
      opacity: 1,
      duration: 0.8,
      ease: "power3.out",
      stagger: 0.06,
      scrollTrigger: { trigger: headline, start: "top 80%", once: true },
    });
  }

  // Étapes empilées (sticky) : la carte sortante rétrécit, floute, s'estompe
  const steps = gsap.utils.toArray(".process-step");
  steps.forEach((step, i) => {
    if (i === steps.length - 1) return;
    const card = step.querySelector(".card");
    gsap.to(card, {
      scale: 0.95,
      filter: "blur(4px)",
      opacity: 0.45,
      ease: "none",
      scrollTrigger: {
        trigger: steps[i + 1],
        start: "top 60%",
        end: "top 20%",
        scrub: true,
      },
    });
  });
}

/* ---------------------------------------------------------------
   Copier le récapitulatif
   --------------------------------------------------------------- */
function setupCopy() {
  const label = copySummaryBtn.querySelector("span") || copySummaryBtn;
  const original = label.textContent;
  copySummaryBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(contactSummary.textContent);
      label.textContent = "Copié ✓";
    } catch (error) {
      label.textContent = "Copie impossible";
    }
    setTimeout(() => {
      label.textContent = original;
    }, 2000);
  });
}

/* ---------------------------------------------------------------
   Branchements & init
   --------------------------------------------------------------- */
simForm.addEventListener("input", updateSimulator);
simForm.addEventListener("submit", (event) => {
  event.preventDefault();
  updateSimulator();
  document
    .getElementById("contact")
    .scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
});

contactForm.addEventListener("input", updateContactSummary);
contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  updateContactSummary();
});

setupFilters();
setupTestimonials();
setupNavigation();
setupScrollUI();
setupMagnetic();
setupCopy();
loadSimulator();
loadContactForm();

// GSAP est chargé en defer ; on attend le load complet pour l'animer.
if (document.readyState === "complete") {
  setupMotion();
} else {
  window.addEventListener("load", setupMotion);
}
