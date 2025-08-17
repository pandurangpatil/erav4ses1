class ThirdPartyDomainTracker {
  constructor() {
    this.container = null;
    this.isEnabled = true;
    this.debugMode = false;
    
    // Producer-Consumer Queue Architecture
    this.domainQueue = [];                    // FIFO queue for domain events
    this.processingInterval = null;           // Consumer timer
    this.processingRate = 50;                 // Process queue every 50ms
    
    // Consumer-only state (single-threaded access)
    this.displayedDomains = new Map();        // Currently displayed domains
    this.domainTimeouts = new Map();          // Timeout IDs for each domain
    this.subdomainCounts = new Map();         // Subdomain tracking per base domain
    
    // Shared resources (read-only after init)
    this.faviconCache = new Map();
    this.colorClasses = ['color-orange', 'color-vista-bleu', 'color-amande', 'color-bleu-oxford'];
    
    this.init();
  }

  init() {
    this.createContainer();
    this.setupMessageListener();
    this.startQueueConsumer();
    this.checkEnabledState();
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
        // PRODUCER: Enqueue domain event (thread-safe)
        this.enqueueDomainEvent(message.domain, message.fullDomain, message.resourceType);
      }
    });

    chrome.storage.onChanged.addListener((changes) => {
      if (changes.enabled) {
        this.isEnabled = changes.enabled.newValue;
        if (!this.isEnabled) {
          this.clearAllTags();
        }
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

  // =================== PRODUCER METHODS (Multi-threaded safe) ===================
  
  enqueueDomainEvent(baseDomain, fullDomain, resourceType) {
    if (!this.isEnabled) return;
    
    const domainEvent = {
      baseDomain: baseDomain,
      fullDomain: fullDomain,
      resourceType: resourceType,
      timestamp: Date.now()
    };
    
    // Thread-safe enqueue operation
    this.domainQueue.push(domainEvent);
    
    if (this.debugMode) {
      console.log(`[TPD Producer] Enqueued: ${baseDomain} (queue size: ${this.domainQueue.length})`);
    }
  }

  // =================== CONSUMER METHODS (Single-threaded) ===================
  
  startQueueConsumer() {
    // Single consumer thread via setInterval
    this.processingInterval = setInterval(() => {
      this.processQueueItem();
    }, this.processingRate);
    
    if (this.debugMode) {
      console.log(`[TPD Consumer] Started with ${this.processingRate}ms interval`);
    }
  }

  processQueueItem() {
    if (!this.isEnabled || this.domainQueue.length === 0) {
      return;
    }
    
    // FIFO dequeue - single consumer, no race conditions
    const domainEvent = this.domainQueue.shift();
    
    if (this.debugMode) {
      console.log(`[TPD Consumer] Processing: ${domainEvent.baseDomain} (queue remaining: ${this.domainQueue.length})`);
    }
    
    this.processDomainEvent(domainEvent);
  }

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
    if (subdomains.size > previousSize) {
      existingDomain.count++;
      this.updateDomainCounter(baseDomain, existingDomain);
    }
    
    // Set fresh timeout
    this.setDomainTimeout(baseDomain);
  }

  createNewDomain(baseDomain, fullDomain, resourceType) {
    if (this.debugMode) {
      console.log(`[TPD Consumer] Creating new domain: ${baseDomain}`);
    }
    
    try {
      // Create domain tag synchronously with placeholder icon
      const tagElement = this.createDomainTag(baseDomain, fullDomain, resourceType);
      
      // Register domain in consumer state immediately
      this.displayedDomains.set(baseDomain, {
        element: tagElement,
        count: 1,
        resourceType: resourceType
      });
      
      // Initialize subdomain tracking
      this.subdomainCounts.set(baseDomain, new Set([fullDomain]));
      
      // Set timeout for removal
      this.setDomainTimeout(baseDomain);
      
      // Load favicon in background (non-blocking)
      this.loadFaviconInBackground(baseDomain, tagElement);
      
    } catch (error) {
      console.error(`[TPD Consumer] Error creating domain ${baseDomain}:`, error);
    }
  }

  createDomainTag(baseDomain, fullDomain, resourceType) {
    const tag = document.createElement('div');
    const colorClass = this.getDomainColorClass(baseDomain);
    tag.className = `tpd-tag ${colorClass}`;
    tag.setAttribute('data-domain', baseDomain);
    
    // Create domain name span
    const domainSpan = document.createElement('span');
    domainSpan.className = 'tpd-domain-name';
    domainSpan.textContent = baseDomain;
    
    // Create count span
    const countSpan = document.createElement('span');
    countSpan.className = 'tpd-count';
    countSpan.textContent = '1';
    
    // Create favicon container with placeholder
    const iconContainer = document.createElement('span');
    iconContainer.className = 'tpd-type';
    iconContainer.textContent = '🌐'; // Placeholder icon
    iconContainer.title = `${baseDomain} - ${resourceType}`;
    
    // Assemble tag
    tag.appendChild(iconContainer);
    tag.appendChild(domainSpan);
    tag.appendChild(countSpan);
    
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
    
    if (this.debugMode) {
      console.log(`[TPD Consumer] Updated counter for ${baseDomain}: ${domainData.count}`);
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

  // =================== TIMEOUT MANAGEMENT (Consumer only) ===================
  
  setDomainTimeout(baseDomain) {
    const timeoutId = setTimeout(() => {
      this.removeDomain(baseDomain);
    }, 5000);
    
    this.domainTimeouts.set(baseDomain, timeoutId);
    
    if (this.debugMode) {
      console.log(`[TPD Consumer] Set timeout for: ${baseDomain}`);
    }
  }

  clearDomainTimeout(baseDomain) {
    const timeoutId = this.domainTimeouts.get(baseDomain);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.domainTimeouts.delete(baseDomain);
      
      if (this.debugMode) {
        console.log(`[TPD Consumer] Cleared timeout for: ${baseDomain}`);
      }
    }
  }

  removeDomain(baseDomain) {
    const domainData = this.displayedDomains.get(baseDomain);
    if (!domainData) {
      if (this.debugMode) {
        console.log(`[TPD Consumer] Attempted to remove non-existent domain: ${baseDomain}`);
      }
      return;
    }

    if (this.debugMode) {
      console.log(`[TPD Consumer] Removing domain: ${baseDomain}`);
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
    this.domainQueue.length = 0; // Clear queue
    
    if (this.debugMode) {
      console.log(`[TPD Consumer] All tags cleared`);
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

  // =================== UTILITY METHODS ===================
  
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
    // Stop consumer
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    // Clear all tags
    this.clearAllTags();
    
    if (this.debugMode) {
      console.log(`[TPD] Destroyed tracker`);
    }
  }
}

// Initialize the tracker
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ThirdPartyDomainTracker();
  });
} else {
  new ThirdPartyDomainTracker();
}