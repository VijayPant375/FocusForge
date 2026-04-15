import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-full glass-card hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
      aria-label="Toggle theme"
    >
      <div className="relative w-6 h-6 flex items-center justify-center">
        <Sun 
          className={`absolute transition-all duration-500 ease-in-out ${
            theme === 'dark' ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
          } text-amber-500`} 
          size={20} 
        />
        <Moon 
          className={`absolute transition-all duration-500 ease-in-out ${
            theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
          } text-blue-400`} 
          size={20} 
        />
      </div>
    </button>
  );
}
