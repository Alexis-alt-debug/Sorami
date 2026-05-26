import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TravelProvider } from './context/TravelContext';
import Navbar from './components/Navbar';
import Auth from './pages/Auth';
import Home from './pages/Home';
import MapPage from './pages/Map';
import Diary from './pages/Diary';
import Profile from './pages/Profile';
import Stats from './pages/Stats';
import CountryPage from './pages/CountryPage';
import AddMemory from './pages/AddMemory';
import BucketList from './pages/BucketList';
import Chat from './pages/Chat';

function AppRoutes() {
  const { user } = useAuth();

  if (user === undefined) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: '#f0e8d8' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#d4c4a8', borderTopColor: '#7b6eb0' }} />
      </div>
    );
  }

  if (!user) return <Auth />;

  return (
    <>
      <div className="flex-1 overflow-y-auto pb-16" style={{ background: '#f0e8d8' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/diary" element={<Diary />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/country/:code" element={<CountryPage />} />
          <Route path="/country/:code/add" element={<AddMemory />} />
          <Route path="/bucket-list" element={<BucketList />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Navbar />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TravelProvider>
          <AppRoutes />
        </TravelProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
