'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { transcribeAudio } from '@/services/openaiService';
import { getOpenAIKey } from '@/services/aiConfig';

interface RecordButtonProps {
    onRecordComplete: (text: string) => void;
    onTextClick: () => void;
    isLoading?: boolean;
}

const CANCEL_THRESHOLD = 80;

export default function RecordButton({ onRecordComplete, onTextClick, isLoading }: RecordButtonProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [recordingSupported, setRecordingSupported] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const [isCancelling, setIsCancelling] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const isRecordingRef = useRef(false);
    const startYRef = useRef(0);
    const shouldCancelRef = useRef(false);
    const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Check if recording is supported
    useEffect(() => {
        if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.mediaDevices) {
            setRecordingSupported(true);
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }
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

    const startRecording = useCallback(async (clientY: number) => {
        if (isRecordingRef.current || isLoading || isTranscribing) return;

        try {
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000,
                }
            });
            streamRef.current = stream;

            // Create MediaRecorder
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
            });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            // Start recording
            startYRef.current = clientY;
            setDragOffset(0);
            setIsCancelling(false);
            shouldCancelRef.current = false;
            setRecordingDuration(0);

            mediaRecorder.start(100); // Collect data every 100ms
            isRecordingRef.current = true;
            setIsRecording(true);

            // Start duration timer
            durationIntervalRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('[RecordButton] Failed to start recording:', error);
            isRecordingRef.current = false;
            setIsRecording(false);
        }
    }, [isLoading, isTranscribing]);

    const stopRecording = useCallback(async () => {
        const mediaRecorder = mediaRecorderRef.current;
        if (!mediaRecorder || !isRecordingRef.current) return;

        // Stop duration timer
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
        }

        // Stop recording
        isRecordingRef.current = false;
        setIsRecording(false);
        setDragOffset(0);
        const wasCancelled = shouldCancelRef.current;
        setIsCancelling(false);

        // Stop the MediaRecorder
        return new Promise<void>((resolve) => {
            mediaRecorder.onstop = async () => {
                // Stop all tracks
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }

                // If cancelled, don't transcribe
                if (wasCancelled) {
                    audioChunksRef.current = [];
                    resolve();
                    return;
                }

                // Check if we have audio data
                if (audioChunksRef.current.length === 0) {
                    resolve();
                    return;
                }

                // Create audio blob
                const audioBlob = new Blob(audioChunksRef.current, {
                    type: mediaRecorder.mimeType
                });
                audioChunksRef.current = [];

                // Check if we have an API key
                const apiKey = getOpenAIKey();
                if (!apiKey) {
                    console.warn('[RecordButton] No OpenAI API key configured');
                    resolve();
                    return;
                }

                // Transcribe with Whisper
                setIsTranscribing(true);
                try {
                    const text = await transcribeAudio(audioBlob);
                    if (text.trim()) {
                        onRecordComplete(text.trim());
                    }
                } catch (error) {
                    console.error('[RecordButton] Transcription failed:', error);
                } finally {
                    setIsTranscribing(false);
                }
                resolve();
            };

            mediaRecorder.stop();
        });
    }, [onRecordComplete]);

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const isDisabled = isLoading || !recordingSupported || isTranscribing;

    return (
        <div className="flex flex-col items-center justify-end pb-4 pt-6">
            {/* Context Text - hidden when recording/transcribing */}
            {!isRecording && !isTranscribing && (
                <p className="text-white/50 text-sm font-medium mb-6 text-center tracking-wide">
                    Capture your thought
                </p>
            )}

            {/* Recording Duration */}
            {isRecording && !isCancelling && (
                <div className="w-full max-w-xs bg-surface-dark/80 backdrop-blur border border-red-500/30 rounded-xl p-3 mb-4">
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <p className="text-white text-sm font-mono">{formatDuration(recordingDuration)}</p>
                    </div>
                </div>
            )}

            {/* Transcribing State */}
            {isTranscribing && (
                <div className="w-full max-w-xs bg-surface-dark/80 backdrop-blur border border-primary/30 rounded-xl p-3 mb-4">
                    <div className="flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-primary animate-spin" style={{ fontSize: '16px' }}>sync</span>
                        <p className="text-primary text-sm">Transcribing with Whisper...</p>
                    </div>
                </div>
            )}

            {/* Buttons Container */}
            <div className="flex items-start gap-6">
                {/* Text Input Button */}
                <button
                    onClick={onTextClick}
                    disabled={isDisabled || isRecording}
                    className={`flex flex-col items-center gap-2 group pt-6 ${isRecording || isTranscribing ? 'opacity-30' : ''}`}
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
                        {!isRecording && !isTranscribing && (
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
                        {isTranscribing && (
                            <>
                                <div className="absolute rounded-full bg-primary/30 w-28 h-28 animate-pulse" />
                            </>
                        )}

                        {/* Button */}
                        <button
                            onMouseDown={recordingSupported ? (e) => startRecording(e.clientY) : undefined}
                            onMouseUp={recordingSupported ? () => stopRecording() : undefined}
                            onMouseLeave={isRecording ? () => stopRecording() : undefined}
                            onTouchStart={recordingSupported ? (e) => { e.preventDefault(); startRecording(e.touches[0].clientY); } : undefined}
                            onTouchEnd={recordingSupported ? (e) => { e.preventDefault(); stopRecording(); } : undefined}
                            disabled={isDisabled}
                            className={`relative z-10 flex items-center justify-center size-20 rounded-full transition-all duration-200 select-none ${isCancelling
                                ? 'bg-red-500/50 scale-90'
                                : isRecording
                                    ? 'bg-red-500 scale-110 shadow-[0_0_60px_rgba(239,68,68,0.6)]'
                                    : isTranscribing
                                        ? 'bg-primary/50'
                                        : 'bg-primary shadow-glow hover:scale-105 active:scale-95'
                                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span
                                className={`material-symbols-outlined ${isRecording || isTranscribing ? 'text-white' : 'text-black'}`}
                                style={{ fontSize: '36px', fontVariationSettings: "'FILL' 1" }}
                            >
                                {isCancelling ? 'close' : isTranscribing ? 'sync' : isRecording ? 'graphic_eq' : 'mic'}
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
            <p className={`text-xs font-semibold uppercase tracking-widest mt-6 ${isCancelling ? 'text-red-400' : isTranscribing ? 'text-primary' : isRecording ? 'text-red-400' : 'text-primary drop-shadow-[0_0_10px_rgba(0,234,255,0.4)]'
                }`}>
                {isCancelling ? '✕ Release to Cancel' : isTranscribing ? '⏳ Processing...' : isRecording ? '🔴 Release to Send' : 'Hold to Record'}
            </p>
        </div>
    );
}
