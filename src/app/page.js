'use client';

import { useProgress } from '@/context/ProgressContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Check, Calendar, BookOpen, Layers, Award, ShieldAlert, Lock } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const { user, isVip } = useAuth();
  const {
    vocabMastered,
    kanjiMastered,
    grammarMastered,
    readingMastered,
    listeningMastered,
    currentLevel,
    minnaMastered,
  } = useProgress();

  const totalVocab = 880;
  const totalKanji = 168;
  const totalGrammar = 110;
  const totalReading = 72;
  const totalListening = 28;

  const vocabPercent = Math.round(((vocabMastered?.length || 0) / totalVocab) * 100) || 0;
  const kanjiPercent = Math.round(((kanjiMastered?.length || 0) / totalKanji) * 100) || 0;

  // Lộ trình 20 ngày đã được loại bỏ

  // ── Minna Lesson Map (N5/N4) ─────────────────────────────────────────────
  const lessonTitles = {
    1:'はじめまして', 2:'これから　お世話に',3:'これを　ください',4:'そちらは　何時まで',5:'この電車は　甲子園へ',
    6:'いっしょに　行きませんか',7:'いらっしゃい',8:'そろそろ　失礼します',9:'残念ですが',10:'ナンプラー、ありますか',
    11:'これ、お願いします',12:'祇園祭は　どうでした',13:'別々に　お願いします',14:'みどり町まで',15:'ご家族は？',
    16:'使い方を　教えて',17:'どう　しましたか？',18:'趣味は　何ですか',19:'ダイエットは　あした',20:'いっしょに　行かない？',
    21:'わたしも　そう　思います',22:'どんな　部屋を',23:'どうやって　行きますか',24:'手伝いに　行きましょうか',25:'お世話に　なりました',
    26:'ごみは　どこに',27:'何でも　作れるんですね',28:'出張も　多いし…',29:'忘れ物を　して',30:'非常袋を　準備して',
    31:'料理を　習おうと',32:'無理を　しない　ほうが',33:'どういう　意味ですか',34:'したとおりに　して',35:'どこか　いい　所',
    36:'毎日　運動するように',37:'金閣寺は　14世紀に',38:'片づけるのが　好き',39:'遅れて、すみません',40:'友達が　できたか',
    41:'ご結婚　おめでとう',42:'ボーナスは　何に',43:'毎日　楽しそうです',44:'この写真みたいに',45:'まちがえた　場合は',
    46:'直して　もらった　ばかり',47:'婚約したそうです',48:'休ませて　いただけませんか',49:'よろしく　お伝え',50:'心から　感謝いたします',
  };

  const MinnaLessonMap = ({ level }) => {
    const isN5 = level === 'N5';
    const startNum = isN5 ? 1 : 26;
    const endNum   = isN5 ? 25 : 50;
    const color    = isN5 ? '#22c55e' : '#0ea5e9';
    const glow     = isN5 ? 'rgba(34,197,94,0.2)' : 'rgba(14,165,233,0.2)';
    const lessons  = Array.from({ length: 25 }, (_, i) => startNum + i);
    const mastered = minnaMastered || [];

    const handleLessonClick = (num) => {
      const isFree = num <= 2;
      if (!isFree && !isVip && user?.role !== 'admin') {
        router.push('/pricing');
        return;
      }
      router.push(`/minna/${num}`);
    };

    return (
      <div>
        <div className="page-header">
          <h1 className="page-title" style={{ background: `linear-gradient(135deg, ${color}, #fff)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {isN5 ? '🌱 Giáo trình Minna no Nihongo N5' : '🌊 Giáo trình Minna no Nihongo N4'}
          </h1>
          <p className="page-description">
            {isN5 ? 'Bài 1 ~ 25 · Sơ cấp I — Bài 1 & 2 miễn phí' : 'Bài 26 ~ 50 · Sơ cấp II — Yêu cầu VIP'}
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[
            { label: 'Tổng bài học', value: '25 bài', icon: '📚' },
            { label: 'Đã hoàn thành', value: `${mastered.filter(n => (isN5 ? n <= 25 : n >= 26)).length}/25`, icon: '✅' },
            { label: 'Bài miễn phí', value: isN5 ? '2 bài' : '0 bài', icon: '🔓' },
            { label: 'Giáo trình', value: 'Minna no Nihongo', icon: '🇯🇵' },
          ].map((s, i) => (
            <div key={i} style={{
              flex: '1 1 140px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)', padding: '12px 16px',
              display: 'flex', flexDirection: 'column', gap: '4px'
            }}>
              <span style={{ fontSize: '20px' }}>{s.icon}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Lesson Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '12px'
        }}>
          {lessons.map((num) => {
            const done   = mastered.includes(num);
            const isFree = num <= 2;
            const locked = !isFree && !isVip && user?.role !== 'admin';
            const pct    = done ? 100 : 0;
            const r      = 28;
            const circ   = 2 * Math.PI * r;
            const offset = circ - (pct / 100) * circ;

            return (
              <div
                key={num}
                id={`minna-lesson-${num}`}
                onClick={() => handleLessonClick(num)}
                style={{
                  background: done
                    ? `linear-gradient(135deg, ${color}18, ${color}08)`
                    : locked
                    ? 'var(--bg-tertiary)'
                    : 'var(--bg-secondary)',
                  border: done ? `1px solid ${color}50` : locked ? '1px solid var(--border-color)' : '1px solid var(--border-color)',
                  borderRadius: '14px',
                  padding: '16px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'center',
                  position: 'relative',
                  opacity: locked ? 0.65 : 1,
                }}
                onMouseEnter={e => { if (!locked) e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${glow}`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {/* Progress ring */}
                <div style={{ position: 'relative', width: '64px', height: '64px', margin: '0 auto 8px' }}>
                  <svg width="64" height="64" style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}>
                    <circle cx="32" cy="32" r={r} fill="none" stroke="var(--border-color)" strokeWidth="3.5" />
                    <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="3.5"
                      strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
                  </svg>
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '11px', fontWeight: 800,
                    color: done ? color : locked ? 'var(--text-muted)' : 'var(--text-primary)'
                  }}>
                    {locked ? <Lock size={14} /> : done ? '✓' : num}
                  </div>
                </div>

                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '3px' }}>
                  Bài {num}
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3,
                  overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {lessonTitles[num]}
                </div>

                {isFree && !done && (
                  <div style={{
                    position: 'absolute', top: '6px', right: '6px',
                    background: '#22c55e', color: '#fff', fontSize: '8px',
                    fontWeight: 700, padding: '2px 5px', borderRadius: '4px'
                  }}>FREE</div>
                )}
                {done && (
                  <div style={{
                    position: 'absolute', top: '6px', right: '6px',
                    background: color, color: '#fff', fontSize: '8px',
                    fontWeight: 700, padding: '2px 5px', borderRadius: '4px'
                  }}>✓ DONE</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (currentLevel === 'N5') return <MinnaLessonMap level="N5" />;
  if (currentLevel === 'N4') return <MinnaLessonMap level="N4" />;

  // Default: N3 Map
  const n3Cards = [
    { title: 'Từ vựng Mimikara', path: '/vocab', icon: '📖', desc: '880 từ vựng cốt lõi', stat: `${vocabMastered?.length || 0}/${totalVocab}` },
    { title: 'Ngữ pháp N3', path: '/grammar', icon: '✏️', desc: '110 cấu trúc trọng điểm', stat: `${grammarMastered?.length || 0}/${totalGrammar}` },
    { title: 'Đọc hiểu N3', path: '/reading', icon: '📝', desc: '72 bài tập đọc hiểu', stat: `${readingMastered?.length || 0}/${totalReading}` },
    { title: 'Nghe hiểu N3', path: '/listening', icon: '🎧', desc: '28 bài tập nghe hiểu', stat: `${listeningMastered?.length || 0}/${totalListening}` },
    { title: 'Kanji N3', path: '/kanji', icon: '漢字', desc: '168 chữ Hán cơ bản', stat: `${kanjiMastered?.length || 0}/${totalKanji}` },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title" style={{ background: `linear-gradient(135deg, #8b5cf6, #fff)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🔮 Bản đồ bài học N3
        </h1>
        <p className="page-description">
          Chương trình Trung cấp — Hãy hoàn thành từng kỹ năng để chinh phục cấp độ N3
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { label: 'Từ vựng', value: `${vocabPercent}%`, icon: '📖' },
          { label: 'Ngữ pháp', value: `${Math.round(((grammarMastered?.length || 0) / totalGrammar) * 100) || 0}%`, icon: '✏️' },
          { label: 'Đọc hiểu', value: `${Math.round(((readingMastered?.length || 0) / totalReading) * 100) || 0}%`, icon: '📝' },
          { label: 'Nghe hiểu', value: `${Math.round(((listeningMastered?.length || 0) / totalListening) * 100) || 0}%`, icon: '🎧' },
          { label: 'Kanji', value: `${kanjiPercent}%`, icon: '漢字' },
        ].map((s, i) => (
          <div key={i} style={{
            flex: '1 1 120px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)', padding: '12px 16px',
            display: 'flex', flexDirection: 'column', gap: '4px'
          }}>
            <span style={{ fontSize: '20px' }}>{s.icon}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</span>
            <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        {n3Cards.map((card, idx) => {
          return (
            <div
              key={idx}
              onClick={() => router.push(card.path)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '20px 16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center',
                position: 'relative',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px rgba(139,92,246,0.2)`; e.currentTarget.style.borderColor = '#8b5cf650'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{card.icon}</div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{card.title}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>{card.desc}</p>
              
              <div style={{ display: 'inline-block', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                Tiến độ: {card.stat}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
