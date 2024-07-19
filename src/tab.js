const clippy_button = document.getElementById('ask-clippyllm');

document.addEventListener('DOMContentLoaded', function () {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    console.log("AAAAA", tabs, contents);
    chrome.storage.local.get(['isProcessing'], function(data) {
        clippy_button.disabled = data.isProcessing;
    });
       
  
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
  
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
  
        contents.forEach(content => {
          if (content.id === target) {
            content.classList.add('active');
          } else {
            content.classList.remove('active');
          }
        });
      });
    });


    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (changes["isProcessing"]) {
            const { _, newValue } = changes['isProcessing'];
            clippy_button.disabled = newValue;
        }        
    });
    
  });
  