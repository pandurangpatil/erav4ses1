class ThirdPartyDomainTracker {
  constructor() {
    this.container = null;
    this.domains = new Map();
    this.subdomainCounts = new Map();
    this.faviconCache = new Map();
    this.colorClasses = ['color-orange', 'color-vista-bleu', 'color-amande', 'color-bleu-oxford'];
    this.isEnabled = true;
    this.init();
  }

  init() {
    this.createContainer();
    this.setupMessageListener();
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
        this.addDomainTag(message.domain, message.fullDomain, message.resourceType);
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

  async addDomainTag(baseDomain, fullDomain, resourceType) {
    if (!this.isEnabled) return;

    const existingTag = this.domains.get(baseDomain);
    if (existingTag) {
      clearTimeout(existingTag.timeout);
      this.updateTagCount(existingTag.element, baseDomain, fullDomain);
      
      const timeout = setTimeout(() => {
        this.removeDomainTag(baseDomain);
      }, 30000);
      existingTag.timeout = timeout;
    } else {
      await this.createNewTag(baseDomain, fullDomain, resourceType);
      
      const tag = this.domains.get(baseDomain);
      if (tag) {
        const timeout = setTimeout(() => {
          this.removeDomainTag(baseDomain);
        }, 30000);
        tag.timeout = timeout;
      }
    }
  }

  async createNewTag(baseDomain, fullDomain, resourceType) {
    const tag = document.createElement('div');
    const colorClass = this.getDomainColorClass(baseDomain);
    tag.className = `tpd-tag ${colorClass}`;
    tag.setAttribute('data-domain', baseDomain);
    
    const domainSpan = document.createElement('span');
    domainSpan.className = 'tpd-domain-name';
    domainSpan.textContent = baseDomain;
    
    const countSpan = document.createElement('span');
    countSpan.className = 'tpd-count';
    countSpan.textContent = '1';
    
    const iconContainer = document.createElement('span');
    iconContainer.className = 'tpd-type';
    
    try {
      const faviconSrc = await this.loadFavicon(baseDomain);
      
      if (faviconSrc.startsWith('http')) {
        const favicon = document.createElement('img');
        favicon.className = 'tpd-favicon';
        favicon.src = faviconSrc;
        favicon.alt = baseDomain;
        favicon.title = `${baseDomain} - ${resourceType}`;
        iconContainer.appendChild(favicon);
      } else {
        iconContainer.textContent = faviconSrc;
        iconContainer.title = `${baseDomain} - ${resourceType}`;
      }
    } catch (error) {
      iconContainer.textContent = '🌐';
      iconContainer.title = `${baseDomain} - ${resourceType}`;
    }
    
    tag.appendChild(iconContainer);
    tag.appendChild(domainSpan);
    tag.appendChild(countSpan);
    
    this.container.appendChild(tag);
    
    setTimeout(() => {
      tag.classList.add('tpd-visible');
    }, 10);

    this.subdomainCounts.set(baseDomain, new Set([fullDomain]));
    
    this.domains.set(baseDomain, {
      element: tag,
      count: 1,
      timeout: null
    });
  }

  updateTagCount(tagElement, baseDomain, fullDomain) {
    const domainData = this.domains.get(baseDomain);
    
    if (domainData) {
      const subdomains = this.subdomainCounts.get(baseDomain);
      subdomains.add(fullDomain);
      
      domainData.count++;
      const countSpan = tagElement.querySelector('.tpd-count');
      countSpan.textContent = domainData.count;
      
      tagElement.classList.add('tpd-pulse');
      setTimeout(() => {
        tagElement.classList.remove('tpd-pulse');
      }, 300);
    }
  }

  removeDomainTag(domain) {
    const domainData = this.domains.get(domain);
    if (!domainData) return;

    const tag = domainData.element;
    tag.classList.add('tpd-removing');
    
    setTimeout(() => {
      if (tag.parentNode) {
        tag.parentNode.removeChild(tag);
      }
      this.domains.delete(domain);
      this.subdomainCounts.delete(domain);
    }, 300);

    if (domainData.timeout) {
      clearTimeout(domainData.timeout);
    }
  }

  clearAllTags() {
    this.domains.forEach((data, domain) => {
      if (data.timeout) {
        clearTimeout(data.timeout);
      }
      if (data.element.parentNode) {
        data.element.parentNode.removeChild(data.element);
      }
    });
    this.domains.clear();
    this.subdomainCounts.clear();
  }

}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ThirdPartyDomainTracker();
  });
} else {
  new ThirdPartyDomainTracker();
}