const backButton = document.querySelector('.back-button');
const site = document.querySelector('.site');

const activePages = window.LAPADRE_PAGES || [1];
const pageLabels = window.LAPADRE_PAGE_LABELS || {};
const hotspots = window.LAPADRE_HOTSPOTS || {};
const crops = window.LAPADRE_CROPS || {};

const loadedPages = new Set();

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

/*
  HIZLI LAZY LOADING MANTIĞI:
  - İlk sayfa hemen yüklenir.
  - Sayfa açıldıktan kısa süre sonra 2 ve 3. sayfalar arkadan hazırlanır.
  - Bir butona dokununca hedef sayfanın görseli hemen yüklenmeye başlar.
  - Hedef sayfaya geçerken "yükleniyor" ekranı göstermez; bekleme hissini azaltır.
  - Görsel bir kez yüklendiyse tekrar yüklenmez.
*/

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
    img.loading = page === 1 ? 'eager' : 'lazy';

    if (page === 1 && 'fetchPriority' in img) {
      img.fetchPriority = 'high';
    }

    img.addEventListener('load', () => {
      loadedPages.add(String(page));
      applyCrop(section, img, page);
    });

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

      // Kullanıcı dokunur dokunmaz hedef görseli başlat.
      a.addEventListener('pointerdown', () => {
        warmTarget(a.getAttribute('href'));
      }, { passive: true });

      // Masaüstünde mouse üstüne gelince de hazırla.
      a.addEventListener('mouseenter', () => {
        warmTarget(a.getAttribute('href'));
      }, { passive: true });

      section.appendChild(a);
    });

    site.appendChild(section);
  });
}

function getSectionFromHash(hash) {
  if (!hash || !hash.startsWith('#sayfa')) return null;
  return document.querySelector(hash);
}

function loadImageForSection(section, priority = 'normal') {
  if (!section) return;

  const page = section.dataset.page;
  const img = section.querySelector('.page-image');
  if (!img) return;

  if (img.getAttribute('src')) return;

  if (priority === 'high' && 'fetchPriority' in img) {
    img.fetchPriority = 'high';
  }

  img.setAttribute('src', img.dataset.src);
}

function warmTarget(hash) {
  const target = getSectionFromHash(hash);
  if (!target) return;
  loadImageForSection(target, 'high');
}

function preloadPage(pageNumber) {
  const section = document.querySelector(`#sayfa${pageNumber}`);
  if (!section) return;
  loadImageForSection(section, 'normal');
}

function preloadLikelyPages() {
  // Ana girişten sonra en muhtemel hedefler: erkek ve kadın kategori.
  preloadPage(2);
  preloadPage(3);
}

function preloadCurrentLinks(section) {
  // Aktif sayfadaki tıklanabilir hedefleri arka planda hazırla.
  // Bütün siteyi değil, sadece mevcut sayfanın olası hedeflerini.
  const links = section.querySelectorAll('.hotspot[href^="#sayfa"]');

  links.forEach(link => {
    const href = link.getAttribute('href');
    const target = getSectionFromHash(href);
    if (target) loadImageForSection(target, 'normal');
  });
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

function showPageFromHash() {
  const hash = window.location.hash || '#sayfa1';
  const target = getSectionFromHash(hash);
  const active = target && target.classList.contains('screen')
    ? target
    : document.querySelector('#sayfa1');

  loadImageForSection(active, active.id === 'sayfa1' ? 'high' : 'normal');

  document.querySelectorAll('.screen').forEach(section => {
    section.classList.remove('active');
  });

  active.classList.add('active');

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

  // Sayfa geçtikten sonra bu sayfadaki olası hedefleri hazırla.
  setTimeout(() => preloadCurrentLinks(active), 500);

  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', showPageFromHash);
window.addEventListener('resize', applyActiveCrop);

window.addEventListener('DOMContentLoaded', () => {
  createSite();
  showPageFromHash();

  // İlk açılıştan biraz sonra kategori sayfalarını hazırla.
  setTimeout(preloadLikelyPages, 700);
});
