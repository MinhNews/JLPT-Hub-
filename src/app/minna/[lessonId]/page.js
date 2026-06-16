'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useProgress } from '@/context/ProgressContext';
import { ChevronLeft, ChevronRight, Lock, CheckCircle, RotateCcw, Volume2 } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const TABS = [
  { id: 'vocab',       label: '📝 Từ vựng',    emoji: '📝' },
  { id: 'grammar',     label: '✏️ Ngữ pháp',   emoji: '✏️' },
  { id: 'reading',     label: '📖 Luyện đọc',  emoji: '📖' },
  { id: 'kaiwa',       label: '💬 Hội thoại',  emoji: '💬' },
  { id: 'listening',   label: '🎧 Luyện nghe', emoji: '🎧' },
  { id: 'exercise',    label: '📋 Bài tập',    emoji: '📋' },
  { id: 'kanji',       label: '🔠 Hán tự',     emoji: '🔠' },
  { id: 'kanjiRenshu', label: '✍️ Kanji Renshū', emoji: '✍️' },
  { id: 'readingComp', label: '📚 Đọc hiểu',   emoji: '📚' },
  { id: 'test',        label: '📝 Kiểm tra',   emoji: '📝' },
  { id: 'reference',   label: '📎 Tham khảo',  emoji: '📎' },
];

// ──── Flashcard Component ────────────────────────────────────────────────────
function Flashcard({ vocab }) {
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState('list'); // 'list' | 'flash'

  if (!vocab?.length) return <p style={{ color: 'var(--text-muted)' }}>Chưa có dữ liệu từ vựng.</p>;
  const card = vocab[cardIdx];

  if (mode === 'list') {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
          <button onClick={() => setMode('flash')} style={{
            padding: '8px 16px', background: 'var(--primary)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600
          }}>🃏 Chế độ Flashcard</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)' }}>
                {['Kana', 'Kanji', 'Âm Hán Việt', 'Nghĩa tiếng Việt'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700,
                    color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vocab.map((w, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '10px 14px', fontWeight: 700, fontSize: '16px', fontFamily: 'serif' }}>{w.kana}</td>
                  <td style={{ padding: '10px 14px', fontSize: '15px' }}>{w.kanji || '—'}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--primary-light)', fontWeight: 600, fontSize: '12px', letterSpacing: '0.05em' }}>
                    {w.hanViet || '—'}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{w.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Flashcard mode
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
        <button onClick={() => setMode('list')} style={{
          padding: '6px 12px', background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)',
          cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '12px'
        }}>← Danh sách</button>
        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{cardIdx + 1} / {vocab.length}</span>
        <button onClick={() => { setCardIdx(0); setFlipped(false); }} style={{
          padding: '6px 12px', background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)',
          cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '12px'
        }}><RotateCcw size={12} style={{ display: 'inline', marginRight: 4 }} />Làm lại</button>
      </div>

      {/* Card */}
      <div onClick={() => setFlipped(!flipped)} style={{
        perspective: '1000px', cursor: 'pointer', marginBottom: '20px',
        height: '220px', position: 'relative'
      }}>
        <div style={{
          width: '100%', height: '100%', position: 'relative',
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 0.5s ease',
        }}>
          {/* Front */}
          <div style={{
            position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
            background: 'var(--bg-secondary)', border: '2px solid var(--primary)',
            borderRadius: '16px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: '0 8px 32px rgba(99,102,241,0.15)'
          }}>
            <div style={{ fontSize: '42px', fontFamily: 'serif', fontWeight: 700, color: 'var(--text-primary)' }}>
              {card.kana}
            </div>
            {card.kanji && <div style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>{card.kanji}</div>}
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Nhấn để xem nghĩa ↕</p>
          </div>
          {/* Back */}
          <div style={{
            position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))',
            border: '2px solid var(--primary)', borderRadius: '16px',
            transform: 'rotateY(180deg)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: '0 8px 32px rgba(99,102,241,0.15)'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{card.meaning}</div>
            {card.hanViet && <div style={{ fontSize: '14px', color: 'var(--primary-light)', fontWeight: 600, letterSpacing: '0.1em' }}>{card.hanViet}</div>}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
        <button onClick={() => { setCardIdx(i => Math.max(0, i-1)); setFlipped(false); }} disabled={cardIdx === 0}
          style={{ padding: '8px 20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', cursor: cardIdx === 0 ? 'not-allowed' : 'pointer', color: 'var(--text-secondary)' }}>
          <ChevronLeft size={16} style={{ display: 'inline' }} />
        </button>
        <button onClick={() => { setCardIdx(i => Math.min(vocab.length-1, i+1)); setFlipped(false); }} disabled={cardIdx === vocab.length-1}
          style={{ padding: '8px 20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', cursor: cardIdx === vocab.length-1 ? 'not-allowed' : 'pointer', color: 'var(--text-secondary)' }}>
          <ChevronRight size={16} style={{ display: 'inline' }} />
        </button>
      </div>
    </div>
  );
}

