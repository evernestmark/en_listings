// =========================
// Initialize Market Dropdown
// =========================
async function initMarketDropdown() {
  try {
    const res = await fetch('https://rently.purpletree-c228d976.eastus.azurecontainerapps.io/enweb/location');
    const allProps = await res.json();
    const marketSelect = document.getElementById('market-select-back');
    const markets = Array.from(new Set(allProps.map(p => p.market_id))).sort();

    marketSelect.innerHTML = '<option value="">All Markets</option>' +
      markets.map(m => `<option value="${m.toLowerCase()}">${m}</option>`).join('');

    // Set dropdown based on current URL parameter 'market'
    const params = new URLSearchParams(window.location.search);
    const currentMarket = params.get('market');
    if (currentMarket) {
      marketSelect.value = currentMarket.toLowerCase();
    }
  } catch (error) {
    console.error('Error fetching market data:', error);
  }
}

initMarketDropdown();

// Apply market filter button click
document.getElementById('apply-market')?.addEventListener('click', () => {
  const params = new URLSearchParams(window.location.search);
  const selectedMarket = document.getElementById('market-select-back').value;

  if (selectedMarket) {
    params.set('market', selectedMarket);
  } else {
    params.delete('market');
  }

  // Preserve 'state' parameter if present
  const stateParam = new URLSearchParams(window.location.search).get('state');
  if (stateParam) {
    params.set('state', stateParam);
  }

  const queryString = params.toString();
  const url = '/bay-area-homes-for-rent/listings' + (queryString ? `?${queryString}` : '');
  window.location.href = url;
});

// ================================================
// Append current search params to dropdown links
// ================================================
(function appendSearchParamsToLinks() {
  const currentSearch = window.location.search;
  document.querySelectorAll('.dropdown-content a').forEach(a => {
    const href = a.getAttribute('href');
    if (href) {
      const url = new URL(href, window.location.origin);
      const hrefParams = new URLSearchParams(url.search);
      const currentParams = new URLSearchParams(currentSearch);

      for (const [key, value] of currentParams.entries()) {
        hrefParams.set(key, value);
      }

      url.search = hrefParams.toString();
      a.setAttribute('href', url.pathname + (url.search ? '?' + url.search : ''));
    }
  });
})();

// =======================================================
// Highlight active "How to Apply" menu item based on URL
// =======================================================
(function highlightActiveMenu() {
  const currentFile = window.location.pathname.split('/').pop();
  document.querySelectorAll('.dropdown-content a').forEach(a => {
    const hrefFile = a.getAttribute('href').split('/').pop();
    if (hrefFile === currentFile) {
      a.classList.add('active');
    }
  });
})();

// ====================
// Back Button Function
// ====================
document.getElementById('button_back')?.addEventListener('click', function() {
  history.back();
});
