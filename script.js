const backButton = document.querySelector('.back-button');
const site = document.querySelector('.site');

const activePages = window.LAPADRE_PAGES || [1];
const pageLabels = window.LAPADRE_PAGE_LABELS || {};
const hotspots = window.LAPADRE_HOTSPOTS || {};
const crops = window.LAPADRE_CROPS || {};

const loadedPages = new Set();
const loadingPages = new Map();

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

function createLoader() {
  const loader = document.createElement('div');
  loader.className = 'site-loader';
  loader.textContent = 'Yükleniyor...';
  loader.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 99999;
    display: none;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.92);
    color: #111;
    font-family: Arial, sans-serif;
    font-size: 14px;
    font-weight: 600;
  `;
  document.body.appendChild(loader);
  return loader;
}

const loader = createLoader();

function showLoader() {
  loader.style.display = 'flex';
}

function hideLoader() {
  loader.style.display = 'none';
}

function createSite() {
  site.innerHTML = '';

  activePages.forEach(page => {
    const section = document.createElement('section');
    section.id = `sayfa${page}`;
    section.className = 'screen';
    section.dataset.page = String(page);

    const img = document.createElement('img');
    img.dataset.src = `images/${page}.png`;
    img.alt = pageLabels[String(page)] || `Sayfa ${page}`;
    img.className = 'page-image';
    img.decoding = 'async';
    img.loading = 'eager';

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

      // Dokunma anında hedefi sessizce başlatır.
      // Bu tıklama bekleme hissini azaltır ama bütün siteyi önceden yüklemez.
      a.addEventListener('pointerdown', () => {
        const targetHash = a.getAttribute('href');
        if (targetHash && targetHash.startsWith('#sayfa')) {
          const target = document.querySelector(targetHash);
          if (target) loadSectionImage(target, false);
        }
      }, { passive: true });

      section.appendChild(a);
    });

    site.appendChild(section);
  });
}

function loadSectionImage(section, showLoading = true) {
  if (!section) return Promise.resolve();

  const page = section.dataset.page;
  const img = section.querySelector('.page-image');
  if (!img) return Promise.resolve();

  if (loadedPages.has(page) || img.complete && img.getAttribute('src')) {
    return Promise.resolve();
  }

  if (loadingPages.has(page)) {
    return loadingPages.get(page);
  }

  if (showLoading) showLoader();

  const promise = new Promise(resolve => {
    img.onload = async () => {
      loadedPages.add(page);

      try {
        if (img.decode) await img.decode();
      } catch (e) {}

      applyCrop(section, img, page);
      if (showLoading) hideLoader();
      resolve();
    };

    img.onerror = () => {
      if (showLoading) hideLoader();
      resolve();
    };

    if (!img.getAttribute('src')) {
      // İlk sayfaya yüksek öncelik ver.
      if (page === '1' && 'fetchPriority' in img) {
        img.fetchPriority = 'high';
      }

      img.setAttribute('src', img.dataset.src);
    }
  });

  loadingPages.set(page, promise);
  return promise;
}

function applyCrop(section, img, page) {
  const cropBottomPercent = Number(crops[String(page)] || 0);

  if (!cropBottomPercent) {
    section.style.height = '';
    return;
  }

  const renderedHeight = img.getBoundingClientRect().height;
  if (renderedHeight > 0) {
    section.style.height = `${renderedHeight * (1 - cropBottomPercent / 100)}px`;
  }
}

function applyActiveCrop() {
  const section = document.querySelector('.screen.active');
  if (!section) return;

  const img = section.querySelector('.page-image');
  if (img && img.getAttribute('src')) {
    applyCrop(section, img, section.dataset.page);
  }
}

async function showPageFromHash() {
  const hash = window.location.hash || '#sayfa1';
  const target = document.querySelector(hash);
  const active = target && target.classList.contains('screen') ? target : document.querySelector('#sayfa1');

  await loadSectionImage(active, true);

  document.querySelectorAll('.screen').forEach(section => {
    section.classList.remove('active');
  });

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

  applyActiveCrop();
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', showPageFromHash);
window.addEventListener('resize', applyActiveCrop);

window.addEventListener('DOMContentLoaded', () => {
  createSite();
  showPageFromHash();
});
