// popup.js - handles interaction with the extension's popup, sends requests to the
// service worker (background.js), and updates the popup's UI (popup.html) on completion.
const { Voy } = await import("voy-search");

const inputElement = document.getElementById('text');
const outputElement = document.getElementById('output');
const clippy_button = document.getElementById('ask-clippyllm');

const getPageContent = () => {
    const page_url = document.URL;
    const clone = document.body.cloneNode(true);
    console.log("getPageContent clone",clone)

    const tagsToRemove = ['script', 'style', 'meta', 'noscript'];
    tagsToRemove.forEach(tag => {
      const elements = clone.getElementsByTagName(tag);
      while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
      }
    });

    // Rimuovere stili inline
    const allElements = clone.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
        allElements[i].removeAttribute('style');
    }
    let text = '';
    const nodeIterator = document.createNodeIterator(clone, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while (node = nodeIterator.nextNode()) {
      text += node.textContent;
      if (node.parentNode.nodeName === 'DIV') {
        text += '\n';
      }
    }
    console.log("Text: ",text)
    return [text, page_url];

  }

  function splitText(text, maxLength = 512) {
    let sentences = text.split(/(?<=[.!?])\s+|\n+/);
    sentences = sentences.map(s => s.trim()).filter(sentence => sentence.trim().length > 0);
    console.log("sentences: ",sentences)
    return sentences;
}
// Listen for changes made to the textbox.
clippy_button.addEventListener('click', (event) => {
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        console.log("Execute Script", inputElement.value);
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: getPageContent
        }, (page_content) => {
            const [dom, page_url] = page_content[0].result;
           
            console.log("Content", page_content)
            const phrases = splitText(dom);
        
            // Create text embeddings
            const embedding_message = {
                action: 'embed',
                text: phrases,
                url: page_url
            }
            chrome.runtime.sendMessage(embedding_message, (data) => {
                // Handle results returned by the service worker (`background.js`) and update the popup's UI.
                const resource = { embeddings: data};
                const index = new Voy(resource);
                const q = event.target.value;
        
                const embedding_message_query = {
                    action: 'embed',
                    text: [q],
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
                        context: context
                    }
                    chrome.runtime.sendMessage(question_message, (answer) => {
                        console.log("Answer", answer)
                        outputElement.innerText = JSON.stringify(answer, null, 2);
                    });
                });

                
               
            });

        });
      }); 

  return;

    // Bundle the input data into a message.
    const message = {
        action: 'summarize',
        text: event.target.value,
    }

    // Send this message to the service worker.
    chrome.runtime.sendMessage(message, (response) => {
        // Handle results returned by the service worker (`background.js`) and update the popup's UI.
        outputElement.innerText = JSON.stringify(response, null, 2);
    });

});
