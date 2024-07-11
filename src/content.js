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


function import_jquery() {
    console.log("Start Load script")
    var script = document.createElement('script');
    script.setAttribute('src', chrome.runtime.getURL('jquery-3.5.1.min.js'));
    script.setAttribute('async', 'async');
    script.setAttribute('type', 'text/javascript');
    console.log("Script", script)
 
    document.head.appendChild(script);
    console.log("AAA", document.head)
    console.log("ENd Load script")
};

function import_clippy() {
    console.log("Start Load script")
    var script = document.createElement('script');
    script.setAttribute('src', chrome.runtime.getURL('clippy/clippy.js'));
    script.setAttribute('async', 'async');
    script.setAttribute('type', 'text/javascript');
    console.log("Script", script)
 
    document.head.appendChild(script);
    console.log("AAA", document.head)
    console.log("ENd Load script")
};

function load_clippy() {
    console.log("Start Load script")
    var script = document.createElement('script');
    script.setAttribute('src', chrome.runtime.getURL('clippy-init.js'));
    script.setAttribute('async', 'async');
    script.setAttribute('type', 'text/javascript');
    console.log("Script", script)
 
    document.head.appendChild(script);
    console.log("AAA", document.head)
    console.log("ENd Load script")
};
function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
  }

import_jquery();
console.log("CRI", chrome.runtime.id)
await delay(1000);
import_clippy();
load_clippy();