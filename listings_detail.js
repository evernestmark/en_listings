 mapboxgl.accessToken = 'pk.eyJ1Ijoic3JvYmVza3ktZXZlcm5lc3QiLCJhIjoiY204aHNlb3loMDNyYTJtb2d3MGs3d25oMSJ9.lUlpnvq3X1UciyTPie6X_Q';    let allPhotos = [], currentPhotoIndex = 0, videoUrl;

  async function fetchPropertyDetails() {
    const id = new URLSearchParams(window.location.search).get("id");
    const res = await fetch("https://rently.purpletree-c228d976.eastus.azurecontainerapps.io/enweb/location");
    const list = await res.json();
    const property = list.find(p => String(p.tag) === id);
    if (!property) return document.body.innerHTML = "<h2>Property not found.</h2>";

    // Main image
    allPhotos = property.images || [];
    document.getElementById("hero-image").src = allPhotos[0] || "img/placeholder.png";
    document.getElementById("hero-image").onclick = () => openLightbox(0);

    // Availability banner
    const av = document.createElement("div");
    av.className = "availability-banner";
    av.textContent = property.prelease ? "Coming Soon" : "Available Now";
    av.style.backgroundColor = property.prelease ? "#6300FF" : "#1BDBEA";
    document.querySelector(".hero-wrapper").appendChild(av);

    // Special offer banner
    if (property.special_offer) {
      const so = document.createElement("div");
      so.className = "special-offer-banner";
      so.textContent = property.special_offer_description || "Special Offer";
      document.querySelector(".hero-wrapper").appendChild(so);
    }

    // Thumbnails + video
    const gallery = document.getElementById("gallery");
    let items = allPhotos.slice(1);
    if (property.video_url) {
      videoUrl = property.video_url;
      items.push({ video: true });
    }
    const moreCount = items.length - 4;
    items.slice(0,4).forEach((item, idx) => {
      const wrapper = document.createElement("div");
      wrapper.className = "thumbnail-wrapper";
      let el;
      if (item.video) {
        el = document.createElement("div");
        el.className = "video-thumbnail";
        const vidId = new URLSearchParams(videoUrl.split('?')[1]).get('v');
        el.innerHTML = `<img src="https://img.youtube.com/vi/${vidId}/hqdefault.jpg"><span class="play-icon">▶</span>`;
        el.onclick = () => openLightbox(allPhotos.length);
      } else {
        el = document.createElement("img");
        el.src = item;
        el.onclick = () => openLightbox(idx+1);
      }
      wrapper.appendChild(el);
      if (idx === 3 && moreCount > 0) {
        const ov = document.createElement("div");
        ov.className = "thumbnail-count-overlay";
        ov.textContent = "+"+moreCount;
        wrapper.appendChild(ov);
      }
      gallery.appendChild(wrapper);
    });

    // Populate details
    document.getElementById("property-title").textContent = property.heading;
    const rentLine = document.createElement("div");
    rentLine.textContent = `$${property.rent}/mo`;
    rentLine.style.fontSize = "1.3rem";
    rentLine.style.color = "#333";
    document.getElementById("property-title").appendChild(rentLine);
    document.getElementById("property-address").textContent = property.address;
    const bedsText = property.bedrooms === 0
    ? "Studio"
    : property.bedrooms + " Beds";
    document.getElementById("property-beds").textContent = bedsText;
    document.getElementById("property-baths").textContent = property.bathrooms||"—";
    document.getElementById("property-sqft").textContent = property.size||"—";
    let petsText = "No Pets";
    if (property.pets === "Yes") {
      const types = property["pet-types"] || "";
      petsText = types.split(',').map(t => t.trim() + " OK").join(', ');
    }
    document.getElementById("property-pets").textContent = petsText;
    // Render description with line breaks
    const desc = property.description || "";
    const descHtml = desc.split(/\r?\n/).map(line => `<p>${line}</p>`).join("");
    document.getElementById("property-description").innerHTML = descHtml;
    const amenElems = document.getElementById("property-amenities");
    amenElems.innerHTML = "";
    if (property.amenities && property.amenities.length) {
      property.amenities.forEach(amenity => {
        const li = document.createElement("li");
        li.textContent = amenity;
        amenElems.appendChild(li);
      });
    } else {
      document.getElementById("amenities-section").style.display = "none";
    }

    // Actions
    const scheduleBtn = document.getElementById("schedule-btn");
    if (property.prelease) {
      scheduleBtn.textContent = "Join Waitlist";
    } else {
      scheduleBtn.textContent = "Schedule Showing";
    }
    // Link both buttons to marketingLink from JSON
    scheduleBtn.href = property.marketingLink || "#";
    document.getElementById("apply-btn").href = property.application_url||"#";
    const vtBtn = document.getElementById("video-tour-btn");
    vtBtn.style.display = property.video_url?"inline-block":"none";
    vtBtn.href=property.video_url||"#";
    document.getElementById("directions-btn").href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.address)}`;

    // Populate call-to-action block
    const ctaContainer = document.getElementById('cta-section');
    if (property.prelease) {
      ctaContainer.innerHTML = `
          <div class="actions">
            <p class="heading-style-h3">Do you want to be notified when this home will be available for tours?</p></br>
              <a href="#" target="_blank" class="button is-secondary">Join the waitlist</a>
  </p>
  </div>`;
    } else {
      ctaContainer.innerHTML = `
          <div class="actions">
            <h2>Ready to Move In? Apply for this Home Today.</h2></br>
            <a href="${property.application_url || '#'}" target="_blank" class="button is-secondary">Apply Now</a>
  </div>`;
    }

    initMap(property.address);

    // Related Properties
    const related = list.filter(p =>
                                String(p.tag) !== String(property.tag) &&
                                p.zip === property.zip &&
                                Math.abs(p.rent - property.rent) <= 300
                               ).slice(0, 3);

    const relatedContainer = document.getElementById("related-listings");
    if (related.length) {
      related.forEach(p => {
        const div = document.createElement("div");
        div.style.width = "300px";
        div.style.border = "1px solid #ccc";
        div.style.borderRadius = "8px";
        div.style.overflow = "hidden";
        div.style.background = "#fff";
        div.style.cursor = "pointer";
        div.innerHTML = `
            <img src="${p.images?.[0] || 'img/placeholder.png'}" style="width:100%; height:180px; object-fit:cover;">
            <div style="padding: 10px;">
              <strong>${p.heading}</strong><br/>
              $${p.rent}/mo · ${p.bedrooms === 0 ? "Studio" : p.bedrooms + "bd"} · ${p.bathrooms}ba<br/>
              <small>${p.address1}</small>
  </div>
          `;
        div.onclick = () => location.href = "/location-homes-for-rent/listings-detail?id=" + p.tag;
        relatedContainer.appendChild(div);
      });
    } else {
      document.getElementById("related-properties").style.display = "none";
    }

    // Set Back to Listings button to this property's market filter
    const backBtn = document.getElementById('back-btn');
    backBtn.href = `/location-homes-for-rent/listings?market=${property.market_id.toLowerCase()}`;
    const rentalLink = document.getElementById('rental-quals-link');
    if (rentalLink) {
      rentalLink.href = `/location-homes-for-rent/rental-qualifications?state=${encodeURIComponent(property.state)}`;
    }

    // Make the map clickable to open Google Maps directions
    const mapEl = document.getElementById('map');
    mapEl.style.cursor = 'pointer';
    mapEl.addEventListener('click', () => {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.address)}`;
      window.open(url, '_blank');
    });
  }

  function initMap(addr) {
    const m = new mapboxgl.Map({container:"map",style:"mapbox://styles/mapbox/streets-v11",center:[-98.5795,39.8283],zoom:3});
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addr)}.json?access_token=${mapboxgl.accessToken}`)
      .then(r=>r.json()).then(d=>{
      const c=d.features[0]?.center; if(!c)return;
      m.setCenter(c); m.setZoom(14);
      new mapboxgl.Marker().setLngLat(c).addTo(m);
    });
  }

  function openLightbox(idx) {
    const total = allPhotos.length + (videoUrl?1:0);
    currentPhotoIndex=(idx+total)%total;
    const container=document.getElementById("lightbox-media");
    container.innerHTML="";
    if(currentPhotoIndex<allPhotos.length) {
      const img=document.createElement("img"); img.src=allPhotos[currentPhotoIndex]; container.appendChild(img);
    } else {
      const iframe=document.createElement("iframe");
      iframe.src = videoUrl.replace("watch?v=", "embed/");
      iframe.width = "640";
      iframe.height = "480";
      iframe.allow = "accelerometer; autoplay; encrypted-media; picture-in-picture";
      iframe.allowFullscreen = true;
      container.appendChild(iframe);
    }
    document.getElementById("lightbox-modal").classList.add("show");
  }
  function closeLightbox(){document.getElementById("lightbox-modal").classList.remove("show");}
  const prev=()=>openLightbox(currentPhotoIndex-1), next=()=>openLightbox(currentPhotoIndex+1);

  fetchPropertyDetails();

  // Keyboard navigation for lightbox
  document.addEventListener('keydown', function(e) {
    const modal = document.getElementById('lightbox-modal');
    if (!modal.classList.contains('show')) return;
    if (e.key === 'ArrowLeft') { prev(); }
    if (e.key === 'ArrowRight') { next(); }
    if (e.key === 'Escape') { closeLightbox(); }
  });