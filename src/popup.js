const inputElement = document.getElementById('text');
const outputElement = document.getElementById('output');
const clippy_button = document.getElementById('ask-clippyllm');

// Listen for changes made to the textbox.
clippy_button.addEventListener('click', (event) => {
    chrome.storage.local.set({ isProcessing: false })
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let activeTab = tabs[0];
      
      // Invia un messaggio al contenuto della scheda attiva
      chrome.tabs.sendMessage(activeTab.id, { message: "executeContentScript", query: inputElement.value, tab: activeTab.id  }, (data) => {
        console.log("Answer PopUp", data)
        outputElement.innerText = data.response;
        chrome.storage.local.set({ isProcessing: false })
      });
    });
      
  return;

});
