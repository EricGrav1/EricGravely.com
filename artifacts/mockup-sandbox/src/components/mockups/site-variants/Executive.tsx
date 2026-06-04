import React from 'react';
import { ArrowRight, Play, Star } from 'lucide-react';

export default function Executive() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-[#FEF9EF] font-sans selection:bg-[#F59E0B] selection:text-[#0F172A]">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto border-b border-[#1E293B]">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded bg-[#F59E0B] flex items-center justify-center text-[#0F172A] font-bold tracking-wider">
            EG
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#CBD5E1]">
          <a href="#" className="hover:text-[#F59E0B] transition-colors">About</a>
          <a href="#" className="hover:text-[#F59E0B] transition-colors">Videos</a>
          <a href="#" className="hover:text-[#F59E0B] transition-colors">Coaching</a>
        </div>
        
        <button className="hidden md:inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded text-[#0F172A] bg-[#F59E0B] hover:bg-[#D97706] transition-colors">
          Download Playbook
        </button>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-24 md:pt-32 md:pb-36 flex flex-col lg:flex-row items-center gap-16">
        
        {/* Left Content */}
        <div className="flex-1 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1E293B] border border-[#334155] text-xs font-semibold tracking-widest text-[#94A3B8] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>
            Sales Manager · Coach · Content Creator
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-[#FEF9EF]">
            I Help Sales Reps <br/>
            <span className="text-[#F59E0B] font-serif italic font-normal">Become</span> <br/>
            Top Performers
          </h1>
          
          <p className="text-lg md:text-xl text-[#94A3B8] max-w-xl leading-relaxed">
            10+ years in the field. Went from rep to trainer to manager. Now I share everything I've learned to help you build your sales career.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded bg-[#F59E0B] text-[#0F172A] hover:bg-[#D97706] transition-all">
              Download the Free Sales Playbook <ArrowRight className="w-5 h-5" />
            </button>
            <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded border-2 border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B] hover:text-[#0F172A] transition-all">
              <Play className="w-5 h-5" /> Watch on YouTube
            </button>
          </div>
          
          <div className="flex items-center gap-4 pt-6 border-t border-[#1E293B]">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0F172A] bg-[#1E293B] flex items-center justify-center text-xs text-[#94A3B8]">
                  <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                </div>
              ))}
            </div>
            <p className="text-sm font-medium text-[#94A3B8]">
              Join hundreds of sales pros <br/> already following along
            </p>
          </div>
        </div>

        {/* Right Photo Area */}
        <div className="flex-1 w-full max-w-lg flex justify-center lg:justify-end">
          <div className="relative w-full aspect-square max-w-[500px]">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#1E293B] to-[#334155] border-4 border-[#1E293B] shadow-2xl flex items-center justify-center">
              <span className="text-8xl font-bold text-[#475569] tracking-tighter">EG</span>
            </div>
            {/* Decorative elements */}
            <div className="absolute top-10 right-10 w-24 h-24 rounded-full border border-[#F59E0B]/30"></div>
            <div className="absolute bottom-10 left-10 w-32 h-32 rounded-full border border-[#F59E0B]/20"></div>
          </div>
        </div>
      </main>

      {/* Stats Bar */}
      <div className="bg-[#1E293B] border-y border-[#334155]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x-0 md:divide-x divide-[#334155]">
            <div className="flex flex-col items-center text-center">
              <span className="text-4xl font-black text-[#F59E0B]">10+</span>
              <span className="mt-2 text-sm font-semibold tracking-widest text-[#94A3B8] uppercase">Years in Sales</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="text-4xl font-black text-[#F59E0B]">100s</span>
              <span className="mt-2 text-sm font-semibold tracking-widest text-[#94A3B8] uppercase">Reps Coached</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="text-4xl font-black text-[#F59E0B]">3x</span>
              <span className="mt-2 text-sm font-semibold tracking-widest text-[#94A3B8] uppercase">Presidents Club</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="text-4xl font-black text-[#F59E0B]">3</span>
              <span className="mt-2 text-sm font-semibold tracking-widest text-[#94A3B8] uppercase">Top Teams Built</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}