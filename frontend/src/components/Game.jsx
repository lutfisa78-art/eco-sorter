import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const DATA_SAMPAH = [
  { id: 1, img: '/assets/game/or_pisang.png', type: 'organik' },
  { id: 2, img: '/assets/game/an_gelas.png', type: 'anorganik' },
  { id: 3, img: '/assets/game/lampu.png', type: 'b3' },
  { id: 4, img: '/assets/game/an_kaleng.png', type: 'anorganik' },
  { id: 5, img: '/assets/game/Organik2.png', type: 'organik' },
  { id: 6, img: '/assets/game/NonOrganik1.png', type: 'anorganik' },
  { id: 7, img: '/assets/game/b3_spray.png', type: 'b3' },
  { id: 8, img: '/assets/game/NonOrganik2.png', type: 'anorganik' },
  { id: 9, img: '/assets/game/Copy of Organik1.png', type: 'organik' },
  { id: 10, img: '/assets/game/kaleng_cat.png', type: 'b3' },
  { id: 11, img: '/assets/game/Remot_TV.png', type: 'b3' },
  { id: 12, img: '/assets/game/Hp.png', type: 'b3' },
  { id: 13, img: '/assets/game/Susu.png', type: 'anorganik' },
  { id: 14, img: '/assets/game/Sayur.png', type: 'organik' },
  { id: 15, img: '/assets/game/Telur.png', type: 'organik' },
  { id: 16, img: '/assets/game/Baterai.png', type: 'b3' },
  { id: 17, img: '/assets/game/Styrofoam.png', type: 'anorganik' },
];

