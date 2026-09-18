/* =========================================================
   TYPING ANIMATION
========================================================= */

const roles = [
  "Android Developer",
  "Java Spring Boot Developer",
  "Mobile & Backend Developer"
];

let roleIndex = 0;
let charIndex = 0;
let deleting = false;

const typingEl = document.querySelector(".typing-text");

function typeRole() {

  if (!typingEl) return;

  const currentRole = roles[roleIndex];

  if (!deleting) {

    typingEl.textContent =
      currentRole.substring(0, charIndex + 1);

    charIndex++;

    if (charIndex === currentRole.length) {

      deleting = true;

      setTimeout(typeRole, 1800);

      return;
    }

  } else {

    typingEl.textContent =
      currentRole.substring(0, charIndex - 1);

    charIndex--;

    if (charIndex === 0) {

      deleting = false;

      roleIndex =
        (roleIndex + 1) % roles.length;

      setTimeout(typeRole, 400);

      return;
    }
  }

  const typingSpeed = deleting ? 55 : 90;

  setTimeout(typeRole, typingSpeed);
}

typeRole();


/* =========================================================
   MOBILE NAVIGATION
========================================================= */

const mobileMenuBtn =
  document.querySelector(".mobile-menu-btn");

const navLinks =
  document.querySelector(".nav-links");

if (mobileMenuBtn && navLinks) {

  mobileMenuBtn.addEventListener("click", () => {

    navLinks.classList.toggle("show");

    const icon =
      mobileMenuBtn.querySelector("i");

    if (icon) {

      if (navLinks.classList.contains("show")) {

        icon.classList.remove("fa-bars");
        icon.classList.add("fa-xmark");

      } else {

        icon.classList.remove("fa-xmark");
        icon.classList.add("fa-bars");

      }

    }

  });


  /* Close menu after clicking a link */

  const menuItems =
    navLinks.querySelectorAll("a");

  menuItems.forEach((link) => {

    link.addEventListener("click", () => {

      navLinks.classList.remove("show");

      const icon =
        mobileMenuBtn.querySelector("i");

      if (icon) {

        icon.classList.remove("fa-xmark");
        icon.classList.add("fa-bars");

      }

    });

  });

}


/* =========================================================
   ACTIVE NAVIGATION LINK
========================================================= */

const sections =
  document.querySelectorAll("section[id]");

const navigationLinks =
  document.querySelectorAll(
    '.nav-links a[href^="#"]'
  );

function updateActiveNav() {

  let currentSection = "";

  sections.forEach((section) => {

    const sectionTop =
      section.offsetTop - 140;

    const sectionHeight =
      section.offsetHeight;

    if (
      window.scrollY >= sectionTop &&
      window.scrollY < sectionTop + sectionHeight
    ) {

      currentSection =
        section.getAttribute("id");

    }

  });


  navigationLinks.forEach((link) => {

    link.classList.remove("active");

    const target =
      link.getAttribute("href");

    if (target === `#${currentSection}`) {

      link.classList.add("active");

    }

  });

}

window.addEventListener(
  "scroll",
  updateActiveNav
);

updateActiveNav();


/* =========================================================
   EMAILJS INITIALIZATION
========================================================= */

const EMAILJS_PUBLIC_KEY =
  "_xcZCSoFsKQyUXarQ";

const EMAILJS_SERVICE_ID =
  "service_clv013m";

const EMAILJS_TEMPLATE_ID =
  "template_v6i8759";


if (window.emailjs) {

  emailjs.init(EMAILJS_PUBLIC_KEY);

} else {

  console.warn(
    "EmailJS library was not loaded."
  );

}


/* =========================================================
   CONTACT FORM
========================================================= */

const form =
  document.getElementById("contact-form");

const status =
  document.getElementById("form-status");


if (form) {

  form.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();


      /* -----------------------------------------
         Check EmailJS
      ----------------------------------------- */

      if (!window.emailjs) {

        if (status) {

          status.textContent =
            "Email service is currently unavailable.";

        }

        return;
      }


      /* -----------------------------------------
         Get Submit Button
      ----------------------------------------- */

      const submitButton =
        form.querySelector(
          'button[type="submit"]'
        );


      const originalButtonText =
        submitButton
          ? submitButton.innerHTML
          : "";


      /* -----------------------------------------
         Disable button
      ----------------------------------------- */

      if (submitButton) {

        submitButton.disabled = true;

        submitButton.innerHTML =
          'Sending... <i class="fa-solid fa-spinner fa-spin"></i>';

      }


      /* -----------------------------------------
         Clear previous status
      ----------------------------------------- */

      if (status) {

        status.textContent = "";

        status.classList.remove(
          "success",
          "error"
        );

      }


      /* -----------------------------------------
         Collect form data
      ----------------------------------------- */

      const data = {

        name:
          document.getElementById("name")?.value.trim() || "",

        email:
          document.getElementById("email")?.value.trim() || "",

        phone:
          document.getElementById("phone")?.value.trim() || "",

        subject:
          document.getElementById("subject")?.value.trim() || "",

        message:
          document.getElementById("message")?.value.trim() || ""

      };


      /* -----------------------------------------
         Send Email
      ----------------------------------------- */

      try {

        const response =
          await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            data
          );


        console.log(
          "EMAILJS SUCCESS:",
          response.status,
          response.text
        );


        /* -----------------------------------------
           Success
        ----------------------------------------- */

        if (status) {

          status.textContent =
            "Message sent successfully. I'll get back to you soon.";

          status.classList.add("success");

        }


        form.reset();


      } catch (error) {

        console.error(
          "EMAILJS ERROR:",
          error
        );


        /* -----------------------------------------
           Error
        ----------------------------------------- */

        if (status) {

          status.textContent =
            "Unable to send the message. Please try again.";

          status.classList.add("error");

        }

      } finally {

        /* -----------------------------------------
           Restore button
        ----------------------------------------- */

        if (submitButton) {

          submitButton.disabled = false;

          submitButton.innerHTML =
            originalButtonText;

        }

      }

    }
  );

}


/* =========================================================
   YEAR
========================================================= */

const footerYear =
  document.querySelector(".footer-bottom p");

if (footerYear) {

  const currentYear =
    new Date().getFullYear();

  footerYear.textContent =
    `© ${currentYear} Aditya Kumar. All rights reserved.`;

}


/* =========================================================
   SIMPLE SCROLL REVEAL
========================================================= */

const revealElements =
  document.querySelectorAll(
    ".section-heading, .about-content, .highlight-card, .skill-card, .project-card, .contact-wrapper"
  );


if ("IntersectionObserver" in window) {

  const observer =
    new IntersectionObserver(
      (entries, observerInstance) => {

        entries.forEach((entry) => {

          if (entry.isIntersecting) {

            entry.target.classList.add(
              "reveal-visible"
            );

            observerInstance.unobserve(
              entry.target
            );

          }

        });

      },
      {
        threshold: 0.08
      }
    );


  revealElements.forEach((element) => {

    element.classList.add("reveal");

    observer.observe(element);

  });

}