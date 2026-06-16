'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useProgress } from '@/context/ProgressContext';
import vocabData from '@/data/mimikara_n3_vocab.json';
import { Check, ChevronLeft, ChevronRight, RotateCw, Search, CheckCircle, HelpCircle, List, Play } from 'lucide-react';

export default function VocabPage() {
  const { vocabMastered, toggleVocabMastered } = useProgress();

  // Mode tabs: 'list', 'flashcard', 'quiz'
  const [activeTab, setActiveTab] = useState('list');

  // Filter selections
  const [selectedUnit, setSelectedUnit] = useState('Tất cả');
  const [selectedLesson, setSelectedLesson] = useState('Tất cả');

  // Flashcard states
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const flashcardRef = useRef(null);

  // Quiz states
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isQuizAnswered, setIsQuizAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // List search state
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Flatten vocab data and add globalId (Sorted by Unit order)
  const allWords = useMemo(() => {
    const list = [];
    const getUnitNumber = (name) => {
      if (name === 'Katakana') return 6; // Katakana tương ứng Unit 6 trên VNJP Club
      const match = name.match(/Unit\s+(\d+)/i);
      return match ? parseInt(match[1], 10) : 999;
    };
    const getLessonNumber = (name) => {
      const match = name.match(/(?:Bài|Phần)\s+(\d+|[A-Z])/i);
      if (!match) return 999;
      const val = match[1];
      if (isNaN(val)) {
        return val.charCodeAt(0);
      }
      return parseInt(val, 10);
    };

    Object.entries(vocabData).forEach(([unitName, lessons]) => {
      Object.entries(lessons).forEach(([lessonName, words]) => {
        words.forEach((word, index) => {
          list.push({
            ...word,
            unit: unitName,
            lesson: lessonName,
            globalId: `${unitName}_${lessonName}_${index}`,
            wordIndex: index,
          });
        });
      });
    });

    list.sort((a, b) => {
      const unitA = getUnitNumber(a.unit);
      const unitB = getUnitNumber(b.unit);
      if (unitA !== unitB) return unitA - unitB;

      const lessonA = getLessonNumber(a.lesson);
      const lessonB = getLessonNumber(b.lesson);
      if (lessonA !== lessonB) return lessonA - lessonB;

      return a.wordIndex - b.wordIndex;
    });

    return list;
  }, []);

  // Get list of units
  const unitsList = useMemo(() => {
    const keys = Object.keys(vocabData);
    const getUnitNumber = (name) => {
      if (name === 'Katakana') return 6; // Katakana tương ứng Unit 6 trên VNJP Club
      const match = name.match(/Unit\s+(\d+)/i);
      return match ? parseInt(match[1], 10) : 999;
    };
    const sorted = [...keys].sort((a, b) => getUnitNumber(a) - getUnitNumber(b));
    return ['Tất cả', ...sorted];
  }, []);

  // Get list of lessons for selected unit
  const lessonsList = useMemo(() => {
    if (selectedUnit === 'Tất cả') return ['Tất cả'];
    const keys = Object.keys(vocabData[selectedUnit] || {});
    const getLessonNumber = (name) => {
      const match = name.match(/(?:Bài|Phần)\s+(\d+|[A-Z])/i);
      if (!match) return 999;
      const val = match[1];
      if (isNaN(val)) {
        return val.charCodeAt(0);
      }
      return parseInt(val, 10);
    };
    const sorted = [...keys].sort((a, b) => getLessonNumber(a) - getLessonNumber(b));
    return ['Tất cả', ...sorted];
  }, [selectedUnit]);

  // Reset lesson when unit changes
  useEffect(() => {
    setSelectedLesson('Tất cả');
  }, [selectedUnit]);

  // Reset index when filters change
  useEffect(() => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
  }, [selectedUnit, selectedLesson]);

  // 2. Filter words based on selection
  const filteredWords = useMemo(() => {
    return allWords.filter((word) => {
      const matchUnit = selectedUnit === 'Tất cả' || word.unit === selectedUnit;
      const matchLesson = selectedLesson === 'Tất cả' || word.lesson === selectedLesson;
      return matchUnit && matchLesson;
    });
  }, [allWords, selectedUnit, selectedLesson]);

  // Words for search in list mode
  const searchedWords = useMemo(() => {
    if (!searchQuery.trim()) return filteredWords;
    const q = searchQuery.toLowerCase().trim();
    return filteredWords.filter((w) => {
      return (
        w.kanji.toLowerCase().includes(q) ||
        w.reading.toLowerCase().includes(q) ||
        (w.hanviet && w.hanviet.toLowerCase().includes(q)) ||
        w.meaning.toLowerCase().includes(q)
      );
    });
  }, [filteredWords, searchQuery]);

  // Current word on flashcard
  const currentWord = filteredWords[currentCardIndex];

  // Keyboard controls for Flashcards
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeTab !== 'flashcard' || filteredWords.length === 0) return;
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
  }, [activeTab, filteredWords.length, currentCardIndex]);

  const handleNextCard = () => {
    if (filteredWords.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev + 1) % filteredWords.length);
    }, 150);
  };

  const handlePrevCard = () => {
    if (filteredWords.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev - 1 + filteredWords.length) % filteredWords.length);
    }, 150);
  };

  // 3. Quiz Generation
  const generateQuiz = () => {
    if (filteredWords.length === 0) return;

    // Pick up to 10 random words from filtered list
    const shuffled = [...filteredWords].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(10, shuffled.length));

    const questions = selected.map((word) => {
      // Type is either 'reading' or 'meaning'
      const type = Math.random() > 0.5 ? 'reading' : 'meaning';
      
      // Get distractors from the general pool
      const distractors = allWords
        .filter((w) => w.globalId !== word.globalId)
        .sort(() => 0.5 - Math.random());

      let correctAnswer = '';
      let choices = [];

      if (type === 'reading') {
        correctAnswer = word.reading;
        // Distractors must have different reading
        const uniqueDistractors = [];
        for (let d of distractors) {
          if (d.reading !== correctAnswer && !uniqueDistractors.includes(d.reading)) {
            uniqueDistractors.push(d.reading);
          }
          if (uniqueDistractors.length >= 3) break;
        }
        choices = [correctAnswer, ...uniqueDistractors].sort(() => 0.5 - Math.random());
      } else {
        correctAnswer = word.meaning;
        // Distractors must have different meaning
        const uniqueDistractors = [];
        for (let d of distractors) {
          if (d.meaning !== correctAnswer && !uniqueDistractors.includes(d.meaning)) {
            uniqueDistractors.push(d.meaning);
          }
          if (uniqueDistractors.length >= 3) break;
        }
        choices = [correctAnswer, ...uniqueDistractors].sort(() => 0.5 - Math.random());
      }

      return {
        word,
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

  // Generate quiz when entering tab or changing filters
  useEffect(() => {
    if (activeTab === 'quiz') {
      generateQuiz();
    }
  }, [activeTab, selectedUnit, selectedLesson]);

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
        <h1 className="page-title">Từ vựng Mimikara N3</h1>
        <p className="page-description">Học và ôn tập 880 từ vựng chia theo các Unit của giáo trình Mimikara Oboeru.</p>
      </div>

      {/* Selectors */}
      <div className="selectors-grid">
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Chọn Unit</label>
          <select
            className="select-custom"
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
          >
            {unitsList.map((unit) => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Chọn Bài học (Lesson)</label>
          <select
            className="select-custom"
            value={selectedLesson}
            onChange={(e) => setSelectedLesson(e.target.value)}
            disabled={selectedUnit === 'Tất cả'}
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
          className={`study-tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <List size={16} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle' }} />
          <span>Danh sách</span>
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

      {/* Content Area */}
      {filteredWords.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ fontWeight: 600, fontSize: '16px' }}>Không tìm thấy từ vựng nào.</p>
          <p style={{ fontSize: '13px', marginTop: '8px' }}>Vui lòng thay đổi bộ chọn Unit hoặc Bài học.</p>
        </div>
      ) : (
        <>
          {/* FLASHCARD MODE */}
          {activeTab === 'flashcard' && currentWord && (
            <div className="flashcard-section">
              <div
                className={`flashcard-wrapper ${isFlipped ? 'flipped' : ''}`}
                onClick={() => setIsFlipped(!isFlipped)}
                ref={flashcardRef}
              >
                <div className="flashcard-inner">
                  {/* Front Side */}
                  <div className="flashcard-front">
                    <span className="card-number">Từ {currentCardIndex + 1}/{filteredWords.length}</span>
                    {vocabMastered.includes(currentWord.globalId) && (
                      <span className="card-mastered-badge">
                        <CheckCircle size={14} />
                        <span>Đã thuộc</span>
                      </span>
                    )}
                    <h2 className="kanji-display-large">{currentWord.kanji}</h2>
                    {currentWord.hanviet && (
                      <span className="han-viet-sub">{currentWord.hanviet}</span>
                    )}
                    <span className="card-instruction">Bấm để lật (hoặc phím Space)</span>
                  </div>

                  {/* Back Side */}
                  <div className="flashcard-back" onClick={(e) => e.stopPropagation()}>
                    <span className="card-number">Từ {currentCardIndex + 1}/{filteredWords.length}</span>
                    <h3 className="vocab-reading-display">{currentWord.reading}</h3>
                    <p className="vietnamese-meaning">{currentWord.meaning}</p>
                    {currentWord.hanviet && (
                      <span className="han-viet-sub" style={{ marginBottom: '12px', display: 'inline-block' }}>{currentWord.hanviet}</span>
                    )}

                    {currentWord.examples && currentWord.examples.length > 0 && (
                      <div className="flashcard-examples">
                        <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary-light)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Ví dụ minh họa:</p>
                        {currentWord.examples.map((ex, index) => (
                          <div key={index} className="example-item">
                            <p className="example-jp">{ex.japanese}</p>
                            <p className="example-vi">{ex.vietnamese}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <span className="card-instruction" style={{ pointerEvents: 'none' }} onClick={() => setIsFlipped(false)}>Bấm Space để lật lại</span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="card-controls">
                <button className="control-btn" onClick={handlePrevCard} title="Từ trước (Mũi tên Trái)">
                  <ChevronLeft size={20} />
                </button>

                <button
                  className={`action-btn ${vocabMastered.includes(currentWord.globalId) ? 'mastered' : ''}`}
                  onClick={() => toggleVocabMastered(currentWord.globalId)}
                >
                  <Check size={16} />
                  <span>{vocabMastered.includes(currentWord.globalId) ? 'Đã học thuộc' : 'Đánh dấu đã thuộc'}</span>
                </button>

                <button className="control-btn" onClick={handleNextCard} title="Từ tiếp theo (Mũi tên Phải)">
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

                  <h2 className="quiz-kanji">{quizQuestions[currentQuizIndex].word.kanji}</h2>
                  <p className="quiz-instruction">
                    {quizQuestions[currentQuizIndex].type === 'reading'
                      ? 'Chọn cách đọc đúng của từ trên:'
                      : 'Chọn nghĩa tiếng Việt đúng của từ trên:'}
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
                      ? 'Tuyệt vời! Bạn đã trả lời đúng tất cả các câu hỏi!'
                      : quizScore >= quizQuestions.length * 0.7
                      ? 'Rất tốt! Tiếp tục phát huy nhé!'
                      : 'Hãy cố gắng ôn tập lại để cải thiện kết quả.'}
                  </p>
                  <button className="action-btn" onClick={generateQuiz} style={{ margin: '0 auto' }}>
                    <RotateCw size={16} />
                    <span>Luyện tập lại</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* LIST MODE */}
          {activeTab === 'list' && (
            <div>
              <div className="search-container">
                <Search className="search-icon-inside" size={18} />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Tìm kiếm bằng Kanji, Hiragana, Hán Việt hoặc Nghĩa tiếng Việt..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="list-table-wrapper">
                <table className="list-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px', textAlign: 'center' }}>Học</th>
                      <th>Kanji</th>
                      <th>Cách đọc</th>
                      <th>Hán Việt</th>
                      <th>Ý nghĩa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchedWords.map((word) => {
                      const isMastered = vocabMastered.includes(word.globalId);
                      return (
                        <tr key={word.globalId}>
                          <td style={{ textAlign: 'center' }}>
                            <div
                              className="checkbox-custom"
                              style={{ margin: '0 auto', cursor: 'pointer', borderColor: isMastered ? 'var(--success)' : 'var(--text-muted)' }}
                              onClick={() => toggleVocabMastered(word.globalId)}
                            >
                              {isMastered && <Check size={14} strokeWidth={3} className="text-success" style={{ color: 'var(--success)' }} />}
                            </div>
                          </td>
                          <td className="kanji-cell" style={{ fontWeight: 600 }}>{word.kanji}</td>
                          <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{word.reading}</td>
                          <td className="han-viet-sub" style={{ fontSize: '12px' }}>{word.hanviet || '-'}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{word.meaning}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {searchedWords.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    Không khớp từ vựng tìm kiếm nào.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
