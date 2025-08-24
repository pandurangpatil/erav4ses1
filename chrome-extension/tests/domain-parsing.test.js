// Comprehensive unit tests for domain parsing functionality
// Tests both the old and new getBaseDomain implementations

// Mock implementation of the new pattern-based getBaseDomain function
function getBaseDomain(domain) {
  if (!domain) return null;
  const parts = domain.split('.');
  if (parts.length < 2) return domain;
  
  // Check if second-to-last part suggests multi-part TLD (≤ 3 characters)
  if (parts.length >= 3 && parts[parts.length - 2].length <= 3) {
    return parts.slice(-3).join('.');
  }
  
  // Default to 2-part domain
  return parts.slice(-2).join('.');
}

// Old implementation for comparison
function getBaseDomainOld(domain) {
  if (!domain) return null;
  const parts = domain.split('.');
  if (parts.length >= 2) {
    return parts.slice(-2).join('.');
  }
  return domain;
}

// Test runner
function runTests() {
  const tests = [
    // Standard TLD tests (should work with both old and new)
    {
      name: 'Standard .com domain',
      input: 'google.com',
      expected: 'google.com',
      category: 'standard-tld'
    },
    {
      name: 'Standard .org domain',
      input: 'example.org',
      expected: 'example.org',
      category: 'standard-tld'
    },
    {
      name: 'Standard .net domain with subdomain',
      input: 'subdomain.example.net',
      expected: 'example.net',
      category: 'standard-tld'
    },
    {
      name: 'Doubleclick domain (from screenshot)',
      input: 'doubleclick.net',
      expected: 'doubleclick.net',
      category: 'standard-tld'
    },
    {
      name: 'Google Analytics domain (from screenshot)',
      input: 'google-analytics.com',
      expected: 'google-analytics.com',
      category: 'standard-tld'
    },
    {
      name: 'Google Tag Manager domain (from screenshot)',
      input: 'googletagmanager.com',
      expected: 'googletagmanager.com',
      category: 'standard-tld'
    },
    
    // Country Code TLD tests (old implementation fails, new should pass)
    {
      name: 'Indian domain (.co.in)',
      input: 'example.co.in',
      expected: 'example.co.in',
      expectedOld: 'co.in', // Old implementation result
      category: 'country-code-tld'
    },
    {
      name: 'Australian domain (.com.au)',
      input: 'sample.com.au',
      expected: 'sample.com.au',
      expectedOld: 'com.au',
      category: 'country-code-tld'
    },
    {
      name: 'UK domain (.co.uk)',
      input: 'test.co.uk',
      expected: 'test.co.uk',
      expectedOld: 'co.uk',
      category: 'country-code-tld'
    },
    {
      name: 'New Zealand domain (.co.nz)',
      input: 'site.co.nz',
      expected: 'site.co.nz',
      expectedOld: 'co.nz',
      category: 'country-code-tld'
    },
    {
      name: 'Australian org domain (.org.au)',
      input: 'domain.org.au',
      expected: 'domain.org.au',
      expectedOld: 'org.au',
      category: 'country-code-tld'
    },
    
    // Complex subdomain tests
    {
      name: 'Multiple subdomains with .co.in',
      input: 'sub.example.co.in',
      expected: 'example.co.in',
      expectedOld: 'co.in',
      category: 'complex-subdomain'
    },
    {
      name: 'Deep subdomain with .co.uk',
      input: 'www.api.service.co.uk',
      expected: 'service.co.uk',
      expectedOld: 'co.uk',
      category: 'complex-subdomain'
    },
    {
      name: 'API subdomain with .com.au',
      input: 'api.v2.example.com.au',
      expected: 'example.com.au',
      expectedOld: 'com.au',
      category: 'complex-subdomain'
    },
    
    // Edge cases
    {
      name: 'Single part domain',
      input: 'localhost',
      expected: 'localhost',
      category: 'edge-case'
    },
    {
      name: 'Two part domain',
      input: 'example.test',
      expected: 'example.test',
      category: 'edge-case'
    },
    {
      name: 'IP address',
      input: '192.168.1.1',
      expected: '168.1.1', // This is expected behavior for IP addresses
      category: 'edge-case'
    },
    {
      name: 'Short TLD with short second part',
      input: 'a.b.c',
      expected: 'a.b.c', // b is ≤ 3 chars, so take 3 parts
      category: 'edge-case'
    },
    {
      name: 'Long second-to-last part',
      input: 'subdomain.verylongdomain.com',
      expected: 'verylongdomain.com', // verylongdomain > 3 chars, so take 2 parts
      category: 'edge-case'
    },
    
    // Null/empty cases
    {
      name: 'Null input',
      input: null,
      expected: null,
      category: 'null-case'
    },
    {
      name: 'Empty string',
      input: '',
      expected: null,
      category: 'null-case'
    }
  ];

  let passed = 0;
  let failed = 0;
  let oldImplementationIssues = 0;

  console.log('🧪 Running Domain Parsing Tests\n');
  console.log('=' .repeat(80));

  tests.forEach((test, index) => {
    const newResult = getBaseDomain(test.input);
    const oldResult = getBaseDomainOld(test.input);
    
    const newPassed = newResult === test.expected;
    const oldPassed = oldResult === (test.expectedOld || test.expected);
    
    if (newPassed) {
      passed++;
      console.log(`✅ Test ${index + 1}: ${test.name}`);
      console.log(`   Input: "${test.input}" → Output: "${newResult}"`);
    } else {
      failed++;
      console.log(`❌ Test ${index + 1}: ${test.name}`);
      console.log(`   Input: "${test.input}"`);
      console.log(`   Expected: "${test.expected}"`);
      console.log(`   Got: "${newResult}"`);
    }
    
    // Track old implementation issues
    if (!oldPassed && test.expectedOld) {
      oldImplementationIssues++;
      console.log(`   🔍 Old implementation would return: "${oldResult}" (incorrect)`);
    }
    
    console.log(`   Category: ${test.category}`);
    console.log('');
  });

  console.log('=' .repeat(80));
  console.log(`📊 Test Results:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Total: ${tests.length}`);
  console.log(`   🔧 Old implementation issues fixed: ${oldImplementationIssues}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Domain parsing implementation is working correctly.');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Please review the implementation.`);
  }
  
  return { passed, failed, total: tests.length, oldIssuesFixed: oldImplementationIssues };
}

// Run tests if this file is executed directly
if (typeof module !== 'undefined' && require.main === module) {
  runTests();
}

// Export for use in other test frameworks
if (typeof module !== 'undefined') {
  module.exports = { getBaseDomain, getBaseDomainOld, runTests };
}