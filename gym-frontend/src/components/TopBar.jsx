import React from 'react';
import { Search, Bell, HelpCircle } from 'lucide-react';

export default function TopBar({ title }) {
  return (
    <div className="top-bar backdrop-blur-md bg-dark/80 px-10">
      <div className="font-space font-bold text-xl text-white tracking-widest uppercase">{title}</div>
      
      <div className="flex items-center gap-10">
        <div className="flex items-center bg-white/[0.03] border border-white/5 rounded-full px-4 py-2 w-[400px] group focus-within:bg-white/[0.05] focus-within:border-iron-lime/20 transition-all">
          <Search size={16} className="text-iron-text-secondary group-focus-within:text-iron-lime transition-colors" />
          <input 
            type="text" 
            placeholder="Search active members..." 
            className="bg-transparent border-none outline-none text-xs ml-3 w-full text-white placeholder:text-iron-text-secondary placeholder:font-medium placeholder:uppercase placeholder:tracking-widest" 
          />
        </div>
        
        <div className="flex items-center gap-8">
          <button className="text-iron-text-secondary hover:text-white transition-colors relative group">
            <Bell size={18} className="group-hover:scale-110 group-active:scale-95 transition-transform" />
            <div className="absolute top-[-3px] right-[-3px] w-3 h-3 bg-red-500 rounded-full border-2 border-dark animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
          </button>
          
          <button className="text-iron-text-secondary hover:text-white transition-colors group">
            <HelpCircle size={18} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
        
        <div className="flex items-center gap-4 pl-8 border-l border-border">
          <div className="w-10 h-10 rounded-full bg-surface border-2 border-iron-lime/20 p-0.5 overflow-hidden group hover:border-iron-lime transition-all">
            <img 
              src="https://ui-avatars.com/api/?name=Alex+Thorne&background=DFFF00&color=0A0A0E" 
              alt="Alex Thorne" 
              className="w-full h-full rounded-full object-cover group-hover:scale-110 transition-transform duration-500" 
            />
          </div>
          <div className="flex flex-col">
            <span className="font-space font-bold text-sm text-white tracking-tighter">Alex Thorne</span>
            <span className="text-[0.6rem] font-bold text-iron-lime uppercase tracking-widest mt-0.5">Master Trainer</span>
          </div>
        </div>
      </div>
    </div>
  );
}
