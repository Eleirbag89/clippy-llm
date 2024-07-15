// background.js - Handles requests from the UI, runs the model, then sends back a response

import { pipeline, env, AutoTokenizer, AutoModelForCausalLM} from '@xenova/transformers';

// Skip initial check for local models, since we are not loading any local models.
env.allowLocalModels = false;

// Due to a bug in onnxruntime-web, we must disable multithreading for now.
// See https://github.com/microsoft/onnxruntime/issues/14445 for more information.
env.backends.onnx.wasm.numThreads = 1;
//env.backends.onnx.wasm.proxy = false;



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

const embed = async (text) => {
    // Get the pipeline instance. This will load and build the model when run for the first time.
    console.log("EMBED METHOD")
    let extractor = await EmbeddingPipelineSingleton.getInstance((data) => {
        // You can track the progress of the pipeline creation here.
        // e.g., you can send `data` back to the UI to indicate a progress bar
        console.log('progress', data)
    });

    // Actually run the model on the input text
    let result = await extractor(text,  { pooling: 'mean', normalize: true });
    console.log("EMBED result", result.tolist())
    return result.tolist();
};

const answer_question = async (question, context) => {
    // Get the pipeline instance. This will load and build the model when run for the first time.
    console.log("answer_question METHOD", question, context)
    const generator = await QuestionAnsweringPipelineSingleton.getInstance((data) => {
        // You can track the progress of the pipeline creation here.
        // e.g., you can send `data` back to the UI to indicate a progress bar
        console.log('progress', data)
    });
    const prompt = `Below is an instruction that describes a task. Write a response that appropriately completes the request.
    
### Instruction:
Answer the following question, using only the following documents as context:
<context>\n${context}\n</context>
Question: ${question}
### Response:`;
    console.log("PROMPT", prompt)

    const output =  await generator(question, context);
    console.log("output", output)
    const answer = output.answer
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
            // Perform classification
            let result = await embed(message.text);

            // Send response back to UI
            sendResponse(result);
        })();

        return true;
    } else if (message.action == 'answer_question') {
        (async function () {
            // Perform classification
            let result = await answer_question(message.question, message.context);

            // Send response back to UI
            sendResponse(result);
        })();

        return true;
    }

    
});
//////////////////////////////////////////////////////////////

