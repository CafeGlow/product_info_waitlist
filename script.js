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
    // If the image fails to load (e.g. file not yet supplied), hide the broken-image
    // icon and mark the parent so CSS can show a richer "image arriving" placeholder.
    image.addEventListener('error', () => {
      image.style.display = 'none';
      const frame = image.closest('.hero-frame, .card-img, .product-img');
      if (frame) frame.classList.add('is-empty');
    }, { once: true });
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
    const renderItems = () => items.map((item) => `<span class="marquee-item">${escapeHtml(item)}</span>`).join('');

    // Keep the repeated copies in equal-width groups so the animation can loop
    // at the exact point where the second copy reaches the viewport.
    marquee.innerHTML =
      `<div class="marquee-group">${renderItems()}</div>` +
      `<div class="marquee-group" aria-hidden="true">${renderItems()}</div>`;
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
      `<div class="card-img"><img src="${escapeHtml(ingredient.imageUrl)}" alt="${escapeHtml(ingredient.imageAlt)}" onerror="this.style.display='none';this.parentElement.classList.add('is-empty')"></div>` +
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
      `<div class="product-img"><span class="product-tag">${escapeHtml(card.tag)}</span><img src="${escapeHtml(card.imageUrl)}" alt="${escapeHtml(card.imageAlt)}" onerror="this.style.display='none';this.parentElement.classList.add('is-empty')"></div>` +
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
        document.body.style.overflow = '';
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
      const isOpen = navBurger.classList.toggle('is-open');
      mobileMenu.classList.toggle('is-open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
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
    if (!dot || !ring) return;

    let mouseX = -100;
    let mouseY = -100;
    let ringX = mouseX;
    let ringY = mouseY;
    let isVisible = false;
    let activeHoverTarget = null;

    function setVisible(visible) {
      isVisible = visible;
      dot.classList.toggle('is-visible', visible);
      ring.classList.toggle('is-visible', visible);
      dot.classList.toggle('is-hidden', !visible);
      ring.classList.toggle('is-hidden', !visible);
    }

    function setHoverTarget(target) {
      if (target === activeHoverTarget) return;
      activeHoverTarget = target;
      dot.classList.toggle('is-hover', Boolean(target));
      ring.classList.toggle('is-hover', Boolean(target));
    }

    function updateContrast(event) {
      const target = event.target instanceof Element ? event.target : null;
      const isInverted = Boolean(target && target.closest('.newsletter, footer, .mobile-menu.is-open'));
      dot.classList.toggle('is-inverted', isInverted);
      ring.classList.toggle('is-inverted', isInverted);
    }

    document.addEventListener('pointermove', (event) => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      mouseX = event.clientX;
      mouseY = event.clientY;
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      if (!isVisible) setVisible(true);
      updateContrast(event);
    }, { passive: true });

    function tick() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    }
    tick();

    document.addEventListener('pointerover', (event) => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      const target = event.target instanceof Element
        ? event.target.closest('[data-hover], a, button, input, textarea, select, label')
        : null;
      setHoverTarget(target);
    }, { passive: true });

    document.addEventListener('pointerout', (event) => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      const nextTarget = event.relatedTarget instanceof Element
        ? event.relatedTarget.closest('[data-hover], a, button, input, textarea, select, label')
        : null;
      setHoverTarget(nextTarget);
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      setHoverTarget(null);
      setVisible(false);
    });
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
    const pinStage = document.getElementById('pin-stage');
    const pinTrack = document.getElementById('pin-track');
    const pinBar = document.getElementById('pin-bar');
    if (!pinViewport || !pinStage || !pinTrack || !pinBar) return;

    function getScrollDistance() {
      return Math.max(0, pinTrack.scrollWidth - pinStage.clientWidth);
    }

    if (prefersReducedMotion) {
      pinStage.style.height = 'auto';
      pinStage.style.overflowX = 'auto';
      pinBar.style.width = '100%';
      return;
    }

    const mm = gsap.matchMedia();
    mm.add('(min-width: 1025px)', () => {
      const tween = gsap.to(pinTrack, {
        x: () => -getScrollDistance(),
        ease: 'none',
        scrollTrigger: {
          trigger: pinViewport,
          start: 'top top',
          end: () => `+=${getScrollDistance()}`,
          scrub: 0.7,
          pin: pinStage,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            pinBar.style.width = `${Math.round(self.progress * 100)}%`;
          },
        },
      });

      gsap.from('.formula-card', {
        opacity: 0,
        y: 40,
        duration: 0.8,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.formula',
          start: 'top 65%',
          once: true,
        },
      });

      ScrollTrigger.refresh();
      return () => {
        tween.scrollTrigger.kill();
        tween.kill();
        gsap.set(pinTrack, { clearProps: 'transform' });
        pinBar.style.width = '0%';
      };
    });

    mm.add('(max-width: 1024px)', () => {
      gsap.set(pinTrack, { clearProps: 'transform' });
      pinBar.style.width = '0%';
      return () => gsap.set(pinTrack, { clearProps: 'transform' });
    });

    window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  }

  function initializeWaitlistForm() {
    const form = document.getElementById('waitlist-form');
    const email = document.getElementById('waitlist-email');
    const consent = document.getElementById('waitlist-consent');
    const success = document.getElementById('waitlist-success');
    const note = document.getElementById('waitlist-note');
    const button = form.querySelector('button[type="submit"]');
    const originalButtonHTML = button.innerHTML;

    // Read attribution params from URL on load (e.g. ?utm_source=instagram, ?ref=... )
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('utm_source') || urlParams.get('ref') || urlParams.get('source') || null;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const emailValue = email.value.trim();
      if (!emailValue || !email.checkValidity()) {
        email.focus();
        return;
      }

      if (!consent.checked) {
        note.textContent = 'Please agree to the privacy policy to continue.';
        note.style.color = 'var(--gold)';
        setTimeout(() => {
          note.textContent = '';
          note.style.color = '';
        }, 4000);
        consent.focus();
        return;
      }

      // Disable form while submitting
      button.disabled = true;
      button.textContent = 'Sending…';

      try {
        const payload = { email: emailValue };
        if (source) payload.source = source;

        const response = await fetch('/api/waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
          success.textContent = data.message || 'You are on the list. We will write when the first pour is ready.';
          success.classList.add('is-shown');
          email.value = '';
          consent.checked = false;
          setTimeout(() => success.classList.remove('is-shown'), 6000);
        } else if (response.status === 409) {
          // Duplicate — friendly message
          success.textContent = data.detail || 'You are already on the waitlist!';
          success.classList.add('is-shown');
          setTimeout(() => success.classList.remove('is-shown'), 6000);
        } else {
          // Server error
          note.textContent = data.detail || 'Something went wrong. Please try again.';
          note.style.color = 'var(--espresso)';
          setTimeout(() => {
            note.textContent = '';
            note.style.color = '';
          }, 5000);
        }
      } catch (error) {
        note.textContent = 'Unable to reach the server. Please try again later.';
        note.style.color = 'var(--espresso)';
        setTimeout(() => {
          note.textContent = '';
          note.style.color = '';
        }, 5000);
      } finally {
        button.disabled = false;
        button.innerHTML = originalButtonHTML;
      }
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
