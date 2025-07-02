// ==========================
// Initialize Market Dropdown
// ==========================
async function initMarketDropdown() {
  try {
    const res = await fetch('https://rently.purpletree-c228d976.eastus.azurecontainerapps.io/enweb/location');
    const allProps = await res.json();
    const marketSelect = document.getElementById('market-select-back');
    const markets = Array.from(new Set(allProps.map(p => p.market_id))).sort();

    marketSelect.innerHTML = '<option value="">All Markets</option>' +
      markets.map(m => `<option value="${m.toLowerCase()}">${m}</option>`).join('');

    // Set dropdown based on URL param
    const urlParams = new URLSearchParams(window.location.search);
    const marketParam = urlParams.get('market');
    marketSelect.value = marketParam || '';
  } catch (error) {
    console.error('Error loading market dropdown:', error);
  }
}

initMarketDropdown();

// ===========================
// Apply Market Button Click
// ===========================
document.getElementById('apply-market')?.addEventListener('click', () => {
  const selectedMarket = document.getElementById('market-select-back').value;
  const url = 'index.html' + (selectedMarket ? `?market=${selectedMarket}` : '');
  window.location.href = url;
});

// ==========================================
// On DOMContentLoaded Run the Following:
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

  // =============================
  // Handle Dropdown Link Updates
  // =============================
  const urlParams = new URLSearchParams(window.location.search);
  const marketParam = urlParams.get('market') || '';
  const stateParam = urlParams.get('state') || document.getElementById('state-select')?.value || '';

  document.querySelectorAll('.info-dropdown .dropdown-content a').forEach(link => {
    const hrefBase = link.getAttribute('href').split('?')[0];
    const params = new URLSearchParams();

    if (stateParam) params.set('state', stateParam);
    if (marketParam) params.set('market', marketParam);

    const newHref = hrefBase + (params.toString() ? '?' + params.toString() : '');
    link.setAttribute('href', newHref);

    // Highlight active page
    if (window.location.pathname.endsWith(hrefBase)) {
      link.classList.add('active');
    }
  });

  // ===================================
  // State Selector and Content Display
  // ===================================
  const select = document.getElementById('state-select');
  const contents = document.querySelectorAll('.state-content');

  if (select) {
    const stateMap = {
      'oregon': 'OR',
      'colorado': 'CO',
      'california': 'CA',
      'washington': 'WA',
      'multi-family': 'Multi-family'
    };

    const stateParamURL = urlParams.get('state');
    if (stateParamURL) {
      const key = stateParamURL.toLowerCase();
      const mapped = stateMap[key] || stateParamURL.toUpperCase();
      const valid = Array.from(select.options).some(o => o.value === mapped);
      select.value = valid ? mapped : 'General';
    }

    function showState() {
      const value = select.value;
      contents.forEach(div => {
        div.classList.toggle('active', div.dataset.state === value);
      });

      const text = select.options[select.selectedIndex].text;
      document.getElementById('page-title').textContent = `Rental Qualifications - ${text}`;
    }

    select.addEventListener('change', showState);
    showState();
  }
});

// ====================
// Back Button Function
// ====================
document.getElementById('button_back')?.addEventListener('click', function() {
  history.back();
});
