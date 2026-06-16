'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useProgress } from '@/context/ProgressContext';
import kanjiData from '@/data/enriched_kanji.json';
import { Check, X, ChevronLeft, ChevronRight, RotateCw, Search, Eye, HelpCircle, Grid, Play } from 'lucide-react';

export default function KanjiPage() {
  const { kanjiMastered, toggleKanjiMastered } = useProgress();

  // Active study tab: 'grid', 'flashcard', 'quiz'
  const [activeTab, setActiveTab] = useState('grid');

  // Filter selections
  const [selectedLesson, setSelectedLesson] = useState('Tất cả');

  // Modal / Detail Panel State
  const [selectedKanji, setSelectedKanji] = useState(null);

  // Flashcard states
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz states
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isQuizAnswered, setIsQuizAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Flatten all Kanji cards
  const allKanji = useMemo(() => {
    const list = [];
    kanjiData.forEach((lessonBlock) => {
      const lessonName = lessonBlock.lesson;
      lessonBlock.cards.forEach((card) => {
        list.push({
          ...card,
          lesson: lessonName,
        });
      });
    });
    return list;
  }, []);

  // List of lessons for selector
  const lessonsList = useMemo(() => {
    return ['Tất cả', ...kanjiData.map((l) => l.lesson)];
  }, []);

  // Filter Kanji cards based on selected lesson
  const filteredKanji = useMemo(() => {
    return allKanji.filter((k) => {
      return selectedLesson === 'Tất cả' || k.lesson === selectedLesson;
    });
  }, [allKanji, selectedLesson]);

  // Search filtered cards
  const searchedKanji = useMemo(() => {
    if (!searchQuery.trim()) return filteredKanji;
    const q = searchQuery.toLowerCase().trim();
    return filteredKanji.filter((k) => {
      return (
        k.kanji.toLowerCase().includes(q) ||
        k.meaning_hv.toLowerCase().includes(q) ||
        k.meaning_vn.toLowerCase().includes(q) ||
        k.reading.toLowerCase().includes(q)
      );
    });
  }, [filteredKanji, searchQuery]);

  // Current flashcard card
  const currentCard = filteredKanji[currentCardIndex];

  // Reset indices when filters change
  useEffect(() => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
  }, [selectedLesson]);

  // Keyboard controls for Flashcards
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeTab !== 'flashcard' || filteredKanji.length === 0) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        handleNextCard();
      } else if (e.code === 'ArrowLeft') {
        handlePrevCard();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, filteredKanji.length, currentCardIndex]);

  const handleNextCard = () => {
    if (filteredKanji.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev + 1) % filteredKanji.length);
    }, 150);
  };

  const handlePrevCard = () => {
    if (filteredKanji.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev - 1 + filteredKanji.length) % filteredKanji.length);
    }, 150);
  };

  // 2. Quiz Generator
  const generateQuiz = () => {
    if (filteredKanji.length === 0) return;

    // Pick up to 10 random kanji
    const shuffled = [...filteredKanji].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(10, shuffled.length));

    const questions = selected.map((card) => {
      // Type is either 'hanviet' or 'meaning'
      const type = Math.random() > 0.5 ? 'hanviet' : 'meaning';
      
      const distractors = allKanji
        .filter((k) => k.kanji !== card.kanji)
        .sort(() => 0.5 - Math.random());

      let correctAnswer = '';
      let choices = [];

      if (type === 'hanviet') {
        correctAnswer = card.meaning_hv;
        const unique = [];
        for (let d of distractors) {
          if (d.meaning_hv !== correctAnswer && !unique.includes(d.meaning_hv)) {
            unique.push(d.meaning_hv);
          }
          if (unique.length >= 3) break;
        }
        choices = [correctAnswer, ...unique].sort(() => 0.5 - Math.random());
      } else {
        correctAnswer = card.meaning_vn;
        const unique = [];
        for (let d of distractors) {
          if (d.meaning_vn !== correctAnswer && !unique.includes(d.meaning_vn)) {
            unique.push(d.meaning_vn);
          }
          if (unique.length >= 3) break;
        }
        choices = [correctAnswer, ...unique].sort(() => 0.5 - Math.random());
      }

      return {
        card,
        type,
        choices,
        correctAnswer,
      };
    });

    setQuizQuestions(questions);
    setCurrentQuizIndex(0);
    setSelectedAnswer(null);
    setIsQuizAnswered(false);
    setQuizScore(0);
    setQuizFinished(false);
  };

  // Trigger quiz when entering tab or changing filter
  useEffect(() => {
    if (activeTab === 'quiz') {
      generateQuiz();
    }
  }, [activeTab, selectedLesson]);

  const handleAnswerSelect = (choice) => {
    if (isQuizAnswered) return;
    setSelectedAnswer(choice);
    setIsQuizAnswered(true);

    const currentQ = quizQuestions[currentQuizIndex];
    if (choice === currentQ.correctAnswer) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const handleNextQuiz = () => {
    if (currentQuizIndex < quizQuestions.length - 1) {
      setCurrentQuizIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsQuizAnswered(false);
    } else {
      setQuizFinished(true);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Kanji N3</h1>
        <p className="page-description">Học và tra cứu 168 chữ Kanji N3 cốt lõi phân bố theo bài học, kèm radials và ví dụ.</p>
      </div>

      {/* Lesson Selector */}
      <div className="selectors-grid">
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Chọn Bài học (Lesson)</label>
          <select
            className="select-custom"
            value={selectedLesson}
            onChange={(e) => setSelectedLesson(e.target.value)}
          >
            {lessonsList.map((lesson) => (
              <option key={lesson} value={lesson}>{lesson}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="study-tabs">
        <button
          className={`study-tab ${activeTab === 'grid' ? 'active' : ''}`}
          onClick={() => setActiveTab('grid')}
        >
          <Grid size={16} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle' }} />
          <span>Lưới Tra Cứu</span>
        </button>
        <button
          className={`study-tab ${activeTab === 'flashcard' ? 'active' : ''}`}
          onClick={() => setActiveTab('flashcard')}
        >
          <Play size={16} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle' }} />
          <span>Thẻ lật</span>
        </button>
        <button
          className={`study-tab ${activeTab === 'quiz' ? 'active' : ''}`}
          onClick={() => setActiveTab('quiz')}
        >
          <HelpCircle size={16} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle' }} />
          <span>Trắc nghiệm</span>
        </button>
      </div>

      {filteredKanji.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ fontWeight: 600, fontSize: '16px' }}>Không tìm thấy chữ Kanji nào.</p>
        </div>
      ) : (
        <>
          {/* GRID SEARCH & VIEW */}
          {activeTab === 'grid' && (
            <div>
              <div className="search-container">
                <Search className="search-icon-inside" size={18} />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Tìm kiếm bằng mặt chữ Kanji, âm Hán Việt, hoặc nghĩa Việt..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="kanji-grid">
                {searchedKanji.map((card) => {
                  const isMastered = kanjiMastered.includes(card.kanji);
                  return (
                    <div
                      key={card.kanji}
                      className={`kanji-grid-cell ${isMastered ? 'mastered' : ''}`}
                      onClick={() => setSelectedKanji(card)}
                    >
                      <span className="kanji-char-grid">{card.kanji}</span>
                      <span className="kanji-hv-grid">{card.meaning_hv}</span>
                    </div>
                  );
                })}
              </div>

              {searchedKanji.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                  Không tìm thấy Kanji nào khớp từ khóa.
                </div>
              )}
            </div>
          )}

          {/* FLASHCARD MODE */}
          {activeTab === 'flashcard' && currentCard && (
            <div className="flashcard-section">
              <div
                className={`flashcard-wrapper ${isFlipped ? 'flipped' : ''}`}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div className="flashcard-inner">
                  {/* Front Side */}
                  <div className="flashcard-front">
                    <span className="card-number">Chữ {currentCardIndex + 1}/{filteredKanji.length}</span>
                    {kanjiMastered.includes(currentCard.kanji) && (
                      <span className="card-mastered-badge">
                        <CheckCircle size={14} />
                        <span>Đã thuộc</span>
                      </span>
                    )}
                    <h2 className="kanji-display-large">{currentCard.kanji}</h2>
                    <span className="han-viet-sub">{currentCard.meaning_hv}</span>
                    <span className="card-instruction">Bấm để lật (hoặc phím Space)</span>
                  </div>

                  {/* Back Side */}
                  <div className="flashcard-back" onClick={(e) => e.stopPropagation()}>
                    <span className="card-number">Chữ {currentCardIndex + 1}/{filteredKanji.length}</span>
                    <span className="han-viet-sub" style={{ fontSize: '18px', marginBottom: '4px' }}>{currentCard.meaning_hv}</span>
                    <p className="vietnamese-meaning" style={{ fontSize: '22px', marginBottom: '12px' }}>{currentCard.meaning_vn}</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', textAlign: 'left', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                      <p style={{ fontSize: '13px' }}><strong>Bộ thủ:</strong> {currentCard.radical}</p>
                      <p style={{ fontSize: '13px' }}><strong>Cách đọc:</strong> {currentCard.reading}</p>
                      {currentCard.mnemonic && (
                        <p style={{ fontSize: '13px', background: 'var(--bg-color)', padding: '8px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary)', color: 'var(--text-secondary)' }}>
                          <strong>Cách nhớ:</strong> {currentCard.mnemonic}
                        </p>
                      )}
                    </div>
                    <span className="card-instruction" style={{ pointerEvents: 'none' }}>Bấm Space để lật lại</span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="card-controls">
                <button className="control-btn" onClick={handlePrevCard} title="Chữ trước (Mũi tên Trái)">
                  <ChevronLeft size={20} />
                </button>

                <button
                  className={`action-btn ${kanjiMastered.includes(currentCard.kanji) ? 'mastered' : ''}`}
                  onClick={() => toggleKanjiMastered(currentCard.kanji)}
                >
                  <Check size={16} />
                  <span>{kanjiMastered.includes(currentCard.kanji) ? 'Đã thuộc' : 'Đánh dấu đã thuộc'}</span>
                </button>

                <button className="control-btn" onClick={handleNextCard} title="Chữ tiếp theo (Mũi tên Phải)">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}

          {/* QUIZ MODE */}
          {activeTab === 'quiz' && quizQuestions.length > 0 && (
            <div className="quiz-section">
              {!quizFinished ? (
                <div className="quiz-card">
                  <div className="quiz-question-header">
                    <span>Câu {currentQuizIndex + 1}/{quizQuestions.length}</span>
                    <span>Đúng: {quizScore}/{currentQuizIndex + (isQuizAnswered ? 1 : 0)}</span>
                  </div>

                  <h2 className="quiz-kanji">{quizQuestions[currentQuizIndex].card.kanji}</h2>
                  <p className="quiz-instruction">
                    {quizQuestions[currentQuizIndex].type === 'hanviet'
                      ? 'Chọn âm Hán Việt đúng của chữ trên:'
                      : 'Chọn nghĩa tiếng Việt đúng của chữ trên:'}
                  </p>

                  <div className="quiz-options">
                    {quizQuestions[currentQuizIndex].choices.map((choice, idx) => {
                      const isCorrect = choice === quizQuestions[currentQuizIndex].correctAnswer;
                      const isSelected = choice === selectedAnswer;
                      let optionClass = '';
                      if (isQuizAnswered) {
                        if (isCorrect) optionClass = 'correct';
                        else if (isSelected) optionClass = 'incorrect';
                      }
                      return (
                        <button
                          key={idx}
                          className={`quiz-option ${optionClass}`}
                          onClick={() => handleAnswerSelect(choice)}
                          disabled={isQuizAnswered}
                        >
                          {choice}
                        </button>
                      );
                    })}
                  </div>

                  {isQuizAnswered && (
                    <button className="action-btn" onClick={handleNextQuiz} style={{ margin: '0 auto', width: '100%' }}>
                      <span>{currentQuizIndex < quizQuestions.length - 1 ? 'Câu tiếp theo' : 'Hoàn thành trắc nghiệm'}</span>
                      <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="quiz-card" style={{ padding: '36px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>Kết quả trắc nghiệm 🎉</h2>
                  <div style={{ fontSize: '48px', fontWeight: 800, color: 'var(--primary-light)', margin: '20px 0' }}>
                    {quizScore}/{quizQuestions.length}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    {quizScore === quizQuestions.length
                      ? 'Tuyệt vời! Bạn đã thuộc làu toàn bộ Kanji ôn tập!'
                      : quizScore >= quizQuestions.length * 0.7
                      ? 'Rất tốt! Bạn đang tiến bộ rõ rệt.'
                      : 'Hãy ôn tập lại để nhớ sâu sắc bộ thủ và cách nhớ.'}
                  </p>
                  <button className="action-btn" onClick={generateQuiz} style={{ margin: '0 auto' }}>
                    <RotateCw size={16} />
                    <span>Luyện tập lại</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* DETAIL MODAL OVERLAY */}
      {selectedKanji && (
        <div className="detail-panel-backdrop" onClick={() => setSelectedKanji(null)}>
          <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
            <div className="detail-panel-header">
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Chi tiết chữ Kanji</h3>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                onClick={() => setSelectedKanji(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="detail-panel-body">
              <div className="detail-kanji-block">
                <div className="detail-kanji-big">{selectedKanji.kanji}</div>
                <div className="detail-kanji-primary-info">
                  <span className="detail-hv">{selectedKanji.meaning_hv}</span>
                  <span className="detail-vi-meaning">{selectedKanji.meaning_vn}</span>
                  <span className="detail-radicals"><strong>Bộ thủ:</strong> {selectedKanji.radical}</span>
                </div>
              </div>

              <div className="detail-info-row">
                <span className="detail-info-title">Cách đọc (On / Kun)</span>
                <span className="detail-info-content">{selectedKanji.reading}</span>
              </div>

              {selectedKanji.mnemonic && (
                <div className="detail-info-row" style={{ borderLeftColor: 'var(--warning)' }}>
                  <span className="detail-info-title">Mẹo nhớ (Mnemonic)</span>
                  <span className="detail-info-content" style={{ fontStyle: 'italic' }}>{selectedKanji.mnemonic}</span>
                </div>
              )}

              {selectedKanji.vocab && selectedKanji.vocab.length > 0 && (
                <div>
                  <span className="detail-info-title" style={{ display: 'block', marginBottom: '8px' }}>Từ vựng liên quan</span>
                  <div className="list-table-wrapper">
                    <table className="list-table" style={{ fontSize: '13px' }}>
                      <thead>
                        <tr>
                          <th>Từ vựng</th>
                          <th>Cách đọc</th>
                          <th>Ý nghĩa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedKanji.vocab.map((v, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600, fontFamily: 'var(--font-kanji)', fontSize: '15px' }}>{v.word}</td>
                            <td style={{ color: 'var(--text-primary)' }}>{v.reading}</td>
                            <td style={{ color: 'var(--text-secondary)' }}>{v.meaning}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="detail-panel-footer">
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Phân nhóm: {selectedKanji.lesson}</span>
              <button
                className={`action-btn ${kanjiMastered.includes(selectedKanji.kanji) ? 'mastered' : ''}`}
                onClick={() => toggleKanjiMastered(selectedKanji.kanji)}
              >
                <Check size={16} />
                <span>{kanjiMastered.includes(selectedKanji.kanji) ? 'Đã học thuộc' : 'Đánh dấu đã thuộc'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
