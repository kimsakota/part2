
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateTOEICQuestions, generateAudio, decodeAudioDataCustom } from './services/geminiService';
import { QuizState, TOEICQuestion } from './types';
import QuestionCard from './components/QuestionCard';
import Summary from './components/Summary';

const App: React.FC = () => {
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestionIndex: 0,
    score: 0,
    answers: {},
    isFinished: false,
    questions: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isWaitingForQuota, setIsWaitingForQuota] = useState(false);
  
  const [audioCache, setAudioCache] = useState<Record<string, AudioBuffer>>({});
  const [fetchingIds, setFetchingIds] = useState<Set<string>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioCtxRef.current;
  };

  const fetchAudioWithRetry = async (q: TOEICQuestion, attempt: number = 1): Promise<void> => {
    if (audioCache[q.id] || isWaitingForQuota) return;
    
    setFetchingIds(prev => new Set(prev).add(q.id));
    const ctx = getAudioCtx();
    
    try {
      const textToSpeak = `Question: ${q.prompt}. (A): ${q.optionA}. (B): ${q.optionB}. (C): ${q.optionC}.`;
      const data = await generateAudio(textToSpeak);
      if (data) {
        const buffer = await decodeAudioDataCustom(data, ctx);
        setAudioCache(prev => ({ ...prev, [q.id]: buffer }));
      }
    } catch (err: any) {
      if (err.message === "QUOTA_EXCEEDED") {
        setIsWaitingForQuota(true);
        setError("API quá tải. Đang tạm nghỉ 10 giây...");
        setTimeout(() => {
          setIsWaitingForQuota(false);
          setError(null);
          fetchAudioWithRetry(q, attempt);
        }, 10000); 
        return;
      }
      
      if (attempt < 2) {
        setTimeout(() => fetchAudioWithRetry(q, attempt + 1), 5000);
      }
    } finally {
      setFetchingIds(prev => {
        const next = new Set(prev);
        next.delete(q.id);
        return next;
      });
    }
  };

  useEffect(() => {
    if (quizState.questions.length === 0 || quizState.isFinished || isWaitingForQuota) return;

    const currentIndex = quizState.currentQuestionIndex;
    const q = quizState.questions[currentIndex];
    const nextQ = quizState.questions[currentIndex + 1];

    if (q && !audioCache[q.id] && !fetchingIds.has(q.id)) {
      fetchAudioWithRetry(q);
    }

    if (nextQ && !audioCache[nextQ.id] && !fetchingIds.has(nextQ.id)) {
      const timer = setTimeout(() => {
        fetchAudioWithRetry(nextQ);
      }, 3000);
      return () => clearTimeout(timer);
    }

    const loadedCount = Object.keys(audioCache).length;
    setDownloadProgress(Math.round((loadedCount / quizState.questions.length) * 100));
  }, [quizState.currentQuestionIndex, quizState.questions, audioCache, fetchingIds, isWaitingForQuota]);

  const fetchQuestions = useCallback(async (isRetry: boolean = false) => {
    if (!isRetry) {
        setIsLoading(true);
        setRetryCount(0);
    }
    setError(null);
    setIsWaitingForQuota(false);

    try {
      const questions = await generateTOEICQuestions(15); 
      if (questions.length === 0) throw new Error("Empty questions");
      
      setQuizState({
        currentQuestionIndex: 0,
        score: 0,
        answers: {},
        isFinished: false,
        questions
      });
      setIsLoading(false);
    } catch (err: any) {
      if (retryCount < 3) { 
        setRetryCount(prev => prev + 1);
        setError(`API bận. Đang thử lại lần ${retryCount + 1} sau 8 giây...`);
        setTimeout(() => fetchQuestions(true), 8000); 
      } else {
        setError("Hạn mức API miễn phí đã hết. Vui lòng quay lại sau 1-2 phút.");
        setIsLoading(false);
      }
    }
  }, [retryCount]);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleAnswer = (option: 'A' | 'B' | 'C') => {
    const currentQ = quizState.questions[quizState.currentQuestionIndex];
    const isCorrect = option === currentQ.correctOption;
    
    setQuizState(prev => ({
      ...prev,
      score: isCorrect ? prev.score + 1 : prev.score,
      answers: { ...prev.answers, [prev.currentQuestionIndex]: option }
    }));
  };

  const handleNext = () => {
    if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1
      }));
    } else {
      setQuizState(prev => ({ ...prev, isFinished: true }));
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-6">
        <div className="relative w-24 h-24 mb-10">
            <div className="absolute inset-0 border-4 border-indigo-600/10 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            {retryCount > 0 && (
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-rose-500 text-[10px] font-black px-3 py-1 rounded-full text-white uppercase tracking-tighter shadow-xl">
                    Backing off API...
                </div>
            )}
        </div>
        <h2 className="text-3xl font-black tracking-tighter mb-4 text-center">ETS 2024 AI MASTER</h2>
        <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-slate-500 font-medium italic">Vui lòng đợi 5-10 giây để AI chuẩn bị đề bài...</p>
            {error && <p className="text-rose-600 text-sm font-bold bg-rose-50 px-4 py-2 rounded-xl border border-rose-200">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white text-slate-900 overflow-hidden font-sans">
      <header className="h-16 border-b border-slate-200 flex items-center justify-between px-10 bg-white/80 backdrop-blur-xl shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <i className="fas fa-shield-halved text-lg"></i>
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight leading-none text-slate-900">ETS 2024</h1>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Safe Quota Mode</span>
          </div>
        </div>
        
        {isWaitingForQuota && (
            <div className="bg-rose-50 text-rose-600 px-4 py-1.5 rounded-full text-[10px] font-black border border-rose-200 animate-pulse">
                API COOLDOWN: 10S
            </div>
        )}

        {!quizState.isFinished && (
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-[9px] font-black text-slate-400 uppercase">Stream</span>
              <div className="flex items-center gap-3">
                <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 transition-all duration-700" style={{ width: `${downloadProgress}%` }}></div>
                </div>
              </div>
            </div>
            <div className="h-10 w-px bg-slate-200"></div>
            <div className="text-right">
              <span className="block text-[9px] font-black text-slate-400 uppercase mb-1">Q</span>
              <span className="text-2xl font-black text-indigo-600 leading-none">{quizState.currentQuestionIndex + 1}</span>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 flex overflow-hidden relative bg-slate-50">
        {quizState.isFinished ? (
          <div className="w-full flex items-center justify-center p-10 overflow-hidden">
            <Summary state={quizState} onRestart={fetchQuestions} />
          </div>
        ) : (
          <QuestionCard 
            key={quizState.questions[quizState.currentQuestionIndex].id}
            question={quizState.questions[quizState.currentQuestionIndex]}
            selectedAnswer={quizState.answers[quizState.currentQuestionIndex] || null}
            onAnswer={handleAnswer}
            onNext={handleNext}
            isLast={quizState.currentQuestionIndex === quizState.questions.length - 1}
            cachedBuffer={audioCache[quizState.questions[quizState.currentQuestionIndex].id]}
          />
        )}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
      `}} />
    </div>
  );
};

export default App;
