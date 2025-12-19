
import React, { useState } from 'react';
import { TOEICQuestion } from '../types';
import AudioPlayer from './AudioPlayer';

interface QuestionCardProps {
  question: TOEICQuestion;
  onAnswer: (option: 'A' | 'B' | 'C') => void;
  onNext: () => void;
  selectedAnswer: 'A' | 'B' | 'C' | null;
  cachedBuffer?: AudioBuffer;
  isLast: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onAnswer, onNext, selectedAnswer, cachedBuffer, isLast }) => {
  const [showScript, setShowScript] = useState(false);

  return (
    <div className="flex w-full h-full overflow-hidden animate-fade-in bg-white">
      {/* LEFT: INTERACTION AREA (55%) */}
      <div className="w-[55%] flex flex-col p-12 border-r border-slate-200 bg-slate-50/50">
        <div className="flex flex-col items-center justify-center flex-1 space-y-16">
          {/* Audio Player */}
          <div className="w-full flex justify-center">
            <AudioPlayer 
              text={`Question: ${question.prompt}. (A): ${question.optionA}. (B): ${question.optionB}. (C): ${question.optionC}.`} 
              preLoadedBuffer={cachedBuffer}
              size="large"
            />
          </div>

          {/* Options */}
          <div className="w-full max-w-lg flex flex-col gap-5">
            {(['A', 'B', 'C'] as const).map((opt) => {
              const isSelected = selectedAnswer === opt;
              const isActuallyCorrect = opt === question.correctOption;
              
              let stateClass = "border-slate-200 bg-white hover:bg-slate-50 hover:border-indigo-300 shadow-sm";
              let icon = null;

              if (selectedAnswer) {
                if (isActuallyCorrect) {
                  stateClass = "border-green-500 bg-green-50 text-green-700 shadow-green-100";
                  icon = <i className="fas fa-check-circle text-2xl animate-scale-in text-green-500"></i>;
                } else if (isSelected) {
                  stateClass = "border-rose-500 bg-rose-50 text-rose-700 shadow-rose-100";
                  icon = <i className="fas fa-times-circle text-2xl animate-scale-in text-rose-500"></i>;
                } else {
                  stateClass = "border-slate-100 bg-slate-50 opacity-40 grayscale scale-[0.98]";
                }
              }

              return (
                <button
                  key={opt}
                  disabled={!!selectedAnswer}
                  onClick={() => onAnswer(opt)}
                  className={`group relative flex items-center p-7 rounded-[32px] border-2 transition-all duration-500 text-left ${stateClass} ${!selectedAnswer && 'active:scale-[0.97]'}`}
                >
                  <span className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black mr-8 shadow-md transition-all duration-300 ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:scale-110 group-hover:bg-slate-200'
                  }`}>
                    {opt}
                  </span>
                  <span className="flex-1 text-2xl font-bold tracking-tight text-slate-900">
                    {selectedAnswer ? question[`option${opt}`] : `Lựa chọn ${opt}`}
                  </span>
                  {icon && <div className="ml-4">{icon}</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Navigation */}
        {selectedAnswer && (
          <div className="mt-auto pt-10 animate-slide-up">
            <button
              onClick={onNext}
              className="w-full py-7 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[32px] font-black text-2xl tracking-[0.1em] shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-5 active:scale-95"
            >
              {isLast ? 'HOÀN THÀNH ĐỀ THI' : 'CÂU TIẾP THEO'}
              <i className="fas fa-chevron-right text-xl"></i>
            </button>
          </div>
        )}
      </div>

      {/* RIGHT: CONTENT AREA (45%) */}
      <div className="w-[45%] bg-white p-12 flex flex-col">
        <div className="flex items-center justify-between mb-10 shrink-0">
            <h3 className="text-[11px] font-black tracking-[0.3em] text-indigo-600 uppercase">Analysis Engine</h3>
            <button 
                onClick={() => setShowScript(!showScript)}
                className={`text-[10px] font-black tracking-widest uppercase px-5 py-2 rounded-xl border-2 transition-all ${
                    showScript ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
                }`}
            >
                {showScript ? 'HIDE SCRIPT' : 'SHOW SCRIPT'}
            </button>
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-10 overflow-y-auto">
            {(showScript || selectedAnswer) ? (
              <div className="animate-fade-in">
                <div className="p-10 bg-slate-50 rounded-[40px] border border-slate-200">
                  <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-[9px] font-black tracking-widest uppercase mb-6">Original Prompt</span>
                  <p className="text-3xl font-bold text-slate-900 leading-tight mb-6">"{question.prompt}"</p>
                  <p className="text-xl text-slate-500 font-medium italic border-t border-slate-200 pt-6">"{question.vietnameseTranslation.prompt}"</p>
                  
                  {showScript && (
                      <div className="mt-10 grid gap-4 opacity-60 text-sm font-bold text-slate-600">
                        <p className="flex items-center gap-3"><span className="text-indigo-600 font-black">A</span> {question.optionA}</p>
                        <p className="flex items-center gap-3"><span className="text-indigo-600 font-black">B</span> {question.optionB}</p>
                        <p className="flex items-center gap-3"><span className="text-indigo-600 font-black">C</span> {question.optionC}</p>
                      </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-16 border-4 border-dashed border-slate-100 rounded-[40px]">
                <i className="fas fa-fingerprint text-6xl mb-6 text-slate-200"></i>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-center text-slate-300">Script locked until answered</p>
              </div>
            )}

            {selectedAnswer && (
              <div className="animate-slide-up">
                <div className="p-10 bg-indigo-50/50 rounded-[40px] border border-indigo-100">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                        <i className="fas fa-brain"></i>
                    </div>
                    <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">ETS 2024 Context</span>
                  </div>
                  
                  <div className="space-y-8">
                    <div>
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Key Point</span>
                        <p className="text-xl text-slate-800 font-medium leading-relaxed">{question.explanation}</p>
                    </div>
                    <div className="pt-8 border-t border-slate-200">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Vietnamese Analysis</span>
                        <p className="text-base text-slate-500 italic leading-relaxed font-medium">{question.vietnameseTranslation.explanation}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>

        <div className="mt-8 py-4 border-t border-slate-100 flex items-center gap-4 shrink-0">
            <i className="fas fa-info-circle text-xs text-indigo-500"></i>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pro Tip: Modern ETS questions often use "I'm not sure" to dodge WH-questions.
            </p>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
