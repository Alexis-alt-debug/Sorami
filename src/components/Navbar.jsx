import { NavLink } from 'react-router-dom';
import { Home, Globe, BookOpen, Star, MessageCircle } from 'lucide-react';

const links = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/map', icon: Globe, label: 'Map' },
  { to: '/diary', icon: BookOpen, label: 'Diary' },
  { to: '/bucket-list', icon: Star, label: 'Summary' },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
];

export default function Navbar() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex z-50">
      {links.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-3 transition-colors text-xs ${
              isActive ? 'text-violet-400' : 'text-slate-500 hover:text-slate-300'
            }`
          }
        >
          <Icon className="w-5 h-5" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
