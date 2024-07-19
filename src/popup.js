// popup.js - handles interaction with the extension's popup, sends requests to the
// service worker (background.js), and updates the popup's UI (popup.html) on completion.
const { Voy } = await import("voy-search");

const inputElement = document.getElementById('text');
const outputElement = document.getElementById('output');
const clippy_button = document.getElementById('ask-clippyllm');
const DOUBLE_NEWLINE = '\n\n';

const getPageContent = () => {
  const DOUBLE_NEWLINE = '\n\n';
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
    console.log("Cloned", clone.body)
    let text = extractTextWithNewlines(clone.body).replace(/\n\s*\n/g, DOUBLE_NEWLINE).trim();


    console.log("Text: ",text)
    return [text.trim(), page_url];

  }

  function splitText(text, maxLength = 512) {
    return text.split(DOUBLE_NEWLINE).map(paragraph => paragraph.trim()).filter(paragraph => paragraph.length > 5);
}
// Listen for changes made to the textbox.
clippy_button.addEventListener('click', (event) => {
    chrome.storage.local.set({ isProcessing: true })

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        console.log("Execute Script", inputElement.value);
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: getPageContent
        }, (page_content) => {
            const [dom, page_url] = page_content[0].result;
            const tab_id = tabs[0].id
            console.log("Content", page_content)
            const phrases = splitText(dom);
        
            // Create text embeddings
            const embedding_message = {
                action: 'embed',
                text: phrases,
                url: page_url,
                tab: tab_id
            }
            chrome.runtime.sendMessage(embedding_message, (data) => {
                // Handle results returned by the service worker (`background.js`) and update the popup's UI.
                const resource = { embeddings: data};
                const index = new Voy(resource);
                const q = inputElement.value;
        
                const embedding_message_query = {
                    action: 'embed',
                    text: [q],
                    tab: tab_id
                }
                chrome.runtime.sendMessage(embedding_message_query, (processed) => {
                    const results = index.search(processed[0], 10);
                    console.log("Similarity", results.neighbors);
                    // Display search result
                    let context="";
                    results.neighbors.forEach((result) =>
                        context += `${result.title}\n`
                    );
                    const question_message = {
                        action: 'answer_question',
                        question: q,
                        context: context,
                        tab: tab_id
                    }
                    chrome.runtime.sendMessage(question_message, (answer) => {
                        console.log("Answer", answer)
                        outputElement.innerText = JSON.stringify(answer, null, 2);
                        chrome.storage.local.set({ isProcessing: false })
                    });
                });

                
               
            });

        });
      }); 
      
  return;

});
