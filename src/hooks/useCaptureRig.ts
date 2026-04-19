import { useState, useRef, useCallback } from 'react';
import { audioEngine } from '../services/audioEngine';

export const useCaptureRig = () => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(() => {
    try {
      const canvas = document.getElementById('extreamix-canvas') as HTMLCanvasElement;
      if (!canvas) {
        console.error('extreamix-canvas not found');
        return;
      }

      const videoStream = canvas.captureStream(60); // 60fps
      const audioStream = audioEngine.getAudioStream();

      if (!audioStream) {
        console.error('Audio stream not available');
        return;
      }

      const muxedStream = new MediaStream([
        ...videoStream.getTracks(),
        ...audioStream.getTracks()
      ]);

      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(muxedStream, options);
      } catch (e) {
        console.warn('VP9/Opus not supported, falling back to default WebM', e);
        recorder = new MediaRecorder(muxedStream, { mimeType: 'video/webm' });
      }

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `extreamix-capture-${new Date().toISOString().replace(/:/g, '-')}.webm`;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      };

      recorder.start();
      setIsRecording(true);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log('Recording stopped');
    }
  }, []);

  return { isRecording, startRecording, stopRecording };
};
