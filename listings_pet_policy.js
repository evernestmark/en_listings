async function initMarketDropdown() {
    const res = await fetch('https://rently.purpletree-c228d976.eastus.azurecontainerapps.io/enweb/location');
    const allProps = await res.json();
    const marketSelect = document.getElementById('market-select-back');
    const markets = Array.from(new Set(allProps.map(p => p.market_id))).sort();
    marketSelect.innerHTML = '<option value="">All Markets</option>' +
      markets.map(m => `<option value="${m.toLowerCase()}">${m}</option>`).join('');
    // Set the dropdown value based on current URL parameter 'market'
    const params = new URLSearchParams(window.location.search);
    const currentMarket = params.get('market');
    if (currentMarket) {
      marketSelect.value = currentMarket.toLowerCase();
    }
  }
  initMarketDropdown();
  document.getElementById('apply-market').addEventListener('click', () => {
    const params = new URLSearchParams(window.location.search);
    const selectedMarket = document.getElementById('market-select-back').value;
    if (selectedMarket) {
      params.set('market', selectedMarket);
    } else {
      params.delete('market');
    }
    // preserve 'state' parameter if present
    const stateParam = new URLSearchParams(window.location.search).get('state');
    if (stateParam) {
      params.set('state', stateParam);
    }
    const queryString = params.toString();
    const url = '/bay-area-homes-for-rent/listings' + (queryString ? `?${queryString}` : '');
    window.location.href = url;
  });
</script>
<script>
  // Append current window.location.search to each dropdown-content a href to preserve parameters
  (function() {
    const currentSearch = window.location.search;
    document.querySelectorAll('.dropdown-content a').forEach(a => {
      const href = a.getAttribute('href');
      if (href) {
        const url = new URL(href, window.location.origin);
        // Append current search parameters preserving existing ones in href
        const hrefParams = new URLSearchParams(url.search);
        const currentParams = new URLSearchParams(currentSearch);
        // Merge currentParams into hrefParams, overwriting duplicates
        for (const [key, value] of currentParams.entries()) {
          hrefParams.set(key, value);
        }
        url.search = hrefParams.toString();
        a.setAttribute('href', url.pathname + (url.search ? '?' + url.search : ''));
      }
    });
  })();
</script>
<script>
  // highlight the active How to Apply menu item based on current filename
  (function() {
    const currentFile = window.location.pathname.split('/').pop();
    document.querySelectorAll('.dropdown-content a').forEach(a => {
      const hrefFile = a.getAttribute('href').split('/').pop();
      if (hrefFile === currentFile) {
        a.classList.add('active');
      }
    });
  })();
</script>
<script>
// Back button
document.getElementById('button_back').addEventListener('click', function() {
	history.back();
});