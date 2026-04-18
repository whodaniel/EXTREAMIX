/**
 * EXTREAMIX - Background Service Worker
 * Manages the launch of the high-performance synth interface.
 */

chrome.action.onClicked.addListener((tab) => {
    // In a real extension, this would point to index.html after build
    // For local development, we launch the index.html
    chrome.tabs.create({ url: 'index.html' });
});
