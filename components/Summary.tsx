
import React from 'react';
import { QuizState } from '../types';

interface SummaryProps {
  state: QuizState;
  onRestart: () => void;
}

const Summary: React.FC<SummaryProps> = ({ state, onRestart }) => {
  const percentage = Math.round((state.score / state.questions.length) * 100);
  
  let color = percentage >= 80 ? "text-yellow-600" : percentage >= 50 ? "text-indigo-600" : "text-rose-600";
  let bg = percentage >= 80 ? "bg-yellow-50" : percentage >= 50 ? "bg-indigo-50" : "bg-rose-50";
  let circleColor = percentage >= 80 ? "#ca8a04" : percentage >= 50 ? "#4f46e5" : "#e11d48";

  return (
    <div className="bg-white rounded-[40px] p-10 max-w-2xl w-full flex flex-col h-[85vh] animate-scale-in border border-slate-200 shadow-2xl overflow-hidden">
      <div className="text-center mb-8">
        <div className={`w-24 h-24 ${bg} ${color} rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner`}>
            <i className={`fas ${percentage >= 80 ? 'fa-trophy' : percentage >= 50 ? 'fa-star' : 'fa-graduation-cap'}`}></i>
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">KẾT QUẢ LUYỆN TẬP</h2>
        <p className="text-slate-500 mt-2 font-medium">Bạn đã hoàn thành bộ đề ETS 2024</p>
      </div>

      <div className="flex justify-center mb-10">
        <div className="relative inline-flex items-center justify-center">
            <svg className="w-32 h-32">
                <circle className="text-slate-100" strokeWidth="8" stroke="currentColor" fill="transparent" r="56" cx="64" cy="64" />
                <circle className="transition-all duration-1000 ease-out" strokeWidth="8" strokeDasharray={352} strokeDashoffset={352 - (352 * percentage) / 100} strokeLinecap="round" stroke={circleColor} fill="transparent" r="56" cx="64" cy="64" />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black text-slate-900 leading-none">{percentage}%</span>
                <span className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">{state.score}/{state.questions.length}</span>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mb-10 bg-slate-50 rounded-3xl p-6 border border-slate-100">
        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Nhật ký làm bài</h3>
        <div className="grid grid-cols-1 gap-3">
            {state.questions.map((q, idx) => (
            <div key={q.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-200 transition-colors shadow-sm">
                <div className="flex items-center gap-4 overflow-hidden">
                <span className="w-8 h-8 min-w-[32px] rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-black text-xs">
                    {idx + 1}
                </span>
                <span className="text-slate-700 font-bold text-sm truncate italic">"{q.prompt}"</span>
                </div>
                {state.answers[idx] === q.correctOption ? (
                <i className="fas fa-check-circle text-green-500 text-lg"></i>
                ) : (
                <i className="fas fa-times-circle text-rose-500 text-lg"></i>
                )}
            </div>
            ))}
        </div>
      </div>

      <button
        onClick={onRestart}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 rounded-3xl font-black text-xl tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex-shrink-0"
      >
        LUYỆN ĐỀ MỚI
      </button>
    </div>
  );
};

export default Summary;
