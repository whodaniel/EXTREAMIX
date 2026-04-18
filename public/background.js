/**
 * EXTREAMIX - Background Service Worker
 * Manages the launch of the high-performance synth interface and WebRTC signaling.
 */

let targetTabId = null;
let extreamixTabId = null;

chrome.action.onClicked.addListener((tab) => {
    // Store the ID of the tab where the user clicked the extension icon
    targetTabId = tab.id;

    // Open the compiled index.html in a new tab when extension icon is clicked
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') }, (newTab) => {
        extreamixTabId = newTab.id;
    });
});

async function setupOffscreenDocument(path) {
    if (await chrome.offscreen.hasDocument()) return;

    await chrome.offscreen.createDocument({
        url: path,
        reasons: ['USER_MEDIA', 'AUDIO_PLAYBACK', 'WEBRTC'],
        justification: 'Capturing tab audio and routing it via WebRTC to the main app interface'
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'INIT_TAB_CAPTURE') {
        if (!targetTabId) {
            console.error('No target tab ID found');
            return;
        }

        // 1. Get the stream ID for the target tab
        chrome.tabCapture.getMediaStreamId({ targetTabId }, async (streamId) => {
            if (!streamId) {
                console.error('Failed to get stream ID');
                return;
            }

            // 2. Ensure the offscreen document is ready
            await setupOffscreenDocument('offscreen.html');

            // 3. Send the stream ID to the offscreen document to start capture
            chrome.runtime.sendMessage({
                type: 'START_CAPTURE',
                streamId: streamId
            });
        });
    } else if (message.type === 'WEBRTC_OFFER') {
        // Forward offer from main app to offscreen document
        chrome.runtime.sendMessage(message);
    } else if (message.type === 'WEBRTC_ANSWER' || message.type === 'WEBRTC_ICE_CANDIDATE') {
        // Forward answer and ICE candidates from offscreen to main app
        if (extreamixTabId) {
            chrome.tabs.sendMessage(extreamixTabId, message);
        }
    }
});
