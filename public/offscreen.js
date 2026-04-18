let audioContext;
let mediaStream;
let peerConnection;

chrome.runtime.onMessage.addListener(async (message) => {
    if (message.type === 'START_CAPTURE') {
        try {
            // Get the stream using the provided streamId
            mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    mandatory: {
                        chromeMediaSource: 'tab',
                        chromeMediaSourceId: message.streamId
                    }
                },
                video: false
            });

            // Initialize AudioContext to keep the script alive and potentially process audio
            audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(mediaStream);
            const destination = audioContext.createMediaStreamDestination();
            source.connect(destination);

            // Re-assign the processed stream
            mediaStream = destination.stream;

            // Notify the background script that the stream is ready for WebRTC
            chrome.runtime.sendMessage({ type: 'OFFSCREEN_STREAM_READY' });

        } catch (err) {
            console.error('Offscreen capture error:', err);
        }
    } else if (message.type === 'WEBRTC_OFFER') {
        peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        // Add the captured stream to the peer connection
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, mediaStream);
            });
        }

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                chrome.runtime.sendMessage({
                    type: 'WEBRTC_ICE_CANDIDATE',
                    candidate: event.candidate,
                    source: 'offscreen'
                });
            }
        };

        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        chrome.runtime.sendMessage({
            type: 'WEBRTC_ANSWER',
            answer: answer
        });
    } else if (message.type === 'WEBRTC_ICE_CANDIDATE' && message.source === 'main') {
        if (peerConnection) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
        }
    }
});
