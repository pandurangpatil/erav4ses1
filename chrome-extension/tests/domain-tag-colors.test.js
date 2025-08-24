/**
 * TERMINOLOGY METADATA FOR CONTEXT REBUILDING:
 * 
 * Primary Term: DOMAIN TAGS
 * Synonymous Terms: labels, popup toasts, toast notifications, tag elements, 
 *                   domain labels, notification tags, visual indicators
 * 
 * UI Context: Visual elements that appear in the bottom-right corner of web pages
 *            showing third-party domains with color-coded backgrounds and text
 * 
 * Location: Created by ThirdPartyDomainTracker.createDomainTag() in content.js
 * Styling: Defined in styles.css with 4-color palette system
 */

// Mock DOM environment for testing
class MockDOMElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.className = '';
    this.style = {};
    this.children = [];
    this.textContent = '';
    this.attributes = new Map();
  }
  
  setAttribute(name, value) {
    this.attributes.set(name, value);
  }
  
  getAttribute(name) {
    return this.attributes.get(name);
  }
  
  appendChild(child) {
    this.children.push(child);
  }
  
  querySelector(selector) {
    // Simple mock implementation
    if (selector === '.tpd-count') {
      return this.children.find(child => child.className.includes('tpd-count'));
    }
    if (selector === '.tpd-type') {
      return this.children.find(child => child.className.includes('tpd-type'));
    }
    return null;
  }
}

// Mock the getDomainColorClass function from content.js
function getDomainColorClass(domain) {
  const colorClasses = ['color-orange', 'color-vista-bleu', 'color-amande', 'color-bleu-oxford'];
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    const char = domain.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % colorClasses.length;
  return colorClasses[index];
}

// Color definitions from styles.css
const COLOR_DEFINITIONS = {
  'color-orange': {
    background: '#FF8400',
    textColor: 'black',
    borderColor: 'rgba(0, 0, 0, 0.1)',
    countBadgeBackground: 'rgba(0, 0, 0, 0.15)',
    countBadgeText: 'black',
    theme: 'light'
  },
  'color-vista-bleu': {
    background: '#5874B0',
    textColor: 'white',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    countBadgeBackground: 'rgba(255, 255, 255, 0.25)',
    countBadgeText: 'white',
    theme: 'dark'
  },
  'color-amande': {
    background: '#F9DFC6',
    textColor: 'black',
    borderColor: 'rgba(0, 0, 0, 0.1)',
    countBadgeBackground: 'rgba(0, 0, 0, 0.15)',
    countBadgeText: 'black',
    theme: 'light'
  },
  'color-bleu-oxford': {
    background: '#0B0829',
    textColor: 'white',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    countBadgeBackground: 'rgba(255, 255, 255, 0.25)',
    countBadgeText: 'white',
    theme: 'dark'
  }
};