// ──── Grammar Component ───────────────────────────────────────────────────────
function GrammarSection({ grammar }) {
  const [open, setOpen] = useState(0);
  if (!grammar?.length) return <p style={{ color: 'var(--text-muted)' }}>Chưa có dữ liệu ngữ pháp.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {grammar.map((g, i) => (
        <div key={i} style={{
          border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden'
        }}>
          <button onClick={() => setOpen(open === i ? -1 : i)} style={{
            width: '100%', padding: '14px 16px', background: open === i ? 'rgba(99,102,241,0.08)' : 'var(--bg-secondary)',
            border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>{g.title}</span>
            <span style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: open === i ? 'rotate(180deg)' : 'none' }}>▼</span>
          </button>
          {open === i && (
            <div style={{ padding: '16px', background: 'var(--bg-tertiary)' }}>
              {g.structure && (
                <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '8px', padding: '10px 14px', marginBottom: '12px',
                  fontSize: '15px', color: 'var(--text-primary)', textAlign: 'center' }}
                  dangerouslySetInnerHTML={{ __html: g.structure }}
                />
              )}
              {g.explanation && (
                <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '12px' }}
                  dangerouslySetInnerHTML={{ __html: g.explanation }}
                />
              )}
              {g.examples?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>VÍ DỤ</p>
                  {g.examples.map((ex, j) => (
                    <div key={j} style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '12px' }}>
                      <div style={{ fontFamily: 'serif', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '2px' }}>{ex.jp}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{ex.vi}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ──── Kanji Table Component ───────────────────────────────────────────────────
function KanjiTable({ kanji }) {
  if (!kanji?.length) return <p style={{ color: 'var(--text-muted)' }}>Chưa có dữ liệu hán tự.</p>;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
        <thead>
          <tr style={{ background: 'var(--bg-tertiary)' }}>
            {['Hán Tự', 'Âm Hán Việt', 'Cách đọc (Kana)'].map(h => (
              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700,
                color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {kanji.map((k, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <td style={{ padding: '12px 14px', fontSize: '22px', fontFamily: 'serif', fontWeight: 700 }}>{k.kanji}</td>
              <td style={{ padding: '12px 14px', color: 'var(--primary-light)', fontWeight: 700, letterSpacing: '0.05em' }}>{k.hanViet || '—'}</td>
              <td style={{ padding: '12px 14px', fontFamily: 'serif', color: 'var(--text-secondary)' }}>{k.kana || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ──── Kaiwa (Dialogue) Component ─────────────────────────────────────────────
function KaiwaSection({ kaiwa }) {
  const [showVi, setShowVi] = useState(true);
  if (!kaiwa?.lines?.length) return <p style={{ color: 'var(--text-muted)' }}>Chưa có dữ liệu hội thoại.</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button onClick={() => setShowVi(!showVi)} style={{
          padding: '6px 14px', background: showVi ? 'var(--primary)' : 'var(--bg-tertiary)',
          color: showVi ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '12px', fontWeight: 600
        }}>
          {showVi ? '🇻🇳 Ẩn dịch' : '🇻🇳 Hiện dịch'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {kaiwa.lines.map((line, i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{
              minWidth: '56px', padding: '4px 8px', background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)', borderRadius: '6px',
              fontSize: '11px', fontWeight: 700, color: 'var(--primary-light)', textAlign: 'center', flexShrink: 0
            }}>
              {line.speaker || `人${i+1}`}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'serif', fontSize: '16px', color: 'var(--text-primary)', marginBottom: '3px', lineHeight: 1.5 }}>
                {line.jp}
              </div>
              {showVi && line.vi && (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', borderLeft: '2px solid var(--border-color)', paddingLeft: '8px' }}>
                  {line.vi}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──── Test Component ──────────────────────────────────────────────────────────
function TestSection({ test, lessonNumber, onComplete }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  if (!test?.length) return <p style={{ color: 'var(--text-muted)' }}>Chưa có câu hỏi kiểm tra.</p>;

  const handleSubmit = () => {
    let correct = 0;
    test.forEach((q, i) => { if (answers[i] === q.correctIdx) correct++; });
    setScore(correct);
    setSubmitted(true);
    if ((correct / test.length) >= 0.8) onComplete?.();
  };

  const handleReset = () => { setAnswers({}); setSubmitted(false); setScore(0); };

  const pct = Math.round((score / test.length) * 100);
  const passed = pct >= 80;

  return (
    <div>
      {submitted && (
        <div style={{
          padding: '16px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center',
          background: passed ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${passed ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`
        }}>
          <div style={{ fontSize: '36px', marginBottom: '6px' }}>{passed ? '🎉' : '📖'}</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: passed ? '#22c55e' : '#ef4444' }}>
            {score}/{test.length} · {pct}%
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {passed ? '✅ Xuất sắc! Bài học đã được đánh dấu hoàn thành.' : '💪 Cần ôn tập thêm. Mục tiêu ≥ 80% để hoàn thành.'}
          </div>
          <button onClick={handleReset} style={{
            marginTop: '12px', padding: '8px 18px', background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)',
            cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '13px'
          }}>Làm lại</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {test.map((q, i) => (
          <div key={i} style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            borderRadius: '10px', padding: '16px'
          }}>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', fontSize: '14px' }}>
              {i + 1}. {q.question}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {q.choices.map((choice, j) => {
                const isSelected = answers[i] === j;
                const isCorrect = submitted && j === q.correctIdx;
                const isWrong = submitted && isSelected && j !== q.correctIdx;

                return (
                  <label key={j} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', cursor: submitted ? 'default' : 'pointer',
                    padding: '9px 12px', borderRadius: '8px', transition: 'all 0.15s',
                    background: isCorrect ? 'rgba(34,197,94,0.1)' : isWrong ? 'rgba(239,68,68,0.1)' : isSelected ? 'rgba(99,102,241,0.08)' : 'transparent',
                    border: `1px solid ${isCorrect ? 'rgba(34,197,94,0.4)' : isWrong ? 'rgba(239,68,68,0.4)' : isSelected ? 'rgba(99,102,241,0.3)' : 'var(--border-color)'}`,
                  }}>
                    <input type="radio" name={`q${i}`} disabled={submitted}
                      checked={isSelected} onChange={() => setAnswers(a => ({ ...a, [i]: j }))}
                      style={{ accentColor: 'var(--primary)' }} />
                    <span style={{ fontSize: '13.5px', color: isCorrect ? '#22c55e' : isWrong ? '#ef4444' : 'var(--text-secondary)' }}>
                      {choice}
                    </span>
                    {isCorrect && <CheckCircle size={14} style={{ marginLeft: 'auto', color: '#22c55e' }} />}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!submitted && (
        <button onClick={handleSubmit} disabled={Object.keys(answers).length < test.length}
          style={{
            marginTop: '20px', width: '100%', padding: '12px',
            background: Object.keys(answers).length < test.length ? 'var(--bg-tertiary)' : 'var(--primary)',
            color: Object.keys(answers).length < test.length ? 'var(--text-muted)' : '#fff',
            border: 'none', borderRadius: 'var(--radius-sm)', cursor: Object.keys(answers).length < test.length ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: '14px', transition: 'all 0.2s'
          }}>
          Nộp bài ({Object.keys(answers).length}/{test.length} câu đã trả lời)
        </button>
      )}
    </div>
  );
}

// ──── VIP Gate Component ──────────────────────────────────────────────────────
function VipGate({ lessonNumber }) {
  const router = useRouter();
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', textAlign: 'center', gap: '16px', padding: '40px'
    }}>
      <div style={{ fontSize: '64px' }}>🔒</div>
      <h2 style={{ fontWeight: 800, fontSize: '22px', color: 'var(--text-primary)' }}>
        Bài {lessonNumber} yêu cầu VIP
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '380px', lineHeight: 1.7 }}>
        Các bài học từ Bài 3 trở đi trong giáo trình Minna no Nihongo yêu cầu tài khoản VIP để mở khóa toàn bộ nội dung.
      </p>
      <button onClick={() => router.push('/pricing')} style={{
        padding: '12px 28px', background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
        fontWeight: 700, fontSize: '15px', cursor: 'pointer',
        boxShadow: '0 6px 20px rgba(245,158,11,0.3)'
      }}>
        Nâng cấp VIP ngay ⚡
      </button>
      <button onClick={() => router.back()} style={{
        padding: '8px 20px', background: 'transparent', border: '1px solid var(--border-color)',
        color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '13px'
      }}>← Quay lại</button>
    </div>
  );
}

// ──── Main Page ───────────────────────────────────────────────────────────────
export default function MinnaLessonPage() {
  const { lessonId } = useParams();
  const router = useRouter();
  const { token, user, isVip } = useAuth();
  const { toggleMinnaMastered, minnaMastered } = useProgress();

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vipRequired, setVipRequired] = useState(false);
  const [activeTab, setActiveTab] = useState('vocab');
  const [showTranslations, setShowTranslations] = useState(true);

  const lessonNum = parseInt(lessonId);
  const isMastered = (minnaMastered || []).includes(lessonNum);

  useEffect(() => {
    const fetchLesson = async () => {
      setLoading(true);
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE}/minna/lessons/${lessonId}`, { headers });

        if (res.status === 403) {
          setVipRequired(true);
          return;
        }
        if (!res.ok) throw new Error('Không tìm thấy bài học');
        const data = await res.json();
        setLesson(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (lessonId) fetchLesson();
  }, [lessonId, token]);

  useEffect(() => {
    // 1. Handle playwrap audio button clicks dynamically
    const handleAudioClick = (e) => {
      const btn = e.target.closest('.playerbt');
      if (!btn) return;
      e.preventDefault();
      const playwrap = btn.closest('.playwrap');
      if (!playwrap) return;
      const audio = playwrap.querySelector('audio');
      if (!audio) return;

      // Pause all other playing audios
      document.querySelectorAll('audio').forEach(a => {
        if (a !== audio) {
          a.pause();
          const otherBtn = a.closest('.playwrap')?.querySelector('.playerbt');
          if (otherBtn) otherBtn.classList.remove('playing');
        }
      });

      if (audio.paused) {
        audio.play()
          .then(() => btn.classList.add('playing'))
          .catch(err => console.error('Audio play failed:', err));
      } else {
        audio.pause();
        btn.classList.remove('playing');
      }
    };

    // 2. Handle slide expansion/collapse
    const handleSlideClick = (e) => {
      const title = e.target.closest('.slide-title');
      if (!title) return;
      e.preventDefault();
      const slide = title.closest('.slide');
      if (!slide) return;
      const content = slide.querySelector('.slide-content');
      if (!content) return;

      const isOpen = content.style.display === 'block';
      content.style.display = isOpen ? 'none' : 'block';
      title.classList.toggle('active', !isOpen);
    };

    // 3. Handle Kanji Renshu drawing animation controls
    const handleKanjiRenshuClick = (e) => {
      const target = e.target;
      
      const viethantuBtn = target.closest('.viethantu');
      if (viethantuBtn) {
        e.preventDefault();
        const td = viethantuBtn.closest('.td1');
        if (td) {
          td.classList.add('active-drawing');
        }
        return;
      }
      
      const reloadBtn = target.closest('.reload');
      if (reloadBtn) {
        e.preventDefault();
        const td = reloadBtn.closest('.td1');
        if (td) {
          td.classList.remove('active-drawing');
          void td.offsetWidth; // Force reflow
          td.classList.add('active-drawing');
        }
        return;
      }
      
      const anhantuBtn = target.closest('.anhantu');
      if (anhantuBtn) {
        e.preventDefault();
        const td = anhantuBtn.closest('.td1');
        if (td) {
          td.classList.remove('active-drawing');
        }
        return;
      }
    };

    document.addEventListener('click', handleAudioClick);
    document.addEventListener('click', handleSlideClick);
    document.addEventListener('click', handleKanjiRenshuClick);
    
    return () => {
      document.removeEventListener('click', handleAudioClick);
      document.removeEventListener('click', handleSlideClick);
      document.removeEventListener('click', handleKanjiRenshuClick);
    };
  }, [activeTab]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px', height: '40px', border: '3px solid var(--border-color)',
            borderTopColor: 'var(--primary)', borderRadius: '50%',
            animation: 'spin 1s linear infinite', margin: '0 auto 12px'
          }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Đang tải bài học...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (vipRequired) return <VipGate lessonNumber={lessonNum} />;

  if (!lesson) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Không tìm thấy bài học. <button onClick={() => router.push('/')} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>Quay về trang chủ</button></p>
      </div>
    );
  }

  const levelColor = lesson.level === 'N5' ? '#22c55e' : '#0ea5e9';

  const cleanHTML = (html) => {
    if (!html) return '';
    let cleaned = html;
    // Xoá an toàn: Chỉ xoá các thẻ <li> chứa các chữ điều hướng (không cắt nhầm thẻ khác)
    cleaned = cleaned.replace(/<li[^>]*>(?:(?!<\/?li>)[\s\S])*?(?:Đọc 文型|Câu 1|Câu 2|Câu 3|Câu 4|Câu 5|Luyện tập A|Luyện tập B|Đọc 練習|例文|văn mẫu)(?:(?!<\/?li>)[\s\S])*?<\/li>/gi, '');
    
    // Xoá các nút Ẩn/Hiện nghĩa tiếng Anh/Việt thừa thãi
    cleaned = cleaned.replace(/<span[^>]*>\s*Ẩn\/Hiện Nghĩa (VI|EN)\s*<\/span>/gi, '');
    cleaned = cleaned.replace(/<a[^>]*>\s*Ẩn\/Hiện Nghĩa (VI|EN)\s*<\/a>/gi, '');
    cleaned = cleaned.replace(/Ẩn\/Hiện Nghĩa VI/gi, '');
    cleaned = cleaned.replace(/Ẩn\/Hiện Nghĩa EN/gi, '');
    cleaned = cleaned.replace(/\|\s*\|/g, ''); // Xoá ký tự | thừa
    
    // Xoá thẻ <ul> nếu bên trong nó rỗng (sau khi đã xoá hết <li>)
    cleaned = cleaned.replace(/<ul[^>]*>\s*<\/ul>/gi, '');
    
    return cleaned;
  };

  const renderTabContent = () => {
    const wrapClass = showTranslations ? '' : 'hide-translations';
    switch (activeTab) {
      case 'vocab':      return <Flashcard vocab={lesson.vocab} />;
      case 'grammar':    return <GrammarSection grammar={lesson.grammar} />;
      case 'kanji':      return <KanjiTable kanji={lesson.kanji} />;
      case 'kaiwa':      return <KaiwaSection kaiwa={lesson.kaiwa} />;
      case 'test':       return <TestSection test={lesson.test} lessonNumber={lessonNum} onComplete={() => { if (!isMastered) toggleMinnaMastered(lessonNum); }} />;
      case 'reading':    return lesson.readingHtml ? <div className={`${wrapClass} readingHtml`} dangerouslySetInnerHTML={{ __html: cleanHTML(lesson.readingHtml) }} style={{ lineHeight: 1.8, fontSize: '14px', color: 'var(--text-secondary)' }} /> : <p style={{ color: 'var(--text-muted)' }}>Nội dung đang được cập nhật...</p>;
      case 'listening':  return lesson.listeningHtml ? <div className={`${wrapClass} listeningHtml`} dangerouslySetInnerHTML={{ __html: cleanHTML(lesson.listeningHtml) }} style={{ lineHeight: 1.8, fontSize: '14px', color: 'var(--text-secondary)' }} /> : <p style={{ color: 'var(--text-muted)' }}>Nội dung đang được cập nhật...</p>;
      case 'exercise':   return lesson.exerciseHtml ? <div className={`${wrapClass} exerciseHtml`} dangerouslySetInnerHTML={{ __html: cleanHTML(lesson.exerciseHtml) }} style={{ lineHeight: 1.8, fontSize: '14px', color: 'var(--text-secondary)' }} /> : <p style={{ color: 'var(--text-muted)' }}>Nội dung đang được cập nhật...</p>;
      case 'kanjiRenshu': return lesson.kanjiRenshuHtml ? <div className={`${wrapClass} kanjiRenshuHtml`} dangerouslySetInnerHTML={{ __html: cleanHTML(lesson.kanjiRenshuHtml) }} style={{ lineHeight: 1.8, fontSize: '14px', color: 'var(--text-secondary)' }} /> : <p style={{ color: 'var(--text-muted)' }}>Nội dung đang được cập nhật...</p>;
      case 'readingComp': return lesson.readingCompHtml ? <div className={`${wrapClass} readingCompHtml`} dangerouslySetInnerHTML={{ __html: cleanHTML(lesson.readingCompHtml) }} style={{ lineHeight: 1.8, fontSize: '14px', color: 'var(--text-secondary)' }} /> : <p style={{ color: 'var(--text-muted)' }}>Nội dung đang được cập nhật...</p>;
      case 'reference':  return lesson.referenceHtml ? <div className={`${wrapClass} referenceHtml`} dangerouslySetInnerHTML={{ __html: cleanHTML(lesson.referenceHtml) }} style={{ lineHeight: 1.8, fontSize: '14px', color: 'var(--text-secondary)' }} /> : <p style={{ color: 'var(--text-muted)' }}>Nội dung đang được cập nhật...</p>;
      default: return null;
    }
  };

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <button onClick={() => router.push('/')} style={{
            padding: '6px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '12px'
          }}>← Bản đồ</button>

          <span style={{ padding: '3px 10px', background: `${levelColor}20`, color: levelColor,
            fontSize: '11px', fontWeight: 700, borderRadius: '6px', border: `1px solid ${levelColor}40` }}>
            {lesson.level}
          </span>

          <span style={{ padding: '3px 10px', background: 'var(--bg-tertiary)', color: 'var(--text-muted)',
            fontSize: '11px', fontWeight: 700, borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            Bài {lesson.lessonNumber}
          </span>

          {isMastered && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#22c55e', fontSize: '12px', fontWeight: 700 }}>
              <CheckCircle size={14} /> Hoàn thành
            </span>
          )}
        </div>

        <h1 className="page-title" style={{
          fontSize: '28px', fontFamily: 'serif',
          background: `linear-gradient(135deg, ${levelColor}, #a78bfa)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          {lesson.titleJp}
        </h1>
        {lesson.titleVi && (
          <p className="page-description">{lesson.titleVi}</p>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', gap: '4px', flexWrap: 'wrap',
        borderBottom: '1px solid var(--border-color)', marginBottom: '20px', paddingBottom: '0'
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '9px 14px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: '12.5px', fontWeight: 600, whiteSpace: 'nowrap',
              borderBottom: activeTab === tab.id ? `2px solid ${levelColor}` : '2px solid transparent',
              color: activeTab === tab.id ? levelColor : 'var(--text-secondary)',
              transition: 'all 0.15s', marginBottom: '-1px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Controls (e.g. Translation Toggle) ── */}
      {['reading', 'listening', 'exercise', 'readingComp', 'reference'].includes(activeTab) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button onClick={() => setShowTranslations(!showTranslations)} style={{
            padding: '6px 14px', background: showTranslations ? 'var(--primary)' : 'var(--bg-tertiary)',
            color: showTranslations ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '12px', fontWeight: 600
          }}>
            {showTranslations ? '🇻🇳 Ẩn dịch nghĩa' : '🇻🇳 Hiện dịch nghĩa'}
          </button>
        </div>
      )}

      {/* ── Tab Content ── */}
      <div style={{ minHeight: '400px' }}>
        {renderTabContent()}
      </div>

      {/* ── Navigation Arrows ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
        {lessonNum > 1 ? (
          <button onClick={() => router.push(`/minna/${lessonNum - 1}`)} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px',
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '13px'
          }}>
            <ChevronLeft size={16} /> Bài {lessonNum - 1}
          </button>
        ) : <div />}
        {lessonNum < 50 ? (
          <button onClick={() => router.push(`/minna/${lessonNum + 1}`)} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px',
            background: levelColor, border: 'none',
            borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: '#fff', fontSize: '13px', fontWeight: 600
          }}>
            Bài {lessonNum + 1} <ChevronRight size={16} />
          </button>
        ) : <div />}
      </div>
    </div>
  );
}
