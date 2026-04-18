/**
 * EXTREAMIX - Background Service Worker
 * Manages the launch of the high-performance synth interface.
 */

chrome.action.onClicked.addListener((tab) => {
    // Open the compiled index.html in a new tab when extension icon is clicked
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});
