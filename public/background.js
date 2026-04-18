/**
 * EXTREAMIX - Background Service Worker
 * Manages the launch of the high-performance synth interface and offscreen document.
 */

chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});

async function setupOffscreenDocument(path) {
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
    });

    if (existingContexts.length > 0) {
        return;
    }

    await chrome.offscreen.createDocument({
        url: path,
        reasons: ['USER_MEDIA'],
        justification: 'Capturing tab audio for synthesis processing',
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CAPTURE_TAB_REQUEST') {
        // Need to grab the current active tab
        chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
            if (!tabs || tabs.length === 0) return;
            const targetTab = tabs[0];

            try {
                // Get stream ID for the target tab
                chrome.tabCapture.getMediaStreamId({ targetTabId: targetTab.id }, async (streamId) => {
                    if (!streamId) {
                        console.error("Could not get stream ID");
                        return;
                    }

                    // Ensure offscreen document is running
                    await setupOffscreenDocument('offscreen.html');

                    // Send the stream ID to the offscreen document
                    chrome.runtime.sendMessage({
                        type: 'START_CAPTURE',
                        streamId: streamId
                    });
                });
            } catch (error) {
                console.error("Failed to setup tab capture", error);
            }
        });

        return true; // Keep message channel open if needed
    }
});
