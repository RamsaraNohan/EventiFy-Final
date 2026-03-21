import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-6 text-center text-sm text-slate-400 glass-panel mt-auto">
      <p>&copy; {new Date().getFullYear()} <span className="text-primary-400 font-semibold">EventiFy</span>. All systems operational.</p>
    </footer>
  );
}
