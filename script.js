// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Typed.js
    var typed = new Typed(".typing-text", {
        strings: [
            "Web Developer",
            "Frontend Developer", 
            "Backend Developer"
        ],
        typeSpeed: 70,
        backSpeed: 25,
        backDelay: 500,
        loop: true,
        showCursor: true,
        cursorChar: '|'
    });

    // Contact form submission
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const statusElement = document.getElementById('form-status');
            
            // Change button text to sending state
            submitBtn.innerHTML = 'Sending... <i class="fas fa-spinner fa-spin"></i>';
            submitBtn.disabled = true;
            statusElement.textContent = '';
            
            // Get form data
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value || 'Not provided',
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };
            
            // Send email using EmailJS
            emailjs.send('service_agpg1pl', 'template_twxgaav', formData)
                .then(function(response) {
                    statusElement.textContent = 'Message sent successfully!';
                    statusElement.className = 'success-message';
                    contactForm.reset();
                }, function(error) {
                    statusElement.textContent = 'Failed to send message. Please try again.';
                    statusElement.className = 'error-message';
                })
                .finally(function() {
                    submitBtn.innerHTML = 'Send Message <i class="fas fa-paper-plane"></i>';
                    submitBtn.disabled = false;
                });
        });
    } else {
        console.error('Contact form not found');
    }

    // Load Skills from skill.json
    fetch('skill.json')
        .then(res => {
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
        })
        .then(skills => {
            const skillContainer = document.getElementById('skill-container');
            if (skillContainer) {
                skills.forEach(skill => {
                    const div = document.createElement('div');
                    div.className = 'skill-item';
                    div.textContent = skill;
                    skillContainer.appendChild(div);
                });
            } else {
                console.error('Skill container not found');
            }
        })
        .catch(error => console.error('Error loading skills:', error));

    // Load Projects from project.json
    fetch('project.json')
        .then(res => {
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
        })
        .then(projects => {
            const projectContainer = document.getElementById('project-container');
            if (projectContainer) {
                projects.forEach(project => {
                    const box = document.createElement('div');
                    box.className = 'project-box';
                    box.innerHTML = `
                        <img src="${project.image}" alt="${project.title}">
                        <h3>${project.title}</h3>
                        <p>${project.description}</p>
                        <a href="${project.link}" target="_blank" class="btn">View Project</a>
                    `;
                    projectContainer.appendChild(box);
                });
            } else {
                console.error('Project container not found');
            }
        })
        .catch(error => console.error('Error loading projects:', error));
});
