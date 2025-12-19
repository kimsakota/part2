
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateAudio, decodeAudioDataCustom } from '../services/geminiService';

interface AudioPlayerProps {
  text: string;
  label?: string;
  preLoadedBuffer?: AudioBuffer;
  size?: 'normal' | 'large';
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ text, label = "NGHE CÂU HỎI", preLoadedBuffer, size = 'normal' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const playAudio = useCallback(async () => {
    if (isPlaying) {
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch (e) {}
      }
      setIsPlaying(false);
      return;
    }

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }

    let bufferToPlay = preLoadedBuffer;

    if (!bufferToPlay) {
      setIsLoading(true);
      try {
        const data = await generateAudio(text);
        if (data) {
          bufferToPlay = await decodeAudioDataCustom(data, audioCtxRef.current);
        }
      } catch (err) {
        console.error("Audio error:", err);
      }
      setIsLoading(false);
    }

    if (bufferToPlay) {
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = bufferToPlay;
      source.connect(audioCtxRef.current.destination);
      source.onended = () => setIsPlaying(false);
      sourceRef.current = source;
      source.start(0);
      setIsPlaying(true);
    }
  }, [isPlaying, text, preLoadedBuffer]);

  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch(e) {}
      }
    };
  }, [text]);

  const isReady = !!preLoadedBuffer;

  if (size === 'large') {
    return (
      <button
        onClick={playAudio}
        disabled={isLoading}
        className={`group relative flex flex-col items-center justify-center transition-all duration-500 ${
          isPlaying ? 'scale-110' : 'hover:scale-105'
        } active:scale-95 disabled:opacity-50`}
      >
        <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-xl transition-all duration-500 border-4 ${
          isPlaying 
            ? 'bg-rose-500 border-rose-300 shadow-rose-200' 
            : isReady 
              ? 'bg-indigo-600 border-indigo-400 shadow-indigo-100' 
              : 'bg-slate-200 border-slate-300'
        }`}>
          {isLoading ? (
            <i className="fas fa-circle-notch fa-spin text-4xl text-white"></i>
          ) : isPlaying ? (
            <i className="fas fa-stop text-4xl text-white"></i>
          ) : (
            <i className="fas fa-play text-4xl text-white ml-2"></i>
          )}
          
          {isPlaying && (
            <div className="absolute inset-0 rounded-full animate-ping bg-rose-500/20 opacity-75"></div>
          )}
        </div>
        
        <div className="mt-6 text-center">
            <span className={`block text-xs font-black tracking-[0.3em] uppercase transition-colors ${isPlaying ? 'text-rose-600' : isReady ? 'text-indigo-600' : 'text-slate-400'}`}>
                {isPlaying ? "ĐANG PHÁT" : isReady ? "SẴN SÀNG" : "ĐANG TẢI"}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase mt-1 block">Bấm để nghe đề bài</span>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={playAudio}
      disabled={isLoading}
      className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all shadow-md active:scale-95 border-b-4 ${
        isPlaying 
          ? 'bg-rose-500 text-white border-rose-700' 
          : 'bg-indigo-600 text-white border-indigo-800 hover:bg-indigo-700'
      } disabled:opacity-50`}
    >
      {isLoading ? <i className="fas fa-circle-notch fa-spin"></i> : isPlaying ? <i className="fas fa-pause"></i> : <i className="fas fa-volume-up"></i>}
      <span className="font-black text-sm tracking-widest uppercase">{label}</span>
    </button>
  );
};

export default AudioPlayer;
