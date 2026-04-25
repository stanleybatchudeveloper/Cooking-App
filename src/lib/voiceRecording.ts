import { useCallback, useState, useRef } from 'react';
import * as francMin from 'franc-min';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  isFinal: boolean;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  language: string;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: Event & { results: SpeechRecognitionResultList; resultIndex: number }) => any) | null;
  onerror: ((this: SpeechRecognition, ev: Event & { error: string }) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface VoiceRecordingResult {
  isRecording: boolean;
  transcript: string;
  liveTranscript: string;
  detectedLanguage: string;
  confidence: number;
  startRecording: () => void;
  stopRecording: () => void;
}

const LANGUAGE_NAMES: { [key: string]: string } = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'zh': 'Chinese',
  'ko': 'Korean',
  'hi': 'Hindi',
  'ar': 'Arabic',
};

export function useVoiceRecording(onText: (text: string) => void): VoiceRecordingResult {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('en');
  const [confidence, setConfidence] = useState(0);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');

  const startRecording = useCallback(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      console.warn('Speech Recognition API not available in this browser');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.language = 'en-US';

    finalTranscriptRef.current = '';

    recognition.onstart = () => {
      setIsRecording(true);
      setTranscript('');
      setLiveTranscript('');
      setDetectedLanguage('en');
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let bestConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptSegment = event.results[i][0].transcript;
        const conf = event.results[i][0].confidence;

        if (conf > bestConfidence) {
          bestConfidence = conf;
        }

        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcriptSegment + ' ';
        } else {
          interimTranscript += transcriptSegment;
        }
      }

      // Combine final and interim for live display
      const fullLiveTranscript = finalTranscriptRef.current + interimTranscript;
      setLiveTranscript(fullLiveTranscript.trim());
      setConfidence(Math.round(bestConfidence * 100));

      // Detect language from transcript if it has enough text
      if (fullLiveTranscript.length > 10) {
        try {
          const detectedLang = (francMin as any)(fullLiveTranscript) as string;
          if (detectedLang && detectedLang !== 'und') {
            setDetectedLanguage(detectedLang);
          }
        } catch (error) {
          console.warn('Language detection error:', error);
        }
      }

      // Update final transcript
      setTranscript(finalTranscriptRef.current.trim());
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      setIsRecording(false);
      const finalText = finalTranscriptRef.current.trim();
      if (finalText) {
        onText(finalText);
      }
    };

    recognition.start();
  }, [onText]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    }
    setIsRecording(false);
    const finalText = finalTranscriptRef.current.trim();
    if (finalText) {
      onText(finalText);
    }
  }, [onText]);

  return {
    isRecording,
    transcript,
    liveTranscript,
    detectedLanguage,
    confidence,
    startRecording,
    stopRecording,
  };
}
