// typing animation
const roles = [
  "Android Developer",
  "Java Spring Backend Developer",
  "Full Stack Mobile Developer"
];

let roleIndex = 0;
let charIndex = 0;
let deleting = false;

const typingEl = document.querySelector('.typing-text');

setInterval(() => {
  if (!typingEl) return;

  const word = roles[roleIndex];

  if (!deleting) {
    typingEl.textContent = word.substring(0, charIndex + 1);
    charIndex++;

    if (charIndex === word.length) deleting = true;
  } else {
    typingEl.textContent = word.substring(0, charIndex - 1);
    charIndex--;

    if (charIndex === 0) {
      deleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
    }
  }
}, 120);

// EmailJS
if (window.emailjs) {
  emailjs.init("_xcZCSoFsKQyUXarQ");
}

const form = document.getElementById('contact-form');

if (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const status = document.getElementById('form-status');

    const data = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      subject: document.getElementById('subject').value,
      message: document.getElementById('message').value
    };

    emailjs.send("service_clv013m", "template_v6i8759", data)
      .then(function (response) {
        status.textContent = "Message sent successfully";
        form.reset();
        console.log("SUCCESS!", response.status, response.text);
      })
      .catch(function (error) {
        console.log("EMAILJS ERROR =>", error);
        status.textContent = "Error: " + (error.text || "Check console");
      });

  });
}