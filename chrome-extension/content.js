class ThirdPartyDomainTracker {
  constructor() {
    this.container = null;
    this.domains = new Map();
    this.subdomainCounts = new Map();
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

  addDomainTag(baseDomain, fullDomain, resourceType) {
    if (!this.isEnabled) return;

    const existingTag = this.domains.get(baseDomain);
    if (existingTag) {
      clearTimeout(existingTag.timeout);
      this.updateTagCount(existingTag.element, baseDomain, fullDomain);
    } else {
      this.createNewTag(baseDomain, fullDomain, resourceType);
    }

    const tag = this.domains.get(baseDomain);
    const timeout = setTimeout(() => {
      this.removeDomainTag(baseDomain);
    }, 30000);

    tag.timeout = timeout;
  }

  createNewTag(baseDomain, fullDomain, resourceType) {
    const tag = document.createElement('div');
    tag.className = 'tpd-tag';
    tag.setAttribute('data-domain', baseDomain);
    
    const domainSpan = document.createElement('span');
    domainSpan.className = 'tpd-domain-name';
    domainSpan.textContent = baseDomain;
    
    const countSpan = document.createElement('span');
    countSpan.className = 'tpd-count';
    countSpan.textContent = '1';
    
    const typeSpan = document.createElement('span');
    typeSpan.className = 'tpd-type';
    typeSpan.textContent = this.getResourceTypeIcon(resourceType);
    typeSpan.title = resourceType;
    
    tag.appendChild(typeSpan);
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

  getResourceTypeIcon(type) {
    const icons = {
      'script': '🔗',
      'xmlhttprequest': '📡',
      'image': '🖼️',
      'stylesheet': '🎨',
      'font': '🔤',
      'media': '🎵'
    };
    return icons[type] || '📄';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ThirdPartyDomainTracker();
  });
} else {
  new ThirdPartyDomainTracker();
}