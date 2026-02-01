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
    author: "Camille, Vernouillet – Entretien de la maison",
  },
  {
    text: "Une aide précieuse pour la garde de nos enfants. Confiance totale.",
    author: "Rachid, Triel-sur-Seine – Garde d’enfants",
  },
  {
    text: "Rapide et efficace pour le petit bricolage. Je recommande.",
    author: "Isabelle, Verneuil – Petit bricolage",
  },
];

const storageKeys = {
  simulator: "presenceplus_simulator",
  contact: "presenceplus_contact",
};

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

const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const backToTop = document.getElementById("backToTop");

const testimonialText = document.getElementById("testimonialText");
const testimonialAuthor = document.getElementById("testimonialAuthor");
const prevTestimonial = document.getElementById("prevTestimonial");
const nextTestimonial = document.getElementById("nextTestimonial");

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

  const data = {
    service: serviceKey,
    hours,
    frequency: simFrequency.value,
  };
  localStorage.setItem(storageKeys.simulator, JSON.stringify(data));
}

function loadSimulator() {
  const saved = localStorage.getItem(storageKeys.simulator);
  if (!saved) {
    updateSimulator();
    return;
  }
  try {
    const data = JSON.parse(saved);
    if (data.service) simService.value = data.service;
    if (data.hours) simHours.value = data.hours;
    if (data.frequency) simFrequency.value = data.frequency;
  } catch (error) {
    localStorage.removeItem(storageKeys.simulator);
  }
  updateSimulator();
}

function generateSummary(formData) {
  const slots = formData.getAll("slots");
  return [
    `Nom : ${formData.get("lastName") || "-"}`,
    `Prénom : ${formData.get("firstName") || "-"}`,
    `Email : ${formData.get("email") || "-"}`,
    `Téléphone : ${formData.get("phone") || "-"}`,
    `Service souhaité : ${formData.get("service") || "-"}`,
    `Fréquence : ${formData.get("frequency") || "-"}`,
    `Créneaux préférés : ${slots.length ? slots.join(", ") : "-"}`,
    `Message : ${formData.get("message") || "-"}`,
  ].join("\n");
}

function updateContactSummary() {
  const formData = new FormData(contactForm);
  const summaryText = generateSummary(formData);
  contactSummary.textContent = summaryText;
  const data = Object.fromEntries(formData);
  data.slots = formData.getAll("slots");
  localStorage.setItem(storageKeys.contact, JSON.stringify(data));
}

function loadContactForm() {
  const saved = localStorage.getItem(storageKeys.contact);
  if (!saved) {
    updateContactSummary();
    return;
  }
  try {
    const data = JSON.parse(saved);
    Object.entries(data).forEach(([key, value]) => {
      if (key === "slots") return;
      const field = contactForm.elements[key];
      if (!field) return;
      if (field instanceof RadioNodeList || Array.isArray(field)) {
        return;
      }
      field.value = value;
    });
    const slotValues = [].concat(data.slots || []);
    contactForm.querySelectorAll('input[name="slots"]').forEach((checkbox) => {
      checkbox.checked = slotValues.includes(checkbox.value);
    });
  } catch (error) {
    localStorage.removeItem(storageKeys.contact);
  }
  updateContactSummary();
}

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
        card.style.display = match ? "block" : "none";
      });
    });
  });
}

function setupReveal() {
  const revealElements = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );
  revealElements.forEach((el) => observer.observe(el));
}

function setupTestimonials() {
  let index = 0;

  function render() {
    const item = testimonials[index];
    testimonialText.textContent = item.text;
    testimonialAuthor.textContent = item.author;
  }

  function next() {
    index = (index + 1) % testimonials.length;
    render();
  }

  function prev() {
    index = (index - 1 + testimonials.length) % testimonials.length;
    render();
  }

  nextTestimonial.addEventListener("click", next);
  prevTestimonial.addEventListener("click", prev);
  render();
  setInterval(next, 6000);
}


function setupNavigation() {
  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
    });
  });
}

function setupBackToTop() {
  window.addEventListener("scroll", () => {
    backToTop.style.display = window.scrollY > 400 ? "block" : "none";
  });

  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

simForm.addEventListener("input", updateSimulator);
simForm.addEventListener("submit", (event) => {
  event.preventDefault();
  updateSimulator();
  document.getElementById("contact").scrollIntoView({ behavior: "smooth" });
});

contactForm.addEventListener("input", updateContactSummary);
contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  updateContactSummary();
});

copySummaryBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(contactSummary.textContent);
    copySummaryBtn.textContent = "Récapitulatif copié";
    setTimeout(() => {
      copySummaryBtn.textContent = "Copier le récapitulatif";
    }, 2000);
  } catch (error) {
    copySummaryBtn.textContent = "Copie impossible";
  }
});

setupFilters();
setupReveal();
setupTestimonials();
setupNavigation();
setupBackToTop();
loadSimulator();
loadContactForm();
