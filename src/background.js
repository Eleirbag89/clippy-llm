// background.js - Handles requests from the UI, runs the model, then sends back a response

import { pipeline, env} from '@xenova/transformers';
import { openDB } from 'idb';

// Skip initial check for local models, since we are not loading any local models.
env.allowLocalModels = false;

// Due to a bug in onnxruntime-web, we must disable multithreading for now.
// See https://github.com/microsoft/onnxruntime/issues/14445 for more information.
env.backends.onnx.wasm.numThreads = 1;
//env.backends.onnx.wasm.proxy = false;

const idb = {
    clippy_db: openDB("clippy_db", 1, {
        upgrade: (db) => {
            const store = db.createObjectStore('embeddings', { keyPath: 'url' });
            store.createIndex('page', 'page', { unique: false });

          }
      }),
  };

  async function add_embeddings(elements) {
    const db = await idb.clippy_db;
    const tx = db.transaction('embeddings', 'readwrite');
    const store = tx.objectStore('embeddings');
    elements.forEach(element => {
        store.put(element);
    });
    
    await tx.done;
  }

  async function get_embeddings(page) {
    const db = await idb.clippy_db;
    return await db.getAllFromIndex('embeddings', 'page', page );
  }

class SummarizePipelineSingleton {
    static task = 'summarization';
    static model = 'Xenova/t5-base';
    static instance = null;
    
    static async getInstance(progress_callback = null) {
        console.log("Singleton pipeline summary");
        if (this.instance === null) {
            this.instance = pipeline(this.task, this.model, { progress_callback });
        }

        return this.instance;
    }
}

class EmbeddingPipelineSingleton {
    static task = 'feature-extraction';
    static model = 'Xenova/all-MiniLM-L6-v2';
    static instance = null;
    
    static async getInstance(progress_callback = null) {
        console.log("Singleton pipeline embeddings");
        if (this.instance === null) {
            this.instance = pipeline(this.task, this.model, { progress_callback });
        }

        return this.instance;
    }
}


class QuestionAnsweringPipelineSingleton {
    static task = 'question-answering';
    static model = 'Xenova/distilbert-base-uncased-distilled-squad';
    static instance = null;
    
    static async getInstance(progress_callback = null) {
        console.log("Singleton pipeline question answering");
        if (this.instance === null) {
            this.instance = pipeline(this.task, this.model, { progress_callback });
        }

        return this.instance;
    }
}

const summarize = async (text) => {
    // Get the pipeline instance. This will load and build the model when run for the first time.
    console.log("SUMMARIZE METHOD")
    let generator = await SummarizePipelineSingleton.getInstance((data) => {
        // You can track the progress of the pipeline creation here.
        // e.g., you can send `data` back to the UI to indicate a progress bar
        console.log('progress', data)

        
    });

    // Actually run the model on the input text
    let result = await generator(text, {
        max_new_tokens: 100,
      });
    console.log("Summarize result", result)
    return result;
};

const embed = async (text, page_url, tab_id) => {
    // Get the pipeline instance. This will load and build the model when run for the first time.
    console.log("EMBED METHOD", page_url)
    console.log("TAB ID", tab_id)
    chrome.scripting.executeScript({
        target: { tabId: tab_id },    // Run in the tab that the user clicked in
        args: [],               // The arguments to pass to the function
        function: () => {       // The function to run
            window.agent.start_processing();
        },
    });
    if (page_url) {
        const embeddings = await get_embeddings(page_url);
        console.log("IndexDb emb", embeddings)
        if (embeddings && embeddings.length > 0) {
            return embeddings;
        }
         
    }
    let extractor = await EmbeddingPipelineSingleton.getInstance((data) => {
        // You can track the progress of the pipeline creation here.
        // e.g., you can send `data` back to the UI to indicate a progress bar
        console.log('progress', data)
        if (data.status == 'initiate') {
            chrome.scripting.executeScript({
                target: { tabId: tab_id },    // Run in the tab that the user clicked in
                args: [data],               // The arguments to pass to the function
                function: (data) => {       // The function to run
                    window.agent.speak("Loading model file" + data.file  + " for embedding", false);
                },
            });

        }
    });

    chrome.scripting.executeScript({
        target: { tabId: tab_id },    
        args: [],              
        function: () => {     
            window.agent.clear_text();
            window.agent.speak("Analyzing web page...");
        },
    });
    let result = (await extractor(text,  { pooling: 'mean', normalize: true })).tolist();
    console.log("EMBED result", result)
    const data = result.map(( emb , i) => ({
        id: String(i),
        title: text[i],
        url: `${page_url}/${i}`,
        page: `${page_url}`,
        embeddings: emb,
    }));
    if (page_url) {
        await add_embeddings(data);
    }
    chrome.scripting.executeScript({
        target: { tabId: tab_id },    
        args: [],              
        function: () => {    
            window.agent.clear_text();  
            window.agent.speak("Web page analisys done.");
        },
    });

    return data;
};

