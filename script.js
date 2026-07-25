(function() {
  'use strict';

  gsap.registerPlugin(ScrollTrigger);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

  /* ============ LENIS SMOOTH SCROLL ============ */
  let lenis = null;
  if (!prefersReducedMotion) {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href === '#' || href.length < 2) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(target, { offset: -60, duration: 1.4 });
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      // Close mobile menu if open
      mobileMenu.classList.remove('is-open');
      navBurger.classList.remove('is-open');
    });
  });

  /* ============ CUSTOM CURSOR ============ */
  if (!isCoarsePointer) {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    let mx = 0, my = 0, rx = 0, ry = 0;

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    });

    function tick() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    }
    tick();

    document.querySelectorAll('[data-hover]').forEach(el => {
      el.addEventListener('mouseenter', () => {
        dot.classList.add('is-hover');
        ring.classList.add('is-hover');
      });
      el.addEventListener('mouseleave', () => {
        dot.classList.remove('is-hover');
        ring.classList.remove('is-hover');
      });
    });

    document.addEventListener('mouseleave', () => ring.classList.add('is-hidden'));
    document.addEventListener('mouseenter', () => ring.classList.remove('is-hidden'));
  }

  /* ============ NAV SCROLL ============ */
  const nav = document.getElementById('nav');
  const backToTop = document.getElementById('back-to-top');
  function updateNav() {
    const y = window.scrollY;
    if (y > 50) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
    if (y > 600) backToTop.classList.add('is-shown');
    else backToTop.classList.remove('is-shown');
  }
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  backToTop.addEventListener('click', () => {
    if (lenis) lenis.scrollTo(0, { duration: 1.4 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ============ MOBILE MENU ============ */
  const navBurger = document.getElementById('nav-burger');
  const mobileMenu = document.getElementById('mobile-menu');
  navBurger.addEventListener('click', () => {
    navBurger.classList.toggle('is-open');
    mobileMenu.classList.toggle('is-open');
  });

  /* ============ HERO 4-BEAT ENTRANCE ============ */
  if (!prefersReducedMotion) {
    gsap.timeline({ delay: 0.3 })
      .to('#hero-eyebrow', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' })
      .to('#hero-title',   { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }, '-=0.4')
      .to('#hero-sub',     { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' }, '-=0.7')
      .to('#hero-cta',     { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.5')
      .to('#hero-meta',    { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.5')
      .to('#hero-right',   { opacity: 1, y: 0, scale: 1, duration: 1.4, ease: 'expo.out' }, '-=1.4');
  } else {
    document.querySelectorAll('#hero-eyebrow, #hero-title, #hero-sub, #hero-cta, #hero-meta, #hero-right')
      .forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
  }

  /* ============ MANIFESTO SCRUB BLUR ============ */
  document.fonts.ready.then(() => {
    const textEl = document.getElementById('manifesto-text');
    // Preserve <em> tags
    const html = textEl.innerHTML;
    // Split by spaces, but keep em tags intact
    const parts = html.split(/(\s+)/);
    textEl.innerHTML = parts.map(part => {
      if (part.trim() === '') return part;
      if (part.startsWith('<em>') || part.endsWith('</em>')) {
        // Wrap words inside em too
        return part.replace(/(\S+)/g, '<span class="word">$1</span>');
      }
      return `<span class="word">${part}</span>`;
    }).join('');

    if (!prefersReducedMotion) {
      gsap.to('#manifesto-text .word', {
        opacity: 1,
        filter: 'blur(0px)',
        stagger: 0.04,
        ease: 'sine.out',
        scrollTrigger: {
          trigger: '#manifesto-text',
          start: 'top 78%',
          end: 'center 55%',
          scrub: 1,
        }
      });

      gsap.to('#manifesto-sig', {
        opacity: 1,
        scrollTrigger: {
          trigger: '#manifesto-sig',
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        }
      });
    } else {
      document.querySelectorAll('#manifesto-text .word').forEach(w => {
        w.style.opacity = 1;
        w.style.filter = 'none';
      });
      document.getElementById('manifesto-sig').style.opacity = 1;
    }
  });

  /* ============ RITUAL STEPS REVEAL ============ */
  document.querySelectorAll('.ritual-step').forEach((step, i) => {
    if (prefersReducedMotion) {
      step.classList.add('is-in');
      return;
    }
    ScrollTrigger.create({
      trigger: step,
      start: 'top 80%',
      onEnter: () => step.classList.add('is-in'),
      onLeaveBack: () => step.classList.remove('is-in'),
    });
  });

  /* ============ PRODUCT CARDS REVEAL ============ */
  document.querySelectorAll('.product-card').forEach((card, i) => {
    if (prefersReducedMotion) {
      card.classList.add('is-in');
      return;
    }
    ScrollTrigger.create({
      trigger: card,
      start: 'top 85%',
      onEnter: () => {
        gsap.delayedCall(i * 0.12, () => card.classList.add('is-in'));
      },
      onLeaveBack: () => card.classList.remove('is-in'),
    });
  });

  /* ============ HORIZONTAL PIN SCROLL ============ */
  const pinViewport = document.getElementById('pin-viewport');
  const pinStage = document.getElementById('pin-stage');
  const pinTrack = document.getElementById('pin-track');
  const pinBar = document.getElementById('pin-bar');

  let pinScrollWidth = 0;
  let lastY = window.scrollY;
  let skewTimeout = null;

  function recalcPin() {
    if (window.innerWidth < 1024) {
      pinViewport.style.height = '';
      pinTrack.style.transform = '';
      return;
    }
    pinScrollWidth = pinTrack.scrollWidth - window.innerWidth;
    pinViewport.style.height = (window.innerHeight + Math.max(0, pinScrollWidth)) + 'px';
  }

  function updatePin() {
    if (window.innerWidth < 1024) return;
    const top = pinViewport.getBoundingClientRect().top;
    if (top <= 0 && top >= -pinScrollWidth) {
      const p = (-top) / pinScrollWidth;
      pinTrack.style.transform = `translate3d(${-p * pinScrollWidth}px, 0, 0)`;
      pinBar.style.width = (p * 100) + '%';

      // Skew on velocity
      const v = window.scrollY - lastY;
      lastY = window.scrollY;
      if (!prefersReducedMotion) {
        const skew = Math.max(-8, Math.min(8, v * 0.4));
        pinTrack.querySelectorAll('.formula-card').forEach(c => {
          c.style.transform = `skewX(${skew}deg)`;
        });
        clearTimeout(skewTimeout);
        skewTimeout = setTimeout(() => {
          pinTrack.querySelectorAll('.formula-card').forEach(c => {
            c.style.transform = 'skewX(0deg)';
          });
        }, 200);
      }
    } else if (top > 0) {
      pinTrack.style.transform = 'translate3d(0, 0, 0)';
      pinBar.style.width = '0%';
    } else if (top < -pinScrollWidth) {
      pinTrack.style.transform = `translate3d(${-pinScrollWidth}px, 0, 0)`;
      pinBar.style.width = '100%';
    }
  }

  recalcPin();
  window.addEventListener('resize', () => {
    recalcPin();
    ScrollTrigger.refresh();
  });
  window.addEventListener('scroll', updatePin, { passive: true });
  updatePin();

  /* ============ CART ============ */
  const cartTrigger = document.getElementById('cart-trigger');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-overlay');
  const cartClose = document.getElementById('cart-close');
  const cartBody = document.getElementById('cart-body');
  const cartFoot = document.getElementById('cart-foot');
  const cartCount = document.getElementById('cart-count');
  const cartSubtotal = document.getElementById('cart-subtotal');
  const cartTotal = document.getElementById('cart-total');

  let cart = [];

  function openCart() {
    cartDrawer.classList.add('is-open');
    cartOverlay.classList.add('is-open');
    if (lenis) lenis.stop();
    document.body.style.overflow = 'hidden';
  }
  function closeCart() {
    cartDrawer.classList.remove('is-open');
    cartOverlay.classList.remove('is-open');
    if (lenis) lenis.start();
    document.body.style.overflow = '';
  }
  cartTrigger.addEventListener('click', (e) => { e.preventDefault(); openCart(); });
  cartClose.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });

  function renderCart() {
    if (cart.length === 0) {
      cartBody.innerHTML = `
        <div class="cart-empty">
          <span class="label">— Empty</span>
          <p>Your cart is waiting for its first tin.</p>
        </div>`;
      cartFoot.style.display = 'none';
    } else {
      cartBody.innerHTML = cart.map((item, i) => `
        <div class="cart-item" data-i="${i}">
          <img src="${item.img}" alt="${item.name}">
          <div>
            <div class="name">${item.name}</div>
            <div class="meta">— ${item.tag}</div>
            <div class="qty">
              <button class="qty-dec" aria-label="Decrease">−</button>
              <span class="val">${item.qty}</span>
              <button class="qty-inc" aria-label="Increase">+</button>
            </div>
            <button class="remove" data-remove="${i}">Remove</button>
          </div>
          <div class="price">$${item.price * item.qty}</div>
        </div>
      `).join('');
      cartFoot.style.display = 'block';
      const subtotal = cart.reduce((s, it) => s + it.price * it.qty, 0);
      cartSubtotal.textContent = '$' + subtotal;
      cartTotal.textContent = '$' + subtotal;

      // Wire qty buttons
      cartBody.querySelectorAll('.cart-item').forEach((row, i) => {
        row.querySelector('.qty-dec').addEventListener('click', () => {
          if (cart[i].qty > 1) cart[i].qty--;
          renderCart();
        });
        row.querySelector('.qty-inc').addEventListener('click', () => {
          cart[i].qty++;
          renderCart();
        });
      });
      cartBody.querySelectorAll('[data-remove]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.dataset.remove, 10);
          cart.splice(idx, 1);
          renderCart();
        });
      });
    }
    const count = cart.reduce((s, it) => s + it.qty, 0);
    cartCount.textContent = count;
  }

  // Product add to cart
  document.querySelectorAll('.product-card').forEach((card, i) => {
    const addBtn = card.querySelector('.product-add');
    const valEl = card.querySelector('.product-qty .val');
    const incBtn = card.querySelector('.qty-inc');
    const decBtn = card.querySelector('.qty-dec');
    const name = card.querySelector('.product-name').textContent.trim();
    const price = parseInt(card.querySelector('.price').textContent.replace('$', ''), 10);
    const tag = card.querySelector('.product-tag') ? card.querySelector('.product-tag').textContent : '';
    const img = card.querySelector('.product-img img').src;

    let qty = 1;
    incBtn.addEventListener('click', () => {
      qty++;
      valEl.textContent = qty;
    });
    decBtn.addEventListener('click', () => {
      if (qty > 1) { qty--; valEl.textContent = qty; }
    });

    addBtn.addEventListener('click', () => {
      // Check if already in cart
      const existing = cart.find(c => c.name === name);
      if (existing) {
        existing.qty += qty;
      } else {
        cart.push({ name, price, tag, img, qty });
      }
      addBtn.classList.add('is-added');
      const original = addBtn.innerHTML;
      addBtn.innerHTML = '<span>Added ✓</span>';
      setTimeout(() => {
        addBtn.classList.remove('is-added');
        addBtn.innerHTML = original;
      }, 1600);
      renderCart();
      setTimeout(openCart, 400);
      // Reset qty
      qty = 1;
      valEl.textContent = qty;
    });
  });

  renderCart();

  /* ============ NEWSLETTER ============ */
  const newsletterForm = document.getElementById('newsletter-form');
  const newsletterSuccess = document.getElementById('newsletter-success');
  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = newsletterForm.querySelector('input');
    if (input.value && input.value.includes('@')) {
      newsletterSuccess.classList.add('is-shown');
      input.value = '';
      setTimeout(() => newsletterSuccess.classList.remove('is-shown'), 5000);
    }
  });

  /* ============ FEATURES REVEAL ============ */
  if (!prefersReducedMotion) {
    gsap.from('.feature-col', {
      opacity: 0,
      y: 40,
      duration: 1,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.features-grid',
        start: 'top 75%',
      }
    });

    gsap.from('.ritual-head > *', {
      opacity: 0,
      y: 30,
      duration: 1,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.ritual-head',
        start: 'top 80%',
      }
    });

    gsap.from('.testimonial blockquote > *', {
      opacity: 0,
      y: 30,
      duration: 1,
      stagger: 0.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.testimonial',
        start: 'top 75%',
      }
    });

    gsap.from('.newsletter-grid > *', {
      opacity: 0,
      y: 40,
      duration: 1,
      stagger: 0.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.newsletter',
        start: 'top 75%',
      }
    });

    gsap.from('.formula-head > *', {
      opacity: 0,
      y: 30,
      duration: 1,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.formula-head',
        start: 'top 80%',
      }
    });

    gsap.from('.features-head > *', {
      opacity: 0,
      y: 30,
      duration: 1,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.features-head',
        start: 'top 80%',
      }
    });

    gsap.from('.products-head > *', {
      opacity: 0,
      y: 30,
      duration: 1,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.products-head',
        start: 'top 80%',
      }
    });
  }

  // Refresh ScrollTrigger after fonts load
  document.fonts.ready.then(() => {
    ScrollTrigger.refresh();
  });

})();
