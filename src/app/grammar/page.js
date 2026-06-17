'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useProgress } from '@/context/ProgressContext';

import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  RotateCw, 
  Check, 
  Star, 
  CheckCircle, 
  HelpCircle, 
  List, 
  Play, 
  Shuffle, 
  ArrowLeft,
  RefreshCw
} from 'lucide-react';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api');

export default function GrammarPage() {
  const { grammarMastered, toggleGrammarMastered } = useProgress();
  const [grammarData, setGrammarData] = useState([]);
  const [questionData, setQuestionData] = useState({ fillInBlanks: [], starArrangements: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE_URL}/grammar`).then(res => res.json()),
      fetch(`${API_BASE_URL}/grammar/questions`).then(res => res.json())
    ]).then(([grammar, questions]) => {
      setGrammarData(grammar);
      setQuestionData(questions);
      setIsLoading(false);
    }).catch(err => {
      console.error(err);
      setGrammarData([{
        id: 'err_1',
        title: 'LỖI MẠNG',
        meaning: String(err.message || err),
        structure: `URL API: ${API_BASE_URL}/grammar`,
        explain: 'Vui lòng kiểm tra kết nối hoặc API server.',
        examples: []
      }]);
      setIsLoading(false);
    });
  }, []);

  // Mode tabs: 'list' (List), 'flashcard' (Cards), 'quiz' (Quiz)
  const [activeTab, setActiveTab] = useState('list');

  // Furigana & Translation visibility (persist in state)
  const [hideFurigana, setHideFurigana] = useState(false);
  const [hideTranslation, setHideTranslation] = useState(false);

  // Filter selections for Cards
  const [cardRange, setCardRange] = useState('Tất cả');

  // Flashcard states
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const cardContainerRef = useRef(null);

  // List search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [listRange, setListRange] = useState('Tất cả');
  const [listMasterFilter, setListMasterFilter] = useState('Tất cả');
  const [expandedId, setExpandedId] = useState(null);

  // Quiz configuration states
  const [quizRange, setQuizRange] = useState('1-20');
  const [quizType, setQuizType] = useState('fill'); // 'fill' or 'star'
  const [isQuizRunning, setIsQuizRunning] = useState(false);

  // Quiz play states
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null); // For fill-in-blank
  const [isQuestionAnswered, setIsQuestionAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  // Star arrangement specific states
  const [starSlots, setStarSlots] = useState([null, null, null, null]);
  const [starChips, setStarChips] = useState([]); // Array of { text, originalIndex, used }
  const [isStarCorrect, setIsStarCorrect] = useState(false);

  // Ranges array
  const ranges = ['1-20', '21-40', '41-60', '61-80', '81-100', '101-110', 'Tất cả'];

  // Helper function to shuffle array
  const shuffleArray = (arr) => {
    return [...arr].sort(() => 0.5 - Math.random());
  };

  // 1. CARDS MODE: Get cards based on range
  const filteredCards = useMemo(() => {
    if (cardRange === 'Tất cả') return grammarData;
    const [start, end] = cardRange.split('-').map(Number);
    return grammarData.filter((item) => item.id >= start && item.id <= end);
  }, [cardRange, grammarData]);

  // Current Card
  const currentCard = filteredCards[currentCardIndex] || filteredCards[0];

  // Reset current card index when range changes
  useEffect(() => {
    setCurrentCardIndex(0);
  }, [cardRange]);

  const handleNextCard = () => {
    if (filteredCards.length === 0) return;
    setCurrentCardIndex((prev) => (prev + 1) % filteredCards.length);
  };

  const handlePrevCard = () => {
    if (filteredCards.length === 0) return;
    setCurrentCardIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
  };

  const handleRandomCard = () => {
    if (filteredCards.length <= 1) return;
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * filteredCards.length);
    } while (randomIndex === currentCardIndex);
    setCurrentCardIndex(randomIndex);
  };

  // Keyboard controls for Flashcards
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeTab !== 'flashcard' || filteredCards.length === 0) return;
      if (e.code === 'ArrowRight') {
        handleNextCard();
      } else if (e.code === 'ArrowLeft') {
        handlePrevCard();
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (currentCard) {
          toggleGrammarMastered(currentCard.id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, filteredCards.length, currentCardIndex, currentCard]);

  // 2. LIST MODE: Filter list based on queries, range, and master state
  const filteredList = useMemo(() => {
    return grammarData.filter((item) => {
      // 1. Range filter
      if (listRange !== 'Tất cả') {
        const [start, end] = listRange.split('-').map(Number);
        if (item.id < start || item.id > end) return false;
      }

      // 2. Master status filter
      const isMastered = grammarMastered.includes(item.id);
      if (listMasterFilter === 'learned' && !isMastered) return false;
      if (listMasterFilter === 'unlearned' && isMastered) return false;

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = item.title.toLowerCase().includes(q);
        const inMeaning = item.meaning.toLowerCase().includes(q);
        const inStructure = item.structure.toLowerCase().includes(q);
        const inExplain = item.explain.toLowerCase().includes(q);
        
        // Search in examples
        const inExamples = item.examples.some(
          (ex) => ex.jp.toLowerCase().includes(q) || ex.vi.toLowerCase().includes(q)
        );

        return inTitle || inMeaning || inStructure || inExplain || inExamples;
      }

      return true;
    });
  }, [searchQuery, listRange, listMasterFilter, grammarMastered, grammarData]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // 3. QUIZ MODE: Setup and play
  const startQuiz = () => {
    let questionsPool = [];
    if (quizType === 'fill') {
      questionsPool = questionData.fillInBlanks;
    } else {
      questionsPool = questionData.starArrangements;
    }

    // Filter by range
    let filteredQuestions = [];
    if (quizRange === 'Tất cả') {
      filteredQuestions = [...questionsPool];
    } else {
      filteredQuestions = questionsPool.filter((q) => q.range === quizRange);
    }

    if (filteredQuestions.length === 0) {
      alert('Không có câu hỏi nào trong phạm vi đã chọn!');
      return;
    }

    // Shuffle and pick up to 10 questions
    const shuffled = shuffleArray(filteredQuestions);
    const selected = shuffled.slice(0, Math.min(10, shuffled.length));

    setCurrentQuestions(selected);
    setCurrentQuizIndex(0);
    setQuizScore(0);
    setIsQuizFinished(false);
    setIsQuestionAnswered(false);
    setSelectedChoice(null);
    setIsQuizRunning(true);

    // Initialize star puzzle if star quiz type
    if (quizType === 'star' && selected[0]) {
      initStarPuzzle(selected[0]);
    }
  };

  const initStarPuzzle = (question) => {
    setStarSlots([null, null, null, null]);
    // Create chips from words in scrambled order
    const chips = question.words.map((w, idx) => ({
      text: w,
      originalIndex: idx,
      used: false
    }));
    setStarChips(shuffleArray(chips));
    setIsQuestionAnswered(false);
    setIsStarCorrect(false);
  };

  // Multiple choice answer selection
  const handleSelectChoice = (choice) => {
    if (isQuestionAnswered) return;
    setSelectedChoice(choice);
    setIsQuestionAnswered(true);

    const question = currentQuestions[currentQuizIndex];
    if (choice === question.correctAnswer) {
      setQuizScore((prev) => prev + 1);
    }
  };

  // Star arrangement chips interactions
  const handleChipClick = (chipIndex) => {
    if (isQuestionAnswered) return;
    
    const clickedChip = starChips[chipIndex];
    if (clickedChip.used) return;

    // Find first empty slot
    const emptySlotIdx = starSlots.findIndex(s => s === null);
    if (emptySlotIdx === -1) return; // All slots filled

    // Update slots
    const newSlots = [...starSlots];
    newSlots[emptySlotIdx] = clickedChip;
    setStarSlots(newSlots);

    // Mark chip as used
    const newChips = [...starChips];
    newChips[chipIndex].used = true;
    setStarChips(newChips);
  };

  const handleSlotClick = (slotIdx) => {
    if (isQuestionAnswered) return;

    const clickedSlotContent = starSlots[slotIdx];
    if (clickedSlotContent === null) return;

    // Remove from slots
    const newSlots = [...starSlots];
    newSlots[slotIdx] = null;
    setStarSlots(newSlots);

    // Return to chips pool
    const newChips = starChips.map((c) => {
      if (c.originalIndex === clickedSlotContent.originalIndex) {
        return { ...c, used: false };
      }
      return c;
    });
    setStarChips(newChips);
  };

  const resetStarSlots = () => {
    if (isQuestionAnswered) return;
    setStarSlots([null, null, null, null]);
    setStarChips(starChips.map(c => ({ ...c, used: false })));
  };

  const checkStarAnswer = () => {
    if (starSlots.some(s => s === null)) return; // Ensure all slots filled
    setIsQuestionAnswered(true);

    const question = currentQuestions[currentQuizIndex];
    // user order represents the originalIndex sequence placed in slots
    const userOrder = starSlots.map(s => s.originalIndex);
    
    // Strict comparison of the entire sequence
    const isCorrect = userOrder.every((idx, i) => idx === question.correctOrder[i]);
    setIsStarCorrect(isCorrect);

    if (isCorrect) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuizIndex < currentQuestions.length - 1) {
      const nextIdx = currentQuizIndex + 1;
      setCurrentQuizIndex(nextIdx);
      setIsQuestionAnswered(false);
      setSelectedChoice(null);
      
      if (quizType === 'star') {
        initStarPuzzle(currentQuestions[nextIdx]);
      }
    } else {
      setIsQuizFinished(true);
    }
  };

  const exitQuiz = () => {
    setIsQuizRunning(false);
    setIsQuizFinished(false);
    setCurrentQuestions([]);
  };

  if (isLoading) return <div style={{textAlign:'center', padding: '100px'}}>Đang tải dữ liệu ngữ pháp...</div>;

  return (
    <div className={`grammar-page-container ${hideFurigana ? 'hide-furigana' : ''} ${hideTranslation ? 'hide-translation' : ''}`}>
      <div className="page-header">
        <h1 className="page-title">Ngữ pháp N3</h1>
        <p className="page-description">Chinh phục 110 mẫu ngữ pháp Mimi Kara Oboeru N3 với Flashcards và bài tập trắc nghiệm dấu sao.</p>
      </div>

      {/* Global Furigana & Translation Toggles */}
      <div className="toggle-options-header">
        <button 
          className={`toggle-opt-btn ${hideFurigana ? 'active' : ''}`}
          onClick={() => setHideFurigana(!hideFurigana)}
          title="Bật/Tắt hiển thị cách đọc Furigana phía trên chữ Kanji"
        >
          {hideFurigana ? 'Hiện Furigana' : 'Ẩn Furigana'}
        </button>
        <button 
          className={`toggle-opt-btn ${hideTranslation ? 'active' : ''}`}
          onClick={() => setHideTranslation(!hideTranslation)}
          title="Bật/Tắt hiển thị nghĩa tiếng Việt"
        >
          {hideTranslation ? 'Hiện dịch nghĩa' : 'Ẩn dịch nghĩa'}
        </button>
      </div>

      {/* Main Study Tabs */}
      {!isQuizRunning && (
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
            <span>Thẻ học</span>
          </button>
          <button
            className={`study-tab ${activeTab === 'quiz' ? 'active' : ''}`}
            onClick={() => setActiveTab('quiz')}
          >
            <HelpCircle size={16} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle' }} />
            <span>Ôn tập & Trắc nghiệm</span>
          </button>
        </div>
      )}

      {/* TAB CONTENT AREA */}

      {/* 1. CARDS MODE */}
      {activeTab === 'flashcard' && !isQuizRunning && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card filter range */}
          <div className="selectors-grid" style={{ marginBottom: '0px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                Phạm vi ngữ pháp
              </label>
              <select
                className="select-custom"
                value={cardRange}
                onChange={(e) => setCardRange(e.target.value)}
              >
                {ranges.map((r) => (
                  <option key={r} value={r}>{r === 'Tất cả' ? 'Tất cả 110 mẫu' : `Mẫu ${r}`}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredCards.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
              <p style={{ fontWeight: 600 }}>Không tìm thấy mẫu ngữ pháp nào.</p>
            </div>
          ) : (
            currentCard && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} ref={cardContainerRef}>
                {/* Grammar details card */}
                <div style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '32px',
                  boxShadow: 'var(--shadow-lg)',
                  position: 'relative',
                  transition: 'var(--transition)'
                }}>
                  {/* Card Header info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-light)', background: 'var(--primary-glow)', padding: '4px 10px', borderRadius: '20px' }}>
                      Mẫu N3 #{currentCard.id} / 110
                    </span>
                    <button
                      onClick={() => toggleGrammarMastered(currentCard.id)}
                      className={`action-btn ${grammarMastered.includes(currentCard.id) ? 'mastered' : ''}`}
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                    >
                      <Star size={14} fill={grammarMastered.includes(currentCard.id) ? 'currentColor' : 'none'} />
                      <span>{grammarMastered.includes(currentCard.id) ? 'Đã thuộc' : 'Đánh dấu thuộc (Space)'}</span>
                    </button>
                  </div>

                  {/* Title */}
                  <h2 style={{
                    fontSize: '32px',
                    fontWeight: 800,
                    fontFamily: 'var(--font-kanji)',
                    color: 'var(--text-primary)',
                    marginBottom: '16px',
                    letterSpacing: '0.5px'
                  }}>
                    {currentCard.title}
                  </h2>

                  {/* Meaning */}
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Ý nghĩa</p>
                    <p className="np-meaning" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-light)' }}>
                      {currentCard.meaning}
                    </p>
                  </div>

                  {/* Structure */}
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Cấu trúc kết nối</p>
                    <span style={{
                      display: 'inline-block',
                      fontFamily: 'var(--font-kanji)',
                      fontSize: '15px',
                      background: 'rgba(99, 102, 241, 0.05)',
                      border: '1px solid rgba(99, 102, 241, 0.15)',
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 600,
                      color: 'var(--text-primary)'
                    }}>
                      {currentCard.structure}
                    </span>
                  </div>

                  {/* Explanation */}
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Giải thích chi tiết</p>
                    <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                      {currentCard.explain}
                    </p>
                  </div>

                  {/* Notes (if any) */}
                  {currentCard.note && (
                    <div style={{
                      marginBottom: '24px',
                      padding: '12px 16px',
                      background: 'rgba(245, 158, 11, 0.03)',
                      borderLeft: '4px solid var(--warning)',
                      borderRadius: '4px'
                    }}>
                      <p style={{ fontSize: '12px', fontWeight: 800, color: 'var(--warning)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Lưu ý phân biệt / lỗi sai thường gặp</p>
                      <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                        {currentCard.note}
                      </p>
                    </div>
                  )}

                  {/* Examples */}
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>Ví dụ thực tế</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {currentCard.examples.map((ex, index) => (
                        <div key={index} style={{
                          padding: '12px 16px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)'
                        }}>
                          <p style={{
                            fontSize: '18px',
                            fontFamily: 'var(--font-kanji)',
                            lineHeight: '2.0',
                            color: 'var(--text-primary)',
                            marginBottom: '6px'
                          }} dangerouslySetInnerHTML={{ __html: ex.jp }} />
                          
                          <p className="example-vi" style={{
                            fontSize: '14px',
                            color: 'var(--text-secondary)',
                            borderLeft: '2px solid var(--border-color)',
                            paddingLeft: '10px'
                          }}>
                            {ex.vi}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Controls */}
                <div className="card-controls" style={{ marginTop: '8px' }}>
                  <button className="control-btn" onClick={handlePrevCard} title="Mẫu trước (Mũi tên Trái)">
                    <ChevronLeft size={20} />
                  </button>

                  <button className="control-btn" onClick={handleRandomCard} title="Chọn ngẫu nhiên">
                    <Shuffle size={16} />
                    <span style={{ fontSize: '13px', fontWeight: 700, marginLeft: '6px' }}>Ngẫu nhiên</span>
                  </button>

                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {currentCardIndex + 1} / {filteredCards.length}
                  </span>

                  <button className="control-btn" onClick={handleNextCard} title="Mẫu tiếp theo (Mũi tên Phải)">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* 2. LIST MODE */}
      {activeTab === 'list' && !isQuizRunning && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Filters Grid */}
          <div className="selectors-grid" style={{ marginBottom: '0px' }}>
            <div style={{ position: 'relative' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Tìm kiếm</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Tra cứu chữ Hán, Hiragana, nghĩa..."
                  className="input-search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 16px 10px 40px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontSize: '14px'
                  }}
                />
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Phạm vi bài</label>
              <select
                className="select-custom"
                value={listRange}
                onChange={(e) => setListRange(e.target.value)}
              >
                <option value="Tất cả">Tất cả 110 mẫu</option>
                {ranges.filter(r => r !== 'Tất cả').map((r) => (
                  <option key={r} value={r}>Mẫu {r}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Trạng thái</label>
              <select
                className="select-custom"
                value={listMasterFilter}
                onChange={(e) => setListMasterFilter(e.target.value)}
              >
                <option value="Tất cả">Tất cả mẫu học</option>
                <option value="learned">Đã thuộc</option>
                <option value="unlearned">Chưa thuộc</option>
              </select>
            </div>
          </div>

          {/* List display */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'right', marginRight: '4px' }}>
              Tìm thấy: {filteredList.length} cấu trúc
            </div>

            {filteredList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                <p style={{ fontWeight: 600 }}>Không tìm thấy mẫu ngữ pháp phù hợp.</p>
              </div>
            ) : (
              filteredList.map((item) => {
                const isMastered = grammarMastered.includes(item.id);
                const isExpanded = expandedId === item.id;
                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      transition: 'var(--transition)'
                    }}
                  >
                    {/* Row Header */}
                    <div 
                      onClick={() => toggleExpand(item.id)}
                      style={{
                        padding: '18px 24px',
                        display: 'grid',
                        gridTemplateColumns: '50px 1fr 150px',
                        alignItems: 'center',
                        gap: '16px',
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                        background: isExpanded ? 'rgba(99, 102, 241, 0.02)' : 'transparent'
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-muted)' }}>
                        #{item.id}
                      </span>
                      <div>
                        <h3 style={{ fontSize: '17px', fontWeight: 700, fontFamily: 'var(--font-kanji)', color: 'var(--text-primary)', marginBottom: '2px' }}>
                          {item.title}
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {item.meaning}
                        </p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleGrammarMastered(item.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: isMastered ? 'var(--warning)' : 'var(--text-muted)',
                            transition: 'var(--transition)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Star size={18} fill={isMastered ? 'currentColor' : 'none'} />
                          <span style={{ fontSize: '11px', fontWeight: 700 }}>
                            {isMastered ? 'Đã thuộc' : 'Chưa thuộc'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Row Expanded content */}
                    {isExpanded && (
                      <div style={{
                        padding: '24px',
                        borderTop: '1px solid var(--border-color)',
                        background: 'rgba(0, 0, 0, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                      }}>
                        {/* Connection */}
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Cấu trúc kết nối</p>
                          <span style={{ display: 'inline-block', fontFamily: 'var(--font-kanji)', fontSize: '14px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '4px 10px', borderRadius: '4px', color: 'var(--text-primary)' }}>
                            {item.structure}
                          </span>
                        </div>

                        {/* Explanation */}
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Giải thích</p>
                          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                            {item.explain}
                          </p>
                        </div>

                        {/* Note */}
                        {item.note && (
                          <div style={{ padding: '10px 14px', background: 'rgba(245, 158, 11, 0.03)', borderLeft: '3px solid var(--warning)', borderRadius: '4px' }}>
                            <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--warning)', textTransform: 'uppercase', marginBottom: '4px' }}>Lưu ý</p>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                              {item.note}
                            </p>
                          </div>
                        )}

                        {/* Examples */}
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Ví dụ minh họa</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {item.examples.map((ex, exIdx) => (
                              <div key={exIdx} style={{ padding: '8px 12px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                                <p style={{ fontSize: '16px', fontFamily: 'var(--font-kanji)', color: 'var(--text-primary)', lineHeight: '1.8' }} dangerouslySetInnerHTML={{ __html: ex.jp }} />
                                <p className="example-vi" style={{ fontSize: '13px', color: 'var(--text-secondary)', borderLeft: '2px solid var(--border-color)', paddingLeft: '8px', marginTop: '4px' }}>
                                  {ex.vi}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 3. QUIZ MODE: SETUP OR PLAY */}
      {activeTab === 'quiz' && (
        <div style={{ width: '100%' }}>
          {/* Quiz Setup State */}
          {!isQuizRunning ? (
            <div style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '40px',
              maxWidth: '640px',
              margin: '0 auto',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '24px', textAlign: 'center' }}>
                Thiết lập ôn tập Ngữ pháp
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Range select */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                    1. Chọn phạm vi ngữ pháp ôn tập
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px' }}>
                    {ranges.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setQuizRange(r)}
                        style={{
                          padding: '10px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '13.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'var(--transition)',
                          border: '1px solid var(--border-color)',
                          background: quizRange === r ? 'var(--primary-glow)' : 'var(--card-bg)',
                          color: quizRange === r ? 'var(--primary-light)' : 'var(--text-secondary)',
                          borderColor: quizRange === r ? 'var(--primary)' : 'var(--border-color)'
                        }}
                      >
                        {r === 'Tất cả' ? 'Tất cả 110' : `Mẫu ${r}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type select */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                    2. Chọn định dạng câu hỏi
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <button
                      type="button"
                      onClick={() => setQuizType('fill')}
                      style={{
                        padding: '16px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                        textAlign: 'center',
                        border: '1px solid var(--border-color)',
                        background: quizType === 'fill' ? 'var(--primary-glow)' : 'var(--card-bg)',
                        color: quizType === 'fill' ? 'var(--primary-light)' : 'var(--text-secondary)',
                        borderColor: quizType === 'fill' ? 'var(--primary)' : 'var(--border-color)'
                      }}
                    >
                      <HelpCircle size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
                      <span style={{ fontSize: '15px' }}>Điền chỗ trống</span>
                      <p style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)', marginTop: '4px' }}>Tìm cấu trúc ngữ pháp phù hợp điền vào câu ví dụ.</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQuizType('star')}
                      style={{
                        padding: '16px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                        textAlign: 'center',
                        border: '1px solid var(--border-color)',
                        background: quizType === 'star' ? 'var(--primary-glow)' : 'var(--card-bg)',
                        color: quizType === 'star' ? 'var(--primary-light)' : 'var(--text-secondary)',
                        borderColor: quizType === 'star' ? 'var(--primary)' : 'var(--border-color)'
                      }}
                    >
                      <Star size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
                      <span style={{ fontSize: '15px' }}>Sắp xếp Dấu sao (★)</span>
                      <p style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)', marginTop: '4px' }}>Xếp các cụm từ tạo thành câu hoàn chỉnh và chọn vị trí dấu sao.</p>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={startQuiz}
                  style={{
                    marginTop: '12px',
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--primary-gradient)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '16px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)',
                    transition: 'var(--transition)'
                  }}
                >
                  Bắt đầu ôn tập (10 câu)
                </button>
              </div>
            </div>
          ) : (
            /* Quiz Playing State */
            <div className="quiz-section" style={{ maxWidth: '720px', margin: '0 auto' }}>
              {!isQuizFinished && (
                currentQuestions[currentQuizIndex] && (
                  <div className="quiz-card" style={{ padding: '32px', position: 'relative' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                      <button 
                        onClick={exitQuiz}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '13px',
                          fontWeight: 700
                        }}
                      >
                        <ArrowLeft size={16} />
                        <span>Thoát</span>
                      </button>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        Câu {currentQuizIndex + 1}/{currentQuestions.length}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--success)' }}>
                        Đúng: {quizScore}/{currentQuizIndex + (isQuestionAnswered ? 1 : 0)}
                      </span>
                    </div>

                    {/* QUIZ TYPE 1: FILL IN THE BLANK */}
                    {quizType === 'fill' && (
                      <div>
                        {/* Question Text */}
                        <h2 
                          style={{
                            fontSize: '22px',
                            fontFamily: 'var(--font-kanji)',
                            lineHeight: '2.0',
                            textAlign: 'center',
                            marginBottom: '20px',
                            color: 'var(--text-primary)'
                          }} 
                          dangerouslySetInnerHTML={{ __html: currentQuestions[currentQuizIndex].questionJp }}
                        />

                        <p className="quiz-instruction" style={{ textAlign: 'center', marginBottom: '24px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700 }}>
                          Chọn mẫu ngữ pháp phù hợp để điền vào câu:
                        </p>

                        {/* Choices Grid */}
                        <div className="quiz-options">
                          {currentQuestions[currentQuizIndex].choices.map((choice, idx) => {
                            const isCorrect = choice === currentQuestions[currentQuizIndex].correctAnswer;
                            const isSelected = choice === selectedChoice;
                            let optionClass = '';
                            if (isQuestionAnswered) {
                              if (isCorrect) optionClass = 'correct';
                              else if (isSelected) optionClass = 'incorrect';
                            }
                            return (
                              <button
                                key={idx}
                                className={`quiz-option ${optionClass}`}
                                onClick={() => handleSelectChoice(choice)}
                                disabled={isQuestionAnswered}
                              >
                                {choice}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* QUIZ TYPE 2: STAR ARRANGEMENT */}
                    {quizType === 'star' && (
                      <div>
                        <p className="quiz-instruction" style={{ textAlign: 'center', marginBottom: '20px', fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                          Click để sắp xếp các cụm từ tạo thành câu hoàn chỉnh:
                        </p>

                        {/* Scrambled Sentence Preview / Slots */}
                        <div className="star-slots-container">
                          {/* Display sentence structure */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                            gap: '8px',
                            fontSize: '18px',
                            fontFamily: 'var(--font-kanji)',
                            lineHeight: '2.0',
                            color: 'var(--text-primary)',
                            width: '100%',
                            textAlign: 'center'
                          }}>
                            {/* Prefix */}
                            {currentQuestions[currentQuizIndex].prefix && (
                              <span>{currentQuestions[currentQuizIndex].prefix}</span>
                            )}

                            {/* Slot row */}
                            <div className="star-slots" style={{ display: 'inline-flex', verticalAlign: 'middle', margin: '0 4px' }}>
                              {starSlots.map((slot, slotIdx) => {
                                return (
                                  <div
                                    key={slotIdx}
                                    onClick={() => handleSlotClick(slotIdx)}
                                    className={`star-slot ${slot !== null ? 'filled' : ''} ${slotIdx === 2 ? 'star-marked' : ''}`}
                                  >
                                    {slot ? slot.text : ''}
                                    <span className="star-slot-index">{slotIdx + 1}</span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Suffix */}
                            {currentQuestions[currentQuizIndex].suffix && (
                              <span>{currentQuestions[currentQuizIndex].suffix}</span>
                            )}
                          </div>
                        </div>



                        {/* Scrambled Word Pool Chips */}
                        {!isQuestionAnswered && (
                          <div>
                            <div className="word-pool">
                              {starChips.map((chip, chipIdx) => (
                                <button
                                  key={chip.originalIndex}
                                  onClick={() => handleChipClick(chipIdx)}
                                  className={`word-chip ${chip.used ? 'used' : ''}`}
                                  disabled={chip.used}
                                >
                                  {chip.text}
                                </button>
                              ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px' }}>
                              <button
                                onClick={resetStarSlots}
                                className="toggle-opt-btn"
                                style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                              >
                                <RefreshCw size={14} />
                                <span>Làm lại</span>
                              </button>

                              <button
                                onClick={checkStarAnswer}
                                className="action-btn"
                                disabled={starSlots.some(s => s === null)}
                                style={{ padding: '10px 24px' }}
                              >
                                <Check size={16} />
                                <span>Kiểm tra kết quả</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* FEEDBACK & EXPLANATION PANEL */}
                    {isQuestionAnswered && (
                      <div style={{
                        marginTop: '28px',
                        padding: '24px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                      }}>
                        {/* Results check indicator */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {quizType === 'fill' ? (
                            selectedChoice === currentQuestions[currentQuizIndex].correctAnswer ? (
                              <span style={{ color: 'var(--success)', fontWeight: 800, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <CheckCircle size={18} />
                                Chính xác!
                              </span>
                            ) : (
                              <span style={{ color: 'var(--danger)', fontWeight: 800, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <HelpCircle size={18} />
                                Chưa chính xác!
                              </span>
                            )
                          ) : (
                            isStarCorrect ? (
                              <span style={{ color: 'var(--success)', fontWeight: 800, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <CheckCircle size={18} />
                                Sắp xếp hoàn hảo! (+1 điểm)
                              </span>
                            ) : (
                              <span style={{ color: 'var(--danger)', fontWeight: 800, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <HelpCircle size={18} />
                                Sắp xếp sai thứ tự!
                              </span>
                            )
                          )}
                        </div>

                        {/* Correct sentence output */}
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Câu hoàn chỉnh</p>
                          {quizType === 'fill' ? (
                            <p style={{ fontSize: '16.5px', fontFamily: 'var(--font-kanji)', color: 'var(--text-primary)', lineHeight: '1.8' }}
                               dangerouslySetInnerHTML={{
                                 __html: currentQuestions[currentQuizIndex].questionJp.replace('_______', `<span style="color:var(--success);font-weight:bold;border-bottom:2px solid var(--success);padding:0 4px">${currentQuestions[currentQuizIndex].correctAnswer}</span>`)
                               }}
                            />
                          ) : (
                            <div>
                              {/* Display assembled correct chips sequence */}
                              <p style={{ fontSize: '16.5px', fontFamily: 'var(--font-kanji)', color: 'var(--text-primary)', lineHeight: '1.8' }}>
                                {currentQuestions[currentQuizIndex].prefix}
                                {currentQuestions[currentQuizIndex].words.map((w, wIdx) => {
                                  const isStar = wIdx === 2; // Star is index 2 (3rd item)
                                  return (
                                    <span 
                                      key={wIdx} 
                                      style={{ 
                                        color: isStar ? 'var(--warning)' : 'var(--primary-light)', 
                                        fontWeight: 'bold',
                                        borderBottom: isStar ? '2px solid var(--warning)' : '1px dashed var(--border-color)',
                                        padding: '0 4px',
                                        margin: '0 2px'
                                      }}
                                    >
                                      {w}
                                    </span>
                                  );
                                })}
                                {currentQuestions[currentQuizIndex].suffix}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Translation (if hidden dynamically but now we show it in feedback) */}
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Dịch nghĩa</p>
                          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            {currentQuestions[currentQuizIndex].translation}
                          </p>
                        </div>

                        {/* Explanation */}
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Giải thích ngữ pháp</p>
                          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                            {quizType === 'fill' 
                              ? `Đáp án đúng là "${currentQuestions[currentQuizIndex].correctAnswer}".`
                              : currentQuestions[currentQuizIndex].explanation}
                          </p>
                        </div>

                        {/* Next question action */}
                        <button
                          onClick={handleNextQuestion}
                          className="action-btn"
                          style={{ width: '100%', marginTop: '8px', justifyContent: 'center' }}
                        >
                          <span>{currentQuizIndex < currentQuestions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}</span>
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                )
              )}

              {/* Quiz Results Summary */}
              {isQuizFinished && (
                <div className="quiz-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '560px', margin: '0 auto' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>Kết quả luyện tập 🎉</h2>
                  
                  <div style={{ fontSize: '56px', fontWeight: 800, color: 'var(--primary-light)', margin: '24px 0', display: 'flex', justifyContent: 'center', alignItems: 'baseline' }}>
                    <span>{quizScore}</span>
                    <span style={{ fontSize: '24px', color: 'var(--text-muted)', marginLeft: '4px' }}>/{currentQuestions.length}</span>
                  </div>

                  <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '15.5px', lineHeight: '1.5' }}>
                    {quizScore === currentQuestions.length
                      ? 'Xuất sắc! Bạn đã trả lời đúng 100% câu hỏi! Quá đỉnh!'
                      : quizScore >= currentQuestions.length * 0.8
                      ? 'Rất tốt! Cố gắng luyện tập thêm để làm chủ hoàn toàn các mẫu này!'
                      : quizScore >= currentQuestions.length * 0.5
                      ? 'Khá tốt! Đọc kỹ phần giải thích của những câu sai để nhớ lâu hơn.'
                      : 'Cần cố gắng thêm! Hãy quay lại Tab Thẻ học để xem lại kiến thức.'}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button
                      onClick={startQuiz}
                      className="action-btn"
                      style={{ justifyContent: 'center', padding: '12px' }}
                    >
                      <RotateCw size={16} />
                      <span>Luyện tập lại phạm vi này</span>
                    </button>

                    <button
                      onClick={exitQuiz}
                      className="toggle-opt-btn"
                      style={{ justifyContent: 'center', padding: '12px', width: '100%' }}
                    >
                      <span>Quay lại thiết lập</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
