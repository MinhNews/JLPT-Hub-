'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useProgress } from '@/context/ProgressContext';

import Link from 'next/link';
import { 
  Search, CheckCircle, ChevronRight, BookOpen, ArrowLeft, 
  Play, Pause, RotateCcw, Check, X, 
  Info, Headphones, Settings, Volume2, 
  FastForward, VolumeX, AlertCircle, Loader2
} from 'lucide-react';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api');

const cleanForCompare = (text) => {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/[\s　.,，。、・()（）[\]「」❓❓❓?:：]/g, '')
    .trim()
    .toLowerCase();
};



function BlockAudioPlayer({ blockId, audioUrl, playingAudioId, setPlayingAudioId, playbackSpeed, volume, isMuted }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Sync playback speed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Sync volume / mute status
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Stop playing if another block is selected
  useEffect(() => {
    if (playingAudioId !== blockId && isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    }
  }, [playingAudioId, blockId, isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (playingAudioId === blockId) {
        setPlayingAudioId(null);
      }
    } else {
      setPlayingAudioId(blockId);
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Failed to play audio:', err);
      });
    }
  };

  const handleRewind = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
  };

  const handleForward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setPlayingAudioId(null);
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (timeInSec) => {
    if (isNaN(timeInSec)) return '00:00';
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="smart-player-card">
      <audio 
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
      />
      
      {/* Slider Control */}
      <div className="player-progress-row">
        <span className="time-text">{formatTime(currentTime)}</span>
        <input 
          type="range" 
          className="player-slider"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
        />
        <span className="time-text">{formatTime(duration)}</span>
      </div>

      <div className="player-controls-row">
        {/* Backward 10s */}
        <button className="control-btn" onClick={handleRewind} title="Tua lại 10 giây">
          <RotateCcw size={16} />
          <span className="btn-label-small">-10s</span>
        </button>

        {/* Play / Pause */}
        <button className="play-pause-btn" onClick={togglePlay}>
          {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
        </button>

        {/* Forward 10s */}
        <button className="control-btn" onClick={handleForward} title="Tua nhanh 10 giây">
          <FastForward size={16} />
          <span className="btn-label-small">+10s</span>
        </button>
        
        <span className="audio-speed-indicator">
          Tốc độ: {playbackSpeed}x
        </span>
      </div>
    </div>
  );
}

