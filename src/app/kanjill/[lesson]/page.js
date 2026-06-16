'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, RotateCw } from 'lucide-react';
import '../kanjill.css';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api');

export default function KanjiLLLesson() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lesson;
  
  const [lessonData, setLessonData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredKanjis, setMasteredKanjis] = useState([]);

  useEffect(() => {
    fetchLesson();
    const saved = localStorage.getItem(`kanjill_mastered_${lessonId}`);
    if (saved) setMasteredKanjis(JSON.parse(saved));
  }, [lessonId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Bỏ qua nếu người dùng đang gõ vào input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (currentIndex > 0) {
          setIsFlipped(false);
          setTimeout(() => setCurrentIndex(c => c - 1), 150);
        }
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (lessonData && currentIndex < lessonData.kanjis.length - 1) {
          setIsFlipped(false);
          setTimeout(() => setCurrentIndex(c => c + 1), 150);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, lessonData]);

  const fetchLesson = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/kanjill/${lessonId}`);
      if (res.ok) {
        const data = await res.json();
        setLessonData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMastered = () => {
    const kanjiStr = currentKanji.kanji;
    let updated;
    if (masteredKanjis.includes(kanjiStr)) {
      updated = masteredKanjis.filter(k => k !== kanjiStr);
    } else {
      updated = [...masteredKanjis, kanjiStr];
    }
    setMasteredKanjis(updated);
    localStorage.setItem(`kanjill_mastered_${lessonId}`, JSON.stringify(updated));
  };

  const nextCard = () => {
    if (currentIndex < lessonData.kanjis.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(c => c + 1), 150);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(c => c - 1), 150);
    }
  };

  if (isLoading) return <div className="kll-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Đang tải dữ liệu...</div>;
  if (!lessonData) return (
    <div className="kll-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      <p>Không tìm thấy dữ liệu Bài {lessonId}</p>
      <button onClick={() => router.push('/kanjill')} className="kll-btn kll-btn-secondary">Quay lại</button>
    </div>
  );

  const currentKanji = lessonData.kanjis[currentIndex];
  const isMastered = masteredKanjis.includes(currentKanji.kanji);
  const progress = Math.round((masteredKanjis.length / lessonData.kanjis.length) * 100) || 0;

  return (
    <div className="kll-container" style={{ display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div className="kll-flashcard-header">
        <button onClick={() => router.push('/kanjill')} className="kll-back-btn">
          <ArrowLeft size={20} /> Bảng điều khiển
        </button>
        <div style={{ textAlign: 'right' }}>
          <h1 className="kll-lesson-title">{lessonData.title}</h1>
          <p className="kll-lesson-status">{masteredKanjis.length} / {lessonData.kanjis.length} đã thuộc</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="kll-main-progress">
        <div className="kll-main-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Flashcard Area */}
      <div className="kll-flashcard-area">
        
        {/* The Card Scene */}
        <div className="kll-scene" onClick={() => setIsFlipped(!isFlipped)}>
          <div className={`kll-card-3d ${isFlipped ? 'is-flipped' : ''}`}>
            
            {/* Front */}
            <div className="kll-card-face kll-card-front">
              <span className="kll-big-kanji">{currentKanji.kanji}</span>
              <span className="kll-big-hv">{currentKanji.hanViet}</span>
              
              <div className="kll-flip-hint">
                <RotateCw size={16} /> Chạm để lật
              </div>
            </div>

            {/* Back */}
            <div className="kll-card-face kll-card-back">
              <div className="kll-back-header">
                <div>
                  <h2 className="kll-back-meaning">{currentKanji.meaning}</h2>
                  <div className="kll-back-readings">{currentKanji.readings}</div>
                </div>
                <div className="kll-watermark-kanji">{currentKanji.kanji}</div>
              </div>

              <div className="kll-back-body">
                {currentKanji.imgUrl && (
                  <div className="kll-img-container">
                    <img src={currentKanji.imgUrl} alt="Mnemonic" />
                  </div>
                )}
                <div className="kll-mnemonic-text">
                  "{currentKanji.mnemonicText}"
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Controls */}
        <div className="kll-controls">
          <button 
            onClick={prevCard}
            disabled={currentIndex === 0}
            className="kll-btn kll-btn-secondary"
          >
            Về trước
          </button>

          <button
            onClick={toggleMastered}
            className={`kll-btn kll-btn-primary ${isMastered ? 'mastered' : ''}`}
          >
            <CheckCircle size={20} />
            {isMastered ? 'Đã thuộc' : 'Đánh dấu thuộc'}
          </button>

          <button 
            onClick={nextCard}
            disabled={currentIndex === lessonData.kanjis.length - 1}
            className="kll-btn kll-btn-secondary"
            style={{ color: '#10b981' }}
          >
            Tiếp theo
          </button>
        </div>

        {/* Mini pagination */}
        <div className="kll-pagination">
          {lessonData.kanjis.map((k, i) => {
            const isDotMastered = masteredKanjis.includes(k.kanji);
            const isActive = i === currentIndex;
            return (
              <div 
                key={i} 
                onClick={() => { setIsFlipped(false); setTimeout(() => setCurrentIndex(i), 150); }}
                className={`kll-page-dot ${isActive ? 'active' : ''} ${isDotMastered && !isActive ? 'mastered' : ''}`}
              >
                {i + 1}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
