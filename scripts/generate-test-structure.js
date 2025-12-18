/**
 * Test Coverage Generation Script
 * 
 * This script analyzes the project structure and generates a test coverage plan
 * Run: node scripts/generate-test-structure.js
 */

const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'src');
const componentsToTest = [];

function findComponents(dir, basePath = '') {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    const relativePath = path.join(basePath, item.name);
    
    if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
      findComponents(fullPath, relativePath);
    } else if (item.isFile() && item.name.endsWith('.tsx') && !item.name.endsWith('.test.tsx') && !item.name.endsWith('.d.ts')) {
      const testPath = fullPath.replace('.tsx', '.test.tsx');
      const hasTest = fs.existsSync(testPath);
      
      componentsToTest.push({
        component: relativePath,
        fullPath: fullPath,
        testPath: testPath,
        hasTest: hasTest,
        priority: getPriority(relativePath)
      });
    }
  }
}

function getPriority(filePath) {
  // Prioritize critical paths
  if (filePath.includes('auth')) return 1;
  if (filePath.includes('user-management')) return 2;
  if (filePath.includes('client-management')) return 3;
  if (filePath.includes('account-management')) return 4;
  if (filePath.includes('dashboard')) return 5;
  if (filePath.includes('components')) return 6;
  if (filePath.includes('services')) return 7;
  if (filePath.includes('utils')) return 8;
  return 9;
}

findComponents(srcPath);

// Sort by priority
componentsToTest.sort((a, b) => a.priority - b.priority);

// Generate report
console.log('\n=== TEST COVERAGE ANALYSIS ===\n');
console.log(`Total Components: ${componentsToTest.length}`);
console.log(`Components with tests: ${componentsToTest.filter(c => c.hasTest).length}`);
console.log(`Components without tests: ${componentsToTest.filter(c => !c.hasTest).length}\n`);

console.log('=== COMPONENTS NEEDING TESTS (Prioritized) ===\n');

const withoutTests = componentsToTest.filter(c => !c.hasTest);
withoutTests.forEach((comp, index) => {
  console.log(`${index + 1}. [Priority ${comp.priority}] ${comp.component}`);
});

// Generate markdown report
const reportPath = path.join(__dirname, '..', 'TEST_COVERAGE_PLAN.md');
let markdown = `# Test Coverage Plan\n\n`;
markdown += `Generated: ${new Date().toLocaleString()}\n\n`;
markdown += `## Summary\n\n`;
markdown += `- **Total Components:** ${componentsToTest.length}\n`;
markdown += `- **With Tests:** ${componentsToTest.filter(c => c.hasTest).length}\n`;
markdown += `- **Without Tests:** ${componentsToTest.filter(c => !c.hasTest).length}\n`;
markdown += `- **Coverage:** ${Math.round((componentsToTest.filter(c => c.hasTest).length / componentsToTest.length) * 100)}%\n\n`;

markdown += `## Components Needing Tests (by Priority)\n\n`;
withoutTests.forEach((comp, index) => {
  markdown += `${index + 1}. **Priority ${comp.priority}** - \`${comp.component}\`\n`;
  markdown += `   - Path: ${comp.fullPath}\n`;
  markdown += `   - Test: ${comp.testPath}\n\n`;
});

markdown += `## Existing Tests\n\n`;
const withTests = componentsToTest.filter(c => c.hasTest);
withTests.forEach((comp, index) => {
  markdown += `${index + 1}. ✅ \`${comp.component}\`\n`;
});

fs.writeFileSync(reportPath, markdown);
console.log(`\n✅ Report generated: ${reportPath}\n`);
