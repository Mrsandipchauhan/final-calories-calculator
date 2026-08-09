let config = { items: [], sizes: [], options: [] };
let selected = null, size = 0, option = 0;
let orderCart = []; // Shopping cart state
let activeFilter = 'all';
let activeCategory = 'all';
let activeDiet = 'none';

const $ = s => document.querySelector(s);

function loadConfig() {
  let brandId = document.body.dataset.brand;
  if (!brandId) {
    const match = window.location.pathname.match(/\/brands\/([^/.]+)(?:\.html)?/);
    if (match) brandId = match[1];
  }
  if (!brandId) return;

  fetch(`/api/brands/${brandId}/items.json`)
    .then(res => res.json())
    .then(data => {
      config = data;

      // Dynamically populate brand details in DOM
      if (config.brand) {
        const h1 = document.querySelector('h1');
        if (h1 && (h1.textContent.includes('Restaurant Calories') || h1.textContent.trim() === '')) {
          h1.innerHTML = `${config.brand.name} Calories &<br><em>Nutrition Calculator</em>`;
        }
        const desc = document.querySelector('.calc-hero p');
        if (desc && (desc.textContent.includes('customize your orders') || desc.textContent.trim() === '')) {
          desc.textContent = config.brand.desc || `Use our interactive calorie calculator for ${config.brand.name} to track calories, protein, carbs and fat in real-time.`;
        }
        const eyebrow = document.querySelector('.calc-hero .eyebrow');
        if (eyebrow && (eyebrow.textContent.includes('order work for you') || eyebrow.textContent.trim() === '')) {
          eyebrow.innerHTML = `<span></span> Make your ${config.brand.name} order work for you.`;
        }
        const badgeText = document.querySelector('.badge-text');
        if (badgeText && (badgeText.textContent === 'Brand' || badgeText.textContent.trim() === '')) {
          badgeText.textContent = config.brand.name;
        }
        const logoCircle = document.querySelector('.badge-logo-circle');
        if (logoCircle && !logoCircle.querySelector('img')) {
          let logoPath = config.brand.logo_path || `brands/images/${config.brand.id}.png`;
          if (!logoPath.startsWith('/')) {
            logoPath = '/' + logoPath;
          }
          logoCircle.innerHTML = `<img src="${logoPath}" alt="${config.brand.name} logo" onerror="if(this.src.includes('.png')){this.src=this.src.replace('.png','.svg');}else{this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22><circle cx=%2212%22 cy=%2212%22 r=%2210%22 fill=%22%23eee%22/><text x=%2212%22 y=%2216%22 font-size=%2212%22 font-weight=%22bold%22 text-anchor=%22middle%22 fill=%22%23666%22>${config.brand.name[0]}</text></svg>';}">`;
        }
        const activeCrumb = document.querySelector('.active-crumb');
        if (activeCrumb && (activeCrumb.textContent.includes('Restaurant Calorie Calculator') || activeCrumb.textContent.trim() === '')) {
          activeCrumb.textContent = `${config.brand.name} Calorie Calculator`;
        }
        const seoContainer = document.querySelector('.brand-content');
        if (seoContainer && config.brand.seo_content && (seoContainer.textContent.includes('Plan the treat') || seoContainer.textContent.trim() === '')) {
          seoContainer.innerHTML = config.brand.seo_content;
        }
      }
      
      // Parse URL search parameters on load
      const hash = window.location.hash;
      if (hash.startsWith('#o=')) {
        const items = hash.slice(3).split('-');
        items.forEach(str => {
          const parts = str.split('.');
          if (parts.length === 4) {
            orderCart.push({
              index: parseInt(parts[0], 36),
              size: parseInt(parts[1], 36),
              opt: parseInt(parts[2], 36),
              qty: parseInt(parts[3], 36)
            });
          }
        });
        if (orderCart.length > 0) {
          const last = orderCart[orderCart.length - 1];
          selected = last.index;
          size = last.size;
          option = last.opt;
        }
      } else {
        const params = new URLSearchParams(window.location.search);
        if (params.has('item')) {
          selected = parseInt(params.get('item'));
          size = parseInt(params.get('size')) || 0;
          option = parseInt(params.get('opt')) || 0;
          orderCart.push({ index: selected, size, opt: option, qty: 1 });
        }
      }

      render();
      if (orderCart.length > 0) {
        update();
      }
    });
}

