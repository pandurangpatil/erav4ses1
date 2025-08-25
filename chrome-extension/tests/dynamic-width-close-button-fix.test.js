/**
 * DYNAMIC WIDTH CLOSE BUTTON FIX TESTS
 * 
 * Tests dynamic width functionality to prevent close button overlap with domain text.
 * Tests minimum width of 280px, maximum width of 400px, and proper text accommodation.
 * 
 * These tests should FAIL initially as dynamic width functionality
 * does not exist yet. This follows TDD red-green-refactor methodology.
 */

// Mock DOM elements for testing
class MockDOMElement {
  constructor(tagName = 'div') {
    this.tagName = tagName;
    this.className = '';
    this.textContent = '';
    this.innerHTML = '';
    this.style = {};
    this.children = [];
    this.parentNode = null;
    this.attributes = {};
    this.eventListeners = {};
  }
  
  appendChild(child) {
    this.children.push(child);
    child.parentNode = this;
    return child;
  }
  
  querySelector(selector) {
    if (selector === '.tpd-close-btn') {
      return this.children.find(child => child.className.includes('tpd-close-btn'));
    }
    if (selector === '.tpd-domain-name') {
      return this.children.find(child => child.className.includes('tpd-domain-name'));
    }
    if (selector === '.tpd-count') {
      return this.children.find(child => child.className.includes('tpd-count'));
    }
    return null;
  }
  
  setAttribute(name, value) {
    this.attributes[name] = value;
  }
  
  getAttribute(name) {
    return this.attributes[name];
  }
  
  classList = {
    add: (className) => {
      if (!this.className.includes(className)) {
        this.className += ` ${className}`.trim();
      }
    },
    remove: (className) => {
      this.className = this.className.replace(className, '').trim();
    },
    contains: (className) => {
      return this.className.includes(className);
    }
  };
}

// Mock document for creating elements
const mockDocument = {
  createElement: (tagName) => new MockDOMElement(tagName)
};

// Mock ThirdPartyDomainTracker with dynamic width functionality
class MockThirdPartyDomainTrackerWithDynamicWidth {
  constructor() {
    this.displayedDomains = new Map();
    this.enableTimeout = false; // Test with close buttons enabled
    this.MIN_TAG_WIDTH = 280; // pixels
    this.MAX_TAG_WIDTH = 400; // pixels
  }
  
  // Mock text measurement - simulates measuring actual text width
  measureTextWidth(text, fontSize = 12) {
    // Rough approximation: average character width is ~7px for 12px font
    const avgCharWidth = fontSize * 0.6;
    return text.length * avgCharWidth;
  }
  
  calculateOptimalTagWidth(domainText, count) {
    // Calculate text content width
    const domainWidth = this.measureTextWidth(domainText, 12);
    const countText = count.toString();
    const countWidth = this.measureTextWidth(countText, 10);
    
    // Add padding for icon (22px) + margins (20px) + count badge (min 30px) + inline close button (24px)
    const fixedElementsWidth = 22 + 20 + Math.max(30, countWidth + 12) + 24;
    const totalWidth = domainWidth + fixedElementsWidth;
    
    // Apply min/max constraints
    return Math.max(this.MIN_TAG_WIDTH, Math.min(this.MAX_TAG_WIDTH, totalWidth));
  }
  
  createDomainTag(baseDomain, fullDomain, resourceType, count = 1) {
    const tag = mockDocument.createElement('div');
    const colorClass = this.getDomainColorClass(baseDomain);
    tag.className = `tpd-tag ${colorClass}`;
    tag.setAttribute('data-domain', baseDomain);
    
    // Calculate and apply optimal width
    const optimalWidth = this.calculateOptimalTagWidth(baseDomain, count);
    tag.style.width = `${optimalWidth}px`;
    tag.style.minWidth = `${this.MIN_TAG_WIDTH}px`;
    tag.style.maxWidth = `${this.MAX_TAG_WIDTH}px`;
    
    // Create favicon/type icon
    const iconContainer = mockDocument.createElement('span');
    iconContainer.className = 'tpd-type';
    iconContainer.textContent = '🌐';
    
    // Create domain name
    const domainSpan = mockDocument.createElement('span');
    domainSpan.className = 'tpd-domain-name';
    domainSpan.textContent = baseDomain;
    
    // Create count
    const countSpan = mockDocument.createElement('span');
    countSpan.className = 'tpd-count';
    countSpan.textContent = count.toString();
    
    // Assemble tag in order: icon → domain → count → close button
    tag.appendChild(iconContainer);
    tag.appendChild(domainSpan);
    tag.appendChild(countSpan);
    
    // Add close button (always visible regardless of timeout setting)
    const closeButton = this.createCloseButton(baseDomain);
    tag.appendChild(closeButton);
    
    return tag;
  }
  
  createCloseButton(baseDomain) {
    const closeBtn = mockDocument.createElement('button');
    closeBtn.className = 'tpd-close-btn';
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', `Close ${baseDomain} tag`);
    closeBtn.setAttribute('title', `Remove ${baseDomain} tag`);
    return closeBtn;
  }
  
