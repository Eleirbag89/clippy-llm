
# ClippyLLM - Your vintage AI assistant for the web

Clippy Assistant is a Chrome extension that brings the nostalgic Microsoft Clippy back as a virtual assistant. This extension helps you answer questions related to the content of the webpage you are currently viewing. It leverages advanced AI models running directly in your browser to provide intelligent responses without sending data to external servers.

## Features

- Ask questions about the webpage you are viewing, and Clippy will provide relevant answers.
- All AI models run locally in your browser, ensuring privacy and no data leakage.
- Real-time analysis of webpage content, processed and stored in an efficient way for quick retrieval.

## Getting Started
1. Clone the repo and enter the project directory:
    ```bash
    git clone https://github.com/Eleirbag89/clippy-llm.git
    cd clippy-llm
    ```
2. Install the necessary dependencies:
    ```bash
    npm install 
    ```
3. Build the project:
    ```bash
    npm run build 
    ```
    Or, to continue development and see changes in real-time:
    ```bash
    npm run dev 
    ```
4. Add the extension to your browser. To do this, go to `chrome://extensions/`, enable developer mode (top right), and click "Load unpacked". Select the `build` directory from the dialog which appears and click "Select Folder".

5. That's it! You should now be able to open the extenion's popup and use the model in your browser!

## How It Works
### Technologies Used

- [Voy](https://github.com/tantaraio/voy): A vector store to manage and retrieve chunks of data from the webpage. The data is stored locally using IndexDB.
- [Transformers.js](https://huggingface.co/docs/transformers.js/index): Used for generating embeddings of the webpage content with the [all-MiniLM-L6-v2](https://huggingface.co/Xenova/all-MiniLM-L6-v2) model.
- [WebLLM](https://webllm.mlc.ai): Used to run the [Phi-3-mini-4k-instruct-q4f16_1-MLC](https://huggingface.co/mlc-ai/Phi-3-mini-4k-instruct-q4f16_1-MLC) model directly in the browser for answering questions based on the context extracted from the webpage.

### System Flow
1. When you ask a question, the webpage content is analyzed and divided into smaller, meaningful chunks.
2. These chunks are stored locally in the IndexDB database, powered by Voy.
3. The extension uses the all-MiniLM-L6-v2 embedding model to create vector representations of these chunks.
4. The relevant chunks, based on the question asked, are retrieved and used as context for the Phi-3-mini-4k-instruct-q4f16_1-MLC model via WebLLM.
5. Clippy then provides an answer based on the retrieved context and the question.

## Limitations
- Hardware Dependent: The extension's performance is highly dependent on the user's CPU and GPU power. Users with more powerful hardware will experience better performance.
- Quick and dirty: This project is intended as a demonstration of feasibility and may not perform perfectly in all environments or webpages.

## License
This project is licensed under the MIT License. See the LICENSE file for details