const nonVeganKeywords = ["chicken", "beef", "steak", "sausage", "bacon", "meatball", "cali club", "ham", "egg", "cheese", "butter", "croissant", "nuggets", "fish", "turkey", "bravo", "pepper", "kreme", "donut", "bagel", "cheesy", "quesadilla"];
const isVeganItem = (name) => {
  const l = name.toLowerCase();
  return !nonVeganKeywords.some(keyword => l.includes(keyword));
};

function makeChoices(root, choices, fn, activeIndex) {
  root.innerHTML = choices.map((x, i) => `<button class="chip ${i === activeIndex ? 'active' : ''}" data-i="${i}">${x[0]}</button>`).join('');
  root.querySelectorAll('button').forEach(b => b.onclick = () => {
    root.querySelector('.active').classList.remove('active');
    b.classList.add('active');
    fn(+b.dataset.i);
  });
}

function renderFilters() {
  let filterBar = $('#filterChips');
  if (!filterBar) {
    const itemsGrid = $('#items');
    if (itemsGrid) {
      // Create diet bar first
      const dietBar = document.createElement('div');
      dietBar.className = 'filter-chips diet-bar';
      dietBar.id = 'dietChips';
      itemsGrid.parentNode.insertBefore(dietBar, itemsGrid);

      // Create category bar second
      const categoryBar = document.createElement('div');
      categoryBar.className = 'filter-chips category-bar';
      categoryBar.id = 'categoryChips';
      itemsGrid.parentNode.insertBefore(categoryBar, itemsGrid);

      // Create nutrition filter bar
      filterBar = document.createElement('div');
      filterBar.className = 'filter-chips nutrition-bar';
      filterBar.id = 'filterChips';
      itemsGrid.parentNode.insertBefore(filterBar, itemsGrid);
    }
  }

  // Render diet focus filters
  const dietBar = $('#dietChips');
  if (dietBar) {
    const diets = [
      { id: 'none', label: 'All Lifestyles' },
      { id: 'keto', label: '🥑 Keto / Low-Carb' },
      { id: 'vegan', label: '🌱 Vegan / Plant-Based' },
      { id: 'high-protein', label: '💪 High-Protein' }
    ];
    dietBar.innerHTML = diets.map(d => 
      `<button class="chip ${activeDiet === d.id ? 'active' : ''}" data-diet="${d.id}">${d.label}</button>`
    ).join('');
    dietBar.querySelectorAll('button').forEach(b => b.onclick = () => {
      activeDiet = b.dataset.diet;
      render();
      update();
    });
  }

  // Render categories
  const categories = ['all', ...new Set(config.items.map(x => x[6]))];
  const catBar = $('#categoryChips');
  if (catBar) {
    catBar.innerHTML = categories.map(cat => 
      `<button class="chip ${activeCategory === cat ? 'active' : ''}" data-cat="${cat}">${cat === 'all' ? 'All Categories' : cat}</button>`
    ).join('');
    catBar.querySelectorAll('button').forEach(b => b.onclick = () => {
      activeCategory = b.dataset.cat;
      render();
    });
  }

  // Render nutrition filters
  if (!filterBar) return;
  const filters = [
    { id: 'all', label: 'All Items' },
    { id: 'low-cal', label: 'Low Cal (<250)' },
    { id: 'high-protein', label: 'High Protein (20g+)' },
    { id: 'low-carb', label: 'Low Carb (<20g)' }
  ];

  filterBar.innerHTML = filters.map(f => 
    `<button class="chip ${activeFilter === f.id ? 'active' : ''}" data-filter="${f.id}">${f.label}</button>`
  ).join('');

  filterBar.querySelectorAll('button').forEach(b => b.onclick = () => {
    activeFilter = b.dataset.filter;
    render();
  });
}

