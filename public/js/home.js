document.addEventListener('DOMContentLoaded', () => {
  const revealItems = document.querySelectorAll('[data-reveal]');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!revealItems.length || prefersReducedMotion || !('IntersectionObserver' in window)) {
    return;
  }

  document.body.classList.add('motion-ready');
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -24px 0px' });

  revealItems.forEach((item) => observer.observe(item));
});
