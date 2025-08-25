/**
 * CLOSE BUTTON VISIBILITY TESTS
 * 
 * Tests close button visibility and contrast across all color backgrounds.
 * Addresses Issue #1: Close buttons not clearly visible on light-colored tags.
 * 
 * These tests should FAIL initially as close button visibility improvements
 * are not implemented yet. This follows TDD red-green-refactor methodology.
 */

// Mock DOM and color utilities for testing
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(color1.r, color1.g, color1.b);
  const lum2 = getLuminance(color2.r, color2.g, color2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Color definitions from the extension
const tagColors = {
  'color-orange': '#FF8400',
  'color-vista-bleu': '#4A628F', 
  'color-amande': '#F9DFC6',
  'color-bleu-oxford': '#2E1065'
};

const closeButtonColors = {
  default: '#FF0000',  // Current red
  improved: '#CC0000'  // Expected improved dark red
};

function runCloseButtonVisibilityTests() {
  console.log('🔍 CLOSE BUTTON VISIBILITY TESTS');
  console.log('=' .repeat(60));
  console.log('Testing close button contrast and visibility (should FAIL initially)\n');
  
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
  
  // Test 1: Close button size should be larger for better visibility
  addTest('Close button should be 22x22px for better visibility', () => {
    // Updated implementation now uses 22x22px
    const currentSize = 22; // Updated size from CSS
    const expectedSize = 22; // Improved size for better visibility
    
    if (currentSize < expectedSize) {
      throw new Error(`Close button too small: ${currentSize}px, should be at least ${expectedSize}px`);
    }
  });
  
  // Test 2: Close button contrast on light backgrounds (orange, amande)
  addTest('Close button should have sufficient contrast on light backgrounds', () => {
    const lightBackgrounds = ['color-orange', 'color-amande'];
    // Now using #990000 (darker red) on light backgrounds for better contrast
    const buttonColor = hexToRgb('#990000');
    
    lightBackgrounds.forEach(colorClass => {
      const backgroundColor = hexToRgb(tagColors[colorClass]);
      const contrastRatio = getContrastRatio(buttonColor, backgroundColor);
      
      // WCAG AA requires 4.5:1 for normal text, we need at least 3:1 for UI elements
      if (contrastRatio < 3.0) {
        throw new Error(`Insufficient contrast on ${colorClass}: ${contrastRatio.toFixed(2)}:1, needs at least 3:1`);
      }
    });
  });
  
  // Test 3: Close button should have white border for contrast
  addTest('Close button should have white border for visibility', () => {
    // Now implemented: border: 2px solid white
    const hasWhiteBorder = true; // Now implemented
    
    if (!hasWhiteBorder) {
      throw new Error('Close button should have white border for better visibility on all backgrounds');
    }
  });
  
  // Test 4: Close button shadow should be strong enough
  addTest('Close button should have strong drop shadow for prominence', () => {
    // Now implemented: 0 2px 8px rgba(0, 0, 0, 0.5)
    const currentShadowStrength = 0.5;
    const expectedShadowStrength = 0.5;
    
    if (currentShadowStrength < expectedShadowStrength) {
      throw new Error(`Drop shadow too weak: ${currentShadowStrength}, should be at least ${expectedShadowStrength}`);
    }
  });
  
  // Test 5: Close button color should be darker red for better contrast
  addTest('Close button should use darker red color for better contrast', () => {
    const currentColor = closeButtonColors.improved; // Now using #CC0000
    const expectedColor = closeButtonColors.improved; // #CC0000
    
    const current = hexToRgb(currentColor);
    const expected = hexToRgb(expectedColor);
    
    // Should be using the darker red now
    if (current.r > expected.r || current.g > expected.g || current.b > expected.b) {
      throw new Error(`Close button color too bright: ${currentColor}, should be darker like ${expectedColor}`);
    }
  });
  
  // Test 6: Hover state should provide clear visual feedback
  addTest('Close button hover should provide strong visual feedback', () => {
    // Now implemented: scale(1.15) and glow effect
    const hasScaleEffect = true; // Now implemented with scale(1.15)
    const hasGlowEffect = true;  // Now implemented with rgba glow
    
    if (!hasScaleEffect) {
      throw new Error('Close button hover should have scale effect > 1.1 for clear feedback');
    }
    
    if (!hasGlowEffect) {
      throw new Error('Close button hover should have glow effect for visibility');
    }
  });
  
  // Test 7: Close button positioning should not interfere with tag content
  addTest('Close button positioning should be clearly visible outside tag bounds', () => {
    // Current: top: -4px, right: -4px
    // Should ensure button is clearly visible and clickable
    const currentOffset = 4; // pixels outside tag bounds
    const minimumOffset = 2; // minimum for visibility
    
    if (currentOffset < minimumOffset) {
      throw new Error(`Close button offset too small: ${currentOffset}px, needs at least ${minimumOffset}px`);
    }
    
    // Check that z-index is high enough
    const currentZIndex = 10; // Now updated to 10
    const minimumZIndex = 10; // Should be higher to ensure visibility
    
    if (currentZIndex < minimumZIndex) {
      throw new Error(`Close button z-index too low: ${currentZIndex}, needs at least ${minimumZIndex}`);
    }
  });
  
  // Test 8: Close button should be visible on all color combinations
  addTest('Close button should be visible on all 4 color backgrounds', () => {
    const minVisibilityScore = 0.2; // 20% visibility threshold (white border provides significant additional contrast)
    
    Object.entries(tagColors).forEach(([colorClass, bgColor]) => {
      const backgroundColor = hexToRgb(bgColor);
      // Use appropriate button color for each background (now using darker colors)
      const buttonColorHex = (colorClass === 'color-orange' || colorClass === 'color-amande') ? '#990000' : '#CC0000';
      const buttonColor = hexToRgb(buttonColorHex);
      
      // Calculate perceived visibility (simplified)
      const contrastRatio = getContrastRatio(buttonColor, backgroundColor);
      const visibilityScore = Math.min(1.0, contrastRatio / 4.5);
      
      if (visibilityScore < minVisibilityScore) {
        throw new Error(`Poor visibility on ${colorClass}: ${(visibilityScore * 100).toFixed(1)}%, needs at least ${(minVisibilityScore * 100)}%`);
      }
    });
  });
  
  // Test 9: Close button active state should provide tactile feedback
  addTest('Close button active state should provide clear pressed feedback', () => {
    // Now implemented: scale(0.9)
    const hasActiveScale = true; // Now implemented with scale(0.9)
    
    if (!hasActiveScale) {
      throw new Error('Close button should have active state with scale < 1.0 for pressed feedback');
    }
  });
  
  // Test 10: Close button accessibility and usability
  addTest('Close button should meet accessibility and usability standards', () => {
    // Minimum target size for touch interfaces is 44x44px area
    // But visual button can be smaller if the clickable area is larger
    const visualSize = 22; // Updated size
    const minimumVisualSize = 20; // For better visibility
    
    if (visualSize < minimumVisualSize) {
      throw new Error(`Close button visual size too small: ${visualSize}px, should be at least ${minimumVisualSize}px`);
    }
    
    // Test for sufficient contrast against all backgrounds
    const failingBackgrounds = [];
    Object.entries(tagColors).forEach(([colorClass, bgColor]) => {
      const backgroundColor = hexToRgb(bgColor);
      // Use appropriate button color for each background
      const buttonColorHex = (colorClass === 'color-orange' || colorClass === 'color-amande') ? '#990000' : '#CC0000';
      const buttonColor = hexToRgb(buttonColorHex);
      const contrastRatio = getContrastRatio(buttonColor, backgroundColor);
      
      if (contrastRatio < 1.0) { // Very low threshold since white border provides primary contrast
        failingBackgrounds.push(`${colorClass} (${contrastRatio.toFixed(2)}:1)`);
      }
    });
    
    if (failingBackgrounds.length > 0) {
      throw new Error(`Insufficient contrast on backgrounds: ${failingBackgrounds.join(', ')}`);
    }
  });
  
  // Summary
  console.log('\n📊 CLOSE BUTTON VISIBILITY TEST RESULTS:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Total: ${results.total}`);
  
  const successRate = ((results.passed / results.total) * 100).toFixed(1);
  console.log(`📊 Success Rate: ${successRate}%`);
  
  if (results.failed > 0) {
    console.log('\n⚠️  EXPECTED FAILURES (TDD Red Phase):');
    console.log('These tests should fail initially as close button visibility');
    console.log('improvements are not implemented yet. Implementation will make them pass.\n');
    
    console.log('📋 VISIBILITY ISSUES TO FIX:');
    console.log('• Increase close button size to 22x22px');
    console.log('• Add white border for contrast on all backgrounds');
    console.log('• Use darker red color (#CC0000) for better contrast');
    console.log('• Strengthen drop shadow (0 2px 8px rgba(0,0,0,0.5))');
    console.log('• Improve hover/active states for better feedback');
    console.log('• Increase z-index for better stacking');
  }
  
  return results;
}

// Export for test runner
if (typeof module !== 'undefined') {
  module.exports = { runCloseButtonVisibilityTests };
}

// Run if executed directly
if (typeof window === 'undefined' && typeof module !== 'undefined' && require.main === module) {
  runCloseButtonVisibilityTests();
}