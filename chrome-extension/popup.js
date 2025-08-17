document.addEventListener('DOMContentLoaded', function() {
  const toggleSwitch = document.getElementById('toggleSwitch');
  const statusDiv = document.getElementById('status');
  
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
  
  chrome.storage.local.get(['enabled'], function(result) {
    const enabled = result.enabled !== false;
    updateUI(enabled);
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
  
  chrome.storage.onChanged.addListener(function(changes) {
    if (changes.enabled) {
      updateUI(changes.enabled.newValue);
    }
  });
});