export default function ListeningPage() {

  const { listeningMastered, toggleListeningMastered } = useProgress();
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'guide' | 'lesson' | 'locked'
  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [lessonDetailLoading, setLessonDetailLoading] = useState(false);
  const [lockOverlayLesson, setLockOverlayLesson] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Audio Player State (Global settings shared among block players)
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);

  // Quiz state
  const [userAnswers, setUserAnswers] = useState({}); // { qId: optionIdx }
  const [submitted, setSubmitted] = useState(false);
  const [showFurigana, setShowFurigana] = useState(true);
  const [activeSentence, setActiveSentence] = useState(null); // { jp, vi, index, blockId }
  const [expandedTranscripts, setExpandedTranscripts] = useState({}); // { [blockId]: boolean }

  // Fetch lesson summaries
  const fetchLessons = async () => {
    setLessonsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/listening`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setLessons(data);
      }
    } catch (err) {
      console.error('Failed to fetch listening lessons:', err);
    } finally {
      setLessonsLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  // Clean html helper
  const cleanHtml = (text) => {
    if (!text) return '';
    return text.replace(/<[^>]+>/g, '').trim();
  };

  // Reset states when switching lessons
  const handleSelectLesson = async (lessonSummary) => {
    setPlayingAudioId(null);
    setLockOverlayLesson(null);

    if (lessonSummary.isLocked) {
      setLockOverlayLesson(lessonSummary);
      setActiveTab('locked');
      return;
    }

    setLessonDetailLoading(true);
    setActiveTab('lesson');
    try {
      const res = await fetch(`${API_BASE_URL}/listening/${lessonSummary.id}`, { credentials: 'include' });
      if (res.ok) {
        const fullLesson = await res.json();
        setSelectedLesson(fullLesson);
        setUserAnswers({});
        setSubmitted(false);
        setActiveSentence(null);
        setExpandedTranscripts({});
        setPlaybackSpeed(1.0);
      } else {
        alert('Không thể tải chi tiết bài nghe.');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối máy chủ.');
    } finally {
      setLessonDetailLoading(false);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Toggle transcript/script visibility per block
  const toggleTranscript = (blockId) => {
    setExpandedTranscripts(prev => ({
      ...prev,
      [blockId]: !prev[blockId]
    }));
  };

  // Submit quiz answers
  const handleSubmitQuiz = () => {
    setSubmitted(true);
    
    // Auto reveal all transcripts on submit
    const autoExpand = {};
    selectedLesson.blocks.forEach(b => {
      if (b.script) {
        autoExpand[b.id] = true;
      }
    });
    setExpandedTranscripts(autoExpand);
    
    // Check if correct and toggle progress mastery
    const allQuestions = selectedLesson.blocks.flatMap(b => b.questions);
    let correctCount = 0;
    allQuestions.forEach((q) => {
      const qId = q.id || q._id;
      if (userAnswers[qId] === q.correctAnswerIdx) {
        correctCount++;
      }
    });

    // Mark as mastered if student completed the quiz
    if (!listeningMastered.includes(selectedLesson.id)) {
      toggleListeningMastered(selectedLesson.id);
    }
  };



  // Parse block script HTML into interactive, clickable sentences
  const getAnnotatedScript = (scriptHtml, blockId) => {
    if (!scriptHtml) return '';
    let htmlText = scriptHtml.replace(/^(?:\s*<br\s*\/?>)+/, '').trim();

    // If the script contains <div class="tudich"> blocks (explanation/translation divs),
    // render them as-is without wrapping in interactive-sentence spans
    // Only wrap plain text segments (dialog lines) in spans
    if (htmlText.includes('class="tudich"') || htmlText.includes("class='tudich'")) {
      // Split by <div ... > blocks to preserve them intact
      const parts = htmlText.split(/(<div[^>]*class="tudich"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>|<div[^>]*class="tudich"[^>]*>)/);
      let result = '';
      let sentenceIdx = 0;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part) continue;
        if (part.includes('class="tudich"')) {
          // Preserve tudich blocks as-is (they contain translations)
          result += part;
        } else {
          // For plain text parts, wrap sentences
          const segments = part.split(/([。？！])/);
          for (let j = 0; j < segments.length; j++) {
            const seg = segments[j];
            if (!seg) continue;
            if (seg === '。' || seg === '？' || seg === '！') continue;
            const nextChar = (segments[j + 1] === '。' || segments[j + 1] === '？' || segments[j + 1] === '！') ? segments[j + 1] : '';
            const fullSentence = seg + nextChar;
            const cleanText = cleanHtml(fullSentence);
            if (cleanText) {
              result += `<span class="interactive-sentence" data-block="${blockId}" data-idx="${sentenceIdx}" data-jp="${encodeURIComponent(fullSentence)}"><sup class="sent-num font-sans">[${sentenceIdx + 1}]</sup>${fullSentence}</span>`;
              sentenceIdx++;
            } else {
              result += fullSentence;
            }
            if (nextChar) j++;
          }
        }
      }
      return result;
    }

    // Standard path: no tudich blocks, split by sentence ending punctuation
    const segments = htmlText.split(/([。？！])/);
    
    let result = '';
    let sentenceIdx = 0;
    
    for (let i = 0; i < segments.length; i++) {
      let segment = segments[i];
      if (segment === undefined) continue;
      
      if (segment === '。' || segment === '？' || segment === '！') {
        continue;
      }
      
      const nextChar = segments[i + 1] === '。' || segments[i + 1] === '？' || segments[i + 1] === '！' ? segments[i + 1] : '';
      const fullSentence = segment + nextChar;
      
      const cleanText = cleanHtml(fullSentence);
      if (cleanText) {
        result += `<span class="interactive-sentence" data-block="${blockId}" data-idx="${sentenceIdx}" data-jp="${encodeURIComponent(fullSentence)}"><sup class="sent-num font-sans">[${sentenceIdx + 1}]</sup>${fullSentence}</span>`;
        sentenceIdx++;
      } else {
        result += fullSentence;
      }
      
      if (nextChar) {
        i++;
      }
    }
    
    return result;
  };

  // Handle sentence click inside script - show stored translation only
  const handleScriptClick = (e, block) => {
    const target = e.target.closest('.interactive-sentence');
    if (target) {
      const allSentences = e.currentTarget.querySelectorAll('.interactive-sentence');
      allSentences.forEach(s => s.classList.remove('active'));
      target.classList.add('active');

      const idx = parseInt(target.getAttribute('data-idx'));
      const jpEncoded = target.getAttribute('data-jp');
      const jpText = decodeURIComponent(jpEncoded);
      
      const translations = block.sentenceTranslations || [];
      const found = translations.find(t =>
        cleanForCompare(t.jp) === cleanForCompare(jpText) ||
        cleanForCompare(t.jp).includes(cleanForCompare(jpText)) ||
        cleanForCompare(jpText).includes(cleanForCompare(t.jp))
      );
      
      setActiveSentence({
        jp: jpText,
        vi: found ? found.vi : '(Không có bản dịch cho câu này)',
        index: idx,
        blockId: block.id
      });
    }
  };



  // Filter lessons
  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const matchesSearch = 
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.part.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [lessons, searchQuery]);

  // Group lessons by Part
  const groupedLessons = useMemo(() => {
    const groups = {};
    filteredLessons.forEach((lesson) => {
      const part = lesson.part || 'Khác';
      if (!groups[part]) {
        groups[part] = [];
      }
      groups[part].push(lesson);
    });
    return groups;
  }, [filteredLessons]);

  return (
    <div className="listening-page fade-in">
      {/* Top Navbar */}
      <div className="listening-navbar">
        <div className="nav-brand">
          <Headphones className="icon-pulse" size={24} />
          <h1>Nghe hiểu Shinkanzen Master N3</h1>
        </div>
        <div className="nav-controls">
          <button 
            className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            Bài học
          </button>
          <button 
            className={`tab-btn ${activeTab === 'guide' ? 'active' : ''}`}
            onClick={() => setActiveTab('guide')}
          >
            Bí kíp nghe hiểu
          </button>
        </div>
      </div>



      {/* Main Container */}
      <div className="listening-content-container">
        
        {/* TAB 1: LIST VIEW */}
        {activeTab === 'list' && (
          <div className="list-tab-view">
            {/* Search Box */}
            <div className="search-wrapper">
              <div className="search-bar">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Tìm kiếm bài nghe hiểu (Ví dụ: 課題理解, Mogi...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="clear-search" onClick={() => setSearchQuery('')}>&times;</button>
                )}
              </div>
            </div>

            {/* List Groups */}
            <div className="groups-list">
              {lessonsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                  <Loader2 className="animate-spin" size={36} style={{ color: 'var(--primary)', marginBottom: '12px' }} />
                  <p>Đang tải danh sách bài học...</p>
                </div>
              ) : Object.keys(groupedLessons).length === 0 ? (
                <div className="empty-search-card">
                  <AlertCircle size={40} className="empty-icon" />
                  <h3>Không tìm thấy bài học nào phù hợp</h3>
                  <p>Vui lòng thử từ khóa khác hoặc xóa bộ lọc tìm kiếm.</p>
                </div>
              ) : (
                Object.keys(groupedLessons).map((partName) => (
                  <div key={partName} className="part-group">
                    <h2 className="part-group-title">{partName}</h2>
                    <div className="lessons-grid">
                      {groupedLessons[partName].map((lesson) => {
                        const isMastered = listeningMastered.includes(lesson.id);
                        const isLocked = lesson.isLocked;
                        return (
                          <div 
                            key={lesson.id} 
                            className={`lesson-card ${isMastered ? 'mastered' : ''} ${isLocked ? 'locked-card' : ''}`}
                            onClick={() => handleSelectLesson(lesson)}
                          >
                            <div className="card-top">
                              <span className="lesson-badge">{lesson.id.toUpperCase()}</span>
                              {isLocked ? (
                                <span className="lock-badge">🔒 VIP</span>
                              ) : (
                                isMastered && <span className="mastered-badge"><CheckCircle size={14} /> Đã thuộc</span>
                              )}
                            </div>
                            <h3 className="lesson-card-title">{lesson.title}</h3>
                            <div className="card-footer">
                              <span className="audio-icon-span">
                                {isLocked ? '🔒 Bài học VIP' : '🎧 Nghe & Làm bài'}
                              </span>
                              <ChevronRight size={16} className="arrow-icon" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB LOCKED: PREMIUM ACCESS LOCK */}
        {activeTab === 'locked' && lockOverlayLesson && (
          <div className="premium-lock-view fade-in">
            <button className="back-btn" onClick={() => setActiveTab('list')}>
              <ArrowLeft size={16} />
              <span>Quay lại danh sách bài</span>
            </button>
            <div className="lock-card-details">
              <span className="lock-icon-large">🔒</span>
              <h2>Nội Dung Thuộc Gói VIP</h2>
              <p className="lock-description">
                Bài học <strong>{lockOverlayLesson.title}</strong> thuộc học phần nâng cao. 
                Vui lòng nâng cấp tài khoản của bạn lên VIP để truy cập toàn bộ 28 bài nghe hiểu, kịch bản hội thoại tương tác và giải thích chi tiết.
              </p>
              <div className="lock-actions">
                <Link href="/pricing" className="pricing-redirect-btn">
                  Xem Bảng Giá VIP 👑
                </Link>
                <button className="back-list-btn" onClick={() => setActiveTab('list')}>
                  Để sau
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LOADING LESSON DETAIL OVERLAY */}
        {activeTab === 'lesson' && lessonDetailLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-secondary)' }}>
            <Loader2 className="animate-spin" size={36} style={{ color: 'var(--primary)', marginBottom: '12px' }} />
            <p>Đang tải chi tiết bài nghe Shinkanzen...</p>
          </div>
        )}

        {/* TAB 2: GUIDE/TIPS VIEW */}
        {activeTab === 'guide' && (
          <div className="guide-tab-view">
            <div className="guide-hero">
              <BookOpen size={48} className="hero-icon" />
              <h2>Bí kíp &amp; Chiến thuật Nghe hiểu JLPT N3</h2>
              <p>Tổng hợp các phương pháp nghe hiểu, nhận diện bẫy nói tránh và phản xạ trong phòng thi thực tế.</p>
            </div>

            <div className="guide-grid">
              <div className="guide-card">
                <h3>1. Dạng 課題理解 (Hiểu yêu cầu - 6 câu)</h3>
                <p className="card-intro">Nghe các chỉ thị hành động cụ thể để xác định nhân vật sẽ làm việc gì trước tiên.</p>
                <ul>
                  <li><strong>Chiến thuật:</strong> Tập trung vào các trạng từ thời gian như "まず" (trước tiên), "これから" (sau đây).</li>
                  <li><strong>Bẫy thường gặp:</strong> Người nói đổi ý giữa chừng (ví dụ: "Nhờ cậu photo cái này... à thôi để lát nữa tôi tự làm").</li>
                  <li><strong>Từ khóa quyết định:</strong> <em>やっぱり, そうではなくて, ~といて, ~なきゃ.</em></li>
                </ul>
              </div>

              <div className="guide-card">
                <h3>2. Dạng ポイント理解 (Hiểu điểm cốt lõi - 6 câu)</h3>
                <p className="card-intro">Nghe tìm kiếm lý do, thời gian, số lượng hoặc cảm xúc của nhân vật.</p>
                <ul>
                  <li><strong>Chiến thuật:</strong> Đọc trước câu hỏi và 4 đáp án in sẵn trên giấy thi trong thời gian chờ (20 giây).</li>
                  <li><strong>Bẫy thường gặp:</strong> Trình bày nhiều lý do phụ rồi kết luận bằng một lý do trái ngược ở cuối.</li>
                  <li><strong>Từ khóa quyết định:</strong> <em>実は (thực ra), なぜなら (bởi vì là), というのは.</em></li>
                </ul>
              </div>

              <div className="guide-card">
                <h3>3. Dạng 概要理解 (Hiểu khái quát - 3 câu)</h3>
                <p className="card-intro">Nghe ý chính, chủ đề bao quát. Dạng này đề thi HOÀN TOÀN TRỐNG, không in chữ.</p>
                <ul>
                  <li><strong>Chiến thuật:</strong> Không cần nghe ghi nhớ từng chi tiết nhỏ. Hãy tập trung nghe thái độ chung, từ khóa lặp lại để đoán chủ đề tổng thể.</li>
                  <li><strong>Bẫy thường gặp:</strong> Tranh luận dài dòng về 2 vấn đề rồi chốt chủ đề thảo luận chung.</li>
                  <li><strong>Từ khóa quyết định:</strong> <em>~について (về việc), 伝えたいこと (điều muốn truyền đạt).</em></li>
                </ul>
              </div>

              <div className="guide-card">
                <h3>4. Dạng 即時応答 (Phản xạ nhanh - 9 câu)</h3>
                <p className="card-intro">Nghe một câu nói ngắn (lời mời, xin phép, nhờ vả) và chọn 1 trong 3 câu đáp lại ngay lập tức.</p>
                <ul>
                  <li><strong>Chiến thuật:</strong> Phải ghi nhớ các cụm từ giao tiếp thông thường, kính ngữ và thể bị động/sai khiến.</li>
                  <li><strong>Cách luyện:</strong> Tập phản xạ trong vòng 1-2 giây sau khi nghe câu hỏi.</li>
                  <li><strong>Mẹo nhỏ:</strong> Thường phương án lịch sự hoặc đồng ý/từ chối tế nhị sẽ là đáp án đúng.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LESSON DETAIL VIEW */}
        {activeTab === 'lesson' && selectedLesson && (
          <div className="lesson-tab-view">
            {/* Back to List */}
            <button className="back-btn" onClick={() => setActiveTab('list')}>
              <ArrowLeft size={16} />
              <span>Quay lại danh sách bài</span>
            </button>

            <div className="lesson-header-card">
              <div className="header-badge-row">
                <span className="lesson-part-badge">{selectedLesson.part}</span>
                <span className="lesson-id-badge">{selectedLesson.id.toUpperCase()}</span>
              </div>
              <h2 className="lesson-title-detail">{selectedLesson.title}</h2>
            </div>

            {/* Global Listening Settings Card */}
            <div className="listening-settings-bar card-shadow">
              <div className="settings-section">
                <Settings size={16} className="settings-icon" />
                <span className="settings-label">Cài đặt nghe:</span>
                
                {/* Global Speed Selector */}
                <div className="global-speed-selector">
                  {[0.75, 1.0, 1.25, 1.5].map((speed) => (
                    <button
                      key={speed}
                      className={`speed-btn ${playbackSpeed === speed ? 'active' : ''}`}
                      onClick={() => setPlaybackSpeed(speed)}
                    >
                      {speed === 1.0 ? '1.0x' : `${speed}x`}
                    </button>
                  ))}
                </div>

                <div className="player-divider" />

                {/* Global Volume Selector */}
                <div className="volume-control-box">
                  <button className="control-btn volume-mute-btn" onClick={toggleMute}>
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1" 
                    value={isMuted ? 0 : volume} 
                    onChange={handleVolumeChange}
                    className="volume-slider"
                  />
                </div>
              </div>

              {/* Furigana Toggle */}
              <button 
                className={`furigana-toggle-btn ${showFurigana ? 'active' : ''}`}
                onClick={() => setShowFurigana(!showFurigana)}
              >
                {showFurigana ? 'Ẩn Furigana' : 'Hiện Furigana'}
              </button>
            </div>

            <div className="lesson-main-grid">
              
              {/* Left Side: Media, Quiz, Script */}
              <div className="left-column">
                
                {/* Lesson Instruction / Intro (contains images if any) */}
                {selectedLesson.intro && (
                  <div className="intro-card card-shadow">
                    <div className="card-header-small">
                      <Info size={16} />
                      <span>Hướng dẫn bài nghe / Ví dụ</span>
                    </div>
                    <div 
                      className="intro-body-html font-serif"
                      dangerouslySetInnerHTML={{ __html: selectedLesson.intro }}
                    />
                  </div>
                )}

                {/* Blocks List */}
                {selectedLesson.blocks.map((block, bIdx) => {
                  const hasScript = !!block.script;
                  const isTranscriptExpanded = !!expandedTranscripts[block.id];
                  
                  return (
                    <div key={block.id} className="block-card card-shadow">
                      <div className="block-header">
                        <Headphones size={18} className="block-icon" />
                        <h3 className="block-title">{block.title || `Câu hỏi ${bIdx + 1}`}</h3>
                      </div>

                      {/* Dedicated Block Audio Player */}
                      <BlockAudioPlayer 
                        blockId={block.id}
                        audioUrl={block.audioUrl}
                        playingAudioId={playingAudioId}
                        setPlayingAudioId={setPlayingAudioId}
                        playbackSpeed={playbackSpeed}
                        volume={volume}
                        isMuted={isMuted}
                      />

                      {/* Block Questions & Choices */}
                      {block.questions && block.questions.length > 0 && (
                        <div className="block-questions-container">
                          {block.questions.map((q, qIdx) => {
                            const qId = q.id || q._id || `q_${bIdx}_${qIdx}`;
                            const userChoice = userAnswers[qId];
                            return (
                              <div key={qId} className="quiz-question-item">
                                {q.questionJp && (
                                  <h4 className="question-text font-serif" dangerouslySetInnerHTML={{ __html: q.questionJp }} />
                                )}
                                <div className="choices-list">
                                  {q.choices.map((choice, oIdx) => {
                                    const isSelected = userChoice === oIdx;
                                    const isCorrect = q.correctAnswerIdx === oIdx;
                                    
                                    let choiceClass = '';
                                    if (submitted) {
                                      if (isCorrect) choiceClass = 'correct';
                                      else if (isSelected) choiceClass = 'incorrect';
                                    } else if (isSelected) {
                                      choiceClass = 'selected';
                                    }

                                    return (
                                      <button
                                        key={oIdx}
                                        className={`choice-button ${choiceClass}`}
                                        disabled={submitted}
                                        onClick={() => setUserAnswers({ ...userAnswers, [qId]: oIdx })}
                                      >
                                        <span className="choice-number">{oIdx + 1}</span>
                                        <span className="choice-text font-serif" dangerouslySetInnerHTML={{ __html: choice }} />
                                        
                                        {submitted && isCorrect && <Check className="feedback-icon-check" size={16} />}
                                        {submitted && isSelected && !isCorrect && <X className="feedback-icon-x" size={16} />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Block Script & Translation (Collapsible) */}
                      {hasScript && (
                        <div className="block-script-section">
                          <button
                            className={`block-script-toggle ${isTranscriptExpanded ? 'active' : ''}`}
                            onClick={() => toggleTranscript(block.id)}
                          >
                            <BookOpen size={14} />
                            <span>{isTranscriptExpanded ? 'Ẩn Kịch bản & Dịch' : 'Xem Kịch bản & Dịch'}</span>
                          </button>

                          {isTranscriptExpanded && (
                            <div className="block-script-body fade-in">
                              <p className="script-instructions">
                                * Click vào từng câu trong kịch bản để dịch nghĩa tiếng Việt chi tiết.
                              </p>
                              <div 
                                className={`script-rendered-html font-serif ${showFurigana ? 'ruby-active' : 'ruby-hidden'}`}
                                onClick={(e) => handleScriptClick(e, block)}
                                dangerouslySetInnerHTML={{ __html: getAnnotatedScript(block.script, block.id) }}
                              />

                              {/* Active Translation Card for this block */}
                              {activeSentence && activeSentence.blockId === block.id && (
                                <div className="active-translation-card fade-in">
                                  <div className="trans-header">
                                    <span className="trans-badge">Câu {activeSentence.index + 1}</span>
                                    <button className="trans-close" onClick={() => setActiveSentence(null)}>&times;</button>
                                  </div>
                                  <p className="trans-jp font-serif" dangerouslySetInnerHTML={{ __html: activeSentence.jp }} />
                                  <p className="trans-vi">{activeSentence.vi}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Global Quiz Action Button (Submit/Reset) */}
                <div className="global-quiz-action-card card-shadow">
                  {!submitted ? (
                    <button 
                      className="submit-quiz-btn"
                      onClick={handleSubmitQuiz}
                      disabled={Object.keys(userAnswers).length < selectedLesson.blocks.flatMap(b => b.questions).length}
                    >
                      Nộp bài &amp; Xem đáp án
                    </button>
                  ) : (
                    <div className="quiz-feedback-row">
                      <span className="submitted-banner">Đã nộp bài và lưu tiến độ!</span>
                      <button className="reset-quiz-btn" onClick={() => { setSubmitted(false); setUserAnswers({}); setExpandedTranscripts({}); setActiveSentence(null); }}>Làm lại</button>
                    </div>
                  )}
                </div>

              </div>

              {/* Right Side: Explanation */}
              <div className="right-column">
                <div className="explanation-card card-shadow">
                  <div className="explanation-header">
                    <h3>Dịch &amp; Giải thích gốc</h3>
                  </div>

                  <div className="explanation-body">
                    <div className="original-explanation-wrapper">
                      {selectedLesson.explanation ? (
                        <div 
                          className="original-explanation-html font-serif"
                          dangerouslySetInnerHTML={{ __html: selectedLesson.explanation }}
                        />
                      ) : (
                        <div className="no-original-explanation">
                          <p>Bài học này không có phần giải thích gốc từ giáo trình.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Global CSS Styles for Listening Module */}
      <style jsx global>{`
        .listening-page {
          padding: 24px;
          min-height: 100vh;
          background: var(--bg-color);
          color: var(--text-primary);
          font-family: var(--font-sans, system-ui, sans-serif);
        }

        .listening-navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 24px;
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nav-brand h1 {
          font-size: 20px;
          font-weight: 800;
          background: var(--primary-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .icon-pulse {
          color: var(--primary-light);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 0.9; }
        }

        .nav-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .tab-btn {
          padding: 8px 16px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tab-btn.active {
          background: var(--primary-glow);
          border-color: rgba(99, 102, 241, 0.4);
          color: var(--primary-light);
        }

        .config-key-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border: 1px solid var(--border-color);
          background: var(--card-bg);
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .config-key-btn:hover {
          background: var(--card-bg-hover);
          border-color: var(--primary-light);
        }

        /* API key modal */
        .api-config-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }

        .api-config-modal {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          width: 90%;
          max-width: 480px;
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 18px 24px;
          background: var(--bg-color);
          border-bottom: 1px solid var(--border-color);
          color: var(--text-primary);
        }

        .modal-header h3 {
          font-size: 16px;
          font-weight: 700;
        }

        .modal-icon {
          color: var(--text-primary);
        }

        .modal-body {
          padding: 24px;
        }

        .modal-desc {
          font-size: 13.5px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 18px;
        }

        .api-input {
          width: 100%;
          padding: 10px 14px;
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
          margin-bottom: 12px;
          transition: border-color 0.2s;
        }

        .api-input:focus {
          border-color: var(--primary);
        }

        .api-status {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 20px;
        }

        .status-active {
          color: #10b981;
          font-weight: 600;
        }

        .status-inactive {
          color: #ef4444;
          font-weight: 600;
        }

        .api-actions {
          display: flex;
          gap: 10px;
          margin-bottom: 18px;
        }

        .btn-save {
          flex: 2;
          padding: 10px;
          background: var(--primary);
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .btn-save:hover {
          opacity: 0.9;
        }

        .btn-clear {
          flex: 1;
          padding: 10px;
          background: #ef4444;
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .btn-clear:hover {
          opacity: 0.9;
        }

        .btn-close {
          flex: 1;
          padding: 10px;
          background: var(--border-color);
          border: none;
          border-radius: 8px;
          color: var(--text-primary);
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .btn-close:hover {
          opacity: 0.9;
        }

        .api-hint {
          font-size: 12px;
          color: var(--text-muted);
          text-align: center;
        }

        .api-hint a {
          color: var(--primary-light);
          text-decoration: underline;
        }

        /* Search Section */
        .search-wrapper {
          margin-bottom: 24px;
        }

        .search-bar {
          position: relative;
          display: flex;
          align-items: center;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 0 16px;
        }

        .search-icon {
          color: var(--text-muted);
        }

        .search-bar input {
          width: 100%;
          padding: 14px 12px;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
        }

        .clear-search {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 20px;
          cursor: pointer;
          padding: 4px;
        }

        /* Group Lists */
        .part-group {
          margin-bottom: 32px;
        }

        .part-group-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-secondary);
          margin-bottom: 16px;
          padding-left: 4px;
          border-left: 3px solid var(--primary);
        }

        .lessons-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .lesson-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 150px;
        }

        .lesson-card:hover {
          transform: translateY(-4px);
          border-color: var(--primary);
          box-shadow: var(--shadow-md);
          background: var(--card-bg-hover);
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .lesson-badge {
          background: var(--primary-glow);
          color: var(--primary-light);
          font-size: 11px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .mastered-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          background: var(--success-glow);
          color: var(--success);
          font-size: 11px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .lesson-card.mastered {
          border-left: 4px solid var(--success);
        }

        .lesson-card-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          margin-top: 12px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
          font-size: 12.5px;
          color: var(--text-muted);
        }

        .lesson-card:hover .card-footer {
          color: var(--primary-light);
        }

        .arrow-icon {
          transition: transform 0.2s;
        }

        .lesson-card:hover .arrow-icon {
          transform: translateX(4px);
        }

        /* Tips view */
        .guide-hero {
          background: linear-gradient(135deg, var(--primary-glow) 0%, rgba(192, 132, 252, 0.08) 100%);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 32px;
          text-align: center;
          margin-bottom: 32px;
        }

        .hero-icon {
          color: var(--primary-light);
          margin-bottom: 12px;
        }

        .guide-hero h2 {
          font-size: 22px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .guide-hero p {
          color: var(--text-secondary);
          font-size: 14px;
          max-width: 600px;
          margin: 0 auto;
        }

        .guide-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 20px;
        }

        .guide-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 24px;
        }

        .guide-card h3 {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 10px;
          margin-bottom: 12px;
        }

        .card-intro {
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 16px;
        }

        .guide-card ul {
          padding-left: 16px;
        }

        .guide-card li {
          font-size: 13.5px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 8px;
        }

        .guide-card li strong {
          color: var(--text-primary);
        }

        /* Detail Lesson view */
        .back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 16px;
          transition: color 0.2s;
        }

        .back-btn:hover {
          color: var(--primary-light);
        }

        .lesson-header-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .header-badge-row {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .lesson-part-badge {
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
        }

        .lesson-id-badge {
          background: var(--primary);
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
        }

        .lesson-title-detail {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .lesson-main-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 24px;
          align-items: start;
        }

        /* Column contents */
        .left-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .card-shadow {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          box-shadow: var(--shadow-sm);
        }

        /* Custom Smart Audio Player */
        .smart-player-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 20px;
          box-shadow: var(--shadow-md);
        }

        .player-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--primary-light);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 16px;
        }

        .player-progress-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .time-text {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          font-family: monospace;
          min-width: 38px;
        }

        .player-slider {
          flex: 1;
          -webkit-appearance: none;
          height: 6px;
          background: var(--border-color);
          border-radius: 3px;
          outline: none;
          cursor: pointer;
        }

        .player-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          background: var(--primary-light);
          border-radius: 50%;
          transition: transform 0.1s;
        }

        .player-slider::-webkit-slider-thumb:hover {
          transform: scale(1.25);
        }

        .player-controls-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .control-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s;
        }

        .control-btn:hover {
          background: var(--border-color);
          color: var(--text-primary);
        }

        .btn-label-small {
          font-size: 9px;
          font-weight: 600;
          margin-top: -2px;
        }

        .play-pause-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 10px rgba(99, 102, 241, 0.35);
        }

        .play-pause-btn:hover {
          transform: scale(1.06);
          background: var(--primary-light);
        }

        .player-divider {
          width: 1px;
          height: 24px;
          background: var(--border-color);
          margin: 0 4px;
        }

        .speed-selector {
          display: flex;
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 2px;
        }

        .speed-btn {
          font-size: 11px;
          font-weight: 700;
          padding: 6px 10px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          border-radius: 18px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .speed-btn:hover {
          color: var(--text-secondary);
        }

        .speed-btn.active {
          background: var(--border-color);
          color: var(--primary-light);
        }

        .volume-control-box {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: auto;
        }

        .volume-slider {
          -webkit-appearance: none;
          width: 60px;
          height: 4px;
          background: var(--border-color);
          border-radius: 2px;
          outline: none;
        }

        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 10px;
          height: 10px;
          background: var(--text-secondary);
          border-radius: 50%;
        }

        /* Intro card */
        .card-header-small {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 18px;
          background: var(--bg-color);
          border-bottom: 1px solid var(--border-color);
          font-size: 13px;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .intro-body-html {
          padding: 20px;
          font-size: 14.5px;
          line-height: 1.7;
          color: var(--text-primary);
        }

        .intro-body-html img {
          max-width: 100%;
          height: auto;
          margin: 16px 0;
          border-radius: 8px;
          border: 2px solid var(--border-color);
        }

        /* Quiz card */
        .quiz-card {
          padding: 20px;
        }

        .quiz-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          color: var(--text-primary);
        }

        .quiz-header h3 {
          font-size: 16px;
          font-weight: 700;
        }

        .quiz-note-chokai {
          font-size: 12.5px;
          color: var(--text-secondary);
          margin-bottom: 16px;
        }

        .questions-box {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .question-text {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 12px;
        }

        .choices-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .choice-button {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          padding: 12px 16px;
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 14px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
        }

        .choice-button:hover:not(:disabled) {
          border-color: var(--primary);
          background: var(--card-bg-hover);
        }

        .choice-button.selected {
          border-color: var(--primary);
          background: var(--primary-glow);
          color: var(--primary-light);
        }

        .choice-button.correct {
          border-color: var(--success);
          background: var(--success-glow);
          color: var(--success);
        }

        .choice-button.incorrect {
          border-color: var(--danger);
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger);
        }

        .choice-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          background: var(--border-color);
          border-radius: 50%;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-secondary);
          margin-right: 12px;
          flex-shrink: 0;
        }

        .choice-button.selected .choice-number {
          background: var(--primary);
          color: white;
        }

        .choice-button.correct .choice-number {
          background: var(--success);
          color: white;
        }

        .choice-button.incorrect .choice-number {
          background: var(--danger);
          color: white;
        }

        .choice-text {
          flex-grow: 1;
          line-height: 1.4;
        }

        .feedback-icon-check {
          color: var(--success);
          margin-left: 10px;
        }

        .feedback-icon-x {
          color: var(--danger);
          margin-left: 10px;
        }

        .submit-quiz-btn {
          width: 100%;
          padding: 12px;
          background: var(--primary);
          color: white;
          font-weight: 600;
          font-size: 14px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 18px;
          transition: background-color 0.2s;
        }

        .submit-quiz-btn:hover:not(:disabled) {
          background: var(--primary-light);
        }

        .submit-quiz-btn:disabled {
          background: var(--border-color);
          color: var(--text-muted);
          cursor: not-allowed;
        }

        .quiz-feedback-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 18px;
        }

        .submitted-banner {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--success);
        }

        .reset-quiz-btn {
          padding: 8px 14px;
          background: var(--border-color);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 13px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .reset-quiz-btn:hover {
          background: var(--card-bg-hover);
          color: var(--text-primary);
        }

        /* Script card */
        .script-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color);
        }

        .script-header-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .script-header-title h3 {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .script-toggles {
          display: flex;
          gap: 8px;
        }

        .furigana-toggle-btn, .reveal-transcript-btn {
          padding: 6px 12px;
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .furigana-toggle-btn:hover, .reveal-transcript-btn:hover {
          color: var(--text-primary);
          border-color: var(--text-muted);
        }

        .furigana-toggle-btn.active, .reveal-transcript-btn.active {
          background: var(--primary-glow);
          border-color: rgba(99, 102, 241, 0.4);
          color: var(--primary-light);
        }

        .script-body-container {
          padding: 20px;
        }

        .script-instructions {
          font-size: 12px;
          color: var(--primary-light);
          margin-bottom: 12px;
        }

        .script-rendered-html {
          font-size: 15px;
          line-height: 2.1;
          color: var(--text-primary);
        }

        .script-blurred-overlay {
          padding: 40px 20px;
          text-align: center;
          background: var(--card-bg-hover);
          border-radius: 0 0 var(--radius-md) var(--radius-md);
          cursor: pointer;
        }

        .script-blurred-overlay p {
          font-size: 13.5px;
          color: var(--text-secondary);
          margin-bottom: 12px;
        }

        .reveal-btn-blur {
          padding: 8px 16px;
          background: var(--border-color);
          color: var(--text-primary);
          font-size: 12.5px;
          font-weight: 600;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .reveal-btn-blur:hover {
          background: var(--card-bg-hover);
        }

        /* Interactive script sentence */
        .interactive-sentence {
          cursor: pointer;
          padding: 2px 4px;
          border-radius: 4px;
          transition: background 0.2s;
          display: inline;
        }

        .interactive-sentence:hover {
          background: var(--primary-glow);
          color: var(--text-primary);
        }

        .interactive-sentence.active {
          background: var(--primary-glow);
          border-bottom: 2px solid var(--primary);
          color: var(--text-primary);
        }

        .sent-num {
          font-size: 9px;
          color: var(--primary);
          margin-right: 2px;
          vertical-align: super;
        }

        .active-translation-card {
          position: sticky;
          bottom: 12px;
          margin-top: 18px;
          padding: 16px;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-left: 4px solid var(--primary);
          border-radius: 12px;
          box-shadow: var(--shadow-md);
          z-index: 50;
        }

        .trans-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .trans-badge {
          background: var(--primary-glow);
          color: var(--primary-light);
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .trans-close {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 18px;
          cursor: pointer;
        }

        .trans-close:hover {
          color: var(--text-primary);
        }

        .trans-jp {
          font-size: 14.5px;
          color: var(--text-primary);
          margin-bottom: 6px;
          line-height: 1.7;
        }

        .trans-vi {
          font-size: 13.5px;
          color: var(--primary-light);
          line-height: 1.5;
        }

        /* Explanation (Original & AI tabs) */
        .explanation-card {
          overflow: hidden;
        }

        .explanation-header-tabs {
          display: flex;
          align-items: center;
          background: var(--bg-color);
          border-bottom: 1px solid var(--border-color);
          padding: 0 16px;
        }

        .exp-tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 20px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: var(--transition);
        }

        .exp-tab-btn:hover {
          color: var(--text-primary);
        }

        .exp-tab-btn.active {
          color: var(--primary-light);
          border-bottom-color: var(--primary);
        }

        .explanation-body {
          padding: 20px;
          max-height: 700px;
          overflow-y: auto;
        }

        .original-explanation-html {
          font-size: 14.5px;
          line-height: 1.7;
          color: var(--text-primary);
        }

        .original-explanation-html img {
          max-width: 100%;
          border-radius: 8px;
          margin: 16px 0;
          border: 1px solid var(--border-color);
        }

        /* AI assistant styles */
        .ai-assistant-wrapper {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .ai-warning-box {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: 8px;
          padding: 16px;
          color: var(--danger);
        }

        .ai-warning-box h4 {
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 4px;
          color: var(--text-primary);
        }

        .ai-warning-box p {
          font-size: 12.5px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 12px;
        }

        .btn-configure-inline {
          padding: 6px 12px;
          background: var(--danger);
          color: white;
          border: none;
          font-size: 12px;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
        }

        .ai-initial-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 40px 20px;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--primary-glow);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .ai-initial-loading p {
          font-size: 13.5px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .ai-initial-start-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 32px 20px;
          background: var(--bg-color);
          border: 1px dashed var(--border-color);
          border-radius: 12px;
          margin-top: 10px;
        }

        .initial-sparkle-icon {
          color: var(--primary-light);
          margin-bottom: 14px;
          animation: pulse 2s infinite;
        }

        .ai-initial-start-card h4 {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 8px;
          color: var(--text-primary);
        }

        .ai-initial-start-card p {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 20px;
          max-width: 340px;
        }

        .btn-start-analysis {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: var(--primary);
          color: white;
          border: none;
          font-size: 13.5px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-start-analysis:hover {
          background: var(--primary-light);
        }

        .ai-chat-history {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 12px;
        }

        .chat-bubble-row {
          display: flex;
          gap: 12px;
          animation: fadeIn 0.25s ease-out;
        }

        .chat-bubble-row.user {
          flex-direction: row-reverse;
        }

        .avatar-icon {
          width: 30px;
          height: 30px;
          background: var(--border-color);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }

        .chat-bubble-row.user .avatar-icon {
          background: var(--primary-glow);
        }

        .chat-bubble-text {
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13.5px;
          line-height: 1.6;
          max-width: 80%;
        }

        .chat-bubble-row.model .chat-bubble-text {
          background: var(--bg-color);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
        }

        .chat-bubble-row.user .chat-bubble-text {
          background: var(--primary);
          color: white;
        }

        /* Markdown elements inside AI responses */
        .chat-bubble-text strong {
          color: var(--text-primary);
          font-weight: 700;
        }

        .chat-bubble-text p {
          margin-bottom: 10px;
        }

        .chat-bubble-text p:last-child {
          margin-bottom: 0;
        }

        .markdown-list {
          padding-left: 20px;
          margin-bottom: 10px;
        }

        .markdown-list li {
          margin-bottom: 4px;
          list-style-type: disc;
        }

        .chat-bubble-text code {
          background: var(--card-bg);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
          color: var(--primary-light);
        }

        /* Typing indicator */
        .typing-indicator-box {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 14px 20px;
        }

        .typing-dot {
          width: 6px;
          height: 6px;
          background: var(--text-muted);
          border-radius: 50%;
          animation: typeBounce 1.4s infinite ease-in-out both;
        }

        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes typeBounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        .chat-error-message {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 12px;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 6px;
          color: var(--danger);
          font-size: 12px;
        }

        /* Quick actions */
        .quick-actions-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }

        .quick-action-btn {
          padding: 6px 12px;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-size: 11.5px;
          font-weight: 600;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .quick-action-btn:hover {
          border-color: var(--primary);
          background: var(--card-bg-hover);
          color: var(--text-primary);
        }

        /* Chat Input Form */
        .ai-chat-input-form {
          display: flex;
          gap: 10px;
          border-top: 1px solid var(--border-color);
          padding-top: 16px;
        }

        .chat-input-field {
          flex: 1;
          padding: 10px 14px;
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 13.5px;
          outline: none;
        }

        .chat-input-field:focus {
          border-color: var(--primary);
        }

        .chat-send-btn {
          padding: 10px 18px;
          background: var(--primary);
          color: white;
          font-weight: 600;
          font-size: 13.5px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .chat-send-btn:hover:not(:disabled) {
          background: var(--primary-light);
        }

        .chat-send-btn:disabled {
          background: var(--border-color);
          color: var(--text-muted);
          cursor: not-allowed;
        }

        /* Rubies/Furigana hidden/active toggling classes */
        .ruby-hidden rt {
          display: none;
        }
        
        .ruby-active rt {
          display: revert;
        }

        /* General table styling inside raw HTML */
        .intro-body-html table, .original-explanation-html table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
        }

        .intro-body-html th, .original-explanation-html th,
        .intro-body-html td, .original-explanation-html td {
          border: 1px solid var(--border-color);
          padding: 10px 12px;
          font-size: 14px;
        }

        .intro-body-html th, .original-explanation-html th {
          background: var(--border-color);
          color: var(--text-primary);
          font-weight: 700;
        }

        .tudich {
          margin-top: 14px;
          margin-bottom: 14px;
          border-bottom: 1px dashed var(--border-color);
          padding-bottom: 10px;
        }

        .candich {
          font-weight: 600;
          color: var(--text-primary);
        }

        .nddich, .kqdich {
          color: var(--primary-light);
          font-size: 13.5px;
          margin-top: 4px;
        }

        /* Block cards styling */
        .block-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 24px;
          box-shadow: var(--shadow-sm);
        }

        .block-header {
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 12px;
        }

        .block-icon {
          color: var(--primary-light);
        }

        .block-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .block-questions-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .block-script-section {
          border-top: 1px solid var(--border-color);
          padding-top: 18px;
          margin-top: 8px;
        }

        .block-script-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          width: fit-content;
        }

        .block-script-toggle:hover {
          color: var(--primary-light);
          border-color: var(--primary);
        }

        .block-script-toggle.active {
          background: var(--primary-glow);
          border-color: rgba(99, 102, 241, 0.4);
          color: var(--primary-light);
        }

        .block-script-body {
          margin-top: 16px;
        }

        /* Listening settings bar */
        .listening-settings-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          margin-bottom: 24px;
          box-shadow: var(--shadow-sm);
        }

        .settings-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .settings-label {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .global-speed-selector {
          display: flex;
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 2px;
        }

        .audio-speed-indicator {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          margin-left: auto;
          background: var(--bg-color);
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid var(--border-color);
        }

        .global-quiz-action-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          justify-content: center;
          box-shadow: var(--shadow-sm);
          margin-bottom: 24px;
        }

        /* No explanation view styling */
        .no-original-explanation {
          padding: 40px 20px;
          text-align: center;
          color: var(--text-secondary);
        }

        .no-original-explanation p {
          margin-bottom: 12px;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .no-exp-sub {
          font-size: 12.5px;
          line-height: 1.5;
          color: var(--text-muted);
        }

        .btn-use-ai-exp {
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 16px auto 0;
          padding: 8px 16px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .btn-use-ai-exp:hover {
          opacity: 0.9;
        }

        .lock-badge {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
        }
        .locked-card {
          border-color: rgba(245, 158, 11, 0.15) !important;
          opacity: 0.85;
        }
        .locked-card:hover {
          border-color: rgba(245, 158, 11, 0.4) !important;
        }
        .premium-lock-view {
          padding: 32px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 24px;
        }
        .lock-card-details {
          width: 100%;
          max-width: 580px;
          margin: 40px auto;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 48px 36px;
          text-align: center;
          box-shadow: var(--shadow-lg);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .lock-icon-large {
          font-size: 56px;
          margin-bottom: 8px;
          animation: pulse 2s infinite;
        }
        .lock-card-details h2 {
          font-size: 22px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .lock-description {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        .lock-actions {
          display: flex;
          gap: 16px;
          margin-top: 12px;
          width: 100%;
          justify-content: center;
        }
        .pricing-redirect-btn {
          padding: 12px 24px;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white !important;
          text-decoration: none;
          font-weight: 700;
          font-size: 14px;
          border-radius: var(--radius-md);
          box-shadow: 0 4px 10px rgba(245, 158, 11, 0.25);
          transition: var(--transition);
        }
        .pricing-redirect-btn:hover {
          opacity: 0.95;
          transform: translateY(-1px);
        }
        .back-list-btn {
          padding: 12px 24px;
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 14px;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: var(--transition);
        }
        .back-list-btn:hover {
          background: var(--card-bg-hover);
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}