// WCAG 2.1 Color Contrast Calculator
function calculateContrastRatio(color1, color2) {
  function luminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      const srgb = c / 255;
      return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  function parseColor(color) {
    if (color === 'black') return [0, 0, 0];
    if (color === 'white') return [255, 255, 255];
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16)
      ];
    }
    return [128, 128, 128]; // fallback gray
  }

  const [r1, g1, b1] = parseColor(color1);
  const [r2, g2, b2] = parseColor(color2);
  
  const lum1 = luminance(r1, g1, b1);
  const lum2 = luminance(r2, g2, b2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

// Test runner function
function runDomainTagColorTests() {
  console.log('🎨 Running Domain Tag Color Combination Tests\n');
  console.log('=' .repeat(80));
  
  const testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    categories: {
      colorAssignment: { passed: 0, failed: 0 },
      contrastValidation: { passed: 0, failed: 0 },
      countBadgeStyling: { passed: 0, failed: 0 },
      consistencyChecks: { passed: 0, failed: 0 },
      accessibilityTests: { passed: 0, failed: 0 }
    }
  };
  
  // Test 1: Color Class Assignment Consistency
  console.log('📋 Test Category: Color Class Assignment\n');
  
  const testDomains = [
    'google.com', 'facebook.com', 'amazon.com', 'microsoft.com',
    'doubleclick.net', 'google-analytics.com', 'googletagmanager.com',
    'example.co.uk', 'test.org.au', 'site.co.in'
  ];
  
  testDomains.forEach((domain, index) => {
    testResults.total++;
    const colorClass = getDomainColorClass(domain);
    const isValidColorClass = Object.keys(COLOR_DEFINITIONS).includes(colorClass);
    
    if (isValidColorClass) {
      testResults.passed++;
      testResults.categories.colorAssignment.passed++;
      console.log(`✅ Domain "${domain}" → ${colorClass}`);
      
      // Test consistency - same domain should always get same color
      const secondCall = getDomainColorClass(domain);
      if (colorClass === secondCall) {
        console.log(`   ✅ Consistency check passed`);
      } else {
        testResults.categories.consistencyChecks.failed++;
        console.log(`   ❌ Consistency check failed: ${colorClass} vs ${secondCall}`);
      }
      testResults.categories.consistencyChecks.passed++;
      
    } else {
      testResults.failed++;
      testResults.categories.colorAssignment.failed++;
      console.log(`❌ Domain "${domain}" → Invalid color class: ${colorClass}`);
    }
    console.log('');
  });
  
  // Test 2: Background-Text Color Contrast Validation
  console.log('\n📋 Test Category: Background-Text Color Contrast\n');
  
  Object.entries(COLOR_DEFINITIONS).forEach(([colorClass, colors]) => {
    testResults.total++;
    const contrastRatio = calculateContrastRatio(colors.background, colors.textColor);
    const meetsWCAGAA = contrastRatio >= 4.5;
    const meetsWCAGAAA = contrastRatio >= 7;
    
    if (meetsWCAGAA) {
      testResults.passed++;
      testResults.categories.contrastValidation.passed++;
      testResults.categories.accessibilityTests.passed++;
      console.log(`✅ ${colorClass}: ${colors.background} + ${colors.textColor}`);
      console.log(`   Contrast Ratio: ${contrastRatio.toFixed(2)}:1`);
      console.log(`   WCAG AA: ✅ | WCAG AAA: ${meetsWCAGAAA ? '✅' : '❌'}`);
    } else {
      testResults.failed++;
      testResults.categories.contrastValidation.failed++;
      testResults.categories.accessibilityTests.failed++;
      console.log(`❌ ${colorClass}: ${colors.background} + ${colors.textColor}`);
      console.log(`   Contrast Ratio: ${contrastRatio.toFixed(2)}:1 (Below WCAG AA 4.5:1)`);
    }
    console.log('');
  });
  
  // Test 3: Count Badge Color Combinations
  console.log('\n📋 Test Category: Count Badge Styling\n');
  
  Object.entries(COLOR_DEFINITIONS).forEach(([colorClass, colors]) => {
    testResults.total++;
    
    // Parse rgba values for count badge background
    const countBgMatches = colors.countBadgeBackground.match(/rgba?\((.+)\)/);
    const countTextColor = colors.countBadgeText;
    
    let contrastRatio = 0;
    if (countBgMatches) {
      // For rgba backgrounds, approximate contrast with base background
      contrastRatio = calculateContrastRatio(colors.background, countTextColor);
    }
    
    const expectedTheme = colors.theme;
    const correctCountStyling = (
      (expectedTheme === 'light' && countTextColor === 'black') ||
      (expectedTheme === 'dark' && countTextColor === 'white')
    );
    
    if (correctCountStyling) {
      testResults.passed++;
      testResults.categories.countBadgeStyling.passed++;
      console.log(`✅ ${colorClass} count badge: ${colors.countBadgeBackground} + ${countTextColor}`);
      console.log(`   Theme: ${expectedTheme} (correct styling)`);
    } else {
      testResults.failed++;
      testResults.categories.countBadgeStyling.failed++;
      console.log(`❌ ${colorClass} count badge: Incorrect theme styling`);
      console.log(`   Expected ${expectedTheme} theme styling, got ${countTextColor} text`);
    }
    console.log('');
  });
  
  // Test 4: All Color Class Coverage
  console.log('\n📋 Test Category: Color Coverage Distribution\n');
  
  testResults.total++;
  const colorClassCounts = {};
  const sampleDomains = [
    'google.com', 'facebook.com', 'amazon.com', 'microsoft.com', 'apple.com',
    'twitter.com', 'instagram.com', 'linkedin.com', 'youtube.com', 'netflix.com',
    'spotify.com', 'github.com', 'stackoverflow.com', 'reddit.com', 'pinterest.com'
  ];
  
  sampleDomains.forEach(domain => {
    const colorClass = getDomainColorClass(domain);
    colorClassCounts[colorClass] = (colorClassCounts[colorClass] || 0) + 1;
  });
  
  const usedColors = Object.keys(colorClassCounts);
  const allColorsUsed = Object.keys(COLOR_DEFINITIONS).every(color => 
    usedColors.includes(color)
  );
  
  if (allColorsUsed) {
    testResults.passed++;
    console.log(`✅ All 4 color classes are being used:`);
    Object.entries(colorClassCounts).forEach(([color, count]) => {
      console.log(`   ${color}: ${count} domains`);
    });
  } else {
    testResults.failed++;
    console.log(`❌ Not all color classes are being used:`);
    console.log(`   Used: ${usedColors.join(', ')}`);
    console.log(`   Missing: ${Object.keys(COLOR_DEFINITIONS).filter(c => !usedColors.includes(c)).join(', ')}`);
  }
  
  // Test Results Summary
  console.log('\n' + '=' .repeat(80));
  console.log('📊 Domain Tag Color Test Results:');
  console.log(`   ✅ Total Passed: ${testResults.passed}`);
  console.log(`   ❌ Total Failed: ${testResults.failed}`);
  console.log(`   📈 Total Tests: ${testResults.total}`);
  console.log(`   📊 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%\n`);
  
  console.log('📋 Results by Category:');
  Object.entries(testResults.categories).forEach(([category, results]) => {
    const total = results.passed + results.failed;
    if (total > 0) {
      console.log(`   ${category}: ${results.passed}/${total} passed`);
    }
  });
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All domain tag color combination tests passed!');
    console.log('   All 4 color classes are properly configured with correct:');
    console.log('   • Background-text color contrasts');
    console.log('   • Count badge styling for light/dark themes');
    console.log('   • Consistent color assignment algorithm');
    console.log('   • WCAG accessibility compliance');
  } else {
    console.log(`\n⚠️  ${testResults.failed} test(s) failed. Please review the color definitions.`);
  }
  
  return testResults;
}

// Export for use in other test frameworks
if (typeof module !== 'undefined') {
  module.exports = { 
    getDomainColorClass, 
    COLOR_DEFINITIONS, 
    calculateContrastRatio,
    runDomainTagColorTests 
  };
}

// Run tests if this file is executed directly
if (typeof window === 'undefined' && typeof module !== 'undefined' && require.main === module) {
  runDomainTagColorTests();
}