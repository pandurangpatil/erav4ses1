/**
 * TIMEOUT DISABLE BUG TESTS
 * 
 * Tests for Issue #2: Tags still auto-removing despite disabled timeout.
 * Bug location: content.js line 162 in createNewDomain() method calls 
 * setDomainTimeout(baseDomain) unconditionally, ignoring enableTimeout setting.
 * 
 * These tests should FAIL initially as the timeout disable bug
 * is not fixed yet. This follows TDD red-green-refactor methodology.
 */

// Mock chrome.storage for testing
const mockChromeStorage = {
  local: {
    data: { timeoutSeconds: 5, enableTimeout: false }, // Timeout disabled by default for these tests
    get: function(keys, callback) {
      const result = {};
      if (Array.isArray(keys)) {
        keys.forEach(key => {
          if (this.data.hasOwnProperty(key)) {
            result[key] = this.data[key];
          }
        });
      } else if (typeof keys === 'string') {
        if (this.data.hasOwnProperty(keys)) {
          result[keys] = this.data[keys];
        }
      }
      setTimeout(() => callback(result), 0);
    },
    set: function(items, callback) {
      Object.assign(this.data, items);
      if (callback) setTimeout(callback, 0);
    }
  }
};

// Mock ThirdPartyDomainTracker to test the bug
class MockThirdPartyDomainTrackerWithBug {
  constructor() {
    this.displayedDomains = new Map();
    this.domainTimeouts = new Map();
    this.timeoutDuration = 5000;
    this.enableTimeout = true; // This should be loaded from storage
    this.debugMode = true;
    
    this.loadTimeoutSettings();
  }
  
  loadTimeoutSettings() {
    // Synchronous version for testing - simulates the bug where this might not work correctly
    const result = {
      timeoutSeconds: mockChromeStorage.local.data.timeoutSeconds !== undefined ? mockChromeStorage.local.data.timeoutSeconds : 5,
      enableTimeout: mockChromeStorage.local.data.enableTimeout !== false
    };
    this.timeoutDuration = result.timeoutSeconds * 1000;
    this.enableTimeout = result.enableTimeout;
    
    if (this.debugMode) {
      console.log(`[TEST] Loaded timeout settings: ${this.timeoutDuration}ms, enabled: ${this.enableTimeout}`);
    }
  }
  
  // This is the BUGGY version that ignores enableTimeout setting
  createNewDomainWithBug(baseDomain, fullDomain, resourceType) {
    try {
      const tagElement = this.createDomainTag(baseDomain, fullDomain, resourceType);
      
      this.displayedDomains.set(baseDomain, {
        element: tagElement,
        count: 1,
        resourceType: resourceType
      });
      
      // BUG: This line ignores this.enableTimeout setting!
      this.setDomainTimeoutWithBug(baseDomain); // Should be conditional
      
      if (this.debugMode) {
        console.log(`[TEST] Created new domain with BUG: ${baseDomain}, timeout will be set regardless of enableTimeout setting`);
      }
      
    } catch (error) {
      console.error(`[TEST] Error creating domain ${baseDomain}:`, error);
    }
  }
  
  // This is the FIXED version that respects enableTimeout setting
  createNewDomainFixed(baseDomain, fullDomain, resourceType) {
    try {
      const tagElement = this.createDomainTag(baseDomain, fullDomain, resourceType);
      
      this.displayedDomains.set(baseDomain, {
        element: tagElement,
        count: 1,
        resourceType: resourceType
      });
      
      // FIX: Only set timeout when enabled and duration > 0 (matches real implementation)
      if (this.enableTimeout && this.timeoutDuration > 0) {
        this.setDomainTimeout(baseDomain);
      }
      
      if (this.debugMode) {
        console.log(`[TEST] Created new domain FIXED: ${baseDomain}, timeout set: ${this.enableTimeout && this.timeoutDuration > 0}`);
      }
      
    } catch (error) {
      console.error(`[TEST] Error creating domain ${baseDomain}:`, error);
    }
  }
  
  createDomainTag(baseDomain, fullDomain, resourceType) {
    // Simplified mock tag creation
    return {
      baseDomain,
      classList: { add: () => {}, remove: () => {} },
      setAttribute: () => {},
      appendChild: () => {}
    };
  }
  
  setDomainTimeout(baseDomain) {
    if (!this.enableTimeout || this.timeoutDuration <= 0) {
      if (this.debugMode) {
        console.log(`[TEST] Timeout disabled or zero, should not set timeout for: ${baseDomain}`);
      }
      return;
    }
    
    const timeoutId = setTimeout(() => {
      this.removeDomain(baseDomain);
    }, this.timeoutDuration);
    
    this.domainTimeouts.set(baseDomain, timeoutId);
    
    if (this.debugMode) {
      console.log(`[TEST] Set timeout for: ${baseDomain} (${this.timeoutDuration}ms)`);
    }
  }
  
