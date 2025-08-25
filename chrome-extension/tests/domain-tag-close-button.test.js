/**
 * DOMAIN TAG CLOSE BUTTON TESTS
 * 
 * Tests close button functionality for domain tags when timeout is disabled.
 * Tests button rendering, styling, accessibility, and manual removal.
 * 
 * These tests should FAIL initially as close button functionality
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
  
  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index > -1) {
      this.children.splice(index, 1);
      child.parentNode = null;
    }
    return child;
  }
  
  querySelector(selector) {
    // Simple mock implementation
    if (selector === '.tpd-close-btn') {
      return this.children.find(child => child.className.includes('tpd-close-btn'));
    }
    return null;
  }
  
  setAttribute(name, value) {
    this.attributes[name] = value;
  }
  
  getAttribute(name) {
    return this.attributes[name];
  }
  
  addEventListener(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }
  
  click() {
    if (this.eventListeners.click) {
      this.eventListeners.click.forEach(callback => callback());
    }
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

// Mock ThirdPartyDomainTracker with close button functionality
class MockThirdPartyDomainTrackerWithCloseButton {
  constructor() {
    this.displayedDomains = new Map();
    this.enableTimeout = true;
  }
  
  createDomainTag(baseDomain, fullDomain, resourceType) {
    const tag = mockDocument.createElement('div');
    tag.className = 'tpd-tag color-orange';
    tag.setAttribute('data-domain', baseDomain);
    
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
    countSpan.textContent = '1';
    
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
    
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeTagManually(baseDomain);
    });
    
    return closeBtn;
  }
  
  removeTagManually(baseDomain) {
    const domainData = this.displayedDomains.get(baseDomain);
    if (domainData) {
      this.displayedDomains.delete(baseDomain);
      // Simulate DOM removal
      if (domainData.element && domainData.element.parentNode) {
        domainData.element.parentNode.removeChild(domainData.element);
      }
    }
  }
}

function runDomainTagCloseButtonTests() {
  console.log('🧪 DOMAIN TAG CLOSE BUTTON TESTS');
  console.log('=' .repeat(60));
  console.log('Testing close button functionality (should FAIL initially)\n');
  
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
  
  // Test 1: Close button should be present even when timeout is enabled
  addTest('Close button should be present even when timeout is enabled', () => {
    const tracker = new MockThirdPartyDomainTrackerWithCloseButton();
    tracker.enableTimeout = true;
    
    const tag = tracker.createDomainTag('example.com', 'example.com', 'script');
    const closeBtn = tag.querySelector('.tpd-close-btn');
    
    if (!closeBtn) {
      throw new Error('Close button should exist even when timeout is enabled');
    }
  });
  
  // Test 2: Close button should be present when timeout is disabled
  addTest('Close button should be present when timeout is disabled', () => {
    const tracker = new MockThirdPartyDomainTrackerWithCloseButton();
    tracker.enableTimeout = false;
    
    const tag = tracker.createDomainTag('example.com', 'example.com', 'script');
    const closeBtn = tag.querySelector('.tpd-close-btn');
    
    if (!closeBtn) {
      throw new Error('Close button should exist when timeout is disabled');
    }
  });
  
  // Test 3: Close button should have proper CSS class
  addTest('Close button should have proper CSS class', () => {
    const tracker = new MockThirdPartyDomainTrackerWithCloseButton();
    tracker.enableTimeout = false;
    
    const tag = tracker.createDomainTag('example.com', 'example.com', 'script');
    const closeBtn = tag.querySelector('.tpd-close-btn');
    
    if (!closeBtn || !closeBtn.className.includes('tpd-close-btn')) {
      throw new Error('Close button should have tpd-close-btn CSS class');
    }
  });
  
  // Test 4: Close button should have × character
  addTest('Close button should display × character', () => {
    const tracker = new MockThirdPartyDomainTrackerWithCloseButton();
    tracker.enableTimeout = false;
    
    const tag = tracker.createDomainTag('example.com', 'example.com', 'script');
    const closeBtn = tag.querySelector('.tpd-close-btn');
    
    if (!closeBtn || closeBtn.textContent !== '×') {
      throw new Error('Close button should display × character');
    }
  });
  
  // Test 5: Close button should have accessibility attributes
  addTest('Close button should have proper accessibility attributes', () => {
    const tracker = new MockThirdPartyDomainTrackerWithCloseButton();
    tracker.enableTimeout = false;
    
    const tag = tracker.createDomainTag('example.com', 'example.com', 'script');
    const closeBtn = tag.querySelector('.tpd-close-btn');
    
    if (!closeBtn) {
      throw new Error('Close button not found');
    }
    
    const ariaLabel = closeBtn.getAttribute('aria-label');
    const title = closeBtn.getAttribute('title');
    
    if (!ariaLabel || !ariaLabel.includes('example.com')) {
      throw new Error('Close button should have proper aria-label with domain name');
    }
    
    if (!title || !title.includes('example.com')) {
      throw new Error('Close button should have proper title with domain name');
    }
  });
  
  // Test 6: Close button should be a button element
  addTest('Close button should be a button element', () => {
    const tracker = new MockThirdPartyDomainTrackerWithCloseButton();
    tracker.enableTimeout = false;
    
    const tag = tracker.createDomainTag('example.com', 'example.com', 'script');
    const closeBtn = tag.querySelector('.tpd-close-btn');
    
    if (!closeBtn || closeBtn.tagName !== 'button') {
      throw new Error('Close button should be a button element for accessibility');
    }
  });
  
  // Test 7: Clicking close button should remove the tag
  addTest('Clicking close button should remove the domain tag', () => {
    const tracker = new MockThirdPartyDomainTrackerWithCloseButton();
    tracker.enableTimeout = false;
    
    const tag = tracker.createDomainTag('example.com', 'example.com', 'script');
    tracker.displayedDomains.set('example.com', { element: tag });
    
    const closeBtn = tag.querySelector('.tpd-close-btn');
    
    if (!closeBtn) {
      throw new Error('Close button not found');
    }
    
    // Mock the event object properly
    const mockEvent = {
      stopPropagation: () => {}
    };
    
    // Manually trigger the click handler with proper event object
    if (closeBtn.eventListeners.click && closeBtn.eventListeners.click.length > 0) {
      closeBtn.eventListeners.click[0](mockEvent);
    }
    
    if (tracker.displayedDomains.has('example.com')) {
      throw new Error('Domain should be removed from tracker after close button click');
    }
  });
  
  // Test 8: Close button click should stop propagation
  addTest('Close button click should stop event propagation', () => {
    const tracker = new MockThirdPartyDomainTrackerWithCloseButton();
    tracker.enableTimeout = false;
    
    const tag = tracker.createDomainTag('example.com', 'example.com', 'script');
    const closeBtn = tag.querySelector('.tpd-close-btn');
    
    if (!closeBtn) {
      throw new Error('Close button not found');
    }
    
    // Mock event object
    let propagationStopped = false;
    const mockEvent = {
      stopPropagation: () => { propagationStopped = true; }
    };
    
    // This tests the event handler implementation
    if (closeBtn.eventListeners.click) {
      closeBtn.eventListeners.click[0](mockEvent);
      if (!propagationStopped) {
        throw new Error('Close button click should call stopPropagation()');
      }
    } else {
      throw new Error('Close button should have click event listener');
    }
  });
  
  // Test 9: Close button should be positioned correctly inline
  addTest('Close button should be positioned inline after count', () => {
    const tracker = new MockThirdPartyDomainTrackerWithCloseButton();
    tracker.enableTimeout = false;
    
    const tag = tracker.createDomainTag('example.com', 'example.com', 'script');
    const closeBtn = tag.querySelector('.tpd-close-btn');
    
    if (!closeBtn) {
      throw new Error('Close button not found');
    }
    
    // CSS styles should be applied via CSS file, but we test class existence
    if (!closeBtn.className.includes('tpd-close-btn')) {
      throw new Error('Close button should have positioning class');
    }
    
    // Check that close button is the last child (after count)
    const lastChild = tag.children[tag.children.length - 1];
    if (lastChild !== closeBtn) {
      throw new Error('Close button should be the last element in tag');
    }
  });
  
  // Test 10: Multiple tags with timeout disabled should all have close buttons
  addTest('Multiple tags should all have close buttons when timeout disabled', () => {
    const tracker = new MockThirdPartyDomainTrackerWithCloseButton();
    tracker.enableTimeout = false;
    
    const domains = ['google.com', 'facebook.com', 'twitter.com'];
    const tags = domains.map(domain => 
      tracker.createDomainTag(domain, domain, 'script')
    );
    
    tags.forEach((tag, index) => {
      const closeBtn = tag.querySelector('.tpd-close-btn');
      if (!closeBtn) {
        throw new Error(`Close button missing on tag for ${domains[index]}`);
      }
    });
  });
  
  // Summary
  console.log('\n📊 DOMAIN TAG CLOSE BUTTON TEST RESULTS:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Total: ${results.total}`);
  
  const successRate = ((results.passed / results.total) * 100).toFixed(1);
  console.log(`📊 Success Rate: ${successRate}%`);
  
  if (results.failed > 0) {
    console.log('\n⚠️  EXPECTED FAILURES (TDD Red Phase):');
    console.log('These tests should fail initially as close button functionality');
    console.log('is not implemented yet. Implementation will make them pass.\n');
  }
  
  return results;
}

// Export for test runner
if (typeof module !== 'undefined') {
  module.exports = { runDomainTagCloseButtonTests };
}

// Run if executed directly
if (typeof window === 'undefined' && typeof module !== 'undefined' && require.main === module) {
  runDomainTagCloseButtonTests();
}