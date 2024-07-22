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
        }        
    });
    
  });
  
  let db;
let currentPage = 1;
const itemsPerPage = 10;
let uniqueKeys = [];

document.addEventListener('DOMContentLoaded', () => {
  openDatabase();
  document.getElementById('prev-page').addEventListener('click', showPreviousPage);
  document.getElementById('next-page').addEventListener('click', showNextPage);
  document.getElementById('delete-selected').addEventListener('click', deleteSelectedItems);
});

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
      <td>${item.page}</td>
      <td><button class="clippy-btn-delete" data-key="${item.page}">Delete</button></td>
    `;
    tbody.appendChild(row);
  });

  document.querySelectorAll('.delete-button').forEach(button => {
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
    console.log(event)
    const key = event.target.dataset.key;
    const transaction = db.transaction(['embeddings'], 'readwrite');
    const objectStore = transaction.objectStore('embeddings');
    const index = objectStore.index('page');
    const request = index.getAll(IDBKeyRange.only(key));
  
    request.onsuccess = (event) => {
      const items = event.target.result;
      console.log(items)
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
  