import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('eco-music-muted') === 'true';
  });
  const audioRef = useRef(null);
  const [audioAllowed, setAudioAllowed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('eco-music-muted') !== 'true';
  });
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState(null);

  const toggleSound = () => {
    const nextMuted = !isMuted;
    localStorage.setItem('eco-music-muted', nextMuted ? 'true' : 'false');
    if (!nextMuted) {
      setAudioAllowed(true);
    }
    setIsMuted(nextMuted);
  };

  useEffect(() => {
    const audio = document.getElementById('bgm');
    audioRef.current = audio;
    if (!audio) return;

    if (isMuted) {
      audio.pause();
    } else if (audioAllowed) {
      audio.play().catch(err => console.log('Audio play failed:', err));
    }
  }, [isMuted, audioAllowed]);

  // Coba mainkan audio sekali setelah interaksi pertama pengguna (autoplay workaround)
  useEffect(() => {
    const audio = document.getElementById('bgm');
    audioRef.current = audio;
    if (!audio) return;

    const tryPlay = () => {
      if (localStorage.getItem('eco-music-muted') === 'true') return;
      setAudioAllowed(true);
      audio.play().catch(() => {});
      window.removeEventListener('click', tryPlay);
      window.removeEventListener('touchstart', tryPlay);
    };

    window.addEventListener('click', tryPlay, { once: true });
    window.addEventListener('touchstart', tryPlay, { once: true });

    return () => {
      window.removeEventListener('click', tryPlay);
      window.removeEventListener('touchstart', tryPlay);
    };
  }, []);

  const startGame = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('eco-allow-materi', 'true');
      sessionStorage.setItem('eco-play-materi', 'true');
      sessionStorage.removeItem('eco-allow-game');

      if (!isMuted) {
        try {
          const materiAudio = new Audio('/assets/audio/explainer-corporate.ogg');
          materiAudio.loop = true;
          materiAudio.volume = 0.5;
          materiAudio.__ecoSource = 'materi';
          materiAudio.__ecoAutoStarted = true;
          window.__ecoMateriAutoAudio = materiAudio;
          materiAudio.play().catch(() => {});
        } catch (error) {
          console.warn('Materi autoplay setup gagal:', error);
        }
      }
    }
    navigate('/materi');
  };

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    setLeaderboardError(null);

    try {
      // Mengarah langsung ke domain publik backend Railway kamu kawan
      const response = await fetch('https://eco-sorter-production-bbd3.up.railway.app/get_leaderboard.php');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setLeaderboardData(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboardError('Gagal memuat leaderboard');
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const openLeaderboard = () => {
    setShowLeaderboard(true);
    fetchLeaderboard();
  };

  const closeLeaderboard = () => {
    setShowLeaderboard(false);
  };

  return (
    <div className="relative w-full h-screen h-dvh overflow-hidden flex items-center justify-center bg-slate-900 select-none">
      {/* Background */}
      <img 
        src="/assets/home/BGgHome.jpg" 
        alt="Taman" 
        className="absolute inset-0 w-full h-full object-cover" 
      />

      {/* Judul Game */}
      <div className="absolute top-3 sm:top-5 md:top-7 flex justify-center w-full z-10 px-4">
        <img 
          src="/assets/home/judul.png" 
          alt="Pilah Sampah" 
          className="w-80 sm:w-[34rem] md:w-[48rem] lg:w-[52rem] max-w-[92vw] max-h-[26vh] object-contain" 
        />
      </div>

      {/* Tombol Navigasi Kanan Atas */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex flex-col gap-2 z-20">
        <button 
          onClick={openLeaderboard} 
          className="hover:scale-110 active:scale-95 transition-transform touch-manipulation"
        >
          <img 
            src="/assets/home/TbPiala.png" 
            alt="Piala" 
            className="w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14" 
          />
        </button>

        <button 
          onClick={toggleSound} 
          className="hover:scale-110 active:scale-95 transition-transform touch-manipulation"
        >
          <img 
            src={isMuted ? "/assets/home/TbMusik_Mati.png" : "/assets/home/TbMusik.png"} 
            alt="Speaker" 
            className="w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14" 
          />
        </button>
      </div>

      {/* Tombol Play */}
      <div className="z-10 mt-16 sm:mt-24">
        <button 
          onClick={startGame} 
          className="hover:scale-110 active:scale-95 transition-transform duration-300 animate-bounce touch-manipulation focus:outline-none"
        >
          <img 
            src="/assets/home/TbPlay.png" 
            alt="Play" 
            className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-36 lg:h-36" 
          />
        </button>
      </div>

      {/* Modal Leaderboard */}
      {showLeaderboard && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Leaderboard"
        >
          <div className="relative w-full max-w-[260px] sm:max-w-[320px] md:max-w-[380px] h-[90vh] max-h-[340px] sm:max-h-[420px] flex flex-col items-center justify-center">
            {/* Papan Kayu */}
            <img 
              src="/assets/leaderboard/papan.png" 
              alt="Papan" 
              className="absolute inset-0 w-full h-full object-fill z-0 drop-shadow-2xl" 
            />
            
            {/* Isi Data Skor */}
            <div className="absolute inset-x-[14%] sm:inset-x-[16%] top-[24%] bottom-[25%] z-10 text-amber-950 font-bold overflow-hidden flex flex-col">
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-1 sm:px-1.5 pr-0.5 space-y-1 scrollbar-thin scrollbar-thumb-amber-800">
                {loadingLeaderboard ? (
                  <div className="flex items-center justify-center h-full text-[10px]">Memuat...</div>
                ) : leaderboardError ? (
                  <div className="flex items-center justify-center h-full text-red-700 text-[10px]">{leaderboardError}</div>
                ) : leaderboardData.length > 0 ? (
                  leaderboardData.map((entry, index) => (
                    <div 
                      key={index} 
                      className="w-full box-border flex items-center justify-between rounded-xl bg-blue-950/90 px-1.5 py-1 shadow-sm border border-yellow-400/40 gap-1"
                    >
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        <div className="flex-shrink-0 flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-yellow-500 text-[9px] sm:text-[10px] font-black text-slate-950">
                          {index + 1}
                        </div>
                        <span className="text-[9px] sm:text-[11px] font-extrabold uppercase tracking-wide text-white truncate">
                          {entry.nickname}
                        </span>
                      </div>
                      <span className="flex-shrink-0 rounded-lg bg-slate-950 px-1 py-0.5 text-[9px] sm:text-[10px] font-black text-yellow-300">
                        {entry.score}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-amber-900">Belum ada skor.</div>
                )}
              </div>
            </div>

            {/* Tombol Tutup */}
            <button
              type="button"
              onClick={closeLeaderboard}
              className="absolute bottom-[10%] left-1/2 -translate-x-1/2 z-30 rounded-xl bg-gradient-to-b from-red-500 to-red-700 border border-red-400 px-4 py-1.5 text-[10px] sm:text-xs font-black uppercase text-white shadow-md active:translate-y-0.5 transition-all touch-manipulation"
            >
              TUTUP
            </button>
          </div>
        </div>
      )}

      {/* Audio */}
      <audio id="bgm" loop>
        <source src="/assets/audio/bensound-buddy.ogg" type="audio/ogg" />
      </audio>
    </div>
  );
};

export default Home;