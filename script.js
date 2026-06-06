const backButton = document.querySelector('.back-button');
const site = document.querySelector('.site');

const activePages = window.LAPADRE_PAGES || [1];
const pageLabels = window.LAPADRE_PAGE_LABELS || {};
const hotspots = window.LAPADRE_HOTSPOTS || {};
const crops = window.LAPADRE_CROPS || {};

const backTargets = {
  '#sayfa2': '#sayfa1',
  '#sayfa3': '#sayfa1',

  '#sayfa4': '#sayfa2',
  '#sayfa5': '#sayfa2',
  '#sayfa6': '#sayfa2',
  '#sayfa7': '#sayfa2',
  '#sayfa8': '#sayfa2',
  '#sayfa10': '#sayfa2',
  '#sayfa16': '#sayfa2',

  '#sayfa12': '#sayfa3',
  '#sayfa13': '#sayfa3',
  '#sayfa15': '#sayfa3'
};

function createSite() {
  site.innerHTML = '';

  activePages.forEach(page => {
    const section = document.createElement('section');
    section.id = `sayfa${page}`;
    section.className = 'screen';
    section.dataset.page = String(page);

    const img = document.createElement('img');

    /*
      LAZY LOADING MANTIĞI:
      Görseli hemen src ile yüklemiyoruz.
      Önce data-src içinde bekletiyoruz.
      Sayfa aktif olunca gerçek src veriliyor.
    */
    img.dataset.src = `images/${page}.png`;
    img.alt = pageLabels[String(page)] || `Sayfa ${page}`;
    img.className = 'page-image';
    img.loading = 'lazy';
    img.decoding = 'async';

    img.addEventListener('load', () => applyCrop(section, img, page));

    section.appendChild(img);

    const pageHotspots = hotspots[String(page)] || [];
    pageHotspots.forEach(h => {
      const a = document.createElement('a');
      a.href = h.href || '#sayfa1';
      a.className = 'hotspot';
      a.style.left = `${h.left}%`;
      a.style.top = `${h.top}%`;
      a.style.width = `${h.width}%`;
      a.style.height = `${h.height}%`;
      a.setAttribute('aria-label', h.label || 'Hotspot');
      section.appendChild(a);
    });

    site.appendChild(section);
  });
}

function ensureImageLoaded(section) {
  const img = section.querySelector('.page-image');
  if (!img) return;

  if (!img.getAttribute('src')) {
    img.setAttribute('src', img.dataset.src);
  }
}

function preloadLinkedImages(section) {
  /*
    Kullanıcının basabileceği hedef sayfaları hafifçe önceden hazırlar.
    Bütün siteyi değil, sadece mevcut sayfadaki linklerin hedeflerini.
  */
  const links = section.querySelectorAll('.hotspot[href^="#sayfa"]');

  links.forEach(link => {
    const targetSelector = link.getAttribute('href');
    const target = document.querySelector(targetSelector);
    if (!target) return;

    const img = target.querySelector('.page-image');
    if (!img || img.getAttribute('src')) return;

    const pre = new Image();
    pre.src = img.dataset.src;
  });
}

function applyCrop(section, img, page) {
  const cropBottomPercent = Number(crops[String(page)] || 0);

  if (!cropBottomPercent) {
    section.style.height = '';
    return;
  }

  const renderedHeight = img.getBoundingClientRect().height;
  section.style.height = `${renderedHeight * (1 - cropBottomPercent / 100)}px`;
}

function applyAllCrops() {
  document.querySelectorAll('.screen.active').forEach(section => {
    const page = section.dataset.page;
    const img = section.querySelector('.page-image');

    if (img && img.getAttribute('src')) {
      applyCrop(section, img, page);
    }
  });
}

function showPageFromHash() {
  const hash = window.location.hash || '#sayfa1';
  const target = document.querySelector(hash);

  document.querySelectorAll('.screen').forEach(section => {
    section.classList.remove('active');
  });

  const active = target && target.classList.contains('screen')
    ? target
    : document.querySelector('#sayfa1');

  ensureImageLoaded(active);
  active?.classList.add('active');

  const activeHash = '#' + active.id;
  const backTarget = backTargets[activeHash];

  if (backTarget) {
    backButton.href = backTarget;
    backButton.classList.add('show');

    if (backTarget === '#sayfa1') {
      backButton.textContent = '← Ana Sayfa';
    } else {
      backButton.textContent = '← Kategorilere Dön';
    }
  } else {
    backButton.classList.remove('show');
  }

  applyAllCrops();

  /*
    iPhone için yük bindirmemek adına 300 ms sonra
    sadece yakındaki muhtemel hedefleri önden hazırlar.
  */
  setTimeout(() => preloadLinkedImages(active), 300);

  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', showPageFromHash);
window.addEventListener('resize', applyAllCrops);

window.addEventListener('DOMContentLoaded', () => {
  createSite();
  showPageFromHash();
});
