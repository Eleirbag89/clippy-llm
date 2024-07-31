// content.js - the content scripts which is run in the context of web pages, and has access
// to the DOM and other web APIs.

// Example usage:
// const message = {
//     action: 'classify',
//     text: 'text to classify',
// }
// chrome.runtime.sendMessage(message, (response) => {
//     console.log('received user data', response)
// });

// content.js
const DOUBLE_NEWLINE = '\n\n';

const extractTextWithNewlines = (element) => {
    let text = '';

    element.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
            const trimmedText = child.textContent.trim();
            if (trimmedText) {
                text += trimmedText + ' ';
            }
        } else if (child.nodeType === Node.ELEMENT_NODE) {
            if (child.tagName === 'BR') {
                text += '\n';
            } else if (['DIV', 'P'].includes(child.tagName)) {
                text += extractTextWithNewlines(child).trim() + DOUBLE_NEWLINE;
            } else if (child.tagName === 'TABLE') {
                const rows = child.querySelectorAll('tr');
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td, th');
                    cells.forEach((cell, index) => {
                        text += extractTextWithNewlines(cell).trim();
                        if (index < cells.length - 1) {
                            text += ' ';  // Separatore di celle
                        }
                    });
                    text += '\n';  // Fine riga della tabella
                });
                text += DOUBLE_NEWLINE;  // Fine tabella
            } else if (['UL', 'OL'].includes(child.tagName)) {
                const items = child.querySelectorAll('li');
                items.forEach(item => {
                    text += '- ' + extractTextWithNewlines(item).trim() + '\n';
                });
                text += DOUBLE_NEWLINE;  // Fine lista
            } else if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(child.tagName)) {
                text += '\n' + child.textContent.trim() + '\n';  // Aggiungere nuova linea per separare il titolo dal paragrafo
            } else if (child.tagName === 'BLOCKQUOTE') {
                text += '“' + extractTextWithNewlines(child).trim() + '”' + DOUBLE_NEWLINE;
            } else if (child.tagName === 'IMG') {
                const altText = child.getAttribute('alt');
                if (altText) {
                    text += altText.trim() + DOUBLE_NEWLINE;
                }
            } else {
                text += extractTextWithNewlines(child).trim() + ' ';
            }
        }
    });

    return text.trim();
  };

const getPageContent = () => {
    const page_url = document.URL;
    const clone = document.cloneNode(true);
    console.log("getPageContent clone",clone)
    
    const elementsToRemove = [
      'script', 
      'style', 
      'meta', 
      'noscript',
      'header', 
      'footer', 
      'nav', 
      'aside', 
      '.sidebar', 
      '.advertisement', 
      '.ads', 
      '.menu', 
      '.navbar', 
      '.header', 
      '.footer',
      '[class*="nav"]',
      '[style*="display: none"]'

    ];
    elementsToRemove.forEach(selector => {
      const elements = clone.querySelectorAll(selector);
      elements.forEach(element => element.remove());
    });

    // Rimuovere stili inline
    const allElements = clone.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
        allElements[i].removeAttribute('style');
    }

    let text = extractTextWithNewlines(clone.body).replace(/\n\s*\n/g, DOUBLE_NEWLINE).trim();


    console.log("Text: ",text)
    return [text.trim(), page_url];

  }

  function splitLongStrings(arr, soglia) {
    let result = [];

    arr.forEach(element => {
        if (element.length > soglia) {
            // Spezza l'elemento in parti di lunghezza soglia
            for (let i = 0; i < element.length; i += soglia) {
                result.push(element.slice(i, i + soglia));
            }
        } else {
            // Aggiungi l'elemento al risultato se è più corto o uguale alla soglia
            result.push(element);
        }
    });

    return result;
}

  function splitText(text) {
    return text.split(DOUBLE_NEWLINE).map(paragraph => paragraph.trim()).filter(paragraph => paragraph.length > 5);
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "executeContentScript") {
        (async function () {
            // Esegui il codice desiderato
            console.log("Messaggio ricevuto dal popup!");
        
            const [dom, page_url] = getPageContent();

            const phrases = splitLongStrings(splitText(dom), 512);
            const process_message = {
                action: 'process',
                text: phrases,
                url: page_url,
                tab: request.tab,
                query: request.query
            }

            sendMessageToServiceWorker(process_message, (data) => {
                console.log("Answer", data)
                sendResponse({ response: data });
                chrome.storage.local.set({ isProcessing: false })
            });
        }
    )();
    return true;

    }
  });

  
function sendMessageToServiceWorker(message, callback, retries = 5) {
    if (retries < 1) {
      console.error('Non è possibile stabilire la connessione al service worker.');
      return;
    }
    
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('Tentativo fallito, riprovando...', chrome.runtime.lastError);
        setTimeout(() => {
          sendMessageToServiceWorker(message, callback, retries - 1);
        }, 1000); // Ritenta dopo 1 secondo
      } else {
        callback(response);
      }
    });
  }