const answer_question = async (question, context, tab_id) => {
    // Get the pipeline instance. This will load and build the model when run for the first time.
    console.log("answer_question METHOD\nQuestion:", question, "\nContext: ", context)
    const generator = await QuestionAnsweringPipelineSingleton.getInstance((data) => {
        // You can track the progress of the pipeline creation here.
        // e.g., you can send `data` back to the UI to indicate a progress bar
        console.log('progress', data)
        if (data.status == 'initiate') {
            chrome.scripting.executeScript({
                target: { tabId: tab_id },    // Run in the tab that the user clicked in
                args: [data],               // The arguments to pass to the function
                function: (data) => {       // The function to run
                    
                    window.agent.speak("Loading model file" + data.file  + " for question answering");
                    window.agent.start_processing();
                },
            });

        } else if (data.status == 'ready') {
           
            chrome.scripting.executeScript({
                target: { tabId: tab_id },    // Run in the tab that the user clicked in
                args: [],               // The arguments to pass to the function
                function: () => {       // The function to run
                    window.agent.clear_text();
                    window.agent.speak("Processing your question...");
                },
            });

        }
    });

    const output =  await generator(question, context);
    console.log("output", output)
    const answer = output.answer
    chrome.scripting.executeScript({
        target: { tabId: tab_id },    // Run in the tab that the user clicked in
        args: [answer],               // The arguments to pass to the function
        function: (result) => {       // The function to run
            // NOTE: This function is run in the context of the web page, meaning that `document` is available.
            window.agent.end_processing();
            window.agent.clear_text();
            window.agent.play("Explain");
            window.agent.speak(result);
            
        },
    });
    return answer;

};

////////////////////// 1. Context Menus //////////////////////
//
// Add a listener to create the initial context menu items,
// context menu items only need to be created at runtime.onInstalled
chrome.runtime.onInstalled.addListener(function () {
    // Register a context menu item that will only show up for selection text.
    chrome.contextMenus.create({
        id: 'summarize-selection',
        title: 'Summarize "%s"',
        contexts: ['selection'],
    });
});

// Perform inference when the user clicks a context menu
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    // Ignore context menu clicks that are not for classifications (or when there is no input)
    if (info.menuItemId !== 'summarize-selection' || !info.selectionText) return;
    console.log("SUMMARIZE")
    chrome.scripting.executeScript({
        target: { tabId: tab.id },    // Run in the tab that the user clicked in
        args: [],               // The arguments to pass to the function
        function: () => {       // The function to run
            // NOTE: This function is run in the context of the web page, meaning that `document` is available.
            window.agent.start_processing();
        },
    });
    let timer = Date.now();

    // Perform classification on the selected text
    let result = await summarize(info.selectionText);
    let end_time = Math.floor((Date.now() -timer) / 1000)
    console.log("Time taken", end_time);
    chrome.scripting.executeScript({
        target: { tabId: tab.id },    // Run in the tab that the user clicked in
        args: [],               // The arguments to pass to the function
        function: () => {       // The function to run
            // NOTE: This function is run in the context of the web page, meaning that `document` is available.
            window.agent.end_processing();
        },
    });
    // Do something with the result
    chrome.scripting.executeScript({
        target: { tabId: tab.id },    // Run in the tab that the user clicked in
        args: [result],               // The arguments to pass to the function
        function: (result) => {       // The function to run
            // NOTE: This function is run in the context of the web page, meaning that `document` is available.
            console.log('result', result)
            console.log('document', document)
            console.log("summary_text", result[0].summary_text);
            window.agent.speak(result[0].summary_text);
            window.agent.play("Explain");
            console.log("Agent", window.agent)
        },
    });
});
//////////////////////////////////////////////////////////////

////////////////////// 2. Message Events /////////////////////
// 
// Listen for messages from the UI, process it, and send the result back.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('sender', sender)

    if (message.action == 'summarize') {
        // Run model prediction asynchronously
        (async function () {
            // Perform classification
            let result = await summarize(message.text);

            // Send response back to UI
            sendResponse(result);
        })();

        // return true to indicate we will send a response asynchronously
        // see https://stackoverflow.com/a/46628145 for more information
        return true;
    } else if (message.action == 'embed') {

        (async function () {
            
            let result = await embed(message.text, message.url, message.tab);

            // Send response back to UI
            sendResponse(result);
        })();

        return true;
    } else if (message.action == 'answer_question') {
        (async function () {
            // Perform classification
            let result = await answer_question(message.question, message.context, message.tab);

            // Send response back to UI
            sendResponse(result);
        })();

        return true;
    }

    
});
//////////////////////////////////////////////////////////////

