'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ProgressContext = createContext();

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api');

export function ProgressProvider({ children }) {
  const { token } = useAuth();
  const [vocabMastered, setVocabMastered] = useState([]);
  const [kanjiMastered, setKanjiMastered] = useState([]);
  const [grammarMastered, setGrammarMastered] = useState([]);
  const [readingMastered, setReadingMastered] = useState([]);
  const [listeningMastered, setListeningMastered] = useState([]);
  const [completedDays, setCompletedDays] = useState([]);
  const [theme, setTheme] = useState('light');
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentLevel, setCurrentLevel] = useState('N3');
  const [minnaMastered, setMinnaMastered] = useState([]);

  // Load from localStorage after mount
  useEffect(() => {
    try {
      const storedVocab = localStorage.getItem('vocab_mastered_words');
      const storedKanji = localStorage.getItem('kanji_mastered_chars');
      const storedGrammar = localStorage.getItem('grammar_mastered_points');
      const storedReading = localStorage.getItem('reading_mastered_lessons');
      const storedListening = localStorage.getItem('listening_mastered_lessons');
      const storedDays = localStorage.getItem('n3_completed_days');
      const storedTheme = localStorage.getItem('jlpt_theme');

      if (storedVocab) setVocabMastered(JSON.parse(storedVocab));
      if (storedKanji) setKanjiMastered(JSON.parse(storedKanji));
      if (storedGrammar) setGrammarMastered(JSON.parse(storedGrammar));
      if (storedReading) setReadingMastered(JSON.parse(storedReading));
      if (storedListening) setListeningMastered(JSON.parse(storedListening));
      if (storedDays) setCompletedDays(JSON.parse(storedDays));
      if (storedTheme) {
        setTheme(storedTheme);
        document.documentElement.setAttribute('data-theme', storedTheme);
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }
      const storedLevel = localStorage.getItem('jlpt_current_level');
      if (storedLevel && ['N3', 'N4', 'N5'].includes(storedLevel)) setCurrentLevel(storedLevel);
      const storedMinna = localStorage.getItem('minna_mastered_lessons');
      if (storedMinna) setMinnaMastered(JSON.parse(storedMinna));
    } catch (e) {
      console.error('Failed to load state from localStorage:', e);
    }
    setIsLoaded(true);
  }, []);

  // Sync with cloud database when logged in
  useEffect(() => {
    if (!token || !isLoaded) return;

    const syncWithCloud = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/progress/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            vocabMastered,
            kanjiMastered,
            grammarMastered,
            readingMastered,
            listeningMastered
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.progress) {
            const { vocabMastered: vm, kanjiMastered: km, grammarMastered: gm, readingMastered: rm, listeningMastered: lm } = data.progress;
            if (vm) setVocabMastered(vm);
            if (km) setKanjiMastered(km);
            if (gm) setGrammarMastered(gm);
            if (rm) setReadingMastered(rm);
            if (lm) setListeningMastered(lm);
          }
        }
      } catch (err) {
        console.error('Failed to sync progress with cloud:', err);
      }
    };

    syncWithCloud();
  }, [token, isLoaded]);

  // Clean local progress on logout (when token changes to null)
  useEffect(() => {
    if (!token && isLoaded) {
      // Keep local progress if desired, or clear it. Commercial SaaS usually keeps local progress
      // but resets on new registration. We can just keep it.
    }
  }, [token, isLoaded]);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('vocab_mastered_words', JSON.stringify(vocabMastered));
  }, [vocabMastered, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('kanji_mastered_chars', JSON.stringify(kanjiMastered));
  }, [kanjiMastered, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('grammar_mastered_points', JSON.stringify(grammarMastered));
  }, [grammarMastered, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('n3_completed_days', JSON.stringify(completedDays));
  }, [completedDays, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('reading_mastered_lessons', JSON.stringify(readingMastered));
  }, [readingMastered, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('listening_mastered_lessons', JSON.stringify(listeningMastered));
  }, [listeningMastered, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('jlpt_current_level', currentLevel);
  }, [currentLevel, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('minna_mastered_lessons', JSON.stringify(minnaMastered));
  }, [minnaMastered, isLoaded]);

  const changeLevel = (level) => {
    if (['N3', 'N4', 'N5'].includes(level)) setCurrentLevel(level);
  };

  const toggleMinnaMastered = (lessonNumber) => {
    setMinnaMastered((prev) =>
      prev.includes(lessonNumber)
        ? prev.filter((n) => n !== lessonNumber)
        : [...prev, lessonNumber]
    );
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('jlpt_theme', nextTheme);
  };

  const syncToggleToServer = async (lessonId, type, isCompleted) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/progress/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lessonId,
          type,
          status: isCompleted ? 'mastered' : 'in_progress'
        })
      });
    } catch (err) {
      console.error(`Failed to sync toggle progress for ${type} ${lessonId}:`, err);
    }
  };

  const toggleVocabMastered = (id) => {
    const exists = vocabMastered.includes(id);
    setVocabMastered((prev) =>
      exists ? prev.filter((item) => item !== id) : [...prev, id]
    );
    syncToggleToServer(id, 'vocab', !exists);
  };

  const toggleKanjiMastered = (char) => {
    const exists = kanjiMastered.includes(char);
    setKanjiMastered((prev) =>
      exists ? prev.filter((item) => item !== char) : [...prev, char]
    );
    syncToggleToServer(char, 'kanji', !exists);
  };

  const toggleGrammarMastered = (id) => {
    const exists = grammarMastered.includes(id);
    setGrammarMastered((prev) =>
      exists ? prev.filter((item) => item !== id) : [...prev, id]
    );
    syncToggleToServer(id, 'grammar', !exists);
  };

  const toggleDayCompleted = (dayId) => {
    setCompletedDays((prev) =>
      prev.includes(dayId) ? prev.filter((item) => item !== dayId) : [...prev, dayId]
    );
  };

  const toggleReadingMastered = (id) => {
    const exists = readingMastered.includes(id);
    setReadingMastered((prev) =>
      exists ? prev.filter((item) => item !== id) : [...prev, id]
    );
    syncToggleToServer(id, 'reading', !exists);
  };

  const toggleListeningMastered = (id) => {
    const exists = listeningMastered.includes(id);
    setListeningMastered((prev) =>
      exists ? prev.filter((item) => item !== id) : [...prev, id]
    );
    syncToggleToServer(id, 'listening', !exists);
  };

  return (
    <ProgressContext.Provider
      value={{
        vocabMastered,
        kanjiMastered,
        grammarMastered,
        completedDays,
        readingMastered,
        listeningMastered,
        theme,
        isLoaded,
        currentLevel,
        minnaMastered,
        toggleTheme,
        toggleVocabMastered,
        toggleKanjiMastered,
        toggleGrammarMastered,
        toggleDayCompleted,
        toggleReadingMastered,
        toggleListeningMastered,
        changeLevel,
        toggleMinnaMastered,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}