function render() {
  renderFilters();

  const items = $('#items');
  
  // Filter items based on activeDiet AND activeCategory AND activeFilter
  const filtered = config.items
    .map((x, idx) => ({ data: x, idx }))
    .filter(item => {
      const x = item.data;
      // Diet filter
      if (activeDiet === 'keto' && x[4] >= 20) return false;
      if (activeDiet === 'vegan' && !isVeganItem(x[1])) return false;
      if (activeDiet === 'high-protein' && x[3] < 15) return false;

      // Category filter
      if (activeCategory !== 'all' && x[6] !== activeCategory) return false;
      
      // Nutrition filter
      if (activeFilter === 'low-cal') return x[2] < 250;
      if (activeFilter === 'high-protein') return x[3] >= 20;
      if (activeFilter === 'low-carb') return x[4] < 20;
      return true;
    });

  if (filtered.length === 0) {
    items.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 30px 20px; color: #72766e; font-size: 13px;">No items match these lifestyle filters.</div>`;
  } else {
    if (selected !== null) {
      const isSelectedVisible = filtered.some(item => item.idx === selected);
      if (!isSelectedVisible) {
        selected = filtered[0].idx;
        setTimeout(update, 0);
      }
    }
    items.innerHTML = filtered.map(item => `
      <button class="menu-item ${selected === item.idx ? 'active' : ''}" data-i="${item.idx}">
        <span class="food-icon">${item.data[0]}</span>
        <span><b>${item.data[1]}</b><small>${item.data[2]} kcal base</small></span>
      </button>
    `).join('');
  }

  items.querySelectorAll('button').forEach(b => b.onclick = () => {
    selected = +b.dataset.i;
    // Add to cart logic
    let existing = orderCart.find(i => i.index === selected && i.size === size && i.opt === option);
    if (existing) {
      existing.qty++;
    } else {
      orderCart.push({ index: selected, size: size, opt: option, qty: 1 });
    }
    render();
    update();
  });

  makeChoices($('#sizes'), config.sizes, i => { 
    size = i; 
    // Update the last added instance of 'selected'
    if (selected !== null && orderCart.length > 0) {
      let last = orderCart.slice().reverse().find(item => item.index === selected);
      if (last) {
        last.size = size;
        consolidateCart();
      }
    }
    update(); 
  }, size);

  makeChoices($('#milks'), config.options, i => { 
    option = i; 
    // Update the last added instance of 'selected'
    if (selected !== null && orderCart.length > 0) {
      let last = orderCart.slice().reverse().find(item => item.index === selected);
      if (last) {
        last.opt = option;
        consolidateCart();
      }
    }
    update(); 
  }, option);
}

function consolidateCart() {
  // Merge items with identical index, size, and opt
  let newCart = [];
  orderCart.forEach(item => {
    let existing = newCart.find(i => i.index === item.index && i.size === item.size && i.opt === item.opt);
    if (existing) {
      existing.qty += item.qty;
    } else {
      newCart.push({ ...item });
    }
  });
  orderCart = newCart;
}

window.decreaseItem = function(cartIndex) {
  if (orderCart[cartIndex].qty > 1) {
    orderCart[cartIndex].qty--;
  } else {
    orderCart.splice(cartIndex, 1);
  }
  update();
};

window.increaseItem = function(cartIndex) {
  orderCart[cartIndex].qty++;
  update();
};

window.removeCartItem = function(cartIndex) {
  orderCart.splice(cartIndex, 1);
  update();
};

function update() {
  if (orderCart.length === 0) {
    $('#orderEmpty').hidden = false;
    $('#orderContent').hidden = true;
    const shareBtn = $('#shareBtn');
    if (shareBtn) shareBtn.remove();
    
    return;
  }
  
  let tCal = 0, tPro = 0, tCarb = 0, tFat = 0;
  let listHtml = '';
  
  orderCart.forEach((cartItem, i) => {
    const item = config.items[cartItem.index];
    const sizeObj = (config.sizes && config.sizes.length > cartItem.size) ? config.sizes[cartItem.size] : null;
    const optObj = (config.options && config.options.length > cartItem.opt) ? config.options[cartItem.opt] : null;
    
    const sizeAdjust = sizeObj ? sizeObj[1] : 0;
    const optAdjust = optObj ? optObj[1] : 0;
    const adjust = sizeAdjust + optAdjust;
    
    const cal = item[2] + adjust;
    const pro = Math.max(0, item[3] + Math.round(adjust / 45));
    const carb = Math.max(0, item[4] + Math.round(adjust / 12));
    const fat = Math.max(0, item[5] + Math.round(adjust / 55));
    
    tCal += cal * cartItem.qty;
    tPro += pro * cartItem.qty;
    tCarb += carb * cartItem.qty;
    tFat += fat * cartItem.qty;
    
    const sizeName = sizeObj ? sizeObj[0] : '';
    const optName = optObj ? optObj[0] : '';
    const details = [sizeName, optName].filter(Boolean).join(' · ');

    listHtml += `
      <div class="order-item-row">
        <div class="order-item-info">
           <strong>${item[1]}</strong>
           <small>${details}</small>
        </div>
        <div class="order-item-actions">
          <div class="qty-control">
            <button class="qty-btn" onclick="decreaseItem(${i})">-</button>
            <span class="qty-val">${cartItem.qty}</span>
            <button class="qty-btn" onclick="increaseItem(${i})">+</button>
          </div>
          <button class="remove-btn" onclick="removeCartItem(${i})">✕</button>
        </div>
      </div>
    `;
  });
        
  $('#orderEmpty').hidden = true;
  $('#orderContent').hidden = false;
  
  // Update header to show the most recent item added, or just "My Order"
  const lastCartItem = orderCart[orderCart.length - 1];
  const lastItemData = config.items[lastCartItem.index];
  
  $('#orderIcon').textContent = lastItemData[0];
  $('#orderName').textContent = "My Order";
  $('#orderOptions').textContent = `${orderCart.length} item${orderCart.length > 1 ? 's' : ''}`;
  
  $('#calories').textContent = tCal;
  

  // Handle FAB
  let fab = document.getElementById('cartFab');
  if (!fab) {
    fab = document.createElement('div');
    fab.id = 'cartFab';
    fab.className = 'cart-fab';
    fab.innerHTML = '<span class="fab-val">0</span><span class="fab-lbl">CAL</span>';
    document.body.appendChild(fab);
    
    fab.onclick = () => {
      const orderCard = document.querySelector('.order-card');
      if (orderCard) {
        orderCard.classList.toggle('modal-active');
        if (orderCard.classList.contains('modal-active')) {
          fab.classList.add('modal-open');
          fab.innerHTML = '<span class="fab-val">×</span><span class="fab-lbl"></span>';
          document.body.style.overflow = 'hidden';
        } else {
          fab.classList.remove('modal-open');
          fab.innerHTML = '<span class="fab-val">' + Math.round(tCal) + '</span><span class="fab-lbl">CAL</span>';
          document.body.style.overflow = '';
        }
      }
    };
  }
  
  if (orderCart.length > 0) {
    fab.classList.add('visible');
    if (!fab.classList.contains('modal-open')) {
      fab.innerHTML = '<span class="fab-val">' + Math.round(tCal) + '</span><span class="fab-lbl">CAL</span>';
      // pop animation
      fab.style.transform = 'scale(1.15)';
      setTimeout(() => fab.style.transform = '', 200);
    }
  } else {
    fab.classList.remove('visible');
    const orderCard = document.querySelector('.order-card');
    if (orderCard && orderCard.classList.contains('modal-active')) {
      orderCard.classList.remove('modal-active');
      fab.classList.remove('modal-open');
      document.body.style.overflow = '';
    }
  }

  // Update URL in address bar (using Hash for SEO and short URLs)
  const cartParam = orderCart.map(c => [c.index, c.size, c.opt, c.qty].map(num => num.toString(36)).join('.')).join('-');
  const newUrl = `${window.location.pathname}#o=${cartParam}`;
  window.history.replaceState({}, '', newUrl);
  
  [['protein', tPro, 50], ['carbs', tCarb, 75], ['fat', tFat, 40]].forEach(([id, v, max]) => {
    $('#' + id).textContent = v + 'g';
    $('#' + id + 'Bar').style.width = Math.min(100, v / max * 100) + '%';
  });

  const resetBtn = $('#reset');
  
  // Inject Cart Item List
  let listContainer = $('#orderItemsList');
  if (!listContainer && resetBtn) {
    listContainer = document.createElement('div');
    listContainer.id = 'orderItemsList';
    listContainer.style.marginTop = '20px';
    listContainer.style.marginBottom = '20px';
    resetBtn.parentNode.insertBefore(listContainer, resetBtn);
  }
  if (listContainer) {
    listContainer.innerHTML = listHtml;
  }

  // Dynamic breakdown container creation
  let breakdownContainer = $('#breakdownContainer');
  if (!breakdownContainer && resetBtn) {
    breakdownContainer = document.createElement('div');
    breakdownContainer.id = 'breakdownContainer';
    breakdownContainer.className = 'breakdown-container';
    resetBtn.parentNode.insertBefore(breakdownContainer, resetBtn);
  }

  if (breakdownContainer) {
    // Calculate macro calories and percentages
    const calFat = tFat * 9;
    const calProtein = tPro * 4;
    const calCarbs = tCarb * 4;
    const totalMacroCal = calFat + calProtein + calCarbs;

    let pctFat = 0, pctProtein = 0, pctCarbs = 0;
    if (totalMacroCal > 0) {
      pctFat = (calFat / totalMacroCal) * 100;
      pctProtein = (calProtein / totalMacroCal) * 100;
      pctCarbs = (calCarbs / totalMacroCal) * 100;
    }

    const fatEnd = pctFat;
    const proteinEnd = pctFat + pctProtein;

    breakdownContainer.innerHTML = `
      <h4>Nutrition Breakdown</h4>
      <div class="breakdown-chart-wrap">
        <div class="breakdown-donut" style="background: conic-gradient(#e29a24 0% ${fatEnd}%, #e15a37 ${fatEnd}% ${proteinEnd}%, #3a9da4 ${proteinEnd}% 100%)">
          <div class="breakdown-donut-hole"></div>
        </div>
        <div class="breakdown-legend">
          <span><i style="background: #e29a24"></i> Total Fat: ${pctFat.toFixed(1)}%</span>
          <span><i style="background: #e15a37"></i> Protein: ${pctProtein.toFixed(1)}%</span>
          <span><i style="background: #3a9da4"></i> Carbs: ${pctCarbs.toFixed(1)}%</span>
        </div>
      </div>
      
      <h4>Calorie Percentage Contribution</h4>
      <table class="breakdown-table">
        <thead>
          <tr>
            <th>Color Code</th>
            <th>Nutrition Data</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="color-indicator" style="background: #e29a24"></span></td>
            <td>Total Fat</td>
            <td>${pctFat.toFixed(2)}%</td>
          </tr>
          <tr>
            <td><span class="color-indicator" style="background: #e15a37"></span></td>
            <td>Protein</td>
            <td>${pctProtein.toFixed(2)}%</td>
          </tr>
          <tr>
            <td><span class="color-indicator" style="background: #3a9da4"></span></td>
            <td>Total Carbohydrates</td>
            <td>${pctCarbs.toFixed(2)}%</td>
          </tr>
        </tbody>
      </table>
    `;

    // Diet Warnings and Smart Swaps
    let alertHtml = '';
    const selectedName = lastItemData[1].toLowerCase();
    const optObj2 = (config.options && config.options.length > lastCartItem.opt) ? config.options[lastCartItem.opt] : null;
    const selectedMilk = optObj2 ? optObj2[0].toLowerCase() : '';

    if (activeDiet === 'keto') {
      const totalCarbs = tCarb;
      if (totalCarbs > 20) {
        alertHtml += `
          <div class="diet-alert">
            <span>⚠️ <b>Keto Alert:</b> This combination has ${totalCarbs}g of carbs, exceeding recommended keto macros.</span>
          </div>
        `;
      }
      if (selectedMilk.includes('oat') || selectedMilk.includes('whole') || selectedMilk.includes('soda') || selectedMilk.includes('flatbread') || selectedMilk.includes('baguette') || selectedMilk.includes('chips')) {
        alertHtml += `
          <div class="diet-suggestion">
            <span>💡 <b>Keto Swap:</b> Switch to Almond Milk, Water, Diet Soda, or No Side to keep carbs low.</span>
          </div>
        `;
      }
    } else if (activeDiet === 'vegan') {
      const nonVeganMilk = selectedMilk.includes('milk') && !selectedMilk.includes('oat') && !selectedMilk.includes('almond') && !selectedMilk.includes('soy');
      const isMeatOrDairy = nonVeganKeywords.some(keyword => selectedName.includes(keyword) || selectedMilk.includes(keyword));
      
      if (nonVeganMilk || isMeatOrDairy) {
        alertHtml += `
          <div class="diet-alert">
            <span>⚠️ <b>Vegan Alert:</b> This item or customization contains animal ingredients or dairy milk.</span>
          </div>
        `;
      }
      if (nonVeganMilk) {
        alertHtml += `
          <div class="diet-suggestion">
            <span>💡 <b>Vegan Swap:</b> Swap to Almond milk or Oat milk for a 100% plant-based drink.</span>
          </div>
        `;
      }
    } else if (activeDiet === 'high-protein') {
      if (tPro < 20) {
        alertHtml += `
          <div class="diet-suggestion">
            <span>💡 <b>Protein Swap:</b> Try double protein portions or chicken options to hit your 20g+ target.</span>
          </div>
        `;
      }
    }

    let alertBox = $('#dietAlertBox');
    if (!alertBox) {
      alertBox = document.createElement('div');
      alertBox.id = 'dietAlertBox';
      breakdownContainer.parentNode.insertBefore(alertBox, breakdownContainer.nextSibling);
    }
    alertBox.innerHTML = alertHtml;
  }

  // Dynamically append Share Order button if it doesn't exist
  if (resetBtn && !$('#shareBtn')) {
    const shareBtn = document.createElement('button');
    shareBtn.id = 'shareBtn';
    shareBtn.className = 'reset';
    shareBtn.style.color = '#ff8457';
    shareBtn.style.marginLeft = '20px';
    shareBtn.textContent = '🔗 Share order';
    shareBtn.onclick = () => {
      const cartParam = orderCart.map(c => [c.index, c.size, c.opt, c.qty].map(num => num.toString(36)).join('.')).join('-');
      const url = `${window.location.origin}${window.location.pathname}#o=${cartParam}`;
      navigator.clipboard.writeText(url).then(() => {
        shareBtn.textContent = '✅ Copied link!';
        setTimeout(() => {
          shareBtn.textContent = '🔗 Share order';
        }, 2000);
      });
    };
    resetBtn.parentNode.appendChild(shareBtn);
  }

  
}

$('#reset').onclick = () => {
  orderCart = [];
  selected = null;
  window.history.replaceState({}, '', window.location.pathname);
  size = option = 0;
  activeFilter = 'all';
  activeCategory = 'all';
  activeDiet = 'none';
  
  // Clean up search query param from URL
  if (window.history.pushState) {
    const newurl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.pushState({path:newurl},'',newurl);
  }
  
  // Remove share button
  const shareBtn = $('#shareBtn');
  if (shareBtn) shareBtn.remove();

  // Remove breakdown container
  const breakdownContainer = $('#breakdownContainer');
  if (breakdownContainer) breakdownContainer.remove();

  // Remove alert box
  const alertBox = $('#dietAlertBox');
  if (alertBox) alertBox.remove();
  
  $('#orderEmpty').hidden = false;
  $('#orderContent').hidden = true;
  render();
};

loadConfig();
if (orderCart.length > 0) {
  update();
}


