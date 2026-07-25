(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', loadSiteData);

  async function loadSiteData() {
    try {
      const response = await fetch('data.json');
      if (!response.ok) throw new Error(`Unable to load data.json (${response.status})`);

      const data = await response.json();
      populatePage(data);
      initializePage();
    } catch (error) {
      console.error('Jagave content failed to load:', error);
    }
  }

  function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = value || '';
  }

  function setMarkup(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.innerHTML = value || '';
  }

  function setImage(selector, imageUrl, alt) {
    const image = document.querySelector(selector);
    if (!image) return;
    image.src = imageUrl;
    image.alt = alt || '';
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[character]));
  }

  function createLink(link, className) {
    return `<a href="${escapeHtml(link.href)}"${className ? ` class="${className}"` : ''} data-hover>${escapeHtml(link.label)}</a>`;
  }

  function populatePage(data) {
    document.title = data.site.title;
    setText('#nav-brand', data.site.brand);
    setText('#nav-mark', data.site.mark);
    setText('#footer-brand', data.site.brand);
    setText('#footer-mark', data.site.mark);

    document.querySelector('#nav-links').innerHTML = data.site.nav.map((link) => `<li>${createLink(link)}</li>`).join('');
    document.querySelector('#mobile-menu').innerHTML = data.site.nav.map((link, index) => (
      `<a href="${escapeHtml(link.href)}"><span class="num">${String(index + 1).padStart(2, '0')}</span>${escapeHtml(link.label)}</a>`
    )).join('');
    setText('#nav-waitlist', data.site.waitlistLabel);

    populateHero(data.hero);
    populateMarquee(data.marquee);
    populateManifesto(data.manifesto);
    populatePrinciples(data.principles);
    populateFormula(data.formula);
    populateIngredients(data.ingredients);
    populateRitual(data.ritualMeta, data.ritual);
    populatePreview(data.preview);
    populateTestimonial(data.testimonial);
    populateWaitlist(data.waitlist);
    populateFooter(data.footer);
  }

  function populateHero(hero) {
    setText('#hero-eyebrow-left', hero.eyebrow[0]);
    setText('#hero-eyebrow-right', hero.eyebrow[1]);
    setText('#hero-title-leading', hero.title.leading);
    setText('#hero-title-emphasis', hero.title.emphasis);
    setText('#hero-title-trailing', hero.title.trailing);
    setText('#hero-sub', hero.subheadline);
    setText('#hero-frame-tag', hero.frameTag);
    setText('#hero-frame-num', hero.frameNote);
    setText('#hero-side-text', hero.sideText);
    setImage('#hero-image', hero.imageUrl, hero.imageAlt);

    document.querySelector('#hero-cta').innerHTML = hero.ctas.map((cta, index) => (
      `<a href="${escapeHtml(cta.href)}" class="btn${index ? ' btn-ghost' : ''}" data-hover>` +
      `<span${index ? ' class="underline"' : ''}>${escapeHtml(cta.label)}</span>` +
      (index ? '' : '<span class="arrow">→</span>') + '</a>'
    )).join('');

    document.querySelector('#hero-meta').innerHTML = hero.meta.map((item) => (
      `<div class="hero-meta-item"><span class="label">${escapeHtml(item.label)}</span><span class="value">${escapeHtml(item.value)}</span></div>`
    )).join('');
  }

  function populateMarquee(items) {
    const marquee = document.querySelector('[data-list="marquee"]');
    marquee.innerHTML = [...items, ...items].map((item) => `<span class="marquee-item">${escapeHtml(item)}</span>`).join('');
  }

  function populateManifesto(manifesto) {
    setText('#manifesto-section-num', manifesto.sectionNum);
    setText('#manifesto-label', manifesto.label);
    setMarkup('#manifesto-title', manifesto.title);
    setText('#manifesto-text', manifesto.text);
    setText('#manifesto-signature', manifesto.signature);
    setText('#manifesto-founder', manifesto.founder);
  }

  function populatePrinciples(principles) {
    setText('#principles-section-num', principles.sectionNum);
    setMarkup('#principles-title', principles.title);
    setText('#principles-description', principles.description);

    document.querySelector('[data-list="principles"]').innerHTML = principles.items.map((item) => (
      `<div class="feature-col">` +
      `<span class="feature-num">${escapeHtml(item.number)}</span>` +
      `<h3 class="feature-title">${item.title}</h3>` +
      `<p class="feature-body">${escapeHtml(item.body)}</p>` +
      `<div class="feature-spec">${item.specs.map((spec) => (
        `<div class="feature-spec-row"><span class="k">${escapeHtml(spec.label)}</span><span class="v">${escapeHtml(spec.value)}</span></div>`
      )).join('')}</div></div>`
    )).join('');
  }

  function populateFormula(formula) {
    setText('#formula-section-num', formula.sectionNum);
    setMarkup('#formula-title', formula.title);
    setText('#formula-description', formula.description);
    setText('#formula-meta', formula.meta);
    setText('#pin-progress-label', formula.progressLabel);
    setText('#pin-instructions', formula.instructions);
  }

  function populateIngredients(ingredients) {
    document.querySelector('[data-list="ingredients"]').innerHTML = ingredients.map((ingredient, index) => (
      `<article class="formula-card" data-hover>` +
      `<span class="card-num">${String(index + 1).padStart(2, '0')}</span>` +
      `<div class="card-img"><img src="${escapeHtml(ingredient.imageUrl)}" alt="${escapeHtml(ingredient.imageAlt)}"></div>` +
      `<span class="card-label">— ${escapeHtml(ingredient.cosmeticBenefit)}</span>` +
      `<h3 class="card-title">${escapeHtml(ingredient.name)}</h3>` +
      `<p class="card-latin">${escapeHtml(ingredient.botanicalName)}</p>` +
      `<p class="card-body">${escapeHtml(ingredient.description)}</p>` +
      `<div class="card-foot"><span class="origin">${escapeHtml(ingredient.origin)} ↗</span><span class="dose">${escapeHtml(ingredient.dose)}</span></div>` +
      `</article>`
    )).join('');
  }

  function populateRitual(ritualMeta, ritual) {
    setText('#ritual-section-num', ritualMeta.sectionNum);
    setMarkup('#ritual-title', ritualMeta.title);
    setText('#ritual-description', ritualMeta.description);

    document.querySelector('[data-list="ritual"]').innerHTML = ritual.map((step, index) => (
      `<div class="ritual-step">` +
      `<span class="step-num">— Step ${String(index + 1).padStart(2, '0')}</span>` +
      `<h3 class="step-title">${step.title}</h3>` +
      `<div class="step-body">${escapeHtml(step.description)}<div class="detail">↗ ${escapeHtml(step.detail)}</div></div>` +
      `</div>`
    )).join('');
  }

  function populatePreview(preview) {
    setText('#preview-section-num', preview.sectionNum);
    setMarkup('#preview-title', preview.title);
    setText('#preview-description', preview.description);

    document.querySelector('[data-list="preview"]').innerHTML = preview.cards.map((card) => (
      `<article class="product-card" data-hover>` +
      `<div class="product-img"><span class="product-tag">${escapeHtml(card.tag)}</span><img src="${escapeHtml(card.imageUrl)}" alt="${escapeHtml(card.imageAlt)}"></div>` +
      `<div class="product-meta"><span class="label">${escapeHtml(card.label)}</span></div>` +
      `<h3 class="product-name">${card.name}</h3>` +
      `<p class="product-desc">${escapeHtml(card.description)}</p>` +
      `<div class="product-foot"><a class="btn" href="#formula" data-hover>${escapeHtml(card.cta)} <span class="arrow">→</span></a></div>` +
      `</article>`
    )).join('');
  }

  function populateTestimonial(testimonial) {
    setMarkup('#testimonial-quote', testimonial.quote);
    setText('#testimonial-name', testimonial.name);
    setText('#testimonial-role', testimonial.role);
  }

  function populateWaitlist(waitlist) {
    setText('#waitlist-section-num', waitlist.sectionNum);
    setMarkup('#waitlist-title', waitlist.title);
    setText('#waitlist-description', waitlist.description);
    document.querySelector('#waitlist-email').placeholder = waitlist.placeholder;
    setText('#waitlist-button', waitlist.button);
    setText('#waitlist-note', waitlist.note);
    setText('#waitlist-success', waitlist.success);
  }

  function populateFooter(footer) {
    setText('#footer-description', footer.description);
    setText('#footer-explore-title', footer.exploreTitle);
    setText('#footer-studio-title', footer.studioTitle);
    setText('#footer-connect-title', footer.connectTitle);
    document.querySelector('#footer-explore-links').innerHTML = footer.explore.map((link) => `<li>${createLink(link)}</li>`).join('');
    document.querySelector('#footer-studio-links').innerHTML = footer.studio.map((link) => `<li>${createLink(link)}</li>`).join('');
    document.querySelector('#footer-connect-links').innerHTML = footer.connect.map((link) => `<li>${createLink(link)}</li>`).join('');
    setText('#footer-copyright', footer.copyright);
    setText('#footer-credit', footer.credit);
  }

  function initializePage() {
    gsap.registerPlugin(ScrollTrigger);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
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

    const mobileMenu = document.getElementById('mobile-menu');
    const navBurger = document.getElementById('nav-burger');
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const href = link.getAttribute('href');
        if (href === '#' || href.length < 2) return;
        const target = document.querySelector(href);
        if (!target) return;
        event.preventDefault();
        if (lenis) lenis.scrollTo(target, { offset: -60, duration: 1.4 });
        else target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        mobileMenu.classList.remove('is-open');
        navBurger.classList.remove('is-open');
      });
    });

    if (!isCoarsePointer) initializeCursor();

    const nav = document.getElementById('nav');
    const backToTop = document.getElementById('back-to-top');
    function updateNav() {
      const y = window.scrollY;
      nav.classList.toggle('is-scrolled', y > 50);
      backToTop.classList.toggle('is-shown', y > 600);
    }
    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();

    backToTop.addEventListener('click', () => {
      if (lenis) lenis.scrollTo(0, { duration: 1.4 });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    navBurger.addEventListener('click', () => {
      navBurger.classList.toggle('is-open');
      mobileMenu.classList.toggle('is-open');
    });

    initializeHeroAnimation(prefersReducedMotion);
    initializeManifestoAnimation(prefersReducedMotion);
    initializeRitualReveal(prefersReducedMotion);
    initializePreviewReveal(prefersReducedMotion);
    initializeHorizontalFormula(prefersReducedMotion);
    initializeWaitlistForm();
    initializeSectionAnimations(prefersReducedMotion);
  }

  function initializeCursor() {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;

    document.addEventListener('mousemove', (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    });

    function tick() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    }
    tick();

    document.querySelectorAll('[data-hover]').forEach((element) => {
      element.addEventListener('mouseenter', () => {
        dot.classList.add('is-hover');
        ring.classList.add('is-hover');
      });
      element.addEventListener('mouseleave', () => {
        dot.classList.remove('is-hover');
        ring.classList.remove('is-hover');
      });
    });

    document.addEventListener('mouseleave', () => ring.classList.add('is-hidden'));
    document.addEventListener('mouseenter', () => ring.classList.remove('is-hidden'));
  }

  function initializeHeroAnimation(prefersReducedMotion) {
    const heroElements = '#hero-eyebrow, #hero-title, #hero-sub, #hero-cta, #hero-meta, #hero-right';
    if (!prefersReducedMotion) {
      gsap.timeline({ delay: 0.3 })
        .to('#hero-eyebrow', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' })
        .to('#hero-title', { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }, '-=0.4')
        .to('#hero-sub', { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' }, '-=0.7')
        .to('#hero-cta', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.5')
        .to('#hero-meta', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.5')
        .to('#hero-right', { opacity: 1, y: 0, scale: 1, duration: 1.4, ease: 'expo.out' }, '-=1.4');
    } else {
      document.querySelectorAll(heroElements).forEach((element) => {
        element.style.opacity = 1;
        element.style.transform = 'none';
      });
    }
  }

  function initializeManifestoAnimation(prefersReducedMotion) {
    document.fonts.ready.then(() => {
      const textElement = document.getElementById('manifesto-text');
      textElement.innerHTML = textElement.textContent.split(/(\s+)/).map((part) => (
        part.trim() ? `<span class="word">${part}</span>` : part
      )).join('');

      if (!prefersReducedMotion) {
        gsap.to('#manifesto-text .word', {
          opacity: 1,
          filter: 'blur(0px)',
          stagger: 0.04,
          ease: 'sine.out',
          scrollTrigger: { trigger: '#manifesto-text', start: 'top 78%', end: 'center 55%', scrub: 1 }
        });
        gsap.to('#manifesto-sig', {
          opacity: 1,
          scrollTrigger: { trigger: '#manifesto-sig', start: 'top 85%', toggleActions: 'play none none reverse' }
        });
      } else {
        document.querySelectorAll('#manifesto-text .word').forEach((word) => {
          word.style.opacity = 1;
          word.style.filter = 'none';
        });
        document.getElementById('manifesto-sig').style.opacity = 1;
      }
    });
  }

  function initializeRitualReveal(prefersReducedMotion) {
    document.querySelectorAll('.ritual-step').forEach((step, index) => {
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
  }

  function initializePreviewReveal(prefersReducedMotion) {
    document.querySelectorAll('.product-card').forEach((card, index) => {
      if (prefersReducedMotion) {
        card.classList.add('is-in');
        return;
      }
      ScrollTrigger.create({
        trigger: card,
        start: 'top 85%',
        onEnter: () => gsap.delayedCall(index * 0.12, () => card.classList.add('is-in')),
        onLeaveBack: () => card.classList.remove('is-in'),
      });
    });
  }

  function initializeHorizontalFormula(prefersReducedMotion) {
    const pinViewport = document.getElementById('pin-viewport');
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
      pinScrollWidth = Math.max(0, pinTrack.scrollWidth - window.innerWidth);
      pinViewport.style.height = (window.innerHeight + pinScrollWidth) + 'px';
    }

    function updatePin() {
      if (window.innerWidth < 1024 || pinScrollWidth === 0) return;
      const top = pinViewport.getBoundingClientRect().top;
      if (top <= 0 && top >= -pinScrollWidth) {
        const progress = (-top) / pinScrollWidth;
        pinTrack.style.transform = `translate3d(${-progress * pinScrollWidth}px, 0, 0)`;
        pinBar.style.width = (progress * 100) + '%';
        const velocity = window.scrollY - lastY;
        lastY = window.scrollY;
        if (!prefersReducedMotion) {
          const skew = Math.max(-8, Math.min(8, velocity * 0.4));
          pinTrack.querySelectorAll('.formula-card').forEach((card) => { card.style.transform = `skewX(${skew}deg)`; });
          clearTimeout(skewTimeout);
          skewTimeout = setTimeout(() => pinTrack.querySelectorAll('.formula-card').forEach((card) => { card.style.transform = 'skewX(0deg)'; }), 200);
        }
      } else if (top > 0) {
        pinTrack.style.transform = 'translate3d(0, 0, 0)';
        pinBar.style.width = '0%';
      } else {
        pinTrack.style.transform = `translate3d(${-pinScrollWidth}px, 0, 0)`;
        pinBar.style.width = '100%';
      }
    }

    recalcPin();
    window.addEventListener('resize', () => { recalcPin(); ScrollTrigger.refresh(); });
    window.addEventListener('scroll', updatePin, { passive: true });
    updatePin();
  }

  function initializeWaitlistForm() {
    const form = document.getElementById('waitlist-form');
    const email = document.getElementById('waitlist-email');
    const success = document.getElementById('waitlist-success');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!email.value || !email.checkValidity()) return;
      success.classList.add('is-shown');
      email.value = '';
      setTimeout(() => success.classList.remove('is-shown'), 5000);
    });
  }

  function initializeSectionAnimations(prefersReducedMotion) {
    if (prefersReducedMotion) return;
    const animations = [
      ['.feature-col', '.features-grid'],
      ['.ritual-head > *', '.ritual-head'],
      ['.testimonial blockquote > *', '.testimonial'],
      ['.newsletter-grid > *', '.newsletter'],
      ['.formula-head > *', '.formula-head'],
      ['.features-head > *', '.features-head'],
      ['.products-head > *', '.products-head']
    ];
    animations.forEach(([target, trigger]) => {
      gsap.from(target, {
        opacity: 0,
        y: 30,
        duration: 1,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: { trigger, start: 'top 75%' }
      });
    });
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
