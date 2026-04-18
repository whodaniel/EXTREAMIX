/**
 * Offscreen Document - Hosts the AudioContext and captures tab audio.
 */

let audioCtx = null;
let currentStream = null;
let peerConnection = null;

async function setupWebRTC(stream) {
    if (peerConnection) {
        peerConnection.close();
    }

    peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
    });

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            chrome.runtime.sendMessage({
                type: 'WEBRTC_ICE_CANDIDATE',
                candidate: event.candidate,
                target: 'app'
            });
        }
    };
}

let pendingCandidates = [];

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.type === 'START_CAPTURE') {
        const { streamId } = message;

        try {
            currentStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    mandatory: {
                        chromeMediaSource: 'tab',
                        chromeMediaSourceId: streamId
                    }
                }
            });

            // Initialize AudioContext to ensure it persists and we can do offscreen processing if needed
            if (!audioCtx) {
                audioCtx = new AudioContext();
            }
            // Even though we just WebRTC it to the app, connecting it to a destination keeps it active
            const source = audioCtx.createMediaStreamSource(currentStream);
            const destination = audioCtx.createMediaStreamDestination();
            source.connect(destination);

            await setupWebRTC(destination.stream);

            // Send ready signal to App to start WebRTC handshake
            chrome.runtime.sendMessage({ type: 'OFFSCREEN_READY' });

        } catch (error) {
            console.error('Error capturing tab:', error);
        }
    }
    else if (message.type === 'WEBRTC_OFFER' && message.target === 'offscreen') {
        if (!peerConnection) return;

        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        for (const candidate of pendingCandidates) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidates = [];

        chrome.runtime.sendMessage({
            type: 'WEBRTC_ANSWER',
            answer: answer,
            target: 'app'
        });
    }
    else if (message.type === 'WEBRTC_ICE_CANDIDATE' && message.target === 'offscreen') {
        if (peerConnection) {
            if (peerConnection.remoteDescription) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
            } else {
                pendingCandidates.push(message.candidate);
            }
        }
    }
});
