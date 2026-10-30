/**
 * Robust Speech Recognition & Audio Capture Service
 * 1. Web Speech API with auto-reconnecting loop for continuous dictation
 * 2. MediaRecorder audio recording buffer sent to /api/transcribe-audio fallback
 * 3. Stream simulation for offline/mic-denied environments
 */

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface SpeechRecorderController {
  isSupported: boolean;
  isListening: boolean;
  start: (
    onInterim: (text: string) => void,
    onFinal: (text: string) => void,
    onError: (error: string) => void,
    lang?: 'en-IN' | 'hi-IN'
  ) => Promise<void>;
  stop: () => Promise<string | null>; // Returns transcribed text or raw audio base64
  cancel: () => void;
}

export function createRobustSpeechController(): SpeechRecorderController {
  const SpeechRecognitionClass =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  let recognitionInstance: any = null;
  let isListeningWanted = false;
  let fullAccumulatedTranscript = '';
  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let mediaStream: MediaStream | null = null;

  const isSupported = Boolean(SpeechRecognitionClass || (typeof navigator !== 'undefined' && navigator.mediaDevices));

  const start = async (
    onInterim: (text: string) => void,
    onFinal: (text: string) => void,
    onError: (error: string) => void,
    lang: 'en-IN' | 'hi-IN' = 'en-IN'
  ) => {
    isListeningWanted = true;
    fullAccumulatedTranscript = '';
    audioChunks = [];

    // 1. Try to start MediaRecorder for raw audio capture fallback
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';
        mediaRecorder = new MediaRecorder(mediaStream, { mimeType });
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunks.push(e.data);
        };
        mediaRecorder.start(250); // collect chunks every 250ms
      }
    } catch (err: any) {
      console.warn('Microphone MediaRecorder permission notice:', err);
      // We still try Web Speech API even if MediaRecorder failed
    }

    // 2. Start Web Speech API with auto-restart on silent pause
    if (SpeechRecognitionClass) {
      const initRecognizer = () => {
        if (!isListeningWanted) return;

        try {
          if (recognitionInstance) {
            try {
              recognitionInstance.abort();
            } catch {
              // ignore
            }
          }

          recognitionInstance = new SpeechRecognitionClass();
          recognitionInstance.continuous = true;
          recognitionInstance.interimResults = true;
          recognitionInstance.lang = lang;
          recognitionInstance.maxAlternatives = 1;

          recognitionInstance.onresult = (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const piece = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                fullAccumulatedTranscript += (fullAccumulatedTranscript ? ' ' : '') + piece;
                onFinal(fullAccumulatedTranscript);
              } else {
                interim += piece;
              }
            }
            if (interim) {
              onInterim((fullAccumulatedTranscript ? fullAccumulatedTranscript + ' ' : '') + interim);
            }
          };

          recognitionInstance.onerror = (event: any) => {
            console.warn('Speech recognition error event:', event.error);
            if (event.error === 'not-allowed') {
              isListeningWanted = false;
              onError('Microphone access was denied. Please allow microphone permissions in your browser bar.');
            } else if (event.error === 'no-speech') {
              // silence timeout, do not terminate if user still wants to record
            } else if (event.error === 'network') {
              console.log('Web speech network timeout, will use audio recording backup');
            }
          };

          recognitionInstance.onend = () => {
            // Chrome Web Speech API frequently dies on silent pauses; auto-restart if still recording!
            if (isListeningWanted) {
              setTimeout(() => {
                if (isListeningWanted) initRecognizer();
              }, 200);
            }
          };

          recognitionInstance.start();
        } catch (e: any) {
          console.warn('SpeechRecognition start error:', e);
        }
      };

      initRecognizer();
    } else if (!mediaStream) {
      onError('Speech Recognition is not supported in this browser environment. Please use Google Chrome or click "Simulate Consultation Dialogue".');
    }
  };

  const stop = async (): Promise<string | null> => {
    isListeningWanted = false;

    // Stop Web Speech
    if (recognitionInstance) {
      try {
        recognitionInstance.stop();
      } catch {
        // ignore
      }
      recognitionInstance = null;
    }

    // Stop MediaRecorder
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        mediaRecorder!.onstop = () => resolve();
        try {
          mediaRecorder!.stop();
        } catch {
          resolve();
        }
      });
    }

    // Stop tracks
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      mediaStream = null;
    }

    // If Web Speech API captured text, return it
    if (fullAccumulatedTranscript.trim().length > 10) {
      return fullAccumulatedTranscript.trim();
    }

    // Fallback: If audio was recorded but Web Speech API captured nothing (e.g. network error / unsupported)
    if (audioChunks.length > 0) {
      try {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
          };
        });
        reader.readAsDataURL(audioBlob);
        const base64Audio = await base64Promise;

        // Send to server for Gemini transcription
        const response = await fetch('/api/transcribe-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Audio,
            mimeType: 'audio/webm',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.transcript) {
            return data.transcript;
          }
        }
      } catch (err) {
        console.warn('Audio fallback error:', err);
      }
    }

    return fullAccumulatedTranscript.trim() || null;
  };

  const cancel = () => {
    isListeningWanted = false;
    if (recognitionInstance) {
      try {
        recognitionInstance.abort();
      } catch {}
      recognitionInstance = null;
    }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try {
        mediaRecorder.stop();
      } catch {}
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      mediaStream = null;
    }
  };

  return {
    get isSupported() {
      return isSupported;
    },
    get isListening() {
      return isListeningWanted;
    },
    start,
    stop,
    cancel,
  };
}

export const createSpeechRecognizer = createRobustSpeechController;

