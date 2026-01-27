'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface RecordButtonProps {
    onRecordComplete: (text: string) => void;
    onTextClick: () => void;
    isLoading?: boolean;
}

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    length: number;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: { error: string }) => void) | null;
    onend: (() => void) | null;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

const CANCEL_THRESHOLD = 80;

export default function RecordButton({ onRecordComplete, onTextClick, isLoading }: RecordButtonProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [speechSupported, setSpeechSupported] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const [isCancelling, setIsCancelling] = useState(false);

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const isRecordingRef = useRef(false);
    const startYRef = useRef(0);
    const shouldCancelRef = useRef(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-US';
                recognitionRef.current = recognition;
                setSpeechSupported(true);
            }
        }

        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch (_e) { /* ignore */ }
            }
        };
    }, []);

    useEffect(() => {
        const recognition = recognitionRef.current;
        if (!recognition) return;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let fullTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
                fullTranscript += event.results[i][0].transcript;
            }
            setTranscript(fullTranscript);
        };

        recognition.onerror = () => {
            isRecordingRef.current = false;
            setIsRecording(false);
            setDragOffset(0);
            setIsCancelling(false);
        };

        recognition.onend = () => {
            isRecordingRef.current = false;
            setIsRecording(false);
        };

        return () => {
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.onend = null;
        };
    }, []);

    const handlePointerMove = useCallback((clientY: number) => {
        if (!isRecordingRef.current) return;
        const offset = startYRef.current - clientY;
        setDragOffset(Math.max(0, offset));
        const shouldCancel = offset > CANCEL_THRESHOLD;
        setIsCancelling(shouldCancel);
        shouldCancelRef.current = shouldCancel;
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => handlePointerMove(e.clientY);
        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) handlePointerMove(e.touches[0].clientY);
        };

        if (isRecording) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('touchmove', handleTouchMove);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
        };
    }, [isRecording, handlePointerMove]);

    const startRecording = useCallback((clientY: number) => {
        const recognition = recognitionRef.current;
        if (!recognition || isRecordingRef.current || isLoading) return;

        try {
            startYRef.current = clientY;
            setTranscript('');
            setDragOffset(0);
            setIsCancelling(false);
            shouldCancelRef.current = false;
            recognition.start();
            isRecordingRef.current = true;
            setIsRecording(true);
        } catch (_e) {
            isRecordingRef.current = false;
            setIsRecording(false);
        }
    }, [isLoading]);

    const stopRecording = useCallback(() => {
        const recognition = recognitionRef.current;
        if (!recognition || !isRecordingRef.current) return;

        try { recognition.stop(); } catch (_e) { /* ignore */ }

        isRecordingRef.current = false;
        setIsRecording(false);
        setDragOffset(0);

        if (shouldCancelRef.current) {
            setIsCancelling(false);
            setTranscript('');
            return;
        }

        setIsCancelling(false);

        setTimeout(() => {
            setTranscript(current => {
                if (current.trim()) onRecordComplete(current.trim());
                return '';
            });
        }, 100);
    }, [onRecordComplete]);

    return (
        <div className="flex flex-col items-center justify-end pb-4 pt-6">
            {/* Context Text - hidden when recording */}
            {!isRecording && (
                <p className="text-white/50 text-sm font-medium mb-6 text-center tracking-wide">
                    Capture your thought
                </p>
            )}

            {/* Transcript Preview */}
            {isRecording && transcript && !isCancelling && (
                <div className="w-full max-w-xs bg-surface-dark/80 backdrop-blur border border-primary/30 rounded-xl p-3 mb-4">
                    <p className="text-white text-sm text-center">{transcript}</p>
                </div>
            )}

            {/* Buttons Container */}
            <div className="flex items-start gap-6">
                {/* Text Input Button */}
                <button
                    onClick={onTextClick}
                    disabled={isLoading || isRecording}
                    className={`flex flex-col items-center gap-2 group pt-6 ${isRecording ? 'opacity-30' : ''}`}
                >
                    <div className="flex items-center justify-center size-14 rounded-full bg-surface-dark border border-white/10 group-hover:border-primary/50 group-hover:bg-primary/10 transition-all">
                        <span className="material-symbols-outlined text-white/60 group-hover:text-primary transition-colors" style={{ fontSize: '24px' }}>
                            edit_note
                        </span>
                    </div>
                    <span className="text-white/40 text-xs group-hover:text-primary transition-colors">Type</span>
                </button>

                {/* Main Push-to-Talk Column */}
                <div className="flex flex-col items-center">
                    {/* Cancel indicator */}
                    {isRecording && (
                        <div className="flex flex-col items-center mb-3">
                            <div className={`size-10 rounded-full flex items-center justify-center transition-all duration-200 ${isCancelling ? 'bg-red-500 scale-110' : 'bg-white/10'
                                }`}>
                                <span className={`material-symbols-outlined ${isCancelling ? 'text-white' : 'text-white/40'
                                    }`} style={{ fontSize: '20px' }}>
                                    close
                                </span>
                            </div>
                            <span className={`text-xs mt-1 ${isCancelling ? 'text-red-400 font-medium' : 'text-white/40'
                                }`}>
                                {isCancelling ? 'Release to cancel' : '↑ Slide up'}
                            </span>
                        </div>
                    )}

                    {/* Mic Button with drag */}
                    <div
                        className="relative flex items-center justify-center"
                        style={{
                            transform: isRecording ? `translateY(-${Math.min(dragOffset, CANCEL_THRESHOLD)}px)` : 'none',
                            transition: isRecording ? 'none' : 'transform 0.2s ease-out'
                        }}
                    >
                        {/* Pulse rings */}
                        {!isRecording && (
                            <>
                                <div className="absolute rounded-full bg-primary/20 blur-xl animate-pulse-ring w-24 h-24" />
                                <div className="absolute rounded-full bg-primary/10 w-32 h-32 animate-pulse-ring" style={{ animationDelay: '1s' }} />
                            </>
                        )}
                        {isRecording && !isCancelling && (
                            <>
                                <div className="absolute rounded-full bg-red-500/30 w-28 h-28 animate-ping" />
                                <div className="absolute rounded-full bg-red-500/20 w-36 h-36 animate-pulse" />
                            </>
                        )}

                        {/* Button */}
                        <button
                            onMouseDown={speechSupported ? (e) => startRecording(e.clientY) : undefined}
                            onMouseUp={speechSupported ? stopRecording : undefined}
                            onMouseLeave={isRecording ? stopRecording : undefined}
                            onTouchStart={speechSupported ? (e) => { e.preventDefault(); startRecording(e.touches[0].clientY); } : undefined}
                            onTouchEnd={speechSupported ? (e) => { e.preventDefault(); stopRecording(); } : undefined}
                            disabled={isLoading || !speechSupported}
                            className={`relative z-10 flex items-center justify-center size-20 rounded-full transition-all duration-200 select-none ${isCancelling
                                ? 'bg-red-500/50 scale-90'
                                : isRecording
                                    ? 'bg-red-500 scale-110 shadow-[0_0_60px_rgba(239,68,68,0.6)]'
                                    : 'bg-primary shadow-glow hover:scale-105 active:scale-95'
                                } ${isLoading || !speechSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span
                                className={`material-symbols-outlined ${isRecording ? 'text-white' : 'text-black'}`}
                                style={{ fontSize: '36px', fontVariationSettings: "'FILL' 1" }}
                            >
                                {isCancelling ? 'close' : isRecording ? 'graphic_eq' : 'mic'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Spacer for symmetry */}
                <div className="w-14 pt-6">
                    <div className="size-14" />
                </div>
            </div>

            {/* Label */}
            <p className={`text-xs font-semibold uppercase tracking-widest mt-6 ${isCancelling ? 'text-red-400' : isRecording ? 'text-red-400' : 'text-primary drop-shadow-[0_0_10px_rgba(0,234,255,0.4)]'
                }`}>
                {isCancelling ? '✕ Release to Cancel' : isRecording ? '🔴 Release to Send' : 'Hold to Record'}
            </p>
        </div>
    );
}
