// Galaxy Background Effect
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
const particleCount = window.innerWidth < 768 ? 50 : 100;
let mouse = { x: null, y: null };

window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
});

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.5 + 0.1;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;

        if (mouse.x && mouse.y) {
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 150) {
                this.x -= dx * 0.01;
                this.y -= dy * 0.01;
            }
        }
    }

    draw() {
        ctx.fillStyle = `rgba(0, 113, 227, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initGalaxy() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particles = [];
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function animateGalaxy() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        for (let j = i + 1; j < particles.length; j++) {
            let dx = particles[i].x - particles[j].x;
            let dy = particles[i].y - particles[j].y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
                ctx.strokeStyle = `rgba(0, 113, 227, ${0.1 * (1 - distance / 100)})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(animateGalaxy);
}

window.addEventListener('resize', initGalaxy);
initGalaxy();
animateGalaxy();

// Initialize GSAP
gsap.registerPlugin(ScrollTrigger);

// Custom Cursor Effect
const cursor = document.querySelector('.cursor-glow');
document.addEventListener('mousemove', (e) => {
    gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.8,
        ease: "power2.out"
    });
});

// Hero Typing Effect
function initTypingEffect() {
    const text = "Harshit Mishra";
    const headline = document.querySelector('.headline');
    headline.innerHTML = '';
    headline.style.opacity = 1;
    headline.style.transform = 'translateY(0)';

    let i = 0;
    function type() {
        if (i < text.length) {
            headline.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, 100);
        }
    }
    type();
}

// Hero Animations
window.addEventListener('DOMContentLoaded', () => {
    const tl = gsap.timeline();

    tl.to('.sub-headline', { opacity: 1, y: 0, duration: 1, delay: 0.5 })
        .add(() => initTypingEffect())
        .to('.hero-description', { opacity: 1, y: 0, duration: 1 }, "+=1.5")
        .to('.hero-actions', { opacity: 1, y: 0, duration: 1 }, "-=0.7");

    // Fetch Projects
    fetchProjects();
});

// Scroll Animations
gsap.utils.toArray('section').forEach(section => {
    gsap.from(section.querySelectorAll('.container > *'), {
        scrollTrigger: {
            trigger: section,
            start: "top 80%",
            toggleActions: "play none none none"
        },
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.2
    });
});

async function fetchProjects() {
    const container = document.getElementById('projects-container');
    try {
        const response = await fetch('/api/projects');
        const projects = await response.json();

        container.innerHTML = '';

        if (projects.length === 0) {
            container.innerHTML = '<p class="muted-color">No projects found. Check back later!</p>';
            return;
        }

        projects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.innerHTML = `
                <div class="project-info">
                    <span class="project-category">${project.category}</span>
                    <h3>${project.name}</h3>
                    <p>${project.description}</p>
                    <div class="project-footer">
                        <div class="project-stats">
                            <span><i class="fas fa-code"></i> ${project.language || 'Code'}</span>
                            <span><i class="fas fa-star"></i> ${project.stars}</span>
                        </div>
                        <a href="${project.url}" target="_blank" class="btn-link"><i class="fas fa-external-link-alt"></i></a>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading projects:', error);
        container.innerHTML = '<p class="muted-color">Failed to load projects. View them on GitHub directly.</p>';
    }
}

// Heartbeat system to keep server alive
function startHeartbeat() {
    setInterval(() => {
        fetch('/api/heartbeat', { method: 'POST' }).catch(() => { });
    }, 5000); // Ping every 5 seconds
}

// Interactive Learning Hub Data
const skillData = {
    python: {
        title: "Python Development",
        desc: "The core language for AI, Data Science, and Backend logic. Mastered through various automation and web projects.",
        video: "https://www.youtube.com/results?search_query=python+playlist",
        docs: "https://docs.python.org/3/",
        roadmap: "https://roadmap.sh/python"
    },
    ml: {
        title: "Machine Learning",
        desc: "Building intelligent systems that learn from data. Specialized in predictive modeling and natural language processing.",
        video: "https://www.youtube.com/results?search_query=machine+learning+course",
        docs: "https://scikit-learn.org/stable/",
        roadmap: "https://roadmap.sh/ai-data-scientist"
    },
    webdev: {
        title: "Full Stack Web Dev",
        desc: "Creating dynamic, responsive, and high-performance user experiences with modern HTML, CSS, and JavaScript stacks.",
        video: "https://www.youtube.com/results?search_query=web+development+course",
        docs: "https://developer.mozilla.org/en-US/",
        roadmap: "https://roadmap.sh/frontend"
    },
    java: {
        title: "Java Development",
        desc: "Building robust, scalable applications with a focus on Object-Oriented Design and backend systems.",
        video: "https://www.youtube.com/results?search_query=java+programming+playlist",
        docs: "https://docs.oracle.com/en/java/",
        roadmap: "https://roadmap.sh/java"
    }
};

const skillModal = document.getElementById('skill-modal');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const modalVideo = document.getElementById('modal-video');
const modalDocs = document.getElementById('modal-docs');
const modalRoadmap = document.getElementById('modal-roadmap');

function openSkillModal(skillKey) {
    const data = skillData[skillKey];
    if (data) {
        modalTitle.innerText = data.title;
        modalDesc.innerText = data.desc;
        modalVideo.href = data.video;
        modalDocs.href = data.docs;
        modalRoadmap.href = data.roadmap;
        skillModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
}

function closeSkillModal() {
    skillModal.classList.remove('active');
    document.body.style.overflow = 'auto'; // Re-enable scrolling
}

// Close modal when clicking outside the content
window.addEventListener('click', (e) => {
    if (e.target === skillModal) {
        closeSkillModal();
    }
});

// Navigation scroll effect
window.addEventListener('scroll', () => {
    const nav = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        nav.style.padding = '10px 0';
        nav.style.height = '70px';
    } else {
        nav.style.padding = '0';
        nav.style.height = '80px';
    }
});

// Initialize heartbeat
startHeartbeat();

// Contact Form Handling
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');
const submitBtn = document.getElementById('submit-btn');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Custom Validation
        let isValid = true;
        const inputs = contactForm.querySelectorAll('input[required], textarea[required]');

        inputs.forEach(input => {
            const formGroup = input.parentElement;
            formGroup.classList.remove('error');

            if (!input.value.trim()) {
                isValid = false;
                formGroup.classList.add('error');
            } else if (input.type === 'email') {
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(input.value)) {
                    isValid = false;
                    formGroup.classList.add('error');
                    formGroup.querySelector('.error-text').innerText = 'Please enter a valid email address';
                }
            }
        });

        if (!isValid) return;

        const originalBtnContent = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Sending...</span> <i class="fas fa-spinner fa-spin"></i>';

        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            message: document.getElementById('message').value
        };

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            formStatus.className = 'form-status active ' + result.status;
            formStatus.innerText = result.message;

            if (result.status === 'success') {
                contactForm.reset();
            }
        } catch (error) {
            formStatus.className = 'form-status active error';
            formStatus.innerText = 'Something went wrong. Please try again later.';
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnContent;

            setTimeout(() => {
                formStatus.className = 'form-status';
            }, 5000);
        }
    });

    // Remove error class on input
    contactForm.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', () => {
            input.parentElement.classList.remove('error');
        });
    });
}
