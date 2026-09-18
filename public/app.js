/* =========================================
   1. GESTION DU MENU MOBILE
   ========================================= */
const navLinks = document.getElementById("navLinks");
const menuOverlay = document.getElementById("menuOverlay");

function showMenu() {
    if (navLinks && menuOverlay) {
        navLinks.classList.add("active");
        menuOverlay.classList.add("active");
        document.body.style.overflow = 'hidden';
    }
}

function hideMenu() {
    if (navLinks && menuOverlay) {
        navLinks.classList.remove("active");
        menuOverlay.classList.remove("active");
        document.body.style.overflow = 'auto';
    }
}

/* =========================================
   2. NAVBAR FIXE AU SCROLL & BOUTON TOP
   ========================================= */
const navbar = document.getElementById('navbar');
const backToTopBtn = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        if (navbar) navbar.classList.add('scrolled');
    } else {
        if (navbar) navbar.classList.remove('scrolled');
    }

    if (window.scrollY > 400) {
        if (backToTopBtn) backToTopBtn.classList.add('show');
    } else {
        if (backToTopBtn) backToTopBtn.classList.remove('show');
    }
});

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* =========================================
   3. ANIMATIONS SCROLL
   ========================================= */
const animElements = document.querySelectorAll('.text-box, .course-col, .campus-col, .facilities-col, .testimonials-col, .meet-card, .cta');

const observer = new IntersectionObserver((entries, observerInstance) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active-scroll');
            observerInstance.unobserve(entry.target);
        }
    });
}, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const heroBox = document.querySelector('.header .text-box');
        if (heroBox) heroBox.classList.add('active-scroll');
    }, 100);

    animElements.forEach(el => {
        if (!el.classList.contains('text-box')) observer.observe(el);
    });
});

/* =========================================
   4. MODALE & FORMULAIRE D'INSCRIPTION
   ========================================= */
const modal = document.getElementById('contactModal');
const toast = document.getElementById('toast');
const form = document.getElementById('inscriptionForm');

function openModal() {
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

function showToastMessage(message) {
    const toastText = document.getElementById('toast-text');
    if (toastText) toastText.innerText = message;
    if (toast) {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    const targetForm = event.target || form;

    // Récupération de chaque champ qu'il ait un attribute ID ou NAME
    const getVal = (selector) => {
        const el = targetForm.querySelector(selector);
        return el ? el.value.trim() : '';
    };

    const selectNiveau = getVal('#niveau') || getVal('[name="niveau"]');
    const customNiveau = getVal('#autreNiveauInput') || getVal('[name="autreNiveau"]');
    const niveauFinal = customNiveau !== '' ? customNiveau : selectNiveau;

    const formData = {
        nom: getVal('[name="nom"]') || getVal('#nom'),
        email: getVal('[name="email"]') || getVal('#email'),
        pays: getVal('[name="pays"]') || getVal('#pays'),
        telephone: getVal('[name="telephone"]') || getVal('#telephone'),
        niveau: niveauFinal,
        message: getVal('[name="message"]') || getVal('#message')
    };

    try {
        const response = await fetch('/api/inscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            closeModal();
            targetForm.reset();
            setTimeout(() => {
                showToastMessage("Merci ! Votre inscription a été enregistrée avec succès.");
            }, 400);
        } else {
            alert("Erreur lors de l'inscription : " + result.message);
        }
    } catch (error) {
        console.error("Erreur serveur :", error);
        alert("Impossible de contacter le serveur. Vérifiez que 'node server.js' est lancé.");
    }
}