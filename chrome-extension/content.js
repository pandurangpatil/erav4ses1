class ThirdPartyDomainTracker {
  constructor() {
    this.container = null;
    this.isEnabled = true;
    this.debugMode = true;
    
    // Timeout configuration
    this.timeoutDuration = 5000; // Default 5 seconds
    this.enableTimeout = true;
    
    // Dynamic width configuration
    this.MIN_TAG_WIDTH = 280; // pixels
    this.MAX_TAG_WIDTH = 400; // pixels
    
    // Domain state management (Chrome runtime handles single-threading)
    this.displayedDomains = new Map();        // Currently displayed domains
    this.domainTimeouts = new Map();          // Timeout IDs for each domain
    this.subdomainCounts = new Map();         // Subdomain tracking per base domain
    
    // Shared resources
    this.faviconCache = new Map();
    this.colorClasses = ['color-orange', 'color-vista-bleu', 'color-amande', 'color-bleu-oxford'];
    
    this.init();
  }

  init() {
    this.createContainer();
    this.setupMessageListener();
    this.checkEnabledState();
    this.loadTimeoutSettings();
  }

  createContainer() {
    this.container = document.createElement('div');
    this.container.id = 'tpd-monitor-container';
    this.container.className = 'tpd-container';
    document.body.appendChild(this.container);
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'THIRD_PARTY_DOMAIN' && this.isEnabled) {
        // Direct synchronous consumer processing
        this.processDomainEvent({
          baseDomain: message.domain,
          fullDomain: message.fullDomain,
          resourceType: message.resourceType,
          timestamp: Date.now()
        });
      } else if (message.type === 'TIMEOUT_CHANGED') {
        this.updateTimeoutSettings(message.timeoutSeconds, message.enableTimeout);
      }
    });

    chrome.storage.onChanged.addListener((changes) => {
      if (changes.enabled) {
        this.isEnabled = changes.enabled.newValue;
        if (!this.isEnabled) {
          this.clearAllTags();
        }
      }
      if (changes.timeoutSeconds || changes.enableTimeout) {
        const timeoutSeconds = changes.timeoutSeconds?.newValue || (this.timeoutDuration / 1000);
        const enableTimeout = changes.enableTimeout?.newValue !== false;
        this.updateTimeoutSettings(timeoutSeconds, enableTimeout);
      }
    });
  }

  checkEnabledState() {
    chrome.runtime.sendMessage({ type: 'GET_ENABLED_STATE' }, (response) => {
      if (response) {
        this.isEnabled = response.enabled;
      }
    });
  }
  
  loadTimeoutSettings() {
    chrome.storage.local.get(['timeoutSeconds', 'enableTimeout'], (result) => {
      this.timeoutDuration = (result.timeoutSeconds || 5) * 1000;
      this.enableTimeout = result.enableTimeout !== false;
      
      if (this.debugMode) {
        console.log(`[TPD] Loaded timeout settings: ${this.timeoutDuration}ms, enabled: ${this.enableTimeout}`);
      }
    });
  }
  
  updateTimeoutSettings(timeoutSeconds, enableTimeout) {
    this.timeoutDuration = (timeoutSeconds || 5) * 1000;
    this.enableTimeout = enableTimeout !== false;
    
    if (this.debugMode) {
      console.log(`[TPD] Updated timeout settings: ${this.timeoutDuration}ms, enabled: ${this.enableTimeout}`);
    }
    
    // Update existing tags based on timeout settings
    if (this.enableTimeout) {
      this.setTimeoutsForExistingTags();
    } else {
      this.clearAllTimeouts();
    }
    
    // Ensure all existing tags have close buttons (always visible)
    this.addCloseButtonsToExistingTags();
  }

  // =================== DOMAIN PROCESSING (Chrome runtime single-threaded) ===================
  
  processDomainEvent(domainEvent) {
    const { baseDomain, fullDomain, resourceType } = domainEvent;
    
    const existingDomain = this.displayedDomains.get(baseDomain);
    
    if (existingDomain) {
      // Update existing domain
      this.updateExistingDomain(baseDomain, fullDomain, existingDomain);
    } else {
      // Create new domain label (synchronously)
      this.createNewDomain(baseDomain, fullDomain, resourceType);
    }
  }

  updateExistingDomain(baseDomain, fullDomain, existingDomain) {
    if (this.debugMode) {
      console.log(`[TPD Consumer] Updating existing domain: ${baseDomain}`);
    }
    
    // Clear existing timeout
    this.clearDomainTimeout(baseDomain);
    
    // Update subdomain counts
    const subdomains = this.subdomainCounts.get(baseDomain);
    const previousSize = subdomains.size;
    subdomains.add(fullDomain);
    
    // Update counter only if new subdomain
    existingDomain.count++;
    this.updateDomainCounter(baseDomain, existingDomain);
    
    
    // Set fresh timeout only if timeout is enabled
    if (this.enableTimeout && this.timeoutDuration > 0) {
      this.setDomainTimeout(baseDomain);
    }
  }

  createNewDomain(baseDomain, fullDomain, resourceType) {
    if (this.debugMode) {
      console.log(`[TPD] Creating new domain: ${baseDomain}`);
    }
    
    try {
      // Create domain tag synchronously with placeholder icon
      const tagElement = this.createDomainTag(baseDomain, fullDomain, resourceType);
      
      // Register domain in state immediately
      this.displayedDomains.set(baseDomain, {
        element: tagElement,
        count: 1,
        resourceType: resourceType
      });
      
      // Initialize subdomain tracking
      this.subdomainCounts.set(baseDomain, new Set([fullDomain]));
      
      // Set timeout for removal only if timeout is enabled and duration > 0
      if (this.enableTimeout && this.timeoutDuration > 0) {
        this.setDomainTimeout(baseDomain);
      }
      
      // Load favicon in background (non-blocking)
      this.loadFaviconInBackground(baseDomain, tagElement);
      
    } catch (error) {
      console.error(`[TPD] Error creating domain ${baseDomain}:`, error);
    }
  }

  createDomainTag(baseDomain, fullDomain, resourceType) {
    const tag = document.createElement('div');
    const colorClass = this.getDomainColorClass(baseDomain);
    tag.className = `tpd-tag ${colorClass}`;
    tag.setAttribute('data-domain', baseDomain);
    
    // Calculate and apply optimal width
    const optimalWidth = this.calculateOptimalTagWidth(baseDomain, 1);
    tag.style.width = `${optimalWidth}px`;
    
    // Create favicon container with placeholder
    const iconContainer = document.createElement('span');
    iconContainer.className = 'tpd-type';
    iconContainer.textContent = '🌐'; // Placeholder icon
    iconContainer.title = `${baseDomain} - ${resourceType}`;
    
    // Create domain name span
    const domainSpan = document.createElement('span');
    domainSpan.className = 'tpd-domain-name';
    domainSpan.textContent = baseDomain;
    
    // Create count span
    const countSpan = document.createElement('span');
    countSpan.className = 'tpd-count';
    countSpan.textContent = '1';
    
    // Create close button (always visible regardless of timeout setting)
    const closeButton = this.createCloseButton(baseDomain);
    
    // Assemble tag in order: icon → domain → count → close button
    tag.appendChild(iconContainer);
    tag.appendChild(domainSpan);
    tag.appendChild(countSpan);
    tag.appendChild(closeButton);
    
    // Add to DOM
    this.container.appendChild(tag);
    
    // Trigger entrance animation
    setTimeout(() => {
      tag.classList.add('tpd-visible');
    }, 10);

    return tag;
  }

  updateDomainCounter(baseDomain, domainData) {
    const countSpan = domainData.element.querySelector('.tpd-count');
    countSpan.textContent = domainData.count;
    
    // Recalculate width for new count
    const optimalWidth = this.calculateOptimalTagWidth(baseDomain, domainData.count);
    domainData.element.style.width = `${optimalWidth}px`;
    
    if (this.debugMode) {
      console.log(`[TPD] Updated counter for ${baseDomain}: ${domainData.count}, width: ${optimalWidth}px`);
    }
    
    // Trigger counter animation
    const tagElement = domainData.element;
    tagElement.classList.remove('tpd-pulse', 'tpd-counter-update');
    
    // Force reflow
    void tagElement.offsetWidth;
    
    // Add animation classes
    tagElement.classList.add('tpd-pulse', 'tpd-counter-update');
    
    setTimeout(() => {
      tagElement.classList.remove('tpd-pulse', 'tpd-counter-update');
    }, 600);
  }

  // =================== TIMEOUT MANAGEMENT ===================
  
  setDomainTimeout(baseDomain) {
    if (!this.enableTimeout || this.timeoutDuration <= 0) {
      if (this.debugMode) {
        console.log(`[TPD] Timeout disabled or zero, skipping timeout for: ${baseDomain}`);
      }
      return;
    }
    
    const timeoutId = setTimeout(() => {
      this.removeDomain(baseDomain);
    }, this.timeoutDuration);
    
    this.domainTimeouts.set(baseDomain, timeoutId);
    
    if (this.debugMode) {
      console.log(`[TPD] Set timeout for: ${baseDomain} (${this.timeoutDuration}ms)`);
    }
  }

  clearDomainTimeout(baseDomain) {
    const timeoutId = this.domainTimeouts.get(baseDomain);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.domainTimeouts.delete(baseDomain);
      
      if (this.debugMode) {
        console.log(`[TPD] Cleared timeout for: ${baseDomain}`);
      }
    }
  }

  removeDomain(baseDomain) {
    const domainData = this.displayedDomains.get(baseDomain);
    if (!domainData) {
      if (this.debugMode) {
        console.log(`[TPD] Attempted to remove non-existent domain: ${baseDomain}`);
      }
      return;
    }

    if (this.debugMode) {
      console.log(`[TPD] Removing domain: ${baseDomain}`);
    }

    const tag = domainData.element;
    
    // Clear timeout
    this.clearDomainTimeout(baseDomain);
    
    // Remove from state immediately (prevent race conditions)
    this.displayedDomains.delete(baseDomain);
    this.subdomainCounts.delete(baseDomain);
    
    // Trigger removal animation
    tag.classList.add('tpd-removing');
    
    // Remove from DOM after animation
    setTimeout(() => {
      if (tag && tag.parentNode) {
        try {
          tag.parentNode.removeChild(tag);
          if (this.debugMode) {
            console.log(`[TPD Consumer] Successfully removed DOM element for: ${baseDomain}`);
          }
        } catch (error) {
          console.error(`[TPD Consumer] Error removing DOM element for ${baseDomain}:`, error);
        }
      }
    }, 300);
  }

  clearAllTags() {
    if (this.debugMode) {
      console.log(`[TPD Consumer] Clearing all tags (${this.displayedDomains.size} total)`);
    }
    
    // Clear all timeouts
    this.domainTimeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    
    // Remove all DOM elements
    this.displayedDomains.forEach((data, domain) => {
      if (data.element && data.element.parentNode) {
        try {
          data.element.parentNode.removeChild(data.element);
        } catch (error) {
          console.error(`[TPD Consumer] Error removing element for ${domain}:`, error);
        }
      }
    });
    
    // Clear all state
    this.displayedDomains.clear();
    this.domainTimeouts.clear();
    this.subdomainCounts.clear();
    
    if (this.debugMode) {
      console.log(`[TPD] All tags cleared`);
    }
  }

  // =================== BACKGROUND FAVICON LOADING ===================
  
  loadFaviconInBackground(baseDomain, tagElement) {
    // Check if domain still exists (might have been removed)
    if (!this.displayedDomains.has(baseDomain)) {
      return;
    }
    
    // Load favicon asynchronously (non-blocking)
    this.loadFavicon(baseDomain).then(faviconSrc => {
      // Check again if domain still exists
      if (!this.displayedDomains.has(baseDomain)) {
        return;
      }
      
      const iconContainer = tagElement.querySelector('.tpd-type');
      if (!iconContainer) return;
      
      // Update icon with loaded favicon
      if (faviconSrc.startsWith('http')) {
        // Clear placeholder text
        iconContainer.textContent = '';
        
        // Create favicon image
        const favicon = document.createElement('img');
        favicon.className = 'tpd-favicon';
        favicon.src = faviconSrc;
        favicon.alt = baseDomain;
        favicon.title = iconContainer.title; // Preserve existing title
        iconContainer.appendChild(favicon);
      } else {
        // Use fallback emoji
        iconContainer.textContent = faviconSrc;
      }
    }).catch(error => {
      if (this.debugMode) {
        console.log(`[TPD Background] Favicon load failed for ${baseDomain}:`, error);
      }
      // Keep placeholder icon on error
    });
  }

  // =================== CLOSE BUTTON MANAGEMENT ===================
  
  createCloseButton(baseDomain) {
    const closeBtn = document.createElement('button');
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
    if (this.debugMode) {
      console.log(`[TPD] Manually removing domain: ${baseDomain}`);
    }
    
    this.removeDomain(baseDomain);
  }
  
  addCloseButtonsToExistingTags() {
    this.displayedDomains.forEach((domainData, baseDomain) => {
      const tag = domainData.element;
      if (!tag.querySelector('.tpd-close-btn')) {
        const closeButton = this.createCloseButton(baseDomain);
        tag.insertBefore(closeButton, tag.firstChild);
      }
    });
    
    if (this.debugMode) {
      console.log(`[TPD] Added close buttons to ${this.displayedDomains.size} existing tags`);
    }
  }
  
  removeCloseButtonsFromExistingTags() {
    this.displayedDomains.forEach((domainData, baseDomain) => {
      const tag = domainData.element;
      const closeButton = tag.querySelector('.tpd-close-btn');
      if (closeButton) {
        closeButton.remove();
      }
    });
    
    if (this.debugMode) {
      console.log(`[TPD] Removed close buttons from ${this.displayedDomains.size} existing tags`);
    }
  }
  
  clearAllTimeouts() {
    this.domainTimeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.domainTimeouts.clear();
    
    if (this.debugMode) {
      console.log(`[TPD] Cleared all timeouts`);
    }
  }
  
  setTimeoutsForExistingTags() {
    this.displayedDomains.forEach((domainData, baseDomain) => {
      if (!this.domainTimeouts.has(baseDomain)) {
        this.setDomainTimeout(baseDomain);
      }
    });
    
    if (this.debugMode) {
      console.log(`[TPD] Set timeouts for ${this.displayedDomains.size} existing tags`);
    }
  }

  // =================== UTILITY METHODS ===================
  
  measureTextWidth(text, fontSize = 12) {
    // Create temporary canvas to measure actual text width
    if (!this.measurementCanvas) {
      this.measurementCanvas = document.createElement('canvas');
      this.measurementContext = this.measurementCanvas.getContext('2d');
    }
    
    // Set font to match domain tag styling
    this.measurementContext.font = `500 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif`;
    
    return this.measurementContext.measureText(text).width;
  }
  
  calculateOptimalTagWidth(domainText, count) {
    // Calculate text content width
    const domainWidth = this.measureTextWidth(domainText, 12);
    const countText = count.toString();
    const countWidth = this.measureTextWidth(countText, 10);
    
    // Add padding for:
    // - Icon: ~22px (favicon + margin)
    // - Left/right padding: ~24px (12px each side)
    // - Count badge: max(30px, countWidth + 12px padding)
    // - Close button inline: 18px + 6px margin = 24px
    // - Extra margin for spacing: 16px
    const iconWidth = 22;
    const padding = 24;
    const countBadgeWidth = Math.max(30, countWidth + 12);
    const closeButtonSpace = 24; // Inline close button (18px + 6px margin)
    const extraMargin = 16;
    
    const totalWidth = domainWidth + iconWidth + padding + countBadgeWidth + closeButtonSpace + extraMargin;
    
    // Apply min/max constraints
    return Math.max(this.MIN_TAG_WIDTH, Math.min(this.MAX_TAG_WIDTH, Math.ceil(totalWidth)));
  }
  
  getDomainColorClass(domain) {
    let hash = 0;
    for (let i = 0; i < domain.length; i++) {
      const char = domain.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const index = Math.abs(hash) % this.colorClasses.length;
    return this.colorClasses[index];
  }

  getFaviconUrl(domain) {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
  }

  loadFavicon(domain) {
    return new Promise((resolve) => {
      if (this.faviconCache.has(domain)) {
        resolve(this.faviconCache.get(domain));
        return;
      }

      const faviconUrl = this.getFaviconUrl(domain);
      const img = new Image();
      
      img.onload = () => {
        this.faviconCache.set(domain, faviconUrl);
        resolve(faviconUrl);
      };
      
      img.onerror = () => {
        const fallbackIcon = '🌐';
        this.faviconCache.set(domain, fallbackIcon);
        resolve(fallbackIcon);
      };
      
      img.src = faviconUrl;
      
      setTimeout(() => {
        if (!this.faviconCache.has(domain)) {
          const fallbackIcon = '🌐';
          this.faviconCache.set(domain, fallbackIcon);
          resolve(fallbackIcon);
        }
      }, 3000);
    });
  }

  // =================== CLEANUP ===================
  
  destroy() {
    // Clear all tags
    this.clearAllTags();
    
    // Cleanup measurement canvas
    if (this.measurementCanvas) {
      this.measurementCanvas = null;
      this.measurementContext = null;
    }
    
    // Remove global reference
    if (window.thirdPartyDomainTracker === this) {
      window.thirdPartyDomainTracker = null;
    }
    
    if (this.debugMode) {
      console.log(`[TPD] Destroyed tracker`);
    }
  }
}

// Prevent multiple instances
if (window.thirdPartyDomainTracker) {
  console.log('[TPD] Tracker already initialized');
} else {

  // Cleanup any existing containers
  const existing = document.getElementById('tpd-monitor-container');
  if (existing) {
    existing.remove();
    console.log('[TPD] Removed existing container');
  }

  // Safe initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.thirdPartyDomainTracker = new ThirdPartyDomainTracker();
      console.log('[TPD] Tracker initialized after DOMContentLoaded');
    });
  } else {
    window.thirdPartyDomainTracker = new ThirdPartyDomainTracker();
    console.log('[TPD] Tracker initialized immediately');
  }

}


