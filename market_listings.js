// Read market= param
const urlParams = new URLSearchParams(window.location.search);
const marketFilter = urlParams.get('market')?.toLowerCase();

mapboxgl.accessToken = 'pk.eyJ1Ijoic3JvYmVza3ktZXZlcm5lc3QiLCJhIjoiY204aHNlb3loMDNyYTJtb2d3MGs3d25oMSJ9.lUlpnvq3X1UciyTPie6X_Q';
let map, allProps = [], filtered = [], page = 1, perPage = 6;
const stateMap = { OR: 'Oregon', CO: 'Colorado', CA: 'California', WA: 'Washington' };

async function fetchProps() {
    // switch to your live endpoint:
    const res = await fetch('https://rently.purpletree-c228d976.eastus.azurecontainerapps.io/enweb/location');
    allProps = await res.json();

    // rent slider & title
    const rents = allProps.map(p => p.rent).filter(r => typeof r === 'number');
    const minRent = Math.min(...rents), maxRent = Math.max(...rents);
    document.getElementById('price-min').min = minRent;
    document.getElementById('price-min').max = maxRent;
    document.getElementById('price-display').textContent = `$${minRent} - $${maxRent}+`;

    let label;
    if (marketFilter) {
        // Get deduplicated marketIds with original casing
        const marketIds = Array.from(new Set(allProps.map(p => p.market_id)));
        // Find the original-cased market ID that matches the filter case-insensitively
        const matched = marketIds.find(m => m && m.toLowerCase() === marketFilter);
        label = matched || marketFilter;
    } else {
        label = 'All Markets';
    }
    document.getElementById('page-title').textContent = `${label} Properties`;

    initFilters();
    applyFilters();

    // populate market dropdown
    const marketSelect = document.getElementById('market-select');
    const marketIds = Array.from(new Set(allProps.map(p => p.market_id))).sort();
    marketSelect.innerHTML =
        '<option value="">All Markets</option>' +
        marketIds.map(m => {
            const v = m.toLowerCase();
            return `<option value="${v}"${marketFilter === v ? ' selected' : ''}>${m}</option>`;
        }).join('');
    marketSelect.addEventListener('change', () => {
        const sel = marketSelect.value;
        const u = new URL(window.location);
        if (sel) u.searchParams.set('market', sel);
        else u.searchParams.delete('market');
        window.location.href = u;
    });
}

// toggle filters
document.getElementById('open-filters-btn').addEventListener('click', e => {
    e.stopPropagation();
    document.getElementById('filters-menu').classList.toggle('open');
});
document.body.addEventListener('click', () => {
    document.getElementById('filters-menu').classList.remove('open');
});
document.getElementById('filters-menu').addEventListener('click', e => e.stopPropagation());

function initFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            let grp = btn.closest('.filter-group');
            grp.querySelectorAll('.filter-btn').forEach(x => x.classList.remove('active'));
            btn.classList.add('active');
            applyFilters();
        });
    });
    document.getElementById('price-min').addEventListener('input', e => {
        const m = +e.target.value;
        document.getElementById('price-display').textContent = `$${m} - ${e.target.max}+`;
        applyFilters();
    });
    document.getElementById('reset-filters').addEventListener('click', e => {
        e.preventDefault();
        ['filter-bedrooms', 'filter-bathrooms', 'filter-pets', 'filter-availability']
            .forEach(id => {
                const grp = document.getElementById(id);
                grp.querySelectorAll('.filter-btn')
                    .forEach(x => x.classList.remove('active'));
                grp.querySelector('.filter-btn').classList.add('active');
            });
        // reset rent
        document.getElementById('price-min').value = document.getElementById('price-min').min;
        document.getElementById('price-display').textContent =
            `$${document.getElementById('price-min').min} - ${document.getElementById('price-min').max}+`;
        applyFilters();
        document.getElementById('filters-menu').classList.remove('open');
    });
}

function getVal(id) {
    return document.querySelector(`#${id} .filter-btn.active`).dataset.value;
}
function getBanner(p) {
    const act = p.active === true || p.active === 'true';
    const pre = p.prelease === true || p.prelease === 'true';
    if (act && pre) return 'Coming Soon';
    if (act && !pre) return 'Available';
    return '';
}
function match(p) {
    // market filter
    if (marketFilter && p.market_id.toLowerCase() !== marketFilter) return false;
    const bnr = getBanner(p); if (!bnr) return false;
    const bfRaw = getVal('filter-bedrooms');
    if (bfRaw === 'studio') {
        if (p.bedrooms !== 0) return false;
    } else {
        const bf = +bfRaw;
        if (bf && p.bedrooms < bf) return false;
    }
    const baf = +getVal('filter-bathrooms'); if (baf && p.bathrooms < baf) return false;
    const min = +document.getElementById('price-min').value; if (p.rent < min) return false;
    const pf = getVal('filter-pets');
    if (pf) {
        const has = p.pets.toLowerCase() === 'yes';
        const types = Array.isArray(p.petTypes) ? p.petTypes : (p.petTypes ? [p.petTypes] : []);
        const dogs = has && types.some(t => t.toLowerCase().includes('dog'));
        const cats = has && types.some(t => t.toLowerCase().includes('cat'));
        if (pf === 'dogs' && !dogs) return false;
        if (pf === 'cats' && !cats) return false;
        if (pf === 'both' && !(dogs && cats)) return false;
        if (pf === 'none' && has) return false;
    }
    const af = getVal('filter-availability');
    if (af && af !== bnr) return false;
    return true;
}

