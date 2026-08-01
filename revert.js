const fs = require('fs');
const path = require('path');

const brandsDir = path.join(__dirname, 'brands');
const files = ['starbucks.html', 'subway.html', 'mcdonalds.html', 'chipotle.html', 'tacobell.html', 'dunkin.html', 'chickfila.html', 'panera.html'];

for (const file of files) {
  const filePath = path.join(brandsDir, file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  const gridStart = content.indexOf('<div class="macro-card-grid">');
  if (gridStart !== -1) {
    const h3Index = content.indexOf('<h3>', gridStart);
    if (h3Index !== -1) {
      const gridContent = content.substring(gridStart, h3Index);
      
      const cardRegex = /<h4 class="macro-card-title">(.*?)<\/h4>.*?<strong>(.*?)<\/strong>.*?<strong>(.*?)<\/strong>.*?<strong>(.*?)<\/strong>.*?<strong>(.*?)<\/strong>/gs;
      
      let tableHtml = '<div class="seo-table-wrap"><table class="seo-table"><thead><tr><th>Menu Item</th><th>Calories</th><th>Protein</th><th>Carbs</th><th>Fat</th></tr></thead><tbody>';
      
      let match;
      while ((match = cardRegex.exec(gridContent)) !== null) {
        tableHtml += `<tr><td>${match[1]}</td><td>${match[2]}</td><td>${match[3]}</td><td>${match[4]}</td><td>${match[5]}</td></tr>`;
      }
      tableHtml += '</tbody></table></div>';
      
      content = content.substring(0, gridStart) + tableHtml + content.substring(h3Index);
    }
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Reverted table in ' + file);
}