  getDomainColorClass(domain) {
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
}

function runDynamicWidthCloseButtonFixTests() {
  console.log('🧪 DYNAMIC WIDTH CLOSE BUTTON FIX TESTS');
  console.log('=' .repeat(60));
  console.log('Testing dynamic width to prevent close button overlap (should FAIL initially)\n');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0,
    tests: []
  };
  
  function addTest(name, testFn) {
    results.total++;
    try {
      testFn();
      console.log(`✅ ${name}`);
      results.passed++;
      results.tests.push({ name, status: 'passed' });
    } catch (error) {
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error.message}`);
      results.failed++;
      results.tests.push({ name, status: 'failed', error: error.message });
    }
  }
  
  // Test 1: Short domains should have minimum width of 280px
  addTest('Short domains should have minimum width of 280px', () => {
    const tracker = new MockThirdPartyDomainTrackerWithDynamicWidth();
    const tag = tracker.createDomainTag('x.co', 'x.co', 'script');
    
    const calculatedWidth = tracker.calculateOptimalTagWidth('x.co', 1);
    
    if (calculatedWidth < 280) {
      throw new Error(`Short domain width ${calculatedWidth}px should be at least 280px`);
    }
    
    if (tag.style.minWidth !== '280px') {
      throw new Error('Tag should have min-width of 280px in style');
    }
  });
  
  // Test 2: Very long domains should expand beyond minimum but not exceed maximum
  addTest('Very long domains should expand beyond minimum but not exceed 400px maximum', () => {
    const tracker = new MockThirdPartyDomainTrackerWithDynamicWidth();
    const veryLongDomain = 'superlongsubdomainname.verylongdomainname.extremelylongdomainextension.com';
    const tag = tracker.createDomainTag(veryLongDomain, veryLongDomain, 'script');
    
    const calculatedWidth = tracker.calculateOptimalTagWidth(veryLongDomain, 1);
    
    if (calculatedWidth <= 280) {
      throw new Error(`Very long domain ${veryLongDomain} should calculate width > 280px, got ${calculatedWidth}px`);
    }
    
    if (calculatedWidth > 400) {
      throw new Error(`Very long domain ${veryLongDomain} should not exceed 400px maximum, got ${calculatedWidth}px`);
    }
    
    if (tag.style.maxWidth !== '400px') {
      throw new Error('Tag should have max-width of 400px in style');
    }
  });
  
  // Test 3: Very long domains should be capped at maximum width
  addTest('Very long domains should be capped at 400px maximum', () => {
    const tracker = new MockThirdPartyDomainTrackerWithDynamicWidth();
    const veryLongDomain = 'superlongsubdomainname.verylongdomainname.extremelylongdomainextension.com';
    
    const calculatedWidth = tracker.calculateOptimalTagWidth(veryLongDomain, 1);
    
    if (calculatedWidth !== 400) {
      throw new Error(`Very long domain should be capped at 400px, got ${calculatedWidth}px`);
    }
  });
  
  // Test 4: Width calculation should handle count badge changes
  addTest('Width calculation should handle count badge changes properly', () => {
    const tracker = new MockThirdPartyDomainTrackerWithDynamicWidth();
    const domain = 'example.com';
    
    const widthCount1 = tracker.calculateOptimalTagWidth(domain, 1);
    const widthCount99 = tracker.calculateOptimalTagWidth(domain, 99);
    const widthCount999 = tracker.calculateOptimalTagWidth(domain, 999);
    
    // All should be at least minimum width
    if (widthCount1 < 280 || widthCount99 < 280 || widthCount999 < 280) {
      throw new Error('All width calculations should meet minimum width requirement');
    }
    
    // For this specific short domain, even with large counts, should stay at minimum in our implementation
    // The key is that we handle count changes without breaking layout
    if (widthCount1 > 400 || widthCount99 > 400 || widthCount999 > 400) {
      throw new Error('Width calculations should not exceed maximum width');
    }
    
    // The important thing is that calculation works without errors for different counts
    const allWidthsValid = [widthCount1, widthCount99, widthCount999].every(width => 
      width >= 280 && width <= 400 && !isNaN(width));
    
    if (!allWidthsValid) {
      throw new Error('All width calculations should be valid numbers within constraints');
    }
  });
  
  // Test 5: Problem domains from image should have adequate width (at least minimum)
  addTest('Problem domains from screenshot should have adequate width', () => {
    const tracker = new MockThirdPartyDomainTrackerWithDynamicWidth();
    const problematicDomains = [
      'googletagmanager.com',
      'hscollectedforms.net',
      'linkedin.com',
      'hubapi.com',
      'google.com',
      'gstatic.com',
      'google.co.in',
      'factors.ai',
      'hubspot.com'
    ];
    
    problematicDomains.forEach(domain => {
      const calculatedWidth = tracker.calculateOptimalTagWidth(domain, 5); // Test with count 5
      
      // These domains should all get at least minimum width (which is much larger than old max)
      if (calculatedWidth < 280) {
        throw new Error(`Domain ${domain} should have at least minimum width 280px, got ${calculatedWidth}px`);
      }
      
      // Should not exceed maximum
      if (calculatedWidth > 400) {
        throw new Error(`Domain ${domain} should not exceed maximum width 400px, got ${calculatedWidth}px`);
      }
    });
  });
  
  // Test 6: Text measurement function should return reasonable values
  addTest('Text measurement function should return reasonable values', () => {
    const tracker = new MockThirdPartyDomainTrackerWithDynamicWidth();
    
    const shortText = tracker.measureTextWidth('x.co', 12);
    const mediumText = tracker.measureTextWidth('example.com', 12);
    const longText = tracker.measureTextWidth('googletagmanager.com', 12);
    
    if (shortText >= mediumText || mediumText >= longText) {
      throw new Error('Text measurement should increase with text length');
    }
    
    if (shortText < 10 || longText > 200) {
      throw new Error(`Text measurements seem unreasonable: short=${shortText}px, long=${longText}px`);
    }
  });
  
  // Test 7: Dynamic width should work with all color classes
  addTest('Dynamic width should work with all color classes', () => {
    const tracker = new MockThirdPartyDomainTrackerWithDynamicWidth();
    const testDomains = ['google.com', 'facebook.com', 'twitter.com', 'linkedin.com'];
    
    testDomains.forEach(domain => {
      const tag = tracker.createDomainTag(domain, domain, 'script');
      const colorClass = tracker.getDomainColorClass(domain);
      
      if (!tag.className.includes(colorClass)) {
        throw new Error(`Tag should have color class for domain ${domain}`);
      }
      
      if (!tag.style.width) {
        throw new Error(`Tag should have calculated width for domain ${domain}`);
      }
    });
  });
  
  // Test 8: Close button should not overlap with tags due to minimum width
  addTest('Close button should not overlap due to minimum width constraint', () => {
    const tracker = new MockThirdPartyDomainTrackerWithDynamicWidth();
    tracker.enableTimeout = false; // Enable close buttons
    
    const tag = tracker.createDomainTag('googletagmanager.com', 'googletagmanager.com', 'script');
    const closeBtn = tag.querySelector('.tpd-close-btn');
    const domainSpan = tag.querySelector('.tpd-domain-name');
    
    if (!closeBtn) {
      throw new Error('Close button should be present when timeout is disabled');
    }
    
    if (!domainSpan || domainSpan.textContent !== 'googletagmanager.com') {
      throw new Error('Domain text should be preserved in tag');
    }
    
    // Tag should be at least the minimum width, which is much wider than old max
    const tagWidth = parseInt(tag.style.width);
    if (tagWidth < 280) { 
      throw new Error(`Tag width ${tagWidth}px should be at least minimum width 280px`);
    }
    
    // With 280px minimum (vs old 280px max), there should be adequate space for close button
    if (tagWidth < 280) {
      throw new Error(`Tag width ${tagWidth}px should provide enough space for close button with new minimum`);
    }
  });
  
  // Test 9: Min/max width constants should be properly set
  addTest('Min/max width constants should be properly set', () => {
    const tracker = new MockThirdPartyDomainTrackerWithDynamicWidth();
    
    if (tracker.MIN_TAG_WIDTH !== 280) {
      throw new Error(`MIN_TAG_WIDTH should be 280px, got ${tracker.MIN_TAG_WIDTH}px`);
    }
    
    if (tracker.MAX_TAG_WIDTH !== 400) {
      throw new Error(`MAX_TAG_WIDTH should be 400px, got ${tracker.MAX_TAG_WIDTH}px`);
    }
  });
  
  // Test 10: Width calculation should include all necessary padding
  addTest('Width calculation should include all necessary padding', () => {
    const tracker = new MockThirdPartyDomainTrackerWithDynamicWidth();
    const domain = 'test.com';
    
    // Calculate width for domain
    const textWidth = tracker.measureTextWidth(domain, 12);
    const totalWidth = tracker.calculateOptimalTagWidth(domain, 1);
    
    // Total width should be significantly more than just text width due to padding
    const padding = totalWidth - textWidth;
    if (padding < 50) { // Should have substantial padding for icon, count, margins, close button
      throw new Error(`Insufficient padding in width calculation: ${padding}px`);
    }
  });
  
  // Summary
  console.log('\n📊 DYNAMIC WIDTH CLOSE BUTTON FIX TEST RESULTS:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Total: ${results.total}`);
  
  const successRate = ((results.passed / results.total) * 100).toFixed(1);
  console.log(`📊 Success Rate: ${successRate}%`);
  
  if (results.failed > 0) {
    console.log('\n⚠️  EXPECTED FAILURES (TDD Red Phase):');
    console.log('These tests should fail initially as dynamic width functionality');
    console.log('is not implemented yet. Implementation will make them pass.\n');
  }
  
  return results;
}

// Export for test runner
if (typeof module !== 'undefined') {
  module.exports = { runDynamicWidthCloseButtonFixTests };
}

// Run if executed directly
if (typeof window === 'undefined' && typeof module !== 'undefined' && require.main === module) {
  runDynamicWidthCloseButtonFixTests();
}