import React from 'react';
import { ArrowRight, Play } from 'lucide-react';

export default function Minimal() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-emerald-100 selection:text-emerald-900 flex flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="w-10 h-10 bg-gray-900 text-white flex items-center justify-center font-bold text-lg rounded-sm tracking-tighter">
              EG
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              <a href="#" className="hover:text-emerald-600 transition-colors">About</a>
              <a href="#" className="hover:text-emerald-600 transition-colors">Videos</a>
              <a href="#" className="hover:text-emerald-600 transition-colors">Coaching</a>
            </div>
          </div>
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors shadow-sm shadow-emerald-600/20">
            Download Playbook
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center relative overflow-hidden">
        {/* Soft background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-32 w-full grid lg:grid-cols-[1fr,400px] gap-16 items-center relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold tracking-wide uppercase mb-8 border border-emerald-100/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              SALES MANAGER · COACH · CONTENT CREATOR
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-[#111827] leading-[1.1] mb-6">
              I Help Sales Reps <span className="text-[#059669] italic font-serif font-medium block mt-2">Become</span> Top Performers
            </h1>
            
            <p className="text-lg text-gray-600 leading-relaxed mb-10 max-w-xl">
              10+ years in the field. Went from rep to trainer to manager. Now I share everything I've learned to help you build your sales career.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <button className="bg-[#059669] hover:bg-emerald-700 text-white px-8 py-4 rounded-full font-medium transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 group">
                Download the Free Sales Playbook
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 px-8 py-4 rounded-full font-medium transition-colors flex items-center justify-center gap-2">
                <Play className="w-4 h-4 text-[#059669]" />
                Watch on YouTube
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white
                    ${i === 1 ? 'bg-emerald-400' : i === 2 ? 'bg-emerald-500' : i === 3 ? 'bg-emerald-600' : 'bg-gray-800'}
                  `}>
                    {i === 4 ? '+1k' : ''}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 font-medium">
                Join hundreds of sales pros already following along
              </p>
            </div>
          </div>
          
          <div className="relative mx-auto lg:mx-0">
            {/* Decorative ring */}
            <div className="absolute inset-[-20px] rounded-full border border-gray-100" />
            <div className="absolute inset-[-40px] rounded-full border border-gray-50" />
            
            <div className="w-[320px] h-[320px] lg:w-[400px] lg:h-[400px] rounded-full bg-gray-900 flex items-center justify-center relative shadow-2xl shadow-gray-900/10">
              <span className="text-8xl font-bold text-white tracking-tighter opacity-20">EG</span>
              
              {/* Floating badge */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 text-[#059669] rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Quota</p>
                  <p className="text-lg font-bold text-gray-900">150% Hit</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Stats bar */}
      <div className="bg-[#F9FAFB] border-t border-gray-100 py-12 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-gray-200/50">
            <div className="text-center px-4">
              <div className="text-4xl font-extrabold text-[#059669] mb-2">10+</div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Years in Sales</div>
            </div>
            <div className="text-center px-4">
              <div className="text-4xl font-extrabold text-[#059669] mb-2">100s</div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Reps Coached</div>
            </div>
            <div className="text-center px-4">
              <div className="text-4xl font-extrabold text-[#059669] mb-2">3x</div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Presidents Club</div>
            </div>
            <div className="text-center px-4">
              <div className="text-4xl font-extrabold text-[#059669] mb-2">3</div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Top Teams Built</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