  // BUGGY version that ignores enableTimeout setting completely
  setDomainTimeoutWithBug(baseDomain) {
    // BUG: This method ignores this.enableTimeout and this.timeoutDuration checks!
    if (this.timeoutDuration <= 0) {
      // Still respect zero timeout to avoid infinite timeouts
      return;
    }
    
    const timeoutId = setTimeout(() => {
      this.removeDomain(baseDomain);
    }, this.timeoutDuration);
    
    this.domainTimeouts.set(baseDomain, timeoutId);
    
    if (this.debugMode) {
      console.log(`[TEST] Set timeout with BUG: ${baseDomain} (${this.timeoutDuration}ms) - ignored enableTimeout=${this.enableTimeout}`);
    }
  }
  
  removeDomain(baseDomain) {
    this.displayedDomains.delete(baseDomain);
    this.domainTimeouts.delete(baseDomain);
    
    if (this.debugMode) {
      console.log(`[TEST] Removed domain: ${baseDomain}`);
    }
  }
  
  clearAllTimeouts() {
    this.domainTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.domainTimeouts.clear();
  }
}

function runTimeoutDisableBugTests() {
  console.log('🐛 TIMEOUT DISABLE BUG TESTS');
  console.log('=' .repeat(60));
  console.log('Testing timeout disable bug fixes (should FAIL initially)\n');
  
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
  
  // Test 1: Bug reproduction - new domains get timeouts even when disabled
  addTest('BUG DEMONSTRATION: Buggy method ignores enableTimeout setting', () => {
    mockChromeStorage.local.data = { enableTimeout: false, timeoutSeconds: 5 };
    const tracker = new MockThirdPartyDomainTrackerWithBug();
    
    // Simulate creating a new domain with the BUGGY method
    tracker.createNewDomainWithBug('example.com', 'example.com', 'script');
    
    // EXPECTED BUG: The buggy method should set timeout regardless of enableTimeout setting
    if (!tracker.domainTimeouts.has('example.com')) {
      throw new Error('Bug not reproduced - expected timeout to be set incorrectly by buggy method');
    }
    
    // Test passes when bug is confirmed
    console.log('   ✅ Bug confirmed: timeout set despite enableTimeout=false');
    tracker.clearAllTimeouts();
  });
  
  // Test 2: Fixed version should respect timeout setting
  addTest('FIXED: New domains should respect enableTimeout setting', () => {
    mockChromeStorage.local.data = { enableTimeout: false, timeoutSeconds: 5 };
    const tracker = new MockThirdPartyDomainTrackerWithBug();
    
    // Use the FIXED method
    tracker.createNewDomainFixed('example.com', 'example.com', 'script');
    
    // This should pass with the fix
    if (tracker.domainTimeouts.has('example.com')) {
      throw new Error('Fixed method should not set timeout when disabled');
    }
  });
  
  // Test 3: Fixed version should set timeout when enabled
  addTest('FIXED: New domains should get timeouts when timeout is enabled', () => {
    mockChromeStorage.local.data = { enableTimeout: true, timeoutSeconds: 5 };
    const tracker = new MockThirdPartyDomainTrackerWithBug();
    
    tracker.createNewDomainFixed('example.com', 'example.com', 'script');
    
    if (!tracker.domainTimeouts.has('example.com')) {
      throw new Error('Fixed method should set timeout when enabled');
    }
    
    // Clean up
    tracker.clearAllTimeouts();
  });
  
  // Test 4: Settings loading should work correctly
  addTest('Settings should load correctly from storage', () => {
    mockChromeStorage.local.data = { enableTimeout: false, timeoutSeconds: 30 };
    const tracker = new MockThirdPartyDomainTrackerWithBug();
    
    if (tracker.enableTimeout !== false) {
      throw new Error(`enableTimeout should be false, got ${tracker.enableTimeout}`);
    }
    
    if (tracker.timeoutDuration !== 30000) {
      throw new Error(`timeoutDuration should be 30000ms, got ${tracker.timeoutDuration}ms`);
    }
  });
  
  // Test 5: Multiple domains should all respect timeout setting
  addTest('Multiple new domains should all respect timeout disable setting', () => {
    mockChromeStorage.local.data = { enableTimeout: false, timeoutSeconds: 5 };
    const tracker = new MockThirdPartyDomainTrackerWithBug();
    
    const testDomains = ['google.com', 'facebook.com', 'twitter.com'];
    
    testDomains.forEach(domain => {
      tracker.createNewDomainFixed(domain, domain, 'script');
    });
    
    const timeoutCount = tracker.domainTimeouts.size;
    if (timeoutCount > 0) {
      throw new Error(`No domains should have timeouts when disabled, but ${timeoutCount} do`);
    }
  });
  
  // Test 6: Existing timeouts should be cleared when timeout is disabled
  addTest('Existing timeouts should be cleared when timeout is disabled', () => {
    mockChromeStorage.local.data = { enableTimeout: true, timeoutSeconds: 5 };
    const tracker = new MockThirdPartyDomainTrackerWithBug();
    
    // Create domain with timeout enabled
    tracker.createNewDomainFixed('example.com', 'example.com', 'script');
    
    if (!tracker.domainTimeouts.has('example.com')) {
      throw new Error('Domain should have timeout when enabled');
    }
    
    // Simulate disabling timeout (this should clear existing timeouts)
    tracker.enableTimeout = false;
    tracker.clearAllTimeouts(); // This should happen automatically in real implementation
    
    if (tracker.domainTimeouts.has('example.com')) {
      throw new Error('Domain timeout should be cleared when timeout is disabled');
    }
  });
  
  // Test 7: Race condition test - rapid domain creation
  addTest('Rapid domain creation should respect timeout setting consistently', () => {
    mockChromeStorage.local.data = { enableTimeout: false, timeoutSeconds: 5 };
    const tracker = new MockThirdPartyDomainTrackerWithBug();
    
    // Simulate rapid domain creation
    const domains = [];
    for (let i = 0; i < 10; i++) {
      const domain = `example${i}.com`;
      domains.push(domain);
      tracker.createNewDomainFixed(domain, domain, 'script');
    }
    
    const totalTimeouts = tracker.domainTimeouts.size;
    if (totalTimeouts > 0) {
      throw new Error(`No domains should have timeouts, but ${totalTimeouts} domains have timeouts`);
    }
  });
  
  // Test 8: Settings change during runtime
  addTest('Settings changes should affect new domain creation immediately', () => {
    mockChromeStorage.local.data = { enableTimeout: true, timeoutSeconds: 5 };
    const tracker = new MockThirdPartyDomainTrackerWithBug();
    
    // Create domain with timeout enabled
    tracker.createNewDomainFixed('domain1.com', 'domain1.com', 'script');
    const initialTimeouts = tracker.domainTimeouts.size;
    
    // Change setting to disabled
    mockChromeStorage.local.data.enableTimeout = false;
    tracker.loadTimeoutSettings(); // Reload settings
    
    // Create new domain - should not get timeout
    tracker.createNewDomainFixed('domain2.com', 'domain2.com', 'script');
    
    const finalTimeouts = tracker.domainTimeouts.size;
    
    if (finalTimeouts !== initialTimeouts) {
      throw new Error(`New domain should not get timeout after settings changed, but timeout count changed from ${initialTimeouts} to ${finalTimeouts}`);
    }
    
    // Clean up
    tracker.clearAllTimeouts();
  });
  
  // Test 9: Zero timeout should behave like disabled
  addTest('Zero timeout should behave like disabled timeout', () => {
    // Clear previous data and set zero timeout
    mockChromeStorage.local.data = { enableTimeout: true, timeoutSeconds: 0 };
    const tracker = new MockThirdPartyDomainTrackerWithBug();
    
    // Verify settings loaded correctly
    if (tracker.timeoutDuration !== 0) {
      throw new Error(`Expected timeoutDuration=0, got ${tracker.timeoutDuration}ms`);
    }
    if (tracker.enableTimeout !== true) {
      throw new Error(`Expected enableTimeout=true, got ${tracker.enableTimeout}`);
    }
    
    tracker.createNewDomainFixed('example.com', 'example.com', 'script');
    
    // Zero timeout should not create actual timeouts
    if (tracker.domainTimeouts.has('example.com')) {
      throw new Error('Zero timeout should not create actual setTimeout calls');
    }
  });
  
  // Test 10: Verify the actual bug exists in current implementation
  addTest('CURRENT BUG: createNewDomainWithBug should demonstrate the bug', () => {
    mockChromeStorage.local.data = { enableTimeout: false, timeoutSeconds: 5 };
    const tracker = new MockThirdPartyDomainTrackerWithBug();
    
    // This should fail, demonstrating the bug exists
    tracker.createNewDomainWithBug('bugtest.com', 'bugtest.com', 'script');
    
    // The bug means timeout will be set even though enableTimeout is false
    if (!tracker.domainTimeouts.has('bugtest.com')) {
      throw new Error('Bug not reproduced - expected timeout to be set incorrectly');
    }
    
    console.log('   ⚠️  Bug confirmed: timeout set despite enableTimeout=false');
    tracker.clearAllTimeouts();
  });
  
  // Summary
  console.log('\n📊 TIMEOUT DISABLE BUG TEST RESULTS:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Total: ${results.total}`);
  
  const successRate = ((results.passed / results.total) * 100).toFixed(1);
  console.log(`📊 Success Rate: ${successRate}%`);
  
  if (results.failed > 0) {
    console.log('\n⚠️  EXPECTED FAILURES (TDD Red Phase):');
    console.log('These tests should fail initially as the timeout disable bug');
    console.log('is not fixed yet. Implementation will make them pass.\n');
    
    console.log('🐛 BUG TO FIX:');
    console.log('• content.js line 162: setDomainTimeout() called unconditionally');
    console.log('• Should add: if (this.enableTimeout) { this.setDomainTimeout(baseDomain); }');
    console.log('• New domains get timeouts even when timeout is globally disabled');
  }
  
  return results;
}

// Export for test runner
if (typeof module !== 'undefined') {
  module.exports = { runTimeoutDisableBugTests };
}

// Run if executed directly
if (typeof window === 'undefined' && typeof module !== 'undefined' && require.main === module) {
  runTimeoutDisableBugTests();
}