function applyFilters() {
    page = 1;
    filtered = allProps.filter(match);
    // sorting
    const sort = document.getElementById('sort-select').value;
    filtered.sort((a, b) => {
        if (sort === 'price-low') return a.rent - b.rent;
        if (sort === 'price-high') return b.rent - a.rent;
        if (sort === 'bedrooms') return b.bedrooms - a.bedrooms;
        if (sort === 'bathrooms') return b.bathrooms - a.bathrooms;
        if (sort === 'size') return b.size - a.size;
        if (sort === 'newest') {
            // skip if no date_created field
            return 0;
        }
        return 0;
    });
    // Update "How to Apply" link based on currently displayed listings
    const rentalLink = document.getElementById('rental-link');
    if (rentalLink) {
        const states = Array.from(new Set(filtered.map(p => p.state)));
        const unitCount = filtered.filter(p => /\b(apt|unit|#)\b/i.test(p.address)).length;
        const regularCount = filtered.length - unitCount;
        let stateName = 'General';
        // if exactly one state and it has its own qualifications, use it
        if (states.length === 1 && stateMap.hasOwnProperty(states[0])) {
            stateName = stateMap[states[0]];
        } else if (unitCount > regularCount) {
            // fallback to multi-family only when no single special state qualifies
            stateName = 'Multi-family';
        }
        const url = new URL(rentalLink.href, window.location.origin);
        url.searchParams.set('state', stateName);
        if (marketFilter) {
            url.searchParams.set('market', marketFilter);
        } else {
            url.searchParams.delete('market');
        }
        rentalLink.href = url.pathname + url.search;
    }
    render();
}

function render() {
    document.getElementById('total-results').textContent =
        `${filtered.length} properties found`;

    if (!map) {
        map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [-122.6765, 45.5231],
            zoom: 10
        });
        map.scrollZoom.disable();
        map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
        map.addControl(new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true
        }), 'top-right');
        map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    }

    // clear
    document.getElementById('listings').innerHTML = '';
    document.getElementById('pagination').innerHTML = '';
    document.querySelectorAll('.mapboxgl-marker').forEach(m => m.remove());

    const bounds = new mapboxgl.LngLatBounds();
    const start = (page - 1) * perPage;
    const pageItems = filtered.slice(start, start + perPage);
    const popup = new mapboxgl.Popup({ offset: 15, closeButton: false });
    const markerMap = {};

    pageItems.forEach(p => {
        const bnr = getBanner(p);
        if (!bnr) return;

        // listing card
        const pets = p.pets === 'Yes'
            ? (Array.isArray(p.petTypes) ? p.petTypes : [p.petTypes]).map(t => t + ' OK').join(', ')
            : 'No Pets';

        const card = document.createElement('div');
        card.className = 'listing';
        card.innerHTML = [
            '<div style="position:relative">',
            `<img src="${(p.images?.length > 0 ? p.images[0] : 'img/placeholder.png')}" alt="">`,
            `<div class="availability-banner" style="background:${bnr === 'Coming Soon' ? '#6300FF' : '#1BDBEA'}">`,
            `${bnr}`,
            '</div>',
            '</div>',
            '<div class="address-line">',
            '<div class="text-size-medium text-weight-bold">' + p.address1 + '</div>',
            `<div class="text-size-small">${p.city}, ${p.state} ${p.zip}</div>`,
            '</div>',
            '<div class="listing-details">',
            '<div class="details-left">',
            '<div>',
            `<strong>${p.bedrooms === 0 ? 'Studio' : p.bedrooms + ' bed'}</strong>`,
            `<strong>${p.bathrooms} bath</strong>`,
            '</div>',
            '<div>',
            `<strong>${p.size} sqft</strong>`,
            `<strong>${pets}</strong>`,
            '</div>',
            '</div>',
            `<div class="rent">$${p.rent}/mo</div>`,
            '</div>'
        ].join('');

        card.onclick = () => location.href = `/location-homes-for-rent/listings-detail?id=${p.tag}`;
        card.addEventListener('mouseenter', () => {
            const info = markerMap[p.tag];
            if (info) {
                map.jumpTo({ center: info.lngLat, zoom: 13 });
                popup.setLngLat(info.lngLat).setHTML([
                    '<a href="/location-homes-for-rent/listings-detail?id=' + p.tag + '" style="display:block; text-decoration:none; color:inherit;">',
                    '<div style="font-family: \'Arvo\', serif; font-size: 0.9rem; background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); padding: 12px; width: 260px;">',
                    `<img src="${info.image}" style="width:100%; height:140px; object-fit:cover; border-radius:4px;" />`,
                    '<div style="margin-top:8px;">',
                    '<strong style="display:block; font-size:1rem; margin-bottom:4px;">' + info.address + '</strong>',
                    '<span style="font-weight:bold;">$' + info.rent + '/mo</span>',
                    '&nbsp;|&nbsp; <a href="/location-homes-for-rent/listings-detail?id=' + p.tag + '" style="color:#1ADCEA; text-decoration:underline;">View</a>',
                    '</div>',
                    '</div>',
                    '</a>'
                ].join('')).addTo(map);
            }
        });
        card.addEventListener('mouseleave', () => {
            map.fitBounds(bounds, { padding: 40, maxZoom: 14 });
        });
        document.getElementById('listings').appendChild(card);

        // geocode & marker
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(p.city + ', ' + p.state + ' ' + p.zip)}.json?access_token=${mapboxgl.accessToken}`)
            .then(r => r.json())
            .then(js => {
                const c = js.features?.[0]?.center;
                if (!c) return;
                markerMap[p.tag] = {
                    lngLat: c,
                    image: (p.images?.length > 0 ? p.images[0] : 'img/placeholder.png'),
                    address: p.address1,
                    rent: p.rent
                };
                bounds.extend(c);

                const popupHTML = [
                    '<a href="/location-homes-for-rent/listings-detail?id=' + p.tag + '" style="display:block; text-decoration:none; color:inherit;">',
                    '<div style="font-family: \'Arvo\', serif; font-size: 0.9rem; background: #fff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); padding: 12px; width: 260px;">',
                    `<img src="${(p.images?.[0] || 'img/placeholder.png')}" style="width:100%; height:140px; object-fit:cover; border-radius:4px;" />`,
                    '<div style="margin-top:8px;">',
                    '<strong style="display:block; font-size:1rem; margin-bottom:4px;">' + p.address1 + '</strong>',
                    '<span style="font-weight:bold;">$' + p.rent + '/mo</span>',
                    '&nbsp;|&nbsp; <a href="/location-homes-for-rent/listings-detail?id=' + p.tag + '" style="color:#1ADCEA; text-decoration:underline;">View</a>',
                    '</div>',
                    '</div>',
                    '</a>'
                ].join('');

                const popupInstance = new mapboxgl.Popup({ offset: 15, closeButton: false })
                    .setHTML(popupHTML);

                const el = document.createElement('div');
                el.innerHTML = '<div style="background:#1ADCEA;color:#fff;border-radius:4px;padding:4px;font-size:0.8rem;font-family:\'Arvo\',serif;cursor:pointer;">$' + p.rent + '</div>';
                const marker = new mapboxgl.Marker(el)
                    .setLngLat(c)
                    .setPopup(popupInstance)
                    .addTo(map);

                el.addEventListener('click', () => {
                    if (map.getZoom() < 13) {
                        map.flyTo({ center: c, zoom: 14 });
                        map.once('moveend', () => popupInstance.addTo(map));
                    } else {
                        popupInstance.addTo(map);
                    }
                });

                map.fitBounds(bounds, { padding: 40, maxZoom: 14 });
            });
    });

    // Enhanced pagination
    document.getElementById('pagination').innerHTML = '';
    const totalPages = Math.ceil(filtered.length / perPage);

    if (totalPages > 1) {
        const pagination = document.getElementById('pagination');
        
        // Previous button
        if (page > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.innerHTML = '&lt;';
            prevBtn.onclick = () => { page--; render(); };
            pagination.appendChild(prevBtn);
        }

        // Always show first page
        if (page > 3 && totalPages > 5) {
            const firstBtn = document.createElement('button');
            firstBtn.textContent = '1';
            firstBtn.onclick = () => { page = 1; render(); };
            pagination.appendChild(firstBtn);
            
            if (page > 4 && totalPages > 6) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                pagination.appendChild(ellipsis);
            }
        }

        // Calculate range of pages to show
        let startPage = Math.max(1, page - 2);
        let endPage = Math.min(totalPages, page + 2);
        
        if (page <= 3) {
            endPage = Math.min(5, totalPages);
        } else if (page >= totalPages - 2) {
            startPage = Math.max(totalPages - 4, 1);
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            if (i === page) btn.classList.add('active');
            btn.onclick = () => { page = i; render(); };
            pagination.appendChild(btn);
        }

        // Show last page with ellipsis if needed
        if (endPage < totalPages - 1) {
            if (endPage < totalPages - 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                pagination.appendChild(ellipsis);
            }
            
            const lastBtn = document.createElement('button');
            lastBtn.textContent = totalPages;
            lastBtn.onclick = () => { page = totalPages; render(); };
            pagination.appendChild(lastBtn);
        }

        // Next button
        if (page < totalPages) {
            const nextBtn = document.createElement('button');
            nextBtn.innerHTML = '&gt;';
            nextBtn.onclick = () => { page++; render(); };
            pagination.appendChild(nextBtn);
        }
    }
}

fetchProps();
document.getElementById('sort-select').addEventListener('change', applyFilters);