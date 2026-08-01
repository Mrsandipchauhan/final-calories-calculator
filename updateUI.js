const fs = require('fs');
const path = require('path');

const brandsDir = path.join('c:\\Users\\Hp\\Documents\\Codex - Copy\\2026-07-31\\https-starbucks-calorie-calculator-com', 'brands');
const files = ['starbucks.html', 'subway.html', 'mcdonalds.html', 'chipotle.html', 'tacobell.html', 'dunkin.html', 'chickfila.html', 'panera.html'];

for (const file of files) {
  const filePath = path.join(brandsDir, file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Replace the table with macro cards
  const tableRegex = /<div class="seo-table-wrap"><table class="seo-table"><thead><tr>(.*?)<\/tr><\/thead><tbody>(.*?)<\/tbody><\/table><\/div>/s;
  const tableMatch = content.match(tableRegex);
  
  if (tableMatch) {
    const tbody = tableMatch[2];
    const rowRegex = /<tr>(.*?)<\/tr>/g;
    let cardsHtml = '<div class="macro-card-grid">';
    
    let match;
    while ((match = rowRegex.exec(tbody)) !== null) {
      const rowContent = match[1];
      const cellRegex = /<td>(.*?)<\/td>/g;
      const cells = [];
      let cellMatch;
      while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
        cells.push(cellMatch[1]);
      }
      
      if (cells.length >= 5) {
        cardsHtml += `
<div class="macro-card">
  <h4 class="macro-card-title">${cells[0]}</h4>
  <div class="macro-card-stats">
    <div class="macro-badge cal"><span>Calories</span> <strong>${cells[1]}</strong></div>
    <div class="macro-badge"><span>Protein</span> <strong>${cells[2]}</strong></div>
    <div class="macro-badge"><span>Carbs</span> <strong>${cells[3]}</strong></div>
    <div class="macro-badge"><span>Fat</span> <strong>${cells[4]}</strong></div>
  </div>
</div>`;
      }
    }
    cardsHtml += '</div>';
    
    // Minify slightly for insertion
    cardsHtml = cardsHtml.replace(/\n\s*/g, '');
    
    content = content.replace(tableRegex, cardsHtml);
  }
  
  // 2. Replace FAQs with accordions
  const faqSectionStart = content.indexOf('<h3>Frequently Asked Questions (FAQs)</h3>');
  if (faqSectionStart !== -1) {
    const sectionEnd = content.indexOf('</section>', faqSectionStart);
    let faqContent = content.substring(faqSectionStart, sectionEnd);
    
    let newFaqContent = faqContent.replace(/<h3>Frequently Asked Questions \(FAQs\)<\/h3>/, '<h3>Frequently Asked Questions (FAQs)</h3><div class="seo-faq-accordion">');
    
    const pRegex = /<p><strong>(.*?)<\/strong><br>(.*?)<\/p>/g;
    newFaqContent = newFaqContent.replace(pRegex, (match, q, a) => {
      q = q.replace(/^\d+\.\s*/, '');
      return `<details><summary>${q}</summary><p>${a}</p></details>`;
    });
    
    const lastDetails = newFaqContent.lastIndexOf('</details>');
    if (lastDetails !== -1) {
      newFaqContent = newFaqContent.substring(0, lastDetails + 10) + '</div>' + newFaqContent.substring(lastDetails + 10);
    }
    
    content = content.substring(0, faqSectionStart) + newFaqContent + content.substring(sectionEnd);
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated ' + file);
}
