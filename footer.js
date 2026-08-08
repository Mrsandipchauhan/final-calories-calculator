(() => {
  const host = document.querySelector('[data-site-footer]');
  if (!host) return;

  const base = location.pathname.includes('/brands/') ? '..' : '.';
  host.className = 'site-footer';
  host.innerHTML = `
    <div class="footer-glow" aria-hidden="true"></div>
    <div class="footer-wrap">
      <section class="footer-lead">
        <a class="footer-logo" href="/" aria-label="NutriRoute home"><span>n</span>nutri<em>route</em></a>
        <h2>Feel good about<br><i>every order.</i></h2>
        <p>A simple way to understand restaurant nutrition before you order.</p>
        <a class="footer-cta" href="/#brands">Explore calculators <b>-></b></a>
      </section>
      <nav class="footer-links" aria-label="Footer navigation">
        <div>
          <small>TOP BRANDS</small>
          <a href="/brands/starbucks">Starbucks</a>
          <a href="/brands/subway">Subway</a>
          <a href="/brands/mcdonalds">McDonald's</a>
          <a href="/brands/chipotle">Chipotle</a>
          <a href="/brands/tacobell">Taco Bell</a>
          <a href="/brands/dunkin">Dunkin'</a>
          <a href="/brands/chickfila">Chick-fil-A</a>
          <a href="/brands/panera">Panera Bread</a>
        </div>
        <div>
          <small>POPULAR CATEGORIES</small>
          <a href="/index.html?q=coffee">Coffee &amp; Café</a>
          <a href="/index.html?q=sandwich">Sandwiches &amp; Subs</a>
          <a href="/index.html?q=burger">Burgers &amp; Fast Food</a>
          <a href="/index.html?q=mexican">Mexican Grill</a>
        </div>
        <div>
          <small>RESOURCES &amp; LEGAL</small>
          <a href="/blog">Nutrition Blog</a>
          <a href="/about.html">About Us</a>
          <a href="/contact.html">Contact</a>
          <a href="/editorial-policy.html">Editorial Policy</a>
          <a href="/methodology.html">Methodology</a>
          <a href="/privacy.html">Privacy Policy</a>
          <a href="/terms.html">Terms of Service</a>
          <a href="/disclaimer.html">Disclaimer</a>
          <a href="/accessibility.html">Accessibility</a>
        </div>
      </nav>
      <div class="footer-note"><span class="footer-dot"></span><p>Made for mindful meals, not perfect ones.</p></div>
    </div>
    <div class="footer-base"><span>© 2026 NutriRoute. All rights reserved.</span><span>Independent nutrition estimates. Not affiliated with restaurant brands.</span></div>`;

  // Global Search Modal Logic
  
  const searchModalHTML = `
    <div id="globalSearchModal" class="global-search-modal" hidden>
      <div class="search-modal-backdrop"></div>
      <div class="search-modal-content">
        <div class="search-modal-header">
          <input type="text" id="globalSearchInput" placeholder="What are you craving?" autocomplete="off">
          <button id="closeSearchModal" aria-label="Close">✕</button>
        </div>
        <div class="search-modal-results">
          <div class="search-group">
            <small>CALCULATORS</small>
            <div class="search-grid" id="globalSearchGrid">
              <!-- Dynamically loaded -->
            </div>
          </div>
          <div class="search-group list-group">
            <small>EXPLORE</small>
            <a href="${base}/blog.html" class="search-list-item" data-name="blog read" data-category="explore">
              <b>Read our latest nutrition blogs</b>
              <span>↗</span>
            </a>
            <a href="${base}/index.html#faq" class="search-list-item" data-name="faq questions" data-category="explore">
              <b>Nutrition FAQs</b>
              <span>↗</span>
            </a>
          </div>
        </div>
      </div>
    </div>
    <style>
      .header-search-bar {
        position: relative;
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        background: #f4f3ed;
        border: 2px solid var(--ink);
        border-radius: 99px;
        padding: 4px 4px 4px 18px;
        width: 380px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.02);
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 10;
      }
      .header-search-bar:focus-within {
        background: #ffffff;
        border-color: var(--orange);
        box-shadow: 0 8px 30px rgba(255, 132, 87, 0.12);
      }
      .header-search-input {
        flex: 1;
        min-width: 0;
        border: none;
        background: transparent;
        padding: 0;
        margin-right: 8px;
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--ink);
        outline: none;
        font-family: inherit;
      }
      .header-search-input::placeholder {
        color: #8c928a;
        font-weight: 500;
      }
      
      .search-category-dropdown {
        position: relative;
        display: flex;
        align-items: center;
        padding-right: 14px;
        border-right: 1px solid rgba(27, 33, 29, 0.12);
        margin-right: 14px;
      }
      .search-category-btn {
        background: transparent;
        border: none;
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--ink);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 0;
        font-family: inherit;
      }
      .search-category-menu {
        position: absolute;
        top: calc(100% + 14px);
        right: 0;
        background: #fffef9;
        border: 1px solid var(--line);
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(27, 33, 29, 0.1);
        z-index: 200;
        min-width: 160px;
        padding: 8px 0;
        display: flex;
        flex-direction: column;
      }
      .search-category-menu[hidden] {
        display: none !important;
      }
      .search-category-menu button {
        background: transparent;
        border: none;
        text-align: left;
        padding: 10px 20px;
        font-size: 0.85rem;
        color: var(--ink);
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
        font-family: inherit;
      }
      .search-category-menu button:hover {
        background: var(--lime);
        color: var(--ink);
      }
      
      .header-search-submit {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: none;
        background: var(--orange);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 0 4px 10px rgba(255, 132, 87, 0.25);
      }
      .header-search-submit:hover {
        transform: scale(1.06);
        background: #f26f41;
        box-shadow: 0 6px 14px rgba(255, 132, 87, 0.35);
      }
      .header-search-submit svg {
        display: block;
      }
      
      .global-search-modal {
        position: fixed; inset: 0; z-index: 9999;
        display: flex; justify-content: center; align-items: flex-start;
        padding-top: 12vh;
      }
      .global-search-modal[hidden] {
        display: none !important;
      }
      .search-modal-backdrop {
        position: absolute; inset: 0;
        background: rgba(245, 240, 231, 0.85);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
      }
      .search-modal-content {
        position: relative;
        background: #fffef9;
        width: 90%; max-width: 680px;
        border-radius: 32px;
        border: 1px solid var(--line);
        box-shadow: 0 40px 80px rgba(27, 33, 29, 0.08), 0 10px 20px rgba(27, 33, 29, 0.04);
        overflow: hidden;
        display: flex; flex-direction: column;
        animation: slideDownFade 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes slideDownFade {
        from { opacity: 0; transform: translateY(-30px) scale(0.97); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .search-modal-header {
        padding: 35px 40px 25px;
        border-bottom: 1px dashed var(--line);
        display: flex; align-items: center; gap: 20px;
      }
      .search-modal-header input {
        flex: 1; border: none; background: transparent;
        font: italic 40px 'Playfair Display', serif;
        color: var(--ink); outline: none; letter-spacing: -1px;
      }
      .search-modal-header input::placeholder {
        color: #d8dbd3;
      }
      .search-modal-header button {
        background: #f4f5f2; width: 44px; height: 44px; flex-shrink: 0;
        border-radius: 50%; border: none; font-size: 18px; color: var(--ink);
        cursor: pointer; transition: 0.2s; display: grid; place-items: center;
      }
      .search-modal-header button:hover {
        background: var(--lime); transform: rotate(90deg);
      }
      .search-modal-results {
        padding: 35px 40px 45px;
        max-height: 65vh; overflow-y: auto;
      }
      .search-modal-results::-webkit-scrollbar {
        width: 8px;
      }
      .search-modal-results::-webkit-scrollbar-thumb {
        background: var(--line); border-radius: 10px;
      }
      .search-group small {
        display: block; font: 700 11px 'DM Mono', monospace;
        color: var(--muted); letter-spacing: 1.5px; margin-bottom: 20px;
      }
      .search-grid {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 45px;
      }
      .search-brand-card {
        display: flex; align-items: center; gap: 14px;
        padding: 12px 16px; border-radius: 20px; text-decoration: none;
        background: rgba(255, 255, 255, 0.5); border: 1px solid var(--line);
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .search-brand-card:hover {
        background: #fff; border-color: var(--ink);
        box-shadow: 0 10px 25px rgba(0,0,0,0.06);
        transform: translateY(-3px);
      }
      .search-brand-card .brand-icon {
        width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
        display: grid; place-items: center; font: 700 22px Georgia, serif;
      }
      .search-brand-card span {
        font: 700 15px 'Manrope', sans-serif; color: var(--ink);
      }
      
      .search-brand-card.starbucks .brand-icon { background: #247644; color: white; }
      .search-brand-card.qdoba .brand-icon { background: #000; color: #a4cc55; }
      .search-brand-card.mcd .brand-icon { background: #d8241d; color: #ffd431; }
      .search-brand-card.chipotle .brand-icon { background: #451400; color: #fff; }
      .search-brand-card.tacobell .brand-icon { background: #702082; color: #fff; }
      .search-brand-card.subway .brand-icon { background: #15947c; color: #ffeb43; }
      .search-brand-card.chickfila .brand-icon { background: #e51636; color: #fff; }
      .search-brand-card.dunkin .brand-icon { background: #ff671f; color: #e11383; }
      .search-brand-card.panera .brand-icon { background: #44693d; color: #f1ebd9; }
      
      .list-group .search-list-item {
        display: flex; justify-content: space-between; align-items: center;
        padding: 20px 24px; background: transparent; border-radius: 20px;
        border: 1px solid var(--line);
        text-decoration: none; color: var(--ink); margin-bottom: 12px;
        transition: all 0.2s;
      }
      .list-group .search-list-item:hover {
        background: var(--lime); border-color: var(--lime);
      }
      .list-group .search-list-item b {
        font-size: 16px; font-weight: 700;
      }
      .list-group .search-list-item span {
        font: 500 20px 'DM Mono'; opacity: 0.5;
      }
      .list-group .search-list-item:hover span { opacity: 1; }
      
      @media(max-width: 960px) {
        .header-search-bar { width: 280px; }
        .search-category-dropdown { display: none; }
      }
      @media(max-width: 700px) {
        .nav { height: auto !important; padding: 16px 0; flex-wrap: wrap; }
        .header-search-bar { width: 100%; margin: 12px 0 0; order: 3; }
        
        .global-search-modal {
          padding-top: 5vh;
        }
        .search-modal-content {
          border-radius: 24px;
        }
        .search-modal-header {
          padding: 20px 24px 15px;
        }
        .search-modal-header button {
          margin-right: 12px;
        }
        .search-modal-header input {
          font-size: 24px !important;
        }
        .search-modal-results {
          padding: 20px 24px 30px;
        }
        .search-grid {
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 10px;
        }
        .search-brand-card {
          padding: 10px 12px;
          gap: 8px;
        }
        .search-brand-card .brand-icon {
          width: 32px;
          height: 32px;
          font-size: 16px;
        }
        .search-brand-card span {
          font-size: 13px;
        }
      }
    </style>
  `;

  document.body.insertAdjacentHTML('beforeend', searchModalHTML);

  // Inject header search bar dynamically
  const header = document.querySelector('header.nav');
  if (header && !header.querySelector('.header-search-bar')) {
    const logo = header.querySelector('.logo');
    if (logo) {
      logo.insertAdjacentHTML('afterend', `
        <div class="header-search-bar">
          <input type="text" class="header-search-input" placeholder="What are you looking for?" aria-label="Search brands">
          <div class="search-category-dropdown">
            <button class="search-category-btn" type="button">
              <span>Brands</span>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-left: 2px; display: inline-block; vertical-align: middle;"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <div class="search-category-menu" hidden>
              <button type="button" data-cat="all">All Brands</button>
              <button type="button" data-cat="coffee">Coffee</button>
              <button type="button" data-cat="sandwiches">Sandwiches</button>
              <button type="button" data-cat="fastfood">Fast Food</button>
            </div>
          </div>
          <button class="header-search-submit" aria-label="Submit search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
        </div>
      `);
    }
  }
  // --- lightweight anti-copy deterrents (reversible) ---
  try {
    document.addEventListener('contextmenu', function (e) { e.preventDefault(); }, { passive: false });
    document.addEventListener('dragstart', function (e) { if (e.target && e.target.tagName === 'IMG') e.preventDefault(); }, true);
    document.addEventListener('keydown', function (e) {
      // Block common shortcuts: F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) || (e.ctrlKey && e.key === 'u') || (e.ctrlKey && e.key === 's')) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  } catch (err) {
    // non-critical
    console.warn('Anti-copy script failed', err);
  }

  const modal = document.getElementById('globalSearchModal');
  const closeBtn = document.getElementById('closeSearchModal');
  const input = document.getElementById('globalSearchInput');
  const backdrop = modal.querySelector('.search-modal-backdrop');
  
  const headerSearchBar = document.querySelector('.header-search-bar');
  const headerSearchInput = document.querySelector('.header-search-input');
  
  let currentCategory = 'all';

  if (headerSearchInput) {
    headerSearchInput.addEventListener('focus', () => {
      openModal();
    });
    headerSearchInput.addEventListener('input', (e) => {
      input.value = e.target.value;
      input.dispatchEvent(new Event('input'));
    });
  }
  
  if (headerSearchBar) {
    headerSearchBar.addEventListener('click', (e) => {
      // Don't open search modal if user clicked category dropdown
      if (e.target.closest('.search-category-dropdown')) return;
      openModal();
    });

    // Category Selector Dropdown Logic
    const categoryBtn = headerSearchBar.querySelector('.search-category-btn');
    const categoryMenu = headerSearchBar.querySelector('.search-category-menu');
    
    if (categoryBtn && categoryMenu) {
      categoryBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        categoryMenu.hidden = !categoryMenu.hidden;
      });

      categoryMenu.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (btn) {
          e.stopPropagation();
          const cat = btn.dataset.cat;
          const label = btn.textContent;
          categoryBtn.querySelector('span').textContent = label;
          currentCategory = cat;
          categoryMenu.hidden = true;
          
          // Apply category filter to search results if open
          filterSearchResults();
          
          // Focus search input and open modal
          openModal();
        }
      });

      // Close category menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!categoryBtn.contains(e.target) && !categoryMenu.contains(e.target)) {
          categoryMenu.hidden = true;
        }
      });
    }
  }

  function openModal() {
    modal.hidden = false;
    setTimeout(() => input.focus(), 50);
    filterSearchResults();
  }
  
  function closeModal() {
    modal.hidden = true;
  }
  
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openModal();
    }
  });

  function filterSearchResults() {
    const term = input.value.toLowerCase();
    const links = modal.querySelectorAll('.search-group a');
    links.forEach(link => {
      const matchTerm = (link.dataset.name || link.textContent).toLowerCase().includes(term);
      const matchCat = currentCategory === 'all' || link.dataset.category === currentCategory || link.dataset.category === 'explore';
      if (matchTerm && matchCat) {
        link.style.display = 'flex';
      } else {
        link.style.display = 'none';
      }
    });
  }

  // Load search modal brands dynamically from API
  const searchGrid = document.getElementById('globalSearchGrid');
  if (searchGrid) {
    fetch(`${base}/api/brands.json`)
      .then(res => res.json())
      .then(data => {
        searchGrid.innerHTML = data.map(brand => {
          let letter = brand.name[0];
          let customClass = brand.id;
          let category = 'fastfood';
          if (brand.category.toLowerCase().includes('coffee')) category = 'coffee';
          if (brand.category.toLowerCase().includes('sandwich') || brand.category.toLowerCase().includes('subs')) category = 'sandwiches';

          // Use the relative path for logos
          const brandLogo = `${base}/${brand.logo_path || 'brands/images/' + brand.id + '.png'}`;

          return `
            <a href="${base}/brands/${brand.id}.html" class="search-brand-card ${customClass}" data-name="${brand.name.toLowerCase()}" data-category="${category}">
              <div class="brand-icon" style="background: none; overflow: hidden; display: flex; align-items: center; justify-content: center; border-radius: 50%;">
                <img src="${brandLogo}" alt="${brand.name} logo" style="width: 100%; height: 100%; object-fit: contain; border-radius: 50%; display: block;" onerror="this.style.display='none';this.parentElement.innerHTML='<span style=\'font-size:22px;font-weight:800;color:var(--ink)\'>${letter}</span>';">
              </div>
              <span>${brand.name}</span>
            </a>
          `;
        }).join('');
        
        // Re-run filtering after load
        filterSearchResults();
      });
  }

  // Basic client side filtering for the modal links
  input.addEventListener('input', filterSearchResults);

  // Mobile Menu Logic
  const menuBtn = document.querySelector('.menu');
  const navContainer = document.querySelector('.nav nav');
  if (menuBtn && navContainer) {
    menuBtn.addEventListener('click', () => {
      const header = document.querySelector('header.nav');
      const isOpen = navContainer.classList.toggle('mobile-open');
      if (header) {
        header.classList.toggle('mobile-nav-open', isOpen);
      }
      menuBtn.innerHTML = isOpen ? '✕' : '☰';
    });
  }

})();