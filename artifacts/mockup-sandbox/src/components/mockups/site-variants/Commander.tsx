import React from 'react';
import { Play, ArrowRight, CheckCircle2 } from 'lucide-react';

export function Commander() {
  return (
    <div className="min-h-screen bg-[#111827] text-white font-sans selection:bg-[#3B82F6] selection:text-white flex flex-col">
      {/* Navigation */}
      <nav className="w-full border-b border-gray-800/60 bg-[#111827]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded bg-[#3B82F6] text-white flex items-center justify-center font-bold text-lg tracking-tight shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              EG
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:block">Eric Gravely</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#videos" className="hover:text-white transition-colors">Videos</a>
            <a href="#coaching" className="hover:text-white transition-colors">Coaching</a>
          </div>

          <button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-5 py-2.5 rounded-md font-medium text-sm transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_25px_rgba(59,130,246,0.4)]">
            Download Playbook
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#3B82F6]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-[#3B82F6]/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 py-20 w-full grid lg:grid-cols-2 gap-16 items-center relative z-10">
          
          {/* Left Column - Content */}
          <div className="flex flex-col items-start gap-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[#3B82F6] text-xs font-bold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse"></span>
              Sales Manager · Coach · Content Creator
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
              I Help Sales Reps <br />
              <span className="text-[#3B82F6] italic pr-2 font-serif font-light">Become</span>
              <br />Top Performers
            </h1>

            <p className="text-lg md:text-xl text-gray-400 max-w-xl leading-relaxed">
              10+ years in the field. Went from rep to trainer to manager. Now I share everything I've learned to help you build your sales career.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mt-4">
              <button className="w-full sm:w-auto bg-[#3B82F6] hover:bg-[#2563EB] text-white px-8 py-4 rounded-md font-bold text-base transition-all flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.23)] hover:-translate-y-0.5">
                Download the Free Sales Playbook
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <button className="w-full sm:w-auto px-8 py-4 rounded-md font-bold text-base transition-all flex items-center justify-center gap-2 border-2 border-gray-700 hover:border-[#3B82F6] text-gray-300 hover:text-[#3B82F6] bg-transparent hover:bg-[#3B82F6]/5">
                <Play className="w-5 h-5 fill-current" />
                Watch on YouTube
              </button>
            </div>

            <div className="flex items-center gap-3 mt-4 text-sm text-gray-500 font-medium">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`w-8 h-8 rounded-full border-2 border-[#111827] bg-gray-800 flex items-center justify-center text-[10px] text-gray-400`}>
                    User
                  </div>
                ))}
              </div>
              <p>Join <span className="text-gray-300">hundreds</span> of sales pros already following along</p>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md aspect-square rounded-full border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center shadow-2xl p-4">
              <div className="absolute inset-0 rounded-full border border-[#3B82F6]/20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#3B82F6]/10 via-transparent to-transparent"></div>
              
              <div className="w-[90%] h-[90%] rounded-full bg-gray-950 flex flex-col items-center justify-center border-4 border-gray-900 shadow-inner relative z-10 overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                <span className="text-[120px] font-bold text-[#3B82F6] opacity-80 tracking-tighter mix-blend-screen drop-shadow-lg">EG</span>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-10 right-10 w-4 h-4 rounded-full bg-[#3B82F6] blur-sm animate-pulse"></div>
              <div className="absolute bottom-20 left-10 w-3 h-3 rounded-full bg-[#3B82F6]/50 blur-sm"></div>
            </div>
          </div>
        </div>
      </main>

      {/* Stats Bar */}
      <div className="bg-[#1f2937] border-y border-gray-800 relative z-20">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-gray-800">
            <div className="flex flex-col items-center justify-center text-center px-4">
              <span className="text-4xl font-black text-[#3B82F6] mb-1">10+</span>
              <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Years in Sales</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center px-4">
              <span className="text-4xl font-black text-[#3B82F6] mb-1">100s</span>
              <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Reps Coached</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center px-4">
              <span className="text-4xl font-black text-[#3B82F6] mb-1">3x</span>
              <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Presidents Club Winner</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center px-4">
              <span className="text-4xl font-black text-[#3B82F6] mb-1">3</span>
              <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Top Teams Built</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Commander;
