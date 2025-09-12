// Student Portal Handler
function handleStudentPortal() {
    // Add click animation
    const button = event.target;
    button.style.transform = 'scale(0.95)';

    setTimeout(() => {
        button.style.transform = 'translateY(-2px)';
    }, 150);

    // Show modal with student portal information
    showStudentModal();
}

// Create and show student modal
function showStudentModal() {
    // Create modal backdrop
    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'modal-backdrop';
    modalBackdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = `
        background: white;
        border-radius: 16px;
        padding: 40px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
        transform: scale(0.7);
        transition: transform 0.3s ease;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
    `;

    modalContent.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 3em; margin-bottom: 20px;">🎓</div>
            <h2 style="color: #1f2937; margin-bottom: 16px; font-size: 1.8em;">Student Portal</h2>
            <p style="color: #6b7280; margin-bottom: 30px; line-height: 1.6;">
                Welcome to your learning hub! Here's what you can access:
            </p>

            <div style="text-align: left; margin-bottom: 30px;">
                <div style="margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #6366f1;">
                    <strong style="color: #1f2937;">📝 Current Assignments</strong>
                    <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 0.9em;">View due dates and submit your work</p>
                </div>

                <div style="margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #8b5cf6;">
                    <strong style="color: #1f2937;">🐍 Python Projects</strong>
                    <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 0.9em;">Interactive coding challenges and tutorials</p>
                </div>

                <div style="margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #10b981;">
                    <strong style="color: #1f2937;">📊 Progress Tracker</strong>
                    <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 0.9em;">See your learning journey and achievements</p>
                </div>

                <div style="padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <strong style="color: #1f2937;">💬 Class Discussion</strong>
                    <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 0.9em;">Connect with classmates and get help</p>
                </div>
            </div>

            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                <button onclick="simulateLogin()" style="
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: transform 0.2s ease;
                " onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">
                    Login to Portal
                </button>
                <button onclick="closeModal()" style="
                    background: #f3f4f6;
                    color: #6b7280;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s ease;
                " onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f3f4f6'">
                    Close
                </button>
            </div>
        </div>
    `;

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
        position: absolute;
        top: 15px;
        right: 20px;
        background: none;
        border: none;
        font-size: 28px;
        color: #9ca3af;
        cursor: pointer;
        line-height: 1;
        transition: color 0.2s ease;
    `;
    closeBtn.onmouseover = () => closeBtn.style.color = '#6b7280';
    closeBtn.onmouseout = () => closeBtn.style.color = '#9ca3af';
    closeBtn.onclick = closeModal;

    modalContent.appendChild(closeBtn);
    modalBackdrop.appendChild(modalContent);
    document.body.appendChild(modalBackdrop);

    // Animate in
    setTimeout(() => {
        modalBackdrop.style.opacity = '1';
        modalContent.style.transform = 'scale(1)';
    }, 10);

    // Close on backdrop click
    modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
            closeModal();
        }
    });

    // Store reference for closing
    window.currentModal = modalBackdrop;
}

// Close modal function
function closeModal() {
    const modal = window.currentModal;
    if (modal) {
        const content = modal.querySelector('.modal-content');
        modal.style.opacity = '0';
        content.style.transform = 'scale(0.7)';

        setTimeout(() => {
            document.body.removeChild(modal);
            window.currentModal = null;
        }, 300);
    }
}

// Simulate login process
function simulateLogin() {
    const button = event.target;
    const originalText = button.textContent;

    button.textContent = 'Connecting...';
    button.style.opacity = '0.7';
    button.disabled = true;

    setTimeout(() => {
        button.textContent = 'Redirecting...';

        setTimeout(() => {
            // In a real application, this would redirect to the actual portal
            alert('🎉 Welcome to your Student Portal!\n\nIn a real implementation, this would redirect you to your personalized learning dashboard with all your assignments, projects, and progress tracking.');

            button.textContent = originalText;
            button.style.opacity = '1';
            button.disabled = false;
            closeModal();
        }, 1000);
    }, 1500);
}

// Smooth scrolling for any internal links (if added later)
document.addEventListener('DOMContentLoaded', function() {
    // Add smooth scrolling to any anchor links
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add some interactive effects to background items
    const bgItems = document.querySelectorAll('.bg-item');
    bgItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px) scale(1.02)';
        });

        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(-4px) scale(1)';
        });
    });

    // Add click effect to social links
    const socialLinks = document.querySelectorAll('.social-link');
    socialLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            // Add click animation
            this.style.transform = 'translateY(-2px) scale(0.95)';

            setTimeout(() => {
                this.style.transform = 'translateY(-2px) scale(1)';
            }, 150);

            // Show coming soon message or redirect
            const platform = this.getAttribute('title');
            setTimeout(() => {
                alert(`🔗 ${platform} link coming soon!\n\nThis would normally take you to Ben's ${platform} profile.`);
            }, 300);
        });
    });
});

// Keyboard accessibility for modal
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && window.currentModal) {
        closeModal();
    }
});

// Add some subtle animations on scroll (optional)
function addScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
            }
        });
    }, { threshold: 0.1 });

    // Observe elements for animation
    const elementsToAnimate = document.querySelectorAll('.bg-item, .highlight-box');
    elementsToAnimate.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        observer.observe(el);
    });
}

// Add CSS animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// Initialize scroll animations when page loads
document.addEventListener('DOMContentLoaded', addScrollAnimations);