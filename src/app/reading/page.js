'use client';

import { useState, useMemo, useEffect } from 'react';
import { useProgress } from '@/context/ProgressContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { 
  Search, CheckCircle, ChevronRight, BookOpen, ArrowLeft, 
  Eye, EyeOff, Check, X, Sparkles, AlertCircle, Info, HelpCircle, Loader2
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

const getTranslation = (jpText, sentenceTranslations) => {
  if (!jpText || !sentenceTranslations) return '';
  const compText = cleanForCompare(jpText);
  const found = sentenceTranslations.find(sent => {
    const compSent = cleanForCompare(sent.jp);
    return compSent === compText || compText.includes(compSent) || compSent.includes(compText);
  });
  return found ? found.vi : '';
};

export default function ReadingPage() {
  const { token } = useAuth();
  const { readingMastered, toggleReadingMastered } = useProgress();
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'guide' | 'lesson' | 'locked'
  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [lessonDetailLoading, setLessonDetailLoading] = useState(false);
  const [lockOverlayLesson, setLockOverlayLesson] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Quiz state
  const [userAnswers, setUserAnswers] = useState({}); // { qId: optionIdx }
  const [submitted, setSubmitted] = useState(false);
  const [showFurigana, setShowFurigana] = useState(true);
  const [activeSentence, setActiveSentence] = useState(null); // { jp, vi, index }

  // AI Chatbot state
  const [apiKey, setApiKey] = useState('');
  const [inputApiKey, setInputApiKey] = useState('');
  const [showApiKeyConfig, setShowApiKeyConfig] = useState(false);
  const [aiActiveTab, setAiActiveTab] = useState('shinkanzen'); // 'shinkanzen' | 'ai'
  const [chatHistory, setChatHistory] = useState([]); // [{ role: 'user' | 'model', text: string }]
  const [chatInput, setChatInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [lessonImagesBase64, setLessonImagesBase64] = useState([]);

  // Fetch lesson summaries
  const fetchLessons = async () => {
    setLessonsLoading(true);
    try {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE_URL}/reading`, { headers });
      if (res.ok) {
        const data = await res.json();
        setLessons(data);
      }
    } catch (err) {
      console.error('Failed to fetch reading lessons:', err);
    } finally {
      setLessonsLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, [token]);

  // Load API Key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    const defaultKey = 'AIzaSyCdZvAqtMl9xZFqx-ZsOccr05-Mslgz-MU';
    if (savedKey) {
      setApiKey(savedKey);
      setInputApiKey(savedKey);
    } else {
      setApiKey(defaultKey);
      setInputApiKey(defaultKey);
      localStorage.setItem('gemini_api_key', defaultKey);
    }
  }, []);

  // Clean html helper
  const cleanHtml = (text) => {
    if (!text) return '';
    return text.replace(/<[^>]+>/g, '').trim();
  };

  const handleSaveApiKey = (newKey) => {
    const trimmed = newKey.trim();
    setApiKey(trimmed);
    localStorage.setItem('gemini_api_key', trimmed);
    setShowApiKeyConfig(false);
    setAiError('');
  };

  const handleClearApiKey = () => {
    setApiKey('');
    setInputApiKey('');
    localStorage.removeItem('gemini_api_key');
    setAiError('');
  };

  // Render Markdown helper
  const renderMarkdown = (text) => {
    if (!text) return '';
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    const lines = escaped.split('\n');
    let inList = false;
    const formattedLines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const content = trimmed.substring(2);
        let prefix = '';
        if (!inList) {
          inList = true;
          prefix = '<ul class="markdown-list">';
        }
        return `${prefix}<li>${content}</li>`;
      } else {
        let suffix = '';
        if (inList) {
          inList = false;
          suffix = '</ul>';
        }
        return `${suffix}<p>${line}</p>`;
      }
    });
    
    let result = formattedLines.join('');
    if (inList) {
      result += '</ul>';
    }
    result = result.replace(/<p><\/p>/g, '').replace(/<p>\s*<\/p>/g, '');
    return result;
  };

  // Trigger initial AI Explanation
  const triggerAiExplanation = async () => {
    if (!apiKey) {
      setAiError('Vui lòng cấu hình API Key trước khi sử dụng.');
      return;
    }
    setAiLoading(true);
    setAiError('');
    
    // Check if there are any images in the passage HTML
    let loadedImages = lessonImagesBase64;
    if (loadedImages.length === 0) {
      const passageHtml = selectedLesson.passage || '';
      const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
      let match;
      const imageUrls = [];
      
      while ((match = imgRegex.exec(passageHtml)) !== null) {
        imageUrls.push(match[1]);
      }
      
      const tempImages = [];
      for (const url of imageUrls) {
        try {
          const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.base64) {
              tempImages.push({
                mimeType: data.mimeType || 'image/png',
                base64: data.base64
              });
            }
          }
        } catch (err) {
          console.error('Error fetching image base64:', err);
        }
      }
      loadedImages = tempImages;
      setLessonImagesBase64(tempImages);
    }

    const passageCleaned = cleanHtml(selectedLesson.passage);
    const questionsContext = selectedLesson.questions.map((q, idx) => {
      const userAnsIdx = userAnswers[q.id];
      const correctAnsIdx = q.correctAnswerIdx;
      const userChoiceText = q.choices[userAnsIdx] || 'Chưa trả lời';
      const correctChoiceText = q.choices[correctAnsIdx];
      return `Câu hỏi ${idx + 1}: ${cleanHtml(q.questionJp)}
Các lựa chọn:
${q.choices.map((choice, cIdx) => `  ${cIdx + 1}. ${cleanHtml(choice)}`).join('\n')}
- Đáp án đúng: ${correctAnsIdx + 1}. ${cleanHtml(correctChoiceText)}
- Lựa chọn của học sinh: ${userAnsIdx !== undefined ? userAnsIdx + 1 : 'Chưa trả lời'}. ${cleanHtml(userChoiceText)}
- Trạng thái: ${userAnsIdx === correctAnsIdx ? 'ĐÚNG' : 'SAI'}`;
    }).join('\n\n');

    const systemPrompt = `Bạn là một giáo viên dạy tiếng Nhật bản ngữ thân thiện, chuyên nghiệp và giàu kinh nghiệm, đang hỗ trợ học sinh học phần Đọc hiểu của giáo trình Shinkanzen Master N3.
Hãy viết một bản phân tích và giải thích chi tiết cho bài đọc hiểu dưới đây bằng Tiếng Việt.

BÀI ĐỌC (TIẾNG NHẬT):
"""
${passageCleaned}
"""

CÁC CÂU HỎI VÀ ĐÁP ÁN:
"""
${questionsContext}
"""

HÃY THỰC HIỆN CÁC YÊU CẦU SAU TRONG BẢN GIẢI THÍCH BAN ĐẦU:
1. Nhận xét tổng quan bài đọc (chủ đề, độ khó, văn cảnh). Nếu có hình ảnh quảng cáo/tờ rơi đính kèm ở bài đọc này, hãy "nhìn" ảnh và phân tích các chi tiết nội dung trên ảnh (như bảng biểu, điều kiện loại trừ, giá cả, thời gian).
2. Giải thích chi tiết từng câu hỏi:
   - Tại sao phương án đúng lại là đáp án đúng? Chỉ ra và dịch nghĩa đoạn/câu/phần trong ảnh chứa từ khóa (keywords) giúp chọn đáp án đó.
   - Nếu học sinh chọn SAI câu hỏi nào, hãy phân tích cụ thể tại sao lựa chọn của họ lại sai, điểm gây nhiễu nằm ở đâu. Nếu họ chọn ĐÚNG, hãy khen ngợi và củng cố lập luận.
3. Tách vế và dịch nghĩa (Clause splitting & Dissection) 1-2 câu văn dài hoặc phức tạp nhất trong bài để giúp học sinh hiểu cấu trúc ngữ pháp.
4. Liệt kê 3-5 từ vựng hoặc cấu trúc ngữ pháp N3 quan trọng/hay xuất hiện trong bài đọc kèm định nghĩa và giải thích ngắn gọn.

Phản hồi hoàn toàn bằng Tiếng Việt, sử dụng định dạng Markdown thân thiện (sử dụng chữ đậm **, gạch đầu dòng, bảng biểu hoặc code tick \` nếu cần) để trình bày rõ ràng, trực quan, chuyên nghiệp. Không dùng các ký hiệu HTML thô. Tránh câu cú quá rườm rà.`;

    const firstTurnParts = [{ text: systemPrompt }];
    loadedImages.forEach(img => {
      firstTurnParts.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.base64
        }
      });
    });

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: firstTurnParts
            }
          ]
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'Có lỗi xảy ra khi kết nối tới Gemini API.');
      }

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Không nhận được câu trả lời từ AI.';
      
      setChatHistory([
        { role: 'user', text: 'Khởi tạo giải thích bài đọc' },
        { role: 'model', text: aiResponse }
      ]);
    } catch (err) {
      setAiError(err.message || 'Lỗi kết nối API. Vui lòng kiểm tra lại API Key hoặc kết nối mạng.');
    } finally {
      setAiLoading(false);
    }
  };

  // Handle send message
  const handleSendChatMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || aiLoading) return;
    if (!apiKey) {
      setAiError('Vui lòng nhập API Key để sử dụng.');
      return;
    }

    const userText = chatInput.trim();
    setChatInput('');
    setAiError('');

    const updatedHistory = [...chatHistory, { role: 'user', text: userText }];
    setChatHistory(updatedHistory);
    setAiLoading(true);

    const contents = updatedHistory.map((msg, idx) => {
      const partList = [{ text: msg.text }];
      if (idx === 0 && lessonImagesBase64.length > 0) {
        lessonImagesBase64.forEach(img => {
          partList.push({
            inlineData: {
              mimeType: img.mimeType,
              data: img.base64
            }
          });
        });
      }
      return {
        role: msg.role === 'user' ? 'user' : 'model',
        parts: partList
      };
    });

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contents })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'Có lỗi xảy ra khi gửi tin nhắn.');
      }

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Không nhận được câu trả lời từ AI.';
      
      setChatHistory(prev => [...prev, { role: 'model', text: aiResponse }]);
    } catch (err) {
      console.error(err);
      setAiError(err.message || 'Lỗi gửi tin nhắn.');
    } finally {
      setAiLoading(false);
    }
  };

  // Trigger quick actions
  const triggerQuickAction = async (actionText) => {
    if (aiLoading) return;
    setAiError('');
    
    const updatedHistory = [...chatHistory, { role: 'user', text: actionText }];
    setChatHistory(updatedHistory);
    setAiLoading(true);

    const contents = updatedHistory.map((msg, idx) => {
      const partList = [{ text: msg.text }];
      if (idx === 0 && lessonImagesBase64.length > 0) {
        lessonImagesBase64.forEach(img => {
          partList.push({
            inlineData: {
              mimeType: img.mimeType,
              data: img.base64
            }
          });
        });
      }
      return {
        role: msg.role === 'user' ? 'user' : 'model',
        parts: partList
      };
    });

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contents })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'Có lỗi xảy ra.');
      }

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Không nhận được câu trả lời từ AI.';
      
      setChatHistory(prev => [...prev, { role: 'model', text: aiResponse }]);
    } catch (err) {
      console.error(err);
      setAiError(err.message || 'Lỗi gửi tin nhắn.');
    } finally {
      setAiLoading(false);
    }
  };


  // Group lessons by parts
  const groupedLessons = useMemo(() => {
    const groups = {};
    lessons.forEach((lesson) => {
      const part = lesson.part || 'Khác';
      if (!groups[part]) {
        groups[part] = [];
      }
      groups[part].push(lesson);
    });
    return groups;
  }, [lessons]);

  // Filtered lessons for search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedLessons;
    const query = searchQuery.toLowerCase();
    
    const filtered = {};
    Object.keys(groupedLessons).forEach((part) => {
      const list = groupedLessons[part].filter((lesson) => 
        lesson.title.toLowerCase().includes(query) || 
        lesson.part.toLowerCase().includes(query)
      );
      if (list.length > 0) {
        filtered[part] = list;
      }
    });
    return filtered;
  }, [groupedLessons, searchQuery]);

  // Handle click on a lesson
  const handleSelectLesson = async (lessonSummary) => {
    setLockOverlayLesson(null);

    if (lessonSummary.isLocked) {
      setLockOverlayLesson(lessonSummary);
      setActiveTab('locked');
      return;
    }

    setLessonDetailLoading(true);
    setActiveTab('lesson');
    try {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE_URL}/reading/${lessonSummary.id}`, { headers });
      if (res.ok) {
        const fullLesson = await res.json();
        setSelectedLesson(fullLesson);
        setUserAnswers({});
        setSubmitted(false);
        setActiveSentence(null);
        setChatHistory([]);
        setChatInput('');
        setAiActiveTab('shinkanzen');
        setAiError('');
        setLessonImagesBase64([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert('Không thể tải chi tiết bài đọc.');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối máy chủ.');
    } finally {
      setLessonDetailLoading(false);
    }
  };

  // Handle quiz radio choice
  const handleSelectAnswer = (qId, optionIdx) => {
    if (submitted) return;
    setUserAnswers(prev => ({
      ...prev,
      [qId]: optionIdx
    }));
  };

  // Handle submit quiz
  const handleSubmitQuiz = () => {
    if (submitted) return;
    
    // Check if all questions are answered
    const questionsCount = selectedLesson?.questions?.length || 0;
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount < questionsCount) {
      alert('Vui lòng trả lời đầy đủ các câu hỏi trước khi nộp bài!');
      return;
    }
    setSubmitted(true);
    
    // Save/sync progress to server
    if (!readingMastered.includes(selectedLesson.id)) {
      toggleReadingMastered(selectedLesson.id);
    }
  };

  // Process passage to make sentences interactive
  const annotatedPassage = useMemo(() => {
    if (!selectedLesson) return '';
    let htmlText = selectedLesson.passage;
    if (!htmlText) return '';

    const translations = selectedLesson.sentenceTranslations || [];
    
    // Sort translations by jp length descending to prevent sub-sentence replacement bugs
    const passageSents = translations
      .map((sent, idx) => ({ ...sent, originalIdx: idx }))
      .filter((sent) => sent.jp && htmlText.includes(sent.jp))
      .sort((a, b) => b.jp.length - a.jp.length);

    // Replace sents with placeholders
    passageSents.forEach((sent) => {
      const placeholder = `__SENT_PLACEHOLDER_${sent.originalIdx}__`;
      htmlText = htmlText.replaceAll(sent.jp, placeholder);
    });

    // Replace placeholders with interactive span tags
    passageSents.forEach((sent) => {
      const placeholder = `__SENT_PLACEHOLDER_${sent.originalIdx}__`;
      const spanTag = `<span class="interactive-sentence" data-idx="${sent.originalIdx}"><sup class="sent-num font-sans">[${sent.originalIdx + 1}]</sup>${sent.jp}</span>`;
      htmlText = htmlText.replaceAll(placeholder, spanTag);
    });

    return htmlText;
  }, [selectedLesson]);

  // Handle sentence clicks inside passage via event delegation
  const handlePassageClick = (e) => {
    const target = e.target.closest('.interactive-sentence');
    if (target) {
      const idx = parseInt(target.getAttribute('data-idx'));
      const sent = selectedLesson.sentenceTranslations[idx];
      if (sent) {
        setActiveSentence({
          jp: sent.jp,
          vi: sent.vi,
          index: idx
        });
      }
    }
  };

  return (
    <div className="reading-page-container">
      {/* Tab Header */}
      <div className="reading-header">
        <div className="title-area">
          <h1 className="main-title">📖 Đọc hiểu Shinkanzen N3</h1>
          <p className="subtitle">
            Luyện phương pháp đọc hiểu thông minh của giáo trình Shinkanzen Master Dokkai N3
          </p>
        </div>
        <div className="tab-menu">
          <button 
            className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => { setActiveTab('list'); setSelectedLesson(null); }}
          >
            Danh sách bài học
          </button>
          <button 
            className={`tab-btn ${activeTab === 'guide' ? 'active' : ''}`}
            onClick={() => { setActiveTab('guide'); setSelectedLesson(null); }}
          >
            Bí kíp đọc hiểu (Smart Guide)
          </button>
          {selectedLesson && (
            <button 
              className={`tab-btn ${activeTab === 'lesson' ? 'active' : ''}`}
              onClick={() => setActiveTab('lesson')}
            >
              Bài đang đọc: {selectedLesson.id}
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: LIST VIEW */}
      {activeTab === 'list' && (
        <div className="tab-content fade-in">
          {/* Search bar and Progress stats */}
          <div className="search-stats-container">
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Tìm tiêu đề bài học, chủ đề..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="progress-summary-card">
              <Sparkles size={18} className="text-amber-500 animate-pulse" />
              <span>
                Đã thuộc: <strong>{readingMastered?.length || 0}/72</strong> bài đọc ({Math.round(((readingMastered?.length || 0) / 72) * 100)}%)
              </span>
            </div>
          </div>

          {/* Grouped Lists */}
          <div className="grouped-lessons-container">
            {lessonsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                <Loader2 className="animate-spin" size={36} style={{ color: 'var(--primary)', marginBottom: '12px' }} />
                <p>Đang tải danh sách bài học...</p>
              </div>
            ) : Object.keys(filteredGroups).length === 0 ? (
              <div className="empty-state">
                <AlertCircle size={36} />
                <p>Không tìm thấy bài đọc nào phù hợp với từ khóa.</p>
              </div>
            ) : (
              Object.keys(filteredGroups).map((partName) => (
                <div key={partName} className="part-card">
                  <div className="part-title-bar">
                    <h2>{partName}</h2>
                    <span className="count-badge">{filteredGroups[partName].length} bài</span>
                  </div>
                  <div className="lessons-grid">
                    {filteredGroups[partName].map((lesson) => {
                      const isMastered = readingMastered?.includes(lesson.id);
                      const isLocked = lesson.isLocked;
                      return (
                        <div 
                          key={lesson.id} 
                          className={`lesson-item-card ${isMastered ? 'mastered' : ''} ${isLocked ? 'locked-card' : ''}`}
                          onClick={() => handleSelectLesson(lesson)}
                        >
                          <div className="card-top">
                            <span className="lesson-badge">Bài {lesson.id}</span>
                            {isLocked ? (
                              <span className="lock-badge">🔒 VIP</span>
                            ) : (
                              isMastered && <CheckCircle className="check-icon" size={16} />
                            )}
                          </div>
                          <h3 className="lesson-card-title">{lesson.title}</h3>
                          <div className="card-bottom">
                            <span className="question-count">
                              {isLocked ? '🔒 Nội dung VIP' : `❓ ${lesson.questions?.length || 0} câu hỏi`}
                            </span>
                            <span className="study-action">
                              {isLocked ? 'Kích hoạt' : 'Học ngay'} <ChevronRight size={14} />
                            </span>
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
            <h2>Nội Dung Đọc Hiểu VIP</h2>
            <p className="lock-description">
              Bài đọc <strong>Bài {lockOverlayLesson.title}</strong> thuộc kho đề VIP nâng cao.
              Vui lòng nâng cấp tài khoản của bạn lên VIP để mở khóa toàn bộ 72 bài đọc hiểu Dokkai kèm bản dịch, giải thích ngữ pháp và hỗ trợ trợ lý AI Gemini thông minh.
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
          <p>Đang tải chi tiết bài đọc Shinkanzen...</p>
        </div>
      )}

      {/* TAB 2: SMART GUIDE */}
      {activeTab === 'guide' && (
        <div className="tab-content fade-in">
          <div className="guide-container">
            <div className="guide-intro">
              <Sparkles className="guide-sparkle" size={28} />
              <h2>Phương pháp Đọc hiểu Tiếng Nhật N3 Thông minh</h2>
              <p>
                Đọc hiểu không phải là dịch từng từ sang tiếng Việt, mà là nắm bắt **cấu trúc câu văn dài**, 
                nhận diện **từ khóa chỉ ý chí người viết**, và **định vị thông tin** cần thiết một cách nhanh gọn.
              </p>
            </div>

            <div className="guide-grid">
              {/* Card 1: Clause Splitting */}
              <div className="guide-card">
                <div className="card-header">
                  <div className="icon-wrap bg-blue-glow">1</div>
                  <h3>Tách vế câu văn dài (Clause Dissection)</h3>
                </div>
                <div className="card-body">
                  <p className="guide-desc">
                    Câu văn tiếng Nhật N3 có thể dài tới 3-4 dòng làm người đọc rối trí. Quy tắc tách vế thông minh:
                  </p>
                  <ul className="guide-list">
                    <li><strong>Tìm Chủ ngữ chính:</strong> Xem trước các trợ từ <code>は</code> (Wa), <code>が</code> (Ga), <code>も</code> (Mo).</li>
                    <li><strong>Ngắt ở Liên từ/Trợ từ liên kết:</strong> Cắt nhỏ câu ở những chữ như <code>から</code> (vì), <code>ので</code> (vì), <code>て</code> (và/rồi), <code>が</code> (nhưng), <code>ながら</code> (vừa... vừa).</li>
                    <li><strong>Đọc từ cuối lên:</strong> Đọc vị ngữ cuối câu trước, rồi dịch ngược lên các bổ ngữ phía trước để tránh bị đảo lộn nghĩa.</li>
                  </ul>
                  <div className="example-box">
                    <span className="badge">Ví dụ tách vế:</span>
                    <p className="ja-text font-serif">
                      <span className="text-indigo-400 font-bold">【私は】</span>
                      日本語の勉強が忙しい<span className="text-emerald-400 font-bold">【ので、】</span>
                      友達と遊ぶ時間を<span className="text-amber-400 font-bold">【減らしている。】</span>
                    </p>
                    <p className="vi-text">
                      ➔ <strong>Vế 1 (Chủ ngữ + Lý do):</strong> Tôi vì bận học tiếng Nhật, <br/>
                      ➔ <strong>Vế 2 (Hành động chính):</strong> nên đang giảm bớt thời gian đi chơi với bạn bè.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Signal Words */}
              <div className="guide-card">
                <div className="card-header">
                  <div className="icon-wrap bg-purple-glow">2</div>
                  <h3>Nhận diện Từ nối & Liên từ chuyển ý</h3>
                </div>
                <div className="card-body">
                  <p className="guide-desc">
                    Các liên từ chính là ngọn hải đăng chỉ đường giúp bạn biết câu tiếp theo mang ý nghĩa thuận hay phản:
                  </p>
                  <table className="guide-table">
                    <thead>
                      <tr>
                        <th>Liên từ</th>
                        <th>Ý nghĩa</th>
                        <th>Mẹo làm bài</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>しかし / だが</code></td>
                        <td>Nhưng / Tuy nhiên</td>
                        <td><strong>Ý chính của tác giả</strong> thường nằm ở câu ngay sau liên từ trái ngược này!</td>
                      </tr>
                      <tr>
                        <td><code>つまり / なぜなら</code></td>
                        <td>Tóm lại / Bởi vì</td>
                        <td>Nêu định nghĩa, tóm tắt hoặc giải thích nguyên nhân cho luận điểm trước đó.</td>
                      </tr>
                      <tr>
                        <td><code>たとえば</code></td>
                        <td>Ví dụ như</td>
                        <td>Phần ví dụ chỉ để làm rõ ý, có thể đọc lướt nhanh để tiết kiệm thời gian.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Card 3: Opinion Patterns */}
              <div className="guide-card">
                <div className="card-header">
                  <div className="icon-wrap bg-amber-glow">3</div>
                  <h3>Định vị ý chí người viết (Author's Viewpoint)</h3>
                </div>
                <div className="card-body">
                  <p className="guide-desc">
                    Câu hỏi JLPT N3 rất hay hỏi: *"Ý tác giả muốn nói nhất trong bài là gì?"*. Hãy truy tìm các đuôi câu thể hiện quan điểm cá nhân:
                  </p>
                  <ul className="guide-list">
                    <li><code>～と思う / ～と考えている</code> (Tôi nghĩ là / Đang suy nghĩ là...)</li>
                    <li><code>～ではないだろうか / ～ではないか</code> (Chẳng phải là... hay sao?)</li>
                    <li><code>～が必要だ / ～べきだ</code> (Cần phải... / Nên...)</li>
                    <li><code>～に違いない</code> (Chắc chắn là...)</li>
                  </ul>
                  <div className="tip-alert">
                    <Info size={16} className="text-indigo-400 shrink-0" />
                    <span>Ý kiến cốt lõi của tác giả thường nằm ở **đoạn cuối cùng** hoặc câu kết luận của văn bản.</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Info Search */}
              <div className="guide-card">
                <div className="card-header">
                  <div className="icon-wrap bg-emerald-glow">4</div>
                  <h3>Chiến thuật Luyện tìm kiếm thông tin (Part 3/4)</h3>
                </div>
                <div className="card-body">
                  <p className="guide-desc">
                    Đối với các bài đọc thông báo, quảng cáo, tờ rơi (Dạng bài Tìm kiếm thông tin):
                  </p>
                  <ul className="guide-list">
                    <li><strong>Đọc câu hỏi trước:</strong> Xem câu hỏi yêu cầu tìm thông tin về đối tượng nào, điều kiện gì (ví dụ: học sinh, ngày thường, giá rẻ...).</li>
                    <li><strong>Đọc kỹ các ký hiệu đặc biệt:</strong> Chú ý các dấu hoa thị <code>※</code>, chữ nhỏ ở góc dưới bảng biểu vì đó thường là các điều kiện loại trừ, nơi chứa bẫy của đáp án.</li>
                    <li><strong>Phương pháp loại trừ:</strong> Đối chiếu từng đáp án lựa chọn với bảng dữ liệu, gạch đi các lựa chọn sai điều kiện ràng buộc.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LESSON VIEW (INTERACTIVE READER) */}
      {activeTab === 'lesson' && selectedLesson && (
        <div className="tab-content fade-in">
          {/* Back Action Bar */}
          <div className="back-bar">
            <button className="back-btn" onClick={() => { setActiveTab('list'); setSelectedLesson(null); }}>
              <ArrowLeft size={16} /> Quay lại danh sách
            </button>
            <div className="lesson-nav-meta">
              <span className="part-tag">{selectedLesson.part}</span>
              <h2 className="current-lesson-title">{selectedLesson.title}</h2>
            </div>
            <button 
              className={`master-toggle-btn ${readingMastered?.includes(selectedLesson.id) ? 'active' : ''}`}
              onClick={() => toggleReadingMastered(selectedLesson.id)}
            >
              <CheckCircle size={16} /> 
              {readingMastered?.includes(selectedLesson.id) ? 'Đã thuộc bài này' : 'Đánh dấu đã học'}
            </button>
          </div>

          {/* Reader Area */}
          <div className="reader-layout-grid">
            
            {/* LEFT COLUMN: INTERACTIVE PASSAGE */}
            <div className="passage-panel">
              <div className="panel-header">
                <span className="panel-title">📖 Văn bản bài đọc</span>
                <div className="control-buttons">
                  <button 
                    className={`control-btn ${showFurigana ? 'active' : ''}`}
                    onClick={() => setShowFurigana(!showFurigana)}
                    title={showFurigana ? "Ẩn Furigana" : "Hiện Furigana"}
                  >
                    Furigana: {showFurigana ? "Bật" : "Tắt"}
                  </button>
                </div>
              </div>

              {/* Smart Tip Alert */}
              <div className="smart-tip-banner">
                <Sparkles size={16} className="text-amber-400 animate-bounce" />
                <span><strong>Mẹo học:</strong> Di chuột (hoặc click) vào từng câu văn tiếng Nhật dưới đây để xem dịch nghĩa tiếng Việt tương ứng ngay lập tức!</span>
              </div>

              {/* The Passage Body */}
              <div 
                className={`passage-card ${showFurigana ? '' : 'hide-furigana'}`}
                onClick={handlePassageClick}
              >
                {annotatedPassage ? (
                  <div 
                    className="japanese-text-container font-serif"
                    dangerouslySetInnerHTML={{ __html: annotatedPassage }}
                  />
                ) : (
                  <div className="no-passage-placeholder">
                    <AlertCircle size={32} />
                    <p>Bài đọc này sử hình ảnh minh họa hoặc biểu đồ trực quan từ VNJP Club.</p>
                    <p>Vui lòng xem các câu hỏi hoặc xem ảnh gốc bên dưới nếu có.</p>
                  </div>
                )}
              </div>

              {/* Interactive Translation Panel */}
              <div className={`sentence-translation-box ${activeSentence ? 'active' : ''}`}>
                {activeSentence ? (
                  <div className="translation-content">
                    <div className="box-header">
                      <span className="sent-badge">Dịch nghĩa câu [{activeSentence.index + 1}]:</span>
                      <button className="close-box-btn" onClick={() => setActiveSentence(null)}>×</button>
                    </div>
                    <p className="jp-sent font-serif" dangerouslySetInnerHTML={{ __html: activeSentence.jp }} />
                    <p className="vi-sent">{activeSentence.vi}</p>
                  </div>
                ) : (
                  <p className="placeholder-text">Chọn một câu bất kỳ trong bài đọc để hiện dịch song ngữ tại đây.</p>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: QUIZ & EXPLANATION */}
            <div className="quiz-panel">
              <div className="panel-header">
                <span className="panel-title">✏️ Trắc nghiệm chọn đáp án</span>
                {submitted && (
                  <span className="score-badge">
                    Đã nộp bài
                  </span>
                )}
              </div>

              <div className="questions-container">
                {selectedLesson.questions && selectedLesson.questions.length > 0 ? (
                  selectedLesson.questions.map((q, qIdx) => {
                    const isCorrect = userAnswers[q.id] === q.correctAnswerIdx;
                    return (
                      <div key={q.id} className={`question-block-card ${submitted ? (isCorrect ? 'correct-border' : 'incorrect-border') : ''}`}>
                        <div className="q-title flex flex-col gap-1">
                          <div className="flex gap-2">
                            <HelpCircle size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                            <span 
                              className="font-serif text-lg leading-relaxed text-[var(--text-primary)]"
                              dangerouslySetInnerHTML={{ __html: q.questionJp }} 
                            />
                          </div>
                          {submitted && getTranslation(q.questionJp, selectedLesson.sentenceTranslations) && (
                            <div className="question-translation text-sm text-[var(--primary-light)] font-sans ml-7">
                              ➔ {getTranslation(q.questionJp, selectedLesson.sentenceTranslations)}
                            </div>
                          )}
                        </div>

                        {/* Choices */}
                        <div className="choices-list">
                          {q.choices.map((choice, choiceIdx) => {
                            const isSelected = userAnswers[q.id] === choiceIdx;
                            const isCorrectChoice = q.correctAnswerIdx === choiceIdx;
                            const choiceTrans = getTranslation(choice, selectedLesson.sentenceTranslations);
                            
                            let choiceClass = "choice-item";
                            if (submitted) {
                              if (isCorrectChoice) {
                                choiceClass += " correct";
                              } else if (isSelected && !isCorrectChoice) {
                                choiceClass += " incorrect";
                              } else {
                                choiceClass += " disabled";
                              }
                            } else if (isSelected) {
                              choiceClass += " selected";
                            }

                            return (
                              <label key={choiceIdx} className={choiceClass}>
                                <input 
                                  type="radio" 
                                  name={`question_${q.id}`}
                                  checked={isSelected}
                                  disabled={submitted}
                                  onChange={() => handleSelectAnswer(q.id, choiceIdx)}
                                />
                                <span className="choice-number">{choiceIdx + 1}</span>
                                <div className="flex flex-col gap-1 flex-1">
                                  <span 
                                    className="choice-text font-serif text-[var(--text-primary)]"
                                    dangerouslySetInnerHTML={{ __html: choice }}
                                  />
                                  {submitted && choiceTrans && (
                                    <span className="choice-translation text-xs text-[var(--text-secondary)] font-sans italic">
                                      ➔ {choiceTrans}
                                    </span>
                                  )}
                                </div>
                                {submitted && isCorrectChoice && <Check size={16} className="text-emerald-500 shrink-0 ml-auto self-start mt-1" />}
                                {submitted && isSelected && !isCorrectChoice && <X size={16} className="text-rose-500 shrink-0 ml-auto self-start mt-1" />}
                              </label>
                            );
                          })}
                        </div>

                        {/* Score Feedback */}
                        {submitted && (
                          <div className={`feedback-alert ${isCorrect ? 'correct' : 'incorrect'}`}>
                            {isCorrect ? (
                              <>
                                <CheckCircle size={16} />
                                <span>Chính xác! Bạn đã chọn đáp án đúng ({q.correctAnswerIdx + 1}).</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle size={16} />
                                <span>Chưa chính xác! Đáp án đúng là <strong>{q.correctAnswerIdx + 1}</strong>. Bạn đã chọn {userAnswers[q.id] !== undefined ? userAnswers[q.id] + 1 : 'chưa chọn'}.</span>
                              </>
                            )}
                          </div>
                        )}

                        </div>
                    );
                  })
                ) : (
                  <div className="no-questions">
                    <p>Bài học này không có câu hỏi trắc nghiệm riêng biệt.</p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              {!submitted && selectedLesson.questions?.length > 0 && (
                <button className="submit-btn" onClick={handleSubmitQuiz}>
                  Nộp bài & Kiểm tra đáp án
                </button>
              )}

              {submitted && (
                <div className="explanation-section fade-in">
                  <div className="explanation-header-tabs">
                    <button 
                      className={`exp-tab-btn ${aiActiveTab === 'shinkanzen' ? 'active' : ''}`}
                      onClick={() => setAiActiveTab('shinkanzen')}
                    >
                      <BookOpen size={16} />
                      Dịch &amp; Giải thích gốc
                    </button>
                    <button 
                      className={`exp-tab-btn ${aiActiveTab === 'ai' ? 'active' : ''}`}
                      onClick={() => setAiActiveTab('ai')}
                    >
                      <Sparkles size={16} className="text-amber-400" />
                      Trợ lý AI thông minh (Gemini)
                    </button>
                    
                    <button 
                      className="api-config-btn-inline ml-auto"
                      onClick={() => setShowApiKeyConfig(!showApiKeyConfig)}
                      title="Cấu hình Gemini API Key"
                    >
                      <Sparkles size={14} className="mr-1" />
                      {apiKey ? 'Đã có API Key' : 'Chưa có API Key'}
                    </button>
                  </div>

                  {showApiKeyConfig && (
                    <div className="api-config-card-overlay">
                      <div className="api-config-card">
                        <h4>Cấu hình Gemini API Key</h4>
                        <p className="text-xs text-[var(--text-secondary)] mb-3">
                          API Key được lưu trực tiếp trên trình duyệt của bạn (localStorage) và chỉ gửi trực tiếp tới máy chủ Google API.
                        </p>
                        <div className="flex gap-2">
                          <input 
                            type="password" 
                            placeholder="Nhập Gemini API Key của bạn..."
                            value={inputApiKey}
                            onChange={(e) => setInputApiKey(e.target.value)}
                            className="api-key-input-field"
                          />
                          <button 
                            className="save-key-btn"
                            onClick={() => handleSaveApiKey(inputApiKey)}
                          >
                            Lưu Key
                          </button>
                          {apiKey && (
                            <button 
                              className="clear-key-btn"
                              onClick={handleClearApiKey}
                            >
                              Xóa Key
                            </button>
                          )}
                        </div>
                        <p className="text-xs mt-2">
                          Lấy API Key miễn phí tại: <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline font-semibold">Google AI Studio</a>
                        </p>
                        <button className="close-config-btn" onClick={() => setShowApiKeyConfig(false)}>Đóng bảng</button>
                      </div>
                    </div>
                  )}

                  <div className="explanation-body">
                    {aiActiveTab === 'shinkanzen' ? (
                      selectedLesson.explanation ? (
                        <div 
                          className="raw-explanation-html font-serif"
                          dangerouslySetInnerHTML={{ __html: selectedLesson.explanation }}
                        />
                      ) : (
                        <p className="no-explanation">Không có giải thích chi tiết cho bài đọc này.</p>
                      )
                    ) : (
                      // AI TAB
                      <div className="ai-chatbot-container">
                        {!apiKey ? (
                          <div className="api-key-setup-prompt-card">
                            <AlertCircle size={28} className="text-amber-400 mb-2" />
                            <h5>Chưa cấu hình Gemini API Key</h5>
                            <p className="text-sm text-[var(--text-secondary)] max-w-md text-center mb-4">
                              Để sử dụng Trợ lý giải thích thông minh, bạn cần có Gemini API Key.
                              Khóa này hoàn toàn miễn phí và được lưu an toàn tại localStorage trình duyệt của bạn.
                            </p>
                            <div className="flex flex-col gap-2 w-full max-w-sm">
                              <input 
                                type="password" 
                                placeholder="Nhập Gemini API Key..."
                                value={inputApiKey}
                                onChange={(e) => setInputApiKey(e.target.value)}
                                className="api-key-input-field"
                              />
                              <div className="flex gap-2">
                                <button 
                                  className="save-key-btn flex-1"
                                  onClick={() => handleSaveApiKey(inputApiKey)}
                                >
                                  Lưu và kích hoạt
                                </button>
                                <a 
                                  href="https://aistudio.google.com/" 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="get-key-link-btn"
                                >
                                  Lấy Key miễn phí
                                </a>
                              </div>
                            </div>
                          </div>
                        ) : chatHistory.length === 0 ? (
                          <div className="ai-initiation-prompt-card">
                            <Sparkles size={36} className="text-amber-500 mb-3 animate-pulse" />
                            <h5>Học hiểu Đỉnh cao cùng Trợ lý AI</h5>
                            <p className="text-sm text-[var(--text-secondary)] max-w-md text-center mb-4">
                              AI sẽ phân tích cụ thể kết quả làm bài của bạn, giải thích lý do đáp án đúng/sai, tách vế ngữ pháp câu khó và hỗ trợ bạn hỏi đáp chi tiết.
                            </p>
                            <button 
                              className="init-ai-btn"
                              onClick={triggerAiExplanation}
                              disabled={aiLoading}
                            >
                              {aiLoading ? (
                                <>
                                  <div className="loader-dots-spinner mr-2"></div>
                                  Đang phân tích bài đọc...
                                </>
                              ) : (
                                <>
                                  <Sparkles size={16} className="mr-1" />
                                  Bắt đầu Phân tích bằng AI
                                </>
                              )}
                            </button>
                            {aiError && <p className="text-rose-500 text-xs mt-2">{aiError}</p>}
                          </div>
                        ) : (
                          // CHAT AREA
                          <div className="chat-interface-wrapper">
                            <div className="chat-messages-viewport">
                              {chatHistory.filter(msg => msg.text !== 'Khởi tạo giải thích bài đọc').map((msg, mIdx) => (
                                <div key={mIdx} className={`chat-bubble-row ${msg.role}`}>
                                  <div className="avatar-icon">
                                    {msg.role === 'user' ? '🙋' : '🤖'}
                                  </div>
                                  <div className="chat-bubble-content">
                                    <div className="bubble-sender-name">
                                      {msg.role === 'user' ? 'Học sinh' : 'Trợ lý AI Gemini'}
                                    </div>
                                    <div 
                                      className="bubble-text"
                                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                                    />
                                  </div>
                                </div>
                              ))}
                              
                              {aiLoading && (
                                <div className="chat-bubble-row model">
                                  <div className="avatar-icon">🤖</div>
                                  <div className="chat-bubble-content">
                                    <div className="bubble-sender-name">Trợ lý AI đang gõ...</div>
                                    <div className="typing-loader-spinner">
                                      <span></span>
                                      <span></span>
                                      <span></span>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {aiError && (
                                <div className="ai-error-banner">
                                  <AlertCircle size={16} />
                                  <span>{aiError}</span>
                                </div>
                              )}
                            </div>

                            {/* Quick Action Suggestions */}
                            <div className="chat-quick-actions">
                              <button 
                                className="quick-action-tag-btn" 
                                onClick={() => triggerQuickAction('Hãy giải thích lý do tại sao đáp án đúng lại chính xác và phân tích cụ thể tại sao các đáp án còn lại chưa đúng.')}
                                disabled={aiLoading}
                              >
                                🔍 Giải thích đáp án
                              </button>
                              <button 
                                className="quick-action-tag-btn" 
                                onClick={() => triggerQuickAction('Hãy trích ra 1-2 câu phức tạp nhất trong bài đọc, sau đó tách vế ngữ pháp và giải nghĩa chi tiết từng vế giúp tôi.')}
                                disabled={aiLoading}
                              >
                                📑 Tách vế câu khó
                              </button>
                              <button 
                                className="quick-action-tag-btn" 
                                onClick={() => triggerQuickAction('Hãy liệt kê các từ vựng N3 nổi bật xuất hiện trong bài đọc cùng ý nghĩa tiếng Việt và ví dụ minh họa.')}
                                disabled={aiLoading}
                              >
                                📝 Học từ vựng N3
                              </button>
                            </div>

                            {/* Chat Form Input */}
                            <form className="chat-input-bar-form" onSubmit={handleSendChatMessage}>
                              <input 
                                type="text" 
                                placeholder="Hỏi AI thêm về từ vựng, ngữ pháp hoặc câu cú trong bài..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                disabled={aiLoading}
                                className="chat-text-input-field"
                              />
                              <button 
                                type="submit" 
                                className="chat-send-submit-btn"
                                disabled={aiLoading || !chatInput.trim()}
                              >
                                Gửi
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Embedded CSS for Interactive Reader & Styles */}
      <style jsx global>{`
        /* Page layout */
        .reading-page-container {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
          min-height: 100vh;
        }

        /* Header styling */
        .reading-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 20px;
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .reading-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
        }

        .title-area .main-title {
          font-size: 28px;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 6px;
        }

        .title-area .subtitle {
          color: var(--text-secondary);
          font-size: 14px;
        }

        /* Tabs menu */
        .tab-menu {
          display: flex;
          gap: 8px;
        }

        .tab-btn {
          padding: 10px 16px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          background: var(--card-bg);
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: var(--transition);
        }

        .tab-btn:hover {
          background: var(--card-bg-hover);
          color: var(--text-primary);
        }

        .tab-btn.active {
          background: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
        }

        /* Search & Progress bar area */
        .search-stats-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .search-stats-container {
            flex-direction: column;
            align-items: stretch;
          }
        }

        .search-box {
          position: relative;
          flex: 1;
          max-width: 480px;
        }

        .search-box input {
          width: 100%;
          padding: 12px 16px 12px 42px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          background: var(--card-bg);
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
          transition: var(--transition);
        }

        .search-box input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px var(--primary-glow);
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .progress-summary-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-size: 14px;
          color: var(--text-primary);
        }

        /* Grouped lessons container */
        .grouped-lessons-container {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .part-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 24px;
        }

        .part-title-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 12px;
          margin-bottom: 20px;
        }

        .part-title-bar h2 {
          font-size: 18px;
          font-weight: 700;
          color: var(--primary-light);
        }

        .count-badge {
          background: var(--border-color);
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 99px;
        }

        .lessons-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        /* Lesson card item */
        .lesson-item-card {
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 16px;
          cursor: pointer;
          transition: var(--transition);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 150px;
        }

        .lesson-item-card:hover {
          transform: translateY(-2px);
          border-color: var(--primary);
          box-shadow: var(--shadow-md);
          background: var(--card-bg-hover);
        }

        .lesson-item-card.mastered {
          background: rgba(16, 185, 129, 0.03);
          border-color: var(--success);
        }

        .lesson-item-card.mastered:hover {
          background: rgba(16, 185, 129, 0.08);
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .lesson-badge {
          background: var(--border-color);
          color: var(--text-primary);
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .check-icon {
          color: var(--success);
        }

        .lesson-card-title {
          font-size: 14px;
          font-weight: 600;
          line-height: 1.4;
          color: var(--text-primary);
          margin-bottom: 12px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: var(--text-muted);
        }

        .study-action {
          display: flex;
          align-items: center;
          gap: 2px;
          color: var(--primary-light);
          font-weight: 600;
        }

        /* Back action bar styling */
        .back-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          padding: 12px 20px;
          border-radius: var(--radius-lg);
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .back-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 8px 14px;
          border-radius: var(--radius-md);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
          white-space: nowrap;
        }

        .back-btn:hover {
          background: var(--card-bg-hover);
        }

        .lesson-nav-meta {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          flex: 1;
        }

        .part-tag {
          font-size: 11px;
          font-weight: 700;
          color: var(--primary-light);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }

        .current-lesson-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .master-toggle-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 8px 14px;
          border-radius: var(--radius-md);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
          white-space: nowrap;
        }

        .master-toggle-btn:hover {
          background: var(--card-bg-hover);
          color: var(--text-primary);
        }

        .master-toggle-btn.active {
          background: rgba(16, 185, 129, 0.1);
          border-color: var(--success);
          color: var(--success);
        }

        /* Split layout reader */
        .reader-layout-grid {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .passage-panel, .quiz-panel {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--card-bg-hover);
          border-bottom: 1px solid var(--border-color);
          padding: 14px 20px;
        }

        .panel-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .control-buttons {
          display: flex;
          gap: 8px;
        }

        .control-btn {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }

        .control-btn:hover {
          border-color: var(--primary);
          color: var(--text-primary);
        }

        .control-btn.active {
          background: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
        }

        /* Smart Tip Banner */
        .smart-tip-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--primary-glow);
          border-bottom: 1px solid var(--border-color);
          padding: 10px 20px;
          font-size: 13px;
          color: var(--text-primary);
        }

        /* Passage Card */
        .passage-card {
          padding: 24px;
          background: var(--card-bg);
        }

        .japanese-text-container img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 16px auto;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
        }

        .japanese-text-container {
          font-size: 18px;
          line-height: 2.5;
          letter-spacing: 0.5px;
          color: var(--text-primary);
        }

        .hide-furigana rt {
          display: none !important;
        }
        .hide-furigana rp {
          display: none !important;
        }

        /* Interactive sentence styles */
        .interactive-sentence {
          cursor: pointer;
          padding: 0 4px;
          border-radius: 4px;
          transition: background-color 0.2s ease;
          display: inline;
        }

        .interactive-sentence:hover {
          background-color: var(--primary-glow);
          text-decoration: underline;
          text-decoration-color: var(--primary-light);
          text-decoration-thickness: 1px;
        }

        .sent-num {
          font-size: 10px;
          color: var(--primary-light);
          margin-right: 4px;
          opacity: 0.65;
          user-select: none;
          vertical-align: super;
        }

        /* Sentence translation box */
        .sentence-translation-box {
          border-top: 1px solid var(--border-color);
          padding: 16px 20px;
          background: var(--card-bg-hover);
          min-height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition);
        }

        .sentence-translation-box.active {
          background: rgba(99, 102, 241, 0.03);
        }

        .sentence-translation-box .placeholder-text {
          color: var(--text-muted);
          font-size: 13px;
          font-style: italic;
          text-align: center;
        }

        .translation-content {
          width: 100%;
        }

        .translation-content .box-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .sent-badge {
          font-size: 11px;
          font-weight: 700;
          color: var(--primary-light);
          text-transform: uppercase;
        }

        .close-box-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 18px;
          cursor: pointer;
          line-height: 1;
        }

        .close-box-btn:hover {
          color: var(--text-primary);
        }

        .jp-sent {
          font-size: 16px;
          color: var(--text-primary);
          line-height: 1.8;
          margin-bottom: 4px;
        }

        .vi-sent {
          font-size: 14px;
          color: var(--primary-light);
          font-weight: 600;
          line-height: 1.5;
        }

        /* No passage placeholder */
        .no-passage-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 20px;
          color: var(--text-muted);
          gap: 12px;
        }

        /* Quiz panel styling */
        .questions-container {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .question-block-card {
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 20px;
          transition: var(--transition);
        }

        .question-block-card.correct-border {
          border-color: var(--success);
        }

        .question-block-card.incorrect-border {
          border-color: var(--danger);
        }

        .q-title {
          display: flex;
          gap: 8px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 16px;
        }

        .choices-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .choice-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 16px;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition);
        }

        .choice-item input[type="radio"] {
          accent-color: var(--primary);
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .choice-item:hover {
          background: var(--card-bg-hover);
          border-color: var(--primary);
        }

        .choice-item.selected {
          border-color: var(--primary);
          background: var(--primary-glow);
        }

        .choice-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--border-color);
          color: var(--text-primary);
          font-size: 12px;
          font-weight: 700;
        }

        .choice-item.selected .choice-number {
          background: var(--primary);
          color: #ffffff;
        }

        .choice-text {
          font-size: 15px;
          color: var(--text-primary);
          line-height: 1.6;
        }

        /* Choice statuses after submit */
        .choice-item.correct {
          background: rgba(16, 185, 129, 0.08);
          border-color: var(--success);
        }

        .choice-item.incorrect {
          background: rgba(239, 68, 68, 0.08);
          border-color: var(--danger);
        }

        .choice-item.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Feedback alerts */
        .feedback-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 600;
        }

        .feedback-alert.correct {
          background: rgba(16, 185, 129, 0.1);
          color: var(--success);
        }

        .feedback-alert.incorrect {
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger);
        }

        /* Submit Quiz Button */
        .submit-btn {
          display: block;
          width: calc(100% - 40px);
          margin: 0 auto 20px;
          padding: 14px;
          border: none;
          background: var(--primary-gradient);
          color: #ffffff;
          font-weight: 700;
          font-size: 15px;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: var(--transition);
          text-align: center;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.2);
        }

        .submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
        }

        /* Explanation Section styling */
        .explanation-section {
          border-top: 1px solid var(--border-color);
          background: var(--card-bg-hover);
        }

        .explanation-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color);
          background: var(--border-color);
        }

        .explanation-header h3 {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .explanation-body {
          padding: 20px;
        }

        /* Raw explanation HTML nested elements styling */
        .raw-explanation-html {
          font-size: 15px;
          line-height: 1.8;
          color: var(--text-secondary);
        }

        .raw-explanation-html b {
          color: var(--text-primary);
          font-weight: 700;
        }

        .raw-explanation-html p {
          margin-bottom: 12px;
        }

        .raw-explanation-html .tieude {
          font-size: 14px;
          font-weight: 700;
          color: var(--primary-light);
          margin-bottom: 8px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 4px;
        }

        /* Full translation list */
        .full-translation-area {
          margin-top: 24px;
          border-top: 1px dashed var(--border-color);
          padding-top: 20px;
        }

        .translation-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 14px;
        }

        .translation-table {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .translation-row {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 12px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 640px) {
          .translation-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }
        }

        .translation-row .jp-cell {
          font-size: 15px;
          line-height: 1.8;
          color: var(--text-primary);
        }

        .translation-row .vi-cell {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-secondary);
          border-left: 1px solid var(--border-color);
          padding-left: 16px;
        }

        @media (max-width: 640px) {
          .translation-row .vi-cell {
            border-left: none;
            border-top: 1px dashed var(--border-color);
            padding-left: 0;
            padding-top: 8px;
          }
        }

        /* Empty state and no questions */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px;
          color: var(--text-muted);
          gap: 16px;
          background: var(--card-bg);
          border-radius: var(--radius-lg);
          border: 1px dashed var(--border-color);
        }

        .no-questions {
          padding: 20px;
          text-align: center;
          color: var(--text-muted);
          font-style: italic;
        }

        /* Smart Guide specific styling */
        .guide-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .guide-intro {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .guide-intro h2 {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .guide-intro p {
          max-width: 800px;
          color: var(--text-secondary);
          font-size: 14px;
        }

        .guide-sparkle {
          color: var(--warning);
        }

        .guide-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        @media (max-width: 1024px) {
          .guide-grid {
            grid-template-columns: 1fr;
          }
        }

        .guide-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .guide-card .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
        }

        .bg-blue-glow { background: var(--primary); box-shadow: 0 0 10px var(--primary-glow); }
        .bg-purple-glow { background: #8b5cf6; box-shadow: 0 0 10px rgba(139, 92, 246, 0.2); }
        .bg-amber-glow { background: var(--warning); box-shadow: 0 0 10px rgba(245, 158, 11, 0.2); }
        .bg-emerald-glow { background: var(--success); box-shadow: 0 0 10px var(--success-glow); }

        .guide-card h3 {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .guide-card .card-body {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .guide-desc {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .guide-list {
          padding-left: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .guide-list li {
          font-size: 13.5px;
          color: var(--text-secondary);
        }

        .example-box {
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .example-box .badge {
          align-self: flex-start;
          background: var(--border-color);
          color: var(--text-primary);
          font-size: 11px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .example-box .ja-text {
          font-size: 16px;
          line-height: 1.8;
          color: var(--text-primary);
        }

        .example-box .vi-text {
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .guide-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          text-align: left;
        }

        .guide-table th, .guide-table td {
          padding: 10px;
          border-bottom: 1px solid var(--border-color);
          color: var(--text-secondary);
        }

        .guide-table th {
          font-weight: 700;
          background: var(--bg-color);
          color: var(--text-primary);
        }

        .tip-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--primary-glow);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          font-size: 12.5px;
          color: var(--text-primary);
        }

        /* Animation utilities */
        .fade-in {
          animation: fadeIn 0.35s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* General tags inside raw HTML */
        .tudich {
          margin-top: 10px;
          margin-bottom: 10px;
        }

        .candich {
          font-weight: 600;
          color: var(--text-primary);
        }

        .nddich, .kqdich {
          color: var(--primary-light);
          font-size: 14px;
          margin-top: 4px;
        }

        /* Yomumae and special structures from VNJP Club */
        .yomumae_kaito {
          font-weight: bold;
          color: var(--success);
        }

        /* AI Chatbot Styles */
        .explanation-header-tabs {
          display: flex;
          align-items: center;
          background: var(--border-color);
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
          color: var(--primary);
          border-bottom-color: var(--primary);
        }

        .api-config-btn-inline {
          display: flex;
          align-items: center;
          background: rgba(99, 102, 241, 0.1);
          color: var(--primary-light);
          border: 1px solid var(--primary-glow);
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }

        .api-config-btn-inline:hover {
          background: var(--primary-glow);
        }

        .api-config-card-overlay {
          padding: 16px 20px;
          border-bottom: 1px dashed var(--border-color);
          background: rgba(99, 102, 241, 0.02);
        }

        .api-config-card {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .api-config-card h4 {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .api-key-input-field {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid var(--border-color);
          background: var(--bg-color);
          color: var(--text-primary);
          border-radius: var(--radius-sm);
          font-size: 13px;
          outline: none;
        }

        .api-key-input-field:focus {
          border-color: var(--primary);
        }

        .save-key-btn {
          background: var(--primary);
          color: #ffffff;
          border: none;
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }

        .save-key-btn:hover {
          opacity: 0.9;
        }

        .clear-key-btn {
          background: transparent;
          color: var(--danger);
          border: 1px solid var(--danger);
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }

        .clear-key-btn:hover {
          background: rgba(239, 68, 68, 0.05);
        }

        .get-key-link-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-color);
          background: var(--card-bg);
          color: var(--text-primary);
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: var(--transition);
        }

        .get-key-link-btn:hover {
          background: var(--card-bg-hover);
        }

        .close-config-btn {
          align-self: flex-start;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 12px;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
        }

        .close-config-btn:hover {
          color: var(--text-primary);
        }

        /* AI Chatbot container */
        .ai-chatbot-container {
          display: flex;
          flex-direction: column;
          min-height: 300px;
        }

        .api-key-setup-prompt-card, .ai-initiation-prompt-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 20px;
          border-radius: var(--radius-md);
          background: var(--card-bg);
          border: 1px dashed var(--border-color);
          margin: 10px 0;
        }

        .api-key-setup-prompt-card h5, .ai-initiation-prompt-card h5 {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .init-ai-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--primary-gradient);
          color: #ffffff;
          border: none;
          padding: 12px 24px;
          border-radius: var(--radius-md);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 12px var(--primary-glow);
          transition: var(--transition);
        }

        .init-ai-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(99, 102, 241, 0.3);
        }

        .init-ai-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* Chat view wrapper */
        .chat-interface-wrapper {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .chat-messages-viewport {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 550px;
          overflow-y: auto;
          padding: 10px 4px;
          border-bottom: 1px solid var(--border-color);
        }

        .chat-bubble-row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          animation: fadeIn 0.25s ease-out;
        }

        .chat-bubble-row.user {
          flex-direction: row-reverse;
        }

        .chat-bubble-row .avatar-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: var(--shadow-sm);
        }

        .chat-bubble-row.user .avatar-icon {
          background: var(--primary);
        }

        .chat-bubble-content {
          max-width: 80%;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .chat-bubble-row.user .chat-bubble-content {
          align-items: flex-end;
        }

        .bubble-sender-name {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
        }

        .bubble-text {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          padding: 12px 16px;
          border-radius: var(--radius-md);
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-primary);
          box-shadow: var(--shadow-sm);
        }

        .chat-bubble-row.user .bubble-text {
          background: var(--primary);
          color: #ffffff;
          border-color: var(--primary);
        }

        .bubble-text strong {
          font-weight: 700;
          color: inherit;
        }
        
        .chat-bubble-row.model .bubble-text strong {
          color: var(--text-primary);
        }

        .bubble-text code {
          background: rgba(99, 102, 241, 0.1);
          color: var(--primary-light);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
        }

        .chat-bubble-row.user .bubble-text code {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        .markdown-list {
          padding-left: 20px;
          margin: 8px 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .markdown-list li {
          list-style-type: disc;
        }

        .bubble-text p {
          margin-bottom: 8px;
        }

        .bubble-text p:last-child {
          margin-bottom: 0;
        }

        /* Typing loader */
        .typing-loader-spinner {
          display: flex;
          gap: 4px;
          padding: 12px 18px;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          width: fit-content;
        }

        .typing-loader-spinner span {
          width: 8px;
          height: 8px;
          background: var(--text-muted);
          border-radius: 50%;
          display: inline-block;
          animation: bounce 1.4s infinite ease-in-out both;
        }

        .typing-loader-spinner span:nth-child(1) { animation-delay: -0.32s; }
        .typing-loader-spinner span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }

        /* Spinner for Analysis */
        .loader-dots-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #ffffff;
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Quick actions */
        .chat-quick-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 4px 0;
        }

        .quick-action-tag-btn {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 8px 12px;
          border-radius: 99px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }

        .quick-action-tag-btn:hover {
          border-color: var(--primary);
          color: var(--primary-light);
          background: var(--primary-glow);
        }

        .quick-action-tag-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Chat input form */
        .chat-input-bar-form {
          display: flex;
          gap: 10px;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          padding: 8px;
          border-radius: var(--radius-md);
        }

        .chat-text-input-field {
          flex: 1;
          border: none;
          background: transparent;
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
          padding: 8px 12px;
        }

        .chat-send-submit-btn {
          background: var(--primary);
          color: #ffffff;
          border: none;
          padding: 8px 18px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition);
        }

        .chat-send-submit-btn:hover {
          opacity: 0.9;
        }

        .chat-send-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ai-error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger);
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 600;
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