const Game = () => {
  const navigate = useNavigate();
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [hearts, setHearts] = useState([true, true, true]);
  const [level, setLevel] = useState(1);
  const [activeTrash, setActiveTrash] = useState([]);
  const [gameState, setGameState] = useState('PLAYING');
  const [nickname, setNickname] = useState('');
  const [binPositions, setBinPositions] = useState({ anorganik: null, organik: null, b3: null });
  const [isLandscape, setIsLandscape] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= window.innerHeight;
  });
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('eco-music-muted') === 'true';
  });
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success'); 
  const [showNotification, setShowNotification] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  // FITUR BARU: State kontrol visual petunjuk tangan di awal game
  const [showTutorial, setShowTutorial] = useState(true);

  const draggingIdRef = useRef(null);
  const handledTrashIdsRef = useRef(new Set());
  const audioRef = useRef(null);
  const soundWrongRef = useRef(null);

  const TRASH_Y = '6vh';

  const createTrash = useCallback((xOffset = 0) => {
    const randomType = DATA_SAMPAH[Math.floor(Math.random() * DATA_SAMPAH.length)];
    const safeWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
    return {
      ...randomType,
      instanceId: Date.now() + Math.random(),
      x: safeWidth + 50 + xOffset,
      y: TRASH_Y,
    };
  }, []);

  const speed = 2 + level * 1.2;

  // Route Guard: Cek akses sebelum render
  useEffect(() => {
    const allowed = typeof window !== 'undefined' && sessionStorage.getItem('eco-allow-game') === 'true';
    if (!allowed) {
      navigate('/', { replace: true });
    } else {
      setIsChecking(false);
    }
  }, [navigate]);

  // Initialize Audio
  useEffect(() => {
    try {
      document.querySelectorAll('audio').forEach((a) => {
        try { a.pause(); a.currentTime = 0; } catch (e) {}
      });
    } catch (e) {}

    const muted = localStorage.getItem('eco-music-muted') === 'true';
    if (!muted && !audioRef.current) {
      audioRef.current = new Audio('/assets/audio/bensound-funnysong.ogg');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(() => {});
    }

    return () => {
      if (audioRef.current && gameState === 'GAMEOVER') {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  // Control audio based on muted state
  useEffect(() => {
    if (isMuted) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio('/assets/audio/bensound-funnysong.ogg');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.5;
    }
    audioRef.current.play().catch(() => {});
  }, [isMuted]);

  useEffect(() => {
    if (gameState !== 'GAMEOVER') return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (isMuted) return;

    if (!soundWrongRef.current) {
      soundWrongRef.current = new Audio('/assets/audio/sound-wrong.wav');
      soundWrongRef.current.volume = 0.65;
    }

    soundWrongRef.current.currentTime = 0;
    soundWrongRef.current.play().catch(() => {});
  }, [gameState, isMuted]);

  useEffect(() => {
    localStorage.setItem('eco-music-muted', isMuted ? 'true' : 'false');
  }, [isMuted]);

  // Cleanup audio ketika komponen unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    const updateBinPositions = () => {
      const anorganikBin = document.getElementById('bin-anorganik');
      const organikBin = document.getElementById('bin-organik');
      const b3Bin = document.getElementById('bin-b3');
      
      setBinPositions({
        organik: organikBin ? organikBin.getBoundingClientRect() : null,
        anorganik: anorganikBin ? anorganikBin.getBoundingClientRect() : null,
        b3: b3Bin ? b3Bin.getBoundingClientRect() : null,
      });
    };

    const timeoutId = setTimeout(updateBinPositions, 150);

    window.addEventListener('resize', updateBinPositions);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateBinPositions);
    };
  }, [level]);

  const updateOrientation = useCallback(() => {
    const isLandscapeScreen =
      window.matchMedia('(orientation: landscape)').matches ||
      window.innerWidth >= window.innerHeight;
    setIsLandscape(isLandscapeScreen);
  }, []);

  const tryLockLandscape = useCallback(async () => {
    const orientation = window.screen?.orientation;
    if (orientation?.lock) {
      try {
        await orientation.lock('landscape');
      } catch (error) {
        if (error?.name !== 'AbortError' && error?.name !== 'NotSupportedError') {
          console.warn('Unable to lock orientation:', error);
        }
      }
    }
  }, []);

  useEffect(() => {
    updateOrientation();
    tryLockLandscape();

    const portraitQuery = window.matchMedia('(orientation: portrait)');
    const onOrientationChange = () => {
      updateOrientation();
      tryLockLandscape();
    };

    portraitQuery.addEventListener?.('change', onOrientationChange);
    portraitQuery.addListener?.(onOrientationChange);
    window.addEventListener('orientationchange', onOrientationChange);
    window.addEventListener('resize', updateOrientation);

    return () => {
      portraitQuery.removeEventListener?.('change', onOrientationChange);
      portraitQuery.removeListener?.(onOrientationChange);
      window.removeEventListener('orientationchange', onOrientationChange);
      window.removeEventListener('resize', updateOrientation);
    };
  }, [tryLockLandscape, updateOrientation]);

  useEffect(() => {
    document.body.style.overflow = isLandscape ? '' : 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLandscape]);

  // Spawn awal sampah
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const safeWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
    const s1 = DATA_SAMPAH[Math.floor(Math.random() * DATA_SAMPAH.length)];
    const s2 = DATA_SAMPAH[Math.floor(Math.random() * DATA_SAMPAH.length)];
    const s3 = DATA_SAMPAH[Math.floor(Math.random() * DATA_SAMPAH.length)];

    // Sampah awal digeser agak ke tengah sedikit agar langsung kena tunjuk animasi kawan
    setActiveTrash([
      { ...s1, instanceId: Date.now() + 0.1, x: safeWidth * 0.65, y: TRASH_Y },
      { ...s2, instanceId: Date.now() + 0.2, x: safeWidth * 0.80, y: TRASH_Y },
      { ...s3, instanceId: Date.now() + 0.3, x: safeWidth * 0.95, y: TRASH_Y }
    ]);

    // Timer pengaman: Jika user bengong, tutorial hilang sendiri dalam 6 detik
    const tutorialTimer = setTimeout(() => {
      setShowTutorial(false);
    }, 6000);

    return () => clearTimeout(tutorialTimer);
  }, [gameState]);

  // Spawn sampah berkala
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const spawnInterval = setInterval(() => {
      const extraOffset = Math.floor(Math.random() * 120);
      setActiveTrash(prev => [...prev, createTrash(extraOffset)]);
    }, Math.max(1000, 2500 - level * 250));

    return () => clearInterval(spawnInterval);
  }, [level, gameState, createTrash]);

  const loseLife = useCallback(() => {
    setLives((prev) => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        setGameState('GAMEOVER');
      }
      return newLives;
    });
    setHearts((prev) => {
      const newHearts = [...prev];
      const lastActive = newHearts.lastIndexOf(true);
      if (lastActive !== -1) {
        newHearts[lastActive] = false;
      }
      return newHearts;
    });
  }, []);

  // Pergerakan Sampah Berjalan
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const moveInterval = setInterval(() => {
      setActiveTrash((prev) => {
        let didLoseLife = false;
        const updated = prev
          .filter((t) => {
            if (handledTrashIdsRef.current.has(t.instanceId)) {
              return false;
            }
            return true;
          })
          .map((t) => {
            if (draggingIdRef.current === t.instanceId) {
              return t;
            }
            return { ...t, x: t.x - speed };
          })
          .filter((t) => {
            if (draggingIdRef.current === t.instanceId) {
              return true;
            }
            if (t.x < -80) {
              didLoseLife = true;
              handledTrashIdsRef.current.add(t.instanceId);
              return false;
            }
            return true;
          });

        if (didLoseLife) {
          loseLife();
        }

        return updated;
      });
    }, 20);

    return () => clearInterval(moveInterval);
  }, [speed, gameState, loseLife]);

  // Fungsi saveScore terhubung ke Railway
  const saveScore = async (name) => {
    if (!name.trim()) return; 
    
    try {
      const response = await fetch('https://eco-sorter-production-bbd3.up.railway.app/save_score.php', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          nickname: name.trim(), 
          score: parseInt(score, 10) 
        }),
      });

      const result = await response.json();

      if (result.status === "success") {
        setNotificationMessage('Skor berhasil disimpan!');
        setNotificationType('success');
        setShowNotification(true);
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1500);
      } else {
        throw new Error(result.message || "Gagal menyimpan");
      }
    } catch (error) {
      console.error('Gagal menyimpan skor:', error);
      setNotificationMessage('Gagal menyimpan skor. Coba lagi.');
      setNotificationType('error');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  };

  const handleDrop = (trash, endX, endY) => {
    const { anorganik, organik, b3 } = binPositions;

    const isOverOrganik =
      organik &&
      endX >= organik.left &&
      endX <= organik.right &&
      endY >= organik.top &&
      endY <= organik.bottom;

    const isOverAnorganik =
      anorganik &&
      endX >= anorganik.left &&
      endX <= anorganik.right &&
      endY >= anorganik.top &&
      endY <= anorganik.bottom;

    const isOverB3 =
      b3 &&
      endX >= b3.left &&
      endX <= b3.right &&
      endY >= b3.top &&
      endY <= b3.bottom;

    let correct = false;
    if (trash.type === 'organik' && isOverOrganik) correct = true;
    if (trash.type === 'anorganik' && isOverAnorganik) correct = true;
    if (trash.type === 'b3' && isOverB3) correct = true;

    if (handledTrashIdsRef.current.has(trash.instanceId)) {
      return;
    }

    if (correct) {
      const newScore = score + 10;
      setScore(newScore);
      if (newScore > 0 && newScore % 50 === 0) {
        setLevel((l) => Math.min(l + 1, 7));
      }
    } else if (isOverOrganik || isOverAnorganik || isOverB3) {
      loseLife();
    }

    handledTrashIdsRef.current.add(trash.instanceId);
    setActiveTrash((prev) => prev.filter((t) => t.instanceId !== trash.instanceId));
  };

  const resetState = () => {
    handledTrashIdsRef.current.clear();
    draggingIdRef.current = null;
    setScore(0);
    setLives(3);
    setHearts([true, true, true]);
    setLevel(1);
    setNickname('');
    setNotificationMessage('');
    setNotificationType('success');
    setShowNotification(false);
    setShowTutorial(true); // Tutorial diaktifkan kembali jika mengulang game

    const safeWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
    const s1 = DATA_SAMPAH[Math.floor(Math.random() * DATA_SAMPAH.length)];
    const s2 = DATA_SAMPAH[Math.floor(Math.random() * DATA_SAMPAH.length)];
    const s3 = DATA_SAMPAH[Math.floor(Math.random() * DATA_SAMPAH.length)];

    setActiveTrash([
      { ...s1, instanceId: Date.now() + 0.1, x: safeWidth * 0.65, y: TRASH_Y },
      { ...s2, instanceId: Date.now() + 0.2, x: safeWidth * 0.80, y: TRASH_Y },
      { ...s3, instanceId: Date.now() + 0.3, x: safeWidth * 0.95, y: TRASH_Y }
    ]);
    setGameState('PLAYING');
  };

  const restartGame = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    resetState();
    if (!isMuted && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  const goHome = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    navigate('/', { replace: true });
  };

  if (isChecking) {
    return null;
  }

  return (
    <div className="relative w-full h-screen h-dvh min-h-[320px] overflow-hidden select-none bg-slate-900">
      {/* Background Rumput */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-400 via-green-500 to-green-600" />
      
      {/* Area Air/Jalur Sungai */}
      <div className="absolute bottom-0 left-0 right-0 h-[22dvh] bg-gradient-to-t from-blue-500 via-blue-400 to-blue-300 shadow-inner" />

      {/* UI HUD Atas */}
      <div className="absolute top-2 left-2 right-2 flex items-center gap-2 sm:gap-3 z-50">
        <div className="bg-orange-200/95 border border-orange-800 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-black text-[11px] sm:text-sm md:text-base shadow-sm text-orange-950 min-w-[72px] text-center">
          Skor: {score}
        </div>
        
        <div className="bg-green-200/95 border border-green-800 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-black text-[11px] sm:text-sm md:text-base shadow-sm text-green-950 min-w-[56px] text-center">
          Lvl: {level}
        </div>
        
        <div className="bg-red-200/95 border border-red-800 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl flex items-center gap-1 shadow-sm">
          {hearts.map((heart, i) => (
            <motion.span
              key={i}
              animate={{
                scale: heart ? 1 : 0.7,
                opacity: heart ? 1 : 0.25,
              }}
              transition={{ duration: 0.25 }}
              className="text-sm sm:text-base"
            >
              {heart ? '❤️' : '🖤'}
            </motion.span>
          ))}
        </div>

        {/* Kontrol Kanan Atas */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setIsMuted((prev) => !prev)}
            className="hover:scale-110 active:scale-95 transition-transform touch-manipulation focus:outline-none"
            title={isMuted ? 'Nyalakan Musik' : 'Matikan Musik'}
          >
            <img 
              src={isMuted ? '/assets/game/TbMusik_Mati.png' : '/assets/game/TbMusik.png'}
              alt={isMuted ? 'Musik Mati' : 'Musik'} 
              className="w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14 object-contain"
            />
          </button>

          <button
            onClick={restartGame}
            className="hover:scale-110 active:scale-95 transition-transform touch-manipulation focus:outline-none"
          >
            <img 
              src="/assets/game/TbReset.png" 
              alt="Reset" 
              className="w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14 object-contain"
            />
          </button>

          <button
            onClick={goHome}
            className="hover:scale-110 active:scale-95 transition-transform touch-manipulation focus:outline-none"
          >
            <img 
              src="/assets/game/TbHome.png" 
              alt="Home" 
              className="w-8 h-8 sm:w-11 sm:h-11 md:w-14 md:h-14 object-contain"
            />
          </button>
        </div>
      </div>

      {/* AREA TONG SAMPAH */}
      <div className="absolute top-[22dvh] sm:top-[20dvh] md:top-[19dvh] w-full flex justify-around px-2 sm:px-12 z-30 pointer-events-none">
        <div id="bin-organik" className="flex flex-col items-center pointer-events-auto">
          <img 
            src="/assets/game/BoxOrganik.png" 
            className="w-16 sm:w-24 md:w-32 lg:w-36 max-h-[36vh] object-contain drop-shadow-md" 
            alt="Organik" 
          />
        </div>

        <motion.div 
          id="bin-anorganik" 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col items-center pointer-events-auto"
        >
          <img 
            src="/assets/game/BoxNonOrganik.png" 
            className="w-16 sm:w-24 md:w-32 lg:w-36 max-h-[36vh] object-contain drop-shadow-md" 
            alt="Anorganik" 
          />
        </motion.div>

        <motion.div 
          id="bin-b3" 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col items-center pointer-events-auto"
        >
          <img 
            src="/assets/game/BoxB3.png" 
            className="w-16 sm:w-24 md:w-32 lg:w-36 max-h-[36vh] object-contain drop-shadow-md" 
            alt="B3" 
          />
        </motion.div>
      </div>

      {/* Hamparan Animasi Tangan Penunjuk */}
      <AnimatePresence>
        {showTutorial && gameState === 'PLAYING' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
          >
            {/* Teks Instruksi Melayang di Atas Aliran Air */}
            <div className="absolute bottom-[32dvh] left-1/2 -translate-x-1/2 bg-black/75 border border-yellow-400 text-yellow-300 font-extrabold px-4 py-2 rounded-2xl text-[10px] sm:text-xs uppercase tracking-wider shadow-md animate-pulse text-center">
              Geser sampah ke dalam tong yang cocok!
            </div>

            {/* Gerakan Menggeser Menggunakan Emoji Tangan */}
            <motion.div
              animate={{
                x: ['12vw', '12vw', '-15vw', '-15vw'],
                y: ['24vh', '24vh', '-8vh', '-8vh'],
                scale: [1, 0.85, 0.85, 1] 
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute text-3xl sm:text-4xl md:text-5xl drop-shadow-lg"
            >
              ☝️
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AREA LINTASAN SAMPAH BERJALAN */}
      <AnimatePresence>
        {activeTrash.map((trash) => (
          <motion.img
            key={trash.instanceId}
            src={trash.img}
            drag
            dragMomentum={false}
            dragElastic={0}
            onDragStart={() => {
              draggingIdRef.current = trash.instanceId;
              setShowTutorial(false); // Tutorial langsung hancur/hilang begitu user menyentuh sampah!
            }}
            onDragEnd={(event, info) => {
              handleDrop(trash, info.point.x, info.point.y);
              draggingIdRef.current = null;
            }}
            className="absolute w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-15 lg:h-15 cursor-grab active:cursor-grabbing z-40 touch-none object-contain"
            style={{
              left: trash.x,
              bottom: trash.y,
              transform: 'translateX(-50%)',
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            whileDrag={{ scale: 1.25, zIndex: 100 }}
            whileTap={{ scale: 1.1 }}
          />
        ))}
      </AnimatePresence>

      {/* Overlay Mode Portrait */}
      {!isLandscape && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 p-4 text-center text-white">
          <div className="max-w-md rounded-2xl border border-white/10 bg-slate-900/95 p-5 shadow-xl">
            <h2 className="text-xl sm:text-2xl font-black">
              Putar layar ke samping!
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-300">
              Game seru ini hanya bisa dimainkan dalam mode landscape ya kawan.
            </p>
          </div>
        </div>
      )}

      {/* Game Over Modal Screen */}
      {gameState === 'GAMEOVER' && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[100] p-2">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-b from-white to-slate-50 p-4 sm:p-6 md:p-8 rounded-2xl text-center w-full max-w-[280px] sm:max-w-[340px] shadow-xl border-4 border-amber-400 flex flex-col"
          >
            <h2 className="text-xl sm:text-2xl font-black text-red-600 tracking-wide">
              GAME OVER
            </h2>
            
            <div className="my-2 bg-amber-50 rounded-xl py-2 border border-amber-200">
              <p className="text-xs sm:text-sm font-bold text-amber-800">Skor Kamu</p>
              <p className="text-2xl sm:text-3xl font-black text-amber-600">{score}</p>
            </div>

            <input
              type="text"
              placeholder="Ketik nickname kamu"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-3 py-1.5 border-2 border-slate-200 rounded-xl text-center text-xs sm:text-sm font-bold focus:border-blue-500 focus:outline-none transition-colors"
              maxLength={15}
              autoComplete="off"
            />
            
            <div className="mt-3 flex gap-2 justify-center">
              <button 
                onClick={() => saveScore(nickname)}
                disabled={!nickname.trim()}
                className="bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white px-4 py-1.5 rounded-xl font-black text-xs transition-colors active:scale-95 shadow-sm"
              >
                Simpan
              </button>
              <button 
                onClick={restartGame}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-xl font-black text-xs transition-colors active:scale-95 shadow-sm"
              >
                Ulangi
              </button>
            </div>
            
            <button 
              onClick={goHome}
              className="mt-2.5 text-slate-400 hover:text-slate-600 text-[11px] font-bold underline"
            >
              Kembali ke Menu Utama
            </button>
          </motion.div>
        </div>
      )}

      {/* Notification Pop-up */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[120] px-6 py-3 rounded-xl font-black text-sm shadow-lg flex items-center gap-2 ${
              notificationType === 'success'
                ? 'bg-gradient-to-r from-green-400 to-green-500 text-white'
                : 'bg-gradient-to-r from-red-400 to-red-500 text-white'
            }`}
          >
            <span>{notificationType === 'success' ? '✓' : '✕'}</span>
            {notificationMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Game;