let isEnabled = true;
let tabDomains = new Map();

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ 
    enabled: true,
    timeoutSeconds: 5,
    enableTimeout: true
  });
});

chrome.storage.local.get(['enabled'], (result) => {
  isEnabled = result.enabled !== false;
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) {
    isEnabled = changes.enabled.newValue;
  }
});

function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

function getBaseDomain(domain) {
  if (!domain) return null;
  const parts = domain.split('.');
  if (parts.length < 2) return domain;
  
  // Check if second-to-last part suggests multi-part TLD (≤ 3 characters)
  // This handles country code TLDs like .co.in, .com.au, .co.uk, .org.au
  if (parts.length >= 3 && parts[parts.length - 2].length <= 3) {
    return parts.slice(-3).join('.');
  }
  
  // Default to 2-part domain for standard TLDs
  return parts.slice(-2).join('.');
}

function isTrackingDomain(url, domain) {
  const trackingPatterns = [
    // Common tracking/analytics keywords in URL
    /tracking/i, /analytics/i, /ads/i, /pixel/i, /beacon/i, /metrics/i, 
    /telemetry/i, /collect/i, /events/i, /conversion/i, /tag/i, /gtm/i,
    
    // Common advertising/analytics file patterns
    /\/ga\.js/i, /\/gtag/i, /\/gtm\.js/i, /\/analytics/i, /\/track/i,
    /\/pixel/i, /\/beacon/i, /\/conversion/i, /\/ads/i, /\/adnxs/i
  ];
  
  const knownTrackingDomains = [
    'google-analytics.com', 'googletagmanager.com', 'googleapis.com',
    'facebook.com', 'connect.facebook.net', 'doubleclick.net',
    'googlesyndication.com', 'amazon-adsystem.com', 'adsystem.amazon.com',
    'twitter.com', 'analytics.twitter.com', 'linkedin.com', 'ads.linkedin.com',
    'microsoft.com', 'bing.com', 'adobe.com', 'omtrdc.net',
    'hotjar.com', 'fullstory.com', 'mixpanel.com', 'segment.com',
    'amplitude.com', 'intercom.io', 'zendesk.com', 'drift.com',
    'hubspot.com', 'salesforce.com', 'pardot.com', 'marketo.com',
    'mailchimp.com', 'constantcontact.com', 'criteo.com', 'outbrain.com',
    'taboola.com', 'quantserve.com', 'scorecardresearch.com',
    'comscore.com', 'nielsen.com', 'chartbeat.com', 'newrelic.com'
  ];
  
  const baseDomain = getBaseDomain(domain);
  
  if (knownTrackingDomains.includes(baseDomain)) {
    return true;
  }
  
  return trackingPatterns.some(pattern => pattern.test(url));
}

function isThirdPartyDomain(requestDomain, tabDomain) {
  if (!requestDomain || !tabDomain) return false;
  
  return getBaseDomain(requestDomain) !== getBaseDomain(tabDomain);
}

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!isEnabled || details.tabId === -1) return;
    
    const requestDomain = extractDomain(details.url);
    if (!requestDomain) return;
    
    chrome.tabs.get(details.tabId, (tab) => {
      if (chrome.runtime.lastError || !tab.url) return;
      
      const tabDomain = extractDomain(tab.url);
      if (!tabDomain) return;
      
      if (isThirdPartyDomain(requestDomain, tabDomain) && isTrackingDomain(details.url, requestDomain)) {
        const baseDomain = getBaseDomain(requestDomain);
        console.log("new domain identified");
        chrome.tabs.sendMessage(details.tabId, {
          type: 'THIRD_PARTY_DOMAIN',
          domain: baseDomain,
          fullDomain: requestDomain,
          resourceType: details.type,
          timestamp: Date.now()
        }).catch(() => {});
      }
    });
  },
  {
    urls: ["<all_urls>"],
    types: ["script", "xmlhttprequest", "image", "stylesheet", "font", "media", "sub_frame"]
  }
);

chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId === 0) {
    tabDomains.set(details.tabId, extractDomain(details.url));
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabDomains.delete(tabId);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_ENABLED_STATE') {
    sendResponse({ enabled: isEnabled });
  }
});