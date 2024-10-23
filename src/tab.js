const clippy_button = document.getElementById('ask-clippyllm');
const clippy_switch = document.getElementById('clippy-switch');
const external_links = document.querySelectorAll('.external-link');

let db;
let currentPage = 1;
const itemsPerPage = 10;
let uniqueKeys = [];



document.addEventListener('DOMContentLoaded', function () {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    chrome.storage.local.get(['isProcessing'], function(data) {
      console.log("Processing", data)  
      clippy_button.disabled = data.isProcessing;
    });
    chrome.storage.local.get(['hideClippy'], function(data) {
      console.log("HideClippy", data)  
      if (data.hideClippy){
        clippy_switch.innerText = "Show clippy";
      } else {
        clippy_switch.innerText = "Hide clippy";
      }
      
    });
       
  
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        displayData();
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
            console.log("NV", newValue)
        }        
    });

    openDatabase();
    document.getElementById('prev-page').addEventListener('click', showPreviousPage);
    document.getElementById('next-page').addEventListener('click', showNextPage);
    document.getElementById('delete-selected').addEventListener('click', deleteSelectedItems);
    document.getElementById('reset-storage').addEventListener('click', reset_storage);
    clippy_switch.addEventListener('click', switchClippy);
    external_links.forEach(link => {
      const location = link.getAttribute('href');
      link.addEventListener('click', (e) => {
        e.preventDefault()
        chrome.tabs.create({active: true, url: location})
    });
    });
  }, { once: true });
  


function openDatabase() {
  const request = indexedDB.open('clippy_db', 1);
  
  request.onsuccess = (event) => {
    db = event.target.result;
    displayData();
  };

  request.onerror = (event) => {
    console.error('Database error:', event.target.error);
  };
}

function reset_storage() {
  chrome.storage.local.set({ isProcessing: false })
}

function displayData() {
  const transaction = db.transaction(['embeddings'], 'readonly');
  const objectStore = transaction.objectStore('embeddings');
  const index = objectStore.index('page');
  const request = index.getAll();

  request.onsuccess = (event) => {
    const allItems = event.target.result;
    uniqueKeys  = getUniqueKeys(allItems);
    paginateData();
  };
}

function getUniqueKeys(data) {
    const keySet = new Set();
    return data.filter(item => {
      if (!keySet.has(item.page)) {
        keySet.add(item.page);
        return true;
      }
      return false;
    });
  }

function paginateData() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = uniqueKeys.slice(startIndex, endIndex);
    populateTable(paginatedItems);
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = endIndex >= uniqueKeys.length;
}

function populateTable(items) {
  const tbody = document.querySelector('#data-table tbody');
  tbody.innerHTML = '';

  items.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="checkbox" class="select-item" data-key="${item.page}"></td>
      <td class="table-site-url">${item.page}</td>
      <td><button class="clippy-btn-delete" data-key="${item.page}">Delete</button></td>
    `;
    tbody.appendChild(row);
  });

  document.querySelectorAll('.clippy-btn-delete').forEach(button => {
    button.addEventListener('click', deleteItem);
  });
}

function showPreviousPage() {
  if (currentPage > 1) {
    currentPage--;
    displayData();
  }
}

function showNextPage() {
    const startIndex = currentPage * itemsPerPage;
    if (startIndex < uniqueKeys.length) {
      currentPage++;
      paginateData();
    }
}
function deleteItem(event) {
    const key = event.target.dataset.key;
    const transaction = db.transaction(['embeddings'], 'readwrite');
    const objectStore = transaction.objectStore('embeddings');
    const index = objectStore.index('page');
    const request = index.getAll(IDBKeyRange.only(key));
  
    request.onsuccess = (event) => {
      const items = event.target.result;
      items.forEach(item => {
        objectStore.delete(item.url); // Supponendo che 'id' sia la chiave primaria
      });
      transaction.oncomplete = () => {
        displayData();
      };
    };
  }
  
  function deleteSelectedItems() {
    const selectedItems = document.querySelectorAll('.select-item:checked');
    const transaction = db.transaction(['embeddings'], 'readwrite');
    const objectStore = transaction.objectStore('embeddings');
    let deleteCount = 0;
  
    selectedItems.forEach(item => {
      const key = item.dataset.key;
      const index = objectStore.index('page');
      const request = index.getAll(IDBKeyRange.only(key));
  
      request.onsuccess = (event) => {
        const items = event.target.result;
        items.forEach(item => {
          objectStore.delete(item.url); // Supponendo che 'id' sia la chiave primaria
        });
        deleteCount++;
  
        if (deleteCount === selectedItems.length) {
          transaction.oncomplete = () => {
            displayData();
          };
        }
      };
    });
  }
  
function switchClippy(){
  chrome.storage.local.get(['hideClippy'], function(data) {
    console.log("sitchCLippy", data)  
    chrome.storage.local.set({ hideClippy: !data?.hideClippy })
    if (data.hideClippy){
      clippy_switch.innerText = "Hide clippy";
    } else {
      clippy_switch.innerText = "Show clippy";
    }
    
  });
}