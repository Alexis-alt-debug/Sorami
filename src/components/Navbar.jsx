import { NavLink, useLocation } from 'react-router-dom';
import { IcoHome, IcoNavGlobe, IcoNavDiary, IcoNavStar, IcoNavQuill } from './VintageIcons';

const links = [
  { to: '/',            Ico: IcoHome,      label: 'Home'    },
  { to: '/map',         Ico: IcoNavGlobe,  label: 'Map'     },
  { to: '/diary',       Ico: IcoNavDiary,  label: 'Diary'   },
  { to: '/bucket-list', Ico: IcoNavStar,   label: 'Wishlist'},
  { to: '/chat',        Ico: IcoNavQuill,  label: 'Chat'    },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430,
      background: '#faf6ef',
      borderTop: '2px solid #d4c4a8',
      display: 'flex',
      zIndex: 50,
      boxShadow: '0 -2px 12px rgba(44,26,14,0.08)',
    }}>
      {links.map(({ to, Ico, label }) => {
        const isActive = to === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(to);

        return (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              paddingTop: 10,
              paddingBottom: 10,
              textDecoration: 'none',
              color: isActive ? '#7b6eb0' : '#a89070',
              transition: 'color 0.15s',
              position: 'relative',
            }}
          >
            {isActive && (
              <span style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 18, height: 2.5, borderRadius: 2,
                background: '#7b6eb0',
              }} />
            )}
            <Ico color={isActive ? '#7b6eb0' : '#a89070'} size={22} />
            <span style={{
              fontSize: 10,
              fontFamily: "'Crimson Text', Georgia, serif",
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}>
              {label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}
