(() => {
  let brands = [];

  const grid = document.getElementById('brandGrid');
  const searchInput = document.getElementById('brandSearch');
  const suggestions = document.getElementById('searchSuggestions');

  if (!grid || !searchInput || !suggestions) return;

  // Load brands dynamically for search suggestions and filtering
  fetch('/api/brands.json')
    .then(res => res.json())
    .then(data => {
      brands = data.map(b => ({
        ...b,
        url: `brands/${b.id}.html`
      }));
      
      // Render all brands dynamically on load
      renderGrid(brands);
      
      // Auto-filter based on URL query parameter e.g. ?q=coffee
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');
        if (query) {
          searchInput.value = query;
          filterGrid(query.toLowerCase());
        }
      } catch(e) {
        console.error('Error checking query parameters:', e);
      }
    });

  // Dynamically set user local time on receipt based on their exact timezone/locale
  const receiptTime = document.getElementById('receipt-time');
  if (receiptTime) {
    try {
      const now = new Date();
      // Using undefined fallback lets the browser auto-detect the user's current country/locale settings
      const userLocale = navigator.language || undefined;
      const formattedTime = now.toLocaleTimeString(userLocale, { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      });
      receiptTime.textContent = formattedTime;
    } catch (e) {
      console.error('Error formatting receipt local time:', e);
    }
  }

  // Render brand cards
  function renderGrid(items) {
    grid.innerHTML = items.map(brand => {
      const logoSrc = brand.logo_path || `brands/images/${brand.id}.png`;
      return `
      <a class="brand-card" href="${brand.url}" style="background: ${brand.bg};">
        <span class="brand-icon" style="background: none; overflow: visible; display: flex; align-items: center; justify-content: center; border-radius: 50%;">
          <img src="${logoSrc}" alt="${brand.name} logo" style="width: 100%; height: 100%; object-fit: contain; border-radius: 50%; display: block;" onerror="if(this.src.includes('.png')){this.src=this.src.replace('.png','.svg');}else{this.style.display='none';this.parentElement.innerHTML='<span style=\\'font-size:28px;font-weight:800;color:var(--ink)\\'>${brand.name[0]}</span>';}">
        </span>
        <div>
          <small>${brand.category}</small>
          <h3>${brand.name}</h3>
          <p>${brand.desc}</p>
        </div>
        <b>→</b>
      </a>
    `}).join('');
  }

  // Filter grid cards visibility
  function filterGrid(query) {
    const cards = grid.querySelectorAll('.brand-card');
    let visibleCount = 0;

    brands.forEach((brand, index) => {
      const card = cards[index];
      if (!card) return;
      const match = brand.name.toLowerCase().includes(query) || 
                    brand.category.toLowerCase().includes(query) || 
                    brand.desc.toLowerCase().includes(query);
      if (match) {
        card.style.display = 'grid';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    let noResults = document.getElementById('noResults');
    if (visibleCount === 0) {
      if (!noResults) {
        noResults = document.createElement('div');
        noResults.id = 'noResults';
        noResults.className = 'no-results';
        noResults.innerHTML = `<h3>No brands found</h3><p>Try searching for another restaurant or café.</p>`;
        grid.parentNode.insertBefore(noResults, grid.nextSibling);
      }
    } else {
      if (noResults) noResults.remove();
    }
  }

  // Initial render is triggered by the fetch callback above

  // Suggestions rendering
  function updateSuggestions(val) {
    const query = val.toLowerCase().trim();
    let filtered = [];
    let headerText = "";

    if (query === "") {
      // Show popular searches (first 4 brands)
      filtered = brands.slice(0, 4);
      headerText = "POPULAR BRANDS";
    } else {
      filtered = brands.filter(b => 
        b.name.toLowerCase().includes(query) || 
        b.category.toLowerCase().includes(query)
      );
      headerText = "SUGGESTIONS";
    }

    if (filtered.length === 0) {
      suggestions.innerHTML = "";
      suggestions.hidden = true;
      return;
    }

    suggestions.innerHTML = `
      <div class="suggestion-header">${headerText}</div>
      ${filtered.map(brand => {
        const logoSrc = brand.logo_path || `brands/images/${brand.id}.png`;
        return `
        <button class="suggestion-item" type="button" data-name="${brand.name}" data-url="${brand.url}">
          <img src="${logoSrc}" alt="${brand.name}" onerror="if(this.src.includes('.png')){this.src=this.src.replace('.png','.svg');}else{this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22><circle cx=%2212%22 cy=%2212%22 r=%2210%22 fill=%22%23eee%22/><text x=%2212%22 y=%2216%22 font-size=%2212%22 font-weight=%22bold%22 text-anchor=%22middle%22 fill=%22%23666%22>${brand.name[0]}</text></svg>';}">
          <span>${brand.name}</span>
          <small>${brand.category}</small>
        </button>
      `}).join('')}
    `;
  }

  // Use event delegation for clicking suggestions to guarantee it works even after DOM updates
  suggestions.addEventListener('click', (e) => {
    const btn = e.target.closest('.suggestion-item');
    if (btn) {
      e.preventDefault();
      const url = btn.dataset.url;
      if (url) {
        window.location.href = url;
      }
    }
  });

  // Focus & typing events
  searchInput.addEventListener('focus', () => {
    updateSuggestions(searchInput.value);
  });

  searchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    updateSuggestions(val);
    filterGrid(val.toLowerCase());
  });

  // Keyboard navigation inside suggestions list
  searchInput.addEventListener('keydown', (e) => {
    const items = suggestions.querySelectorAll('.suggestion-item');
    if (items.length === 0 || suggestions.hidden) return;

    let activeIndex = -1;
    items.forEach((item, idx) => {
      if (item === document.activeElement) activeIndex = idx;
    });

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = (activeIndex + 1) % items.length;
      items[nextIdx].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = (activeIndex - 1 + items.length) % items.length;
      items[prevIdx].focus();
    } else if (e.key === 'Escape') {
      suggestions.hidden = true;
      searchInput.blur();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex !== -1) {
        items[activeIndex].click(); // Triggers the suggestion click logic (navigation)
      } else {
        // If they press enter without selecting, check if there is exactly 1 match or navigate to first
        const firstMatch = items[0];
        if (firstMatch) {
          firstMatch.click();
        } else {
          suggestions.hidden = true;
          searchInput.blur();
        }
      }
    }
  });

  // Hide suggestions when clicking outside
  function closeSearch(e) {
    if (!searchInput.contains(e.target) && !suggestions.contains(e.target)) {
      suggestions.hidden = true;
      searchInput.blur();
    }
  }
  document.addEventListener('mousedown', closeSearch);
  document.addEventListener('touchstart', closeSearch, { passive: true });
})();