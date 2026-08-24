window.addEventListener('pageshow', () => {
  // --- Banner Toggle ---
  const banner = document.getElementById('banner');
  const closeBtn = document.getElementById('closeBanner');
  const nav = document.getElementById('nav');

  if (closeBtn && banner) {
    closeBtn.addEventListener('click', () => {
      banner.style.display = 'none';
      if (nav) {
        nav.classList.add('top-zero');
      }
    });
  }

  // --- Mobile Menu Toggle ---
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const menuIcon = document.getElementById('menuIcon');
  const closeIcon = document.getElementById('closeIcon');

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      if (mobileMenu) mobileMenu.classList.toggle('active');
      if (menuIcon) menuIcon.classList.toggle('hidden');
      if (closeIcon) closeIcon.classList.toggle('hidden');
    });

    // Close mobile menu when clicking a link
    document.querySelectorAll('.mobile-link').forEach(link => {
      link.addEventListener('click', () => {
        if (mobileMenu) mobileMenu.classList.remove('active');
        if (menuIcon) menuIcon.classList.remove('hidden');
        if (closeIcon) closeIcon.classList.add('hidden');
      });
    });
  }

  // --- Smooth Scroll for Internal Anchor Links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // --- Scroll Animations ---
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  document.querySelectorAll('.project-card, .skill-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
  });

  // --- GitHub Screenshots Lightbox Gallery ---
  const modal = document.getElementById('lightbox');
  const imgEl = document.getElementById('lightboxImg');
  const titleEl = document.getElementById('lightboxTitle');
  const counterEl = document.getElementById('lightboxCounter');
  const nextBtn = document.getElementById('lightboxNext');
  const prevBtn = document.getElementById('lightboxPrev');
  const closeLightBoxBtn = document.getElementById('lightboxClose');
  const backdrop = document.getElementById('lightboxBackdrop');

  if (modal && imgEl && titleEl && counterEl) {
    let currentImages = [];
    let currentIndex = 0;
    const imageExtensions = /\.(png|jpe?g|gif|webp|svg)$/i;

    function updateView() {
      imgEl.src = currentImages[currentIndex];
      counterEl.textContent = `${currentIndex + 1} of ${currentImages.length}`;
    }

    document.querySelectorAll('.btn-gallery').forEach(btn => {
      btn.addEventListener('click', async () => {
        const repo = btn.getAttribute('data-repo');
        const folder = btn.getAttribute('data-folder') || 'screenshots';
        const title = btn.getAttribute('data-title') || 'Screenshots';
        const localImages = btn.getAttribute('data-images');

        titleEl.textContent = 'Loading...';
        counterEl.textContent = '';
        imgEl.src = '';
        modal.classList.remove('hidden');

        try {
          if (localImages) {
            currentImages = localImages.split(',').map(img => img.trim());
          } else {
            const response = await fetch(`https://api.github.com/repos/${repo}/contents/${folder}`);
            if (!response.ok) throw new Error('Folder not found or repository is private');

            const files = await response.json();
            currentImages = files
              .filter(file => file.type === 'file' && imageExtensions.test(file.name))
              .map(file => file.download_url);
          }

          if (currentImages.length === 0) {
            titleEl.textContent = 'No screenshots found';
            return;
          }

          currentIndex = 0;
          titleEl.textContent = title;
          updateView();
        } catch (err) {
          console.error(err);
          currentImages = [];
          titleEl.textContent = 'Failed to load images';
        }
      });
    });

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (!currentImages.length) return;
        currentIndex = (currentIndex + 1) % currentImages.length;
        updateView();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (!currentImages.length) return;
        currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
        updateView();
      });
    }

    const closeModal = () => modal.classList.add('hidden');
    if (closeLightBoxBtn) closeLightBoxBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);
  }

  // --- Skill Tags Elliptical Layout ---
  function arrangeSkills() {
    document.querySelectorAll('.skill-card').forEach(card => {
      const tags = Array.from(card.querySelectorAll('.tag-icon'));
      if (!tags.length) return;
      
      const cardWidth = card.offsetWidth || 600;
      const cardHeight = card.offsetHeight || 140;
      // Calculate radii for the ellipse ensuring a strict 40px clearance 
      // (24px for icon half-size + 16px breathing room for hover scale)
      const rx = Math.max(10, (cardWidth / 2) - 40); 
      const ry = Math.max(10, (cardHeight / 2) - 40); 

      tags.forEach((tag, i) => {
        const angle = (i / tags.length) * 2 * Math.PI - Math.PI / 2; // start from top
        const x = Math.cos(angle) * rx;
        const y = Math.sin(angle) * ry;
        
        tag.style.position = 'absolute';
        // Center the tag and then offset by x, y
        // We use left/top and a 50% offset, then subtract half the icon size (24px)
        tag.style.left = `calc(50% + ${x}px - 24px)`;
        tag.style.top = `calc(50% + ${y}px - 24px)`;
      });
    });
  }

  // Run on load and resize
  arrangeSkills();
  window.addEventListener('resize', arrangeSkills);
});