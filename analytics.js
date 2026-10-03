(() => {
  'use strict';
  const id = 'G-8L860EXKPC';
  const key = 'mp-analytics-consent-v1';
  const lifetime = 180 * 86400000;
  let consent = null, loaded = false, activeSeconds = 0, articleSent = false;
  const depths = new Set();
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && Date.now() - saved.time < lifetime) consent = saved.choice;
  } catch (_) { /* Storage may be unavailable; ask on this visit. */ }
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window['ga-disable-' + id] = consent !== 'granted';
  gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  function start() {
    window['ga-disable-' + id] = false;
    gtag('consent', 'update', { analytics_storage: 'granted' });
    if (loaded) return;
    loaded = true;
    gtag('js', new Date());
    gtag('config', id, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: location.origin + location.pathname,
      page_referrer: document.referrer ? document.referrer.split(/[?#]/)[0] : ''
    });
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(tag);
  }
  function event(name, params) {
    if (consent === 'granted') gtag('event', name, params);
  }
  function removeCookies() {
    const domains = [location.hostname, '.' + location.hostname];
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      if (!/^_ga(?:_|$)/.test(name)) return;
      document.cookie = name + '=; Max-Age=0; path=/';
      domains.forEach(domain => { document.cookie = name + '=; Max-Age=0; path=/; domain=' + domain; });
    });
  }
  const panel = document.createElement('section');
  panel.className = 'analytics-choice';
  panel.setAttribute('aria-label', 'Analytics preferences');
  panel.innerHTML = '<div><strong>Help improve this site</strong><p>Allow Google Analytics to measure visits, reading engagement and link clicks? It uses analytics cookies. Your choice is optional, and you can change it anytime. <a href="/privacy/">Privacy details</a></p></div><div class="analytics-actions"><button type="button" data-choice="denied">Decline</button><button type="button" data-choice="granted">Allow analytics</button></div>';
  panel.hidden = consent !== null;
  document.body.appendChild(panel);
  const settings = document.createElement('button');
  settings.type = 'button';
  settings.className = 'analytics-settings';
  settings.textContent = 'Privacy settings';
  settings.addEventListener('click', () => { panel.hidden = false; panel.querySelector('button').focus(); });
  document.body.appendChild(settings);
  panel.addEventListener('click', e => {
    const button = e.target.closest('[data-choice]');
    if (!button) return;
    const previous = consent;
    consent = button.dataset.choice;
    try { localStorage.setItem(key, JSON.stringify({choice: consent, time: Date.now()})); } catch (_) {}
    panel.hidden = true;
    if (consent === 'granted') start();
    else {
      window['ga-disable-' + id] = true;
      removeCookies();
      // Reload after withdrawal to fully unload the tag rather than send denied-consent pings.
      if (loaded && previous === 'granted') location.reload();
    }
    settings.focus();
  });
  window.addEventListener('storage', e => { if (e.key === key) location.reload(); });
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link || consent !== 'granted') return;
    const url = new URL(link.href, location.href);
    const network = {'www.linkedin.com':'linkedin', 'linkedin.com':'linkedin', 'github.com':'github', 'medium.com':'medium'}[url.hostname];
    if (network) event('professional_link_click', { network, link_url: url.origin + url.pathname });
  });
  window.addEventListener('scroll', () => {
    if (consent !== 'granted') return;
    const range = document.documentElement.scrollHeight - innerHeight;
    if (range <= 0) return;
    const percent = Math.round(scrollY / range * 100);
    [25, 50, 75].forEach(depth => {
      if (percent >= depth && !depths.has(depth)) {
        depths.add(depth);
        event('scroll_depth', { percent_scrolled: depth });
      }
    });
  }, {passive: true});
  // Approximate engagement: one minute with the article visible and at least half of the page scrolled.
  if (/^\/blog\/[^/]+\/$/.test(location.pathname)) setInterval(() => {
    if (consent !== 'granted' || document.visibilityState !== 'visible') return;
    activeSeconds += 1;
    if (!articleSent && activeSeconds >= 60 && depths.has(50)) {
      articleSent = true;
      event('article_read', { article_slug: location.pathname.split('/')[2] });
    }
  }, 1000);
  if (consent === 'granted') start();
})();
