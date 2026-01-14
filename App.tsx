
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, ScoreEntry } from './types';
import { TOTAL_ROUNDS, PENALTY_SECONDS, ALPHANUMERIC_CHARS } from './constants';

const getRandomChar = () => {
  return ALPHANUMERIC_CHARS[Math.floor(Math.random() * ALPHANUMERIC_CHARS.length)];
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [targetChar, setTargetChar] = useState<string>('');
  const [roundIndex, setRoundIndex] = useState<number>(0);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [highScores, setHighScores] = useState<ScoreEntry[]>([]);
  const [lastActionTimestamp, setLastActionTimestamp] = useState<number>(0);
  const [isError, setIsError] = useState<boolean>(false);
  
  // Refy zapobiegające problemom z domknięciami w listenerach
  const gameStateRef = useRef(gameState);
  const targetCharRef = useRef(targetChar);
  const roundIndexRef = useRef(roundIndex);
  const lastTimestampRef = useRef(lastActionTimestamp);
  const totalScoreRef = useRef(totalScore);

  useEffect(() => {
    gameStateRef.current = gameState;
    targetCharRef.current = targetChar;
    roundIndexRef.current = roundIndex;
    lastTimestampRef.current = lastActionTimestamp;
    totalScoreRef.current = totalScore;
  }, [gameState, targetChar, roundIndex, lastActionTimestamp, totalScore]);

  // Ładowanie najlepszych wyników
  useEffect(() => {
    const saved = localStorage.getItem('quickkeys_highscores');
    if (saved) {
      setHighScores(JSON.parse(saved));
    }
  }, []);

  const startGame = useCallback(() => {
    const firstChar = getRandomChar();
    setTargetChar(firstChar);
    setRoundIndex(1);
    setTotalScore(0);
    setGameState(GameState.PLAYING);
    const now = Date.now();
    setLastActionTimestamp(now);
    setIsError(false);
  }, []);

  const handleFinish = useCallback((finalScore: number) => {
    setGameState(GameState.FINISHED);
    const newEntry: ScoreEntry = {
      id: Math.random().toString(36).substr(2, 9),
      score: Number(finalScore.toFixed(2)),
      date: new Date().toLocaleDateString()
    };
    const updated = [...highScores, newEntry].sort((a, b) => a.score - b.score).slice(0, 5);
    setHighScores(updated);
    localStorage.setItem('quickkeys_highscores', JSON.stringify(updated));
  }, [highScores]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    // Start gry spacją
    if (gameStateRef.current === GameState.START || gameStateRef.current === GameState.FINISHED) {
      if (e.code === 'Space') {
        e.preventDefault();
        startGame();
        return;
      }
    }

    if (gameStateRef.current !== GameState.PLAYING) return;

    // Ignorowanie klawiszy funkcyjnych (tylko pojedyncze znaki)
    if (e.key.length !== 1) return;

    const pressedKey = e.key.toUpperCase();
    const now = Date.now();
    const diff = (now - lastTimestampRef.current) / 1000;
    
    setLastActionTimestamp(now);

    if (pressedKey === targetCharRef.current) {
      // Poprawny klawisz
      setIsError(false);
      const newScore = totalScoreRef.current + diff;
      setTotalScore(newScore);
      
      if (roundIndexRef.current < TOTAL_ROUNDS) {
        setRoundIndex(prev => prev + 1);
        setTargetChar(getRandomChar());
      } else {
        handleFinish(newScore);
      }
    } else {
      // Błędny klawisz
      setIsError(true);
      setTimeout(() => setIsError(false), 200);
      setTotalScore(prev => prev + diff + PENALTY_SECONDS);
    }
  }, [startGame, handleFinish]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">
      {/* Dekoracja tła */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="z-10 w-full max-w-2xl bg-slate-900/80 border border-slate-700/50 rounded-3xl shadow-2xl backdrop-blur-xl p-8 md:p-12 transition-all duration-500">
        
        {gameState === GameState.START && (
          <div className="text-center space-y-8">
            <div className="space-y-2">
              <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent tracking-tight">
                QUICKKEYS
              </h1>
              <p className="text-slate-400 text-lg">Mistrzowski test szybkości pisania.</p>
            </div>
            
            <div className="bg-slate-800/50 p-6 rounded-2xl text-left border border-slate-700">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-blue-400">Zasady:</span>
              </h2>
              <ul className="space-y-3 text-slate-300">
                <li className="flex gap-3">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Wciśnij kolejno <strong className="text-white">{TOTAL_ROUNDS} znaków</strong> wyświetlanych na ekranie.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Twój wynik to łączny czas. <strong className="text-green-400">Im mniej, tym lepiej!</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-500 font-bold">•</span>
                  <span>Pomyłka dodaje <strong className="text-red-400">+{PENALTY_SECONDS} sekundę kary</strong>.</span>
                </li>
              </ul>
            </div>

            <button 
              onClick={startGame}
              className="group relative w-full md:w-auto px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-2xl rounded-2xl transition-all hover:scale-105 hover:shadow-lg active:scale-95 overflow-hidden"
            >
              <span className="relative z-10 uppercase">Rozpocznij Wyzwanie</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>

            {highScores.length > 0 && (
              <div className="pt-4 border-t border-slate-800">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Najlepsze Wyniki</h3>
                <div className="space-y-2">
                  {highScores.map((s, idx) => (
                    <div key={s.id} className="flex justify-between items-center text-slate-400 px-4 py-2 bg-slate-800/30 rounded-lg">
                      <span>{idx + 1}. {s.date}</span>
                      <span className="font-mono text-blue-400 font-bold">{s.score.toFixed(2)}s</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {gameState === GameState.PLAYING && (
          <div className="space-y-8 text-center">
            <div className="flex justify-between items-end mb-4">
              <div className="text-left">
                <div className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-1">Aktualny Wynik</div>
                <div className="text-4xl font-mono-bold text-blue-400 tabular-nums">
                  {totalScore.toFixed(2)}<span className="text-xl">s</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-1">Postęp</div>
                <div className="text-4xl font-mono-bold text-white tabular-nums">
                  {roundIndex}<span className="text-slate-600">/</span>{TOTAL_ROUNDS}
                </div>
              </div>
            </div>

            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
                style={{ width: `${(roundIndex / TOTAL_ROUNDS) * 100}%` }}
              ></div>
            </div>

            <div className={`relative py-20 flex items-center justify-center transition-all duration-200 ${isError ? 'animate-shake' : ''}`}>
               <div className={`absolute w-48 h-48 md:w-64 md:h-64 rounded-full border-4 transition-all duration-300 ${isError ? 'border-red-500 scale-110 opacity-100' : 'border-blue-500/20 opacity-50'}`}></div>
               <div className={`text-9xl md:text-[12rem] font-black select-none drop-shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-colors ${isError ? 'text-red-500' : 'text-white'}`}>
                {targetChar}
               </div>
            </div>

            <div className="h-6">
              {isError && (
                <div className="text-red-500 font-bold tracking-widest animate-pulse">
                  KARA +{PENALTY_SECONDS}s!
                </div>
              )}
            </div>

            <p className="text-slate-500 italic">Naciśnij odpowiedni klawisz na klawiaturze</p>
          </div>
        )}

        {gameState === GameState.FINISHED && (
          <div className="text-center space-y-10 py-4">
            <div className="space-y-4">
              <div className="inline-block px-4 py-1 bg-green-500/10 border border-green-500/30 text-green-400 rounded-full text-sm font-bold tracking-widest">
                WYZWANIE UKOŃCZONE
              </div>
              <h2 className="text-5xl font-black text-white">Twój Wynik</h2>
              <div className="text-8xl md:text-9xl font-black bg-gradient-to-b from-blue-400 to-purple-600 bg-clip-text text-transparent drop-shadow-lg font-mono-bold">
                {totalScore.toFixed(2)}<span className="text-3xl">s</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={startGame}
                className="flex items-center justify-center gap-2 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl rounded-2xl transition-all hover:scale-[1.02] active:scale-95"
              >
                SPRÓBUJ PONOWNIE
              </button>
              <button 
                onClick={() => setGameState(GameState.START)}
                className="flex items-center justify-center gap-2 py-5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xl rounded-2xl transition-all border border-slate-700 hover:scale-[1.02] active:scale-95"
              >
                MENU GŁÓWNE
              </button>
            </div>

            {highScores.length > 0 && highScores[0].score >= totalScore && (
              <div className="animate-bounce inline-block text-yellow-400 font-bold bg-yellow-400/10 px-6 py-2 rounded-full border border-yellow-400/20">
                🏆 NOWY REKORD ŻYCIOWY!
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 text-slate-500 text-sm flex items-center gap-4">
        <span>Naciśnij <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 font-mono text-slate-300">Spację</kbd> aby zacząć</span>
      </div>
    </div>
  );
};

export default App;
