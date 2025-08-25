document.addEventListener('DOMContentLoaded', function() {
  const toggleSwitch = document.getElementById('toggleSwitch');
  const statusDiv = document.getElementById('status');
  const timeoutInput = document.getElementById('timeoutInput');
  const noTimeoutCheckbox = document.getElementById('noTimeoutCheckbox');
  const timeoutSection = document.getElementById('timeoutSection');
  
  function updateUI(enabled) {
    if (enabled) {
      toggleSwitch.classList.add('active');
      statusDiv.className = 'status enabled';
      statusDiv.textContent = 'Monitoring active - Domain tags will appear on web pages';
    } else {
      toggleSwitch.classList.remove('active');
      statusDiv.className = 'status disabled';
      statusDiv.textContent = 'Monitoring disabled - No domain tags will be shown';
    }
  }
  
  function updateTimeoutUI(enableTimeout, timeoutSeconds) {
    noTimeoutCheckbox.checked = !enableTimeout;
    timeoutInput.value = timeoutSeconds || 5;
    
    if (enableTimeout) {
      timeoutSection.classList.remove('hidden');
    } else {
      timeoutSection.classList.add('hidden');
    }
  }
  
  chrome.storage.local.get(['enabled', 'timeoutSeconds', 'enableTimeout'], function(result) {
    const enabled = result.enabled !== false;
    const timeoutSeconds = result.timeoutSeconds || 5;
    const enableTimeout = result.enableTimeout !== false;
    
    updateUI(enabled);
    updateTimeoutUI(enableTimeout, timeoutSeconds);
  });
  
  toggleSwitch.addEventListener('click', function() {
    chrome.storage.local.get(['enabled'], function(result) {
      const currentState = result.enabled !== false;
      const newState = !currentState;
      
      chrome.storage.local.set({ enabled: newState }, function() {
        updateUI(newState);
        
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: 'TOGGLE_CHANGED',
              enabled: newState
            }).catch(() => {});
          }
        });
      });
    });
  });
  
  // Timeout configuration event listeners
  noTimeoutCheckbox.addEventListener('change', function() {
    const enableTimeout = !this.checked;
    
    chrome.storage.local.set({ enableTimeout }, function() {
      updateTimeoutUI(enableTimeout, timeoutInput.value);
      
      // Notify content scripts of timeout setting change
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'TIMEOUT_CHANGED',
            enableTimeout,
            timeoutSeconds: parseInt(timeoutInput.value)
          }).catch(() => {});
        }
      });
    });
  });
  
  timeoutInput.addEventListener('change', function() {
    let seconds = parseInt(this.value);
    
    // Validate input range
    if (isNaN(seconds) || seconds < 1) {
      seconds = 1;
      this.value = 1;
    } else if (seconds > 300) {
      seconds = 300;
      this.value = 300;
    }
    
    chrome.storage.local.set({ timeoutSeconds: seconds }, function() {
      // Notify content scripts of timeout change
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'TIMEOUT_CHANGED',
            enableTimeout: !noTimeoutCheckbox.checked,
            timeoutSeconds: seconds
          }).catch(() => {});
        }
      });
    });
  });
  
  chrome.storage.onChanged.addListener(function(changes) {
    if (changes.enabled) {
      updateUI(changes.enabled.newValue);
    }
    if (changes.timeoutSeconds || changes.enableTimeout) {
      const timeoutSeconds = changes.timeoutSeconds?.newValue || timeoutInput.value;
      const enableTimeout = changes.enableTimeout?.newValue !== false;
      updateTimeoutUI(enableTimeout, timeoutSeconds);
    }
  });
});