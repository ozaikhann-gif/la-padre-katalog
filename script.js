const backButton = document.querySelector('.back-button');
const pageNav = document.querySelector('.page-nav');
const prevButton = document.querySelector('.prev-button');
const nextButton = document.querySelector('.next-button');
const site = document.querySelector('.site');

const activePages = window.LAPADRE_PAGES || [1];
const pageLabels = window.LAPADRE_PAGE_LABELS || {};
const hotspots = window.LAPADRE_HOTSPOTS || {};

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

const pagePairs = {
  '#sayfa4': { next: '#sayfa5' },
  '#sayfa5': { prev: '#sayfa4' },
  '#sayfa7': { next: '#sayfa8' },
  '#sayfa8': { prev: '#sayfa7' },
  '#sayfa12': { next: '#sayfa13' },
  '#sayfa13': { prev: '#sayfa12' }
};

function esc(text) {
  return String(text || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[m]));
}

function createSite() {
  site.innerHTML = '';

  activePages.forEach(page => {
    const section = document.createElement('section');
    section.id = `sayfa${page}`;
    section.className = 'screen';

    const img = document.createElement('img');
    img.src = `images/${page}.png`;
    img.alt = pageLabels[String(page)] || `Sayfa ${page}`;
    img.className = 'page-image';
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

function showPageFromHash() {
  const hash = window.location.hash || '#sayfa1';
  const target = document.querySelector(hash);

  document.querySelectorAll('.screen').forEach(section => {
    section.classList.remove('active');
  });

  const active = target && target.classList.contains('screen') ? target : document.querySelector('#sayfa1');
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

  const pair = pagePairs[activeHash];
  if (pair && (pair.prev || pair.next)) {
    pageNav.classList.add('show');

    if (pair.prev) {
      prevButton.href = pair.prev;
      prevButton.style.display = 'inline-block';
    } else {
      prevButton.style.display = 'none';
    }

    if (pair.next) {
      nextButton.href = pair.next;
      nextButton.style.display = 'inline-block';
    } else {
      nextButton.style.display = 'none';
    }
  } else {
    pageNav.classList.remove('show');
  }

  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', showPageFromHash);
window.addEventListener('DOMContentLoaded', () => {
  createSite();
  showPageFromHash();
});
