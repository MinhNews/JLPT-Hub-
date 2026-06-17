'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import '../../exams.css';
import './examRoom.css';

export default function ExamRoom() {
  const { level, examId, section } = useParams();
  const router = useRouter();
  
  const [exam, setExam] = useState(null);
  const [sectionData, setSectionData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const timerRef = useRef(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/exams/${level}/${examId}`)
      .then(res => res.json())
      .then(data => {
        setExam(data);
        if (data[section]) {
          setSectionData(data[section]);
          // Set timer
          let minutes = 30;
          if (section === 'listening') minutes = level === 'n5' ? 30 : level === 'n4' ? 35 : 40;
          if (section === 'grammar' || section === 'grammar_reading') minutes = (level === 'n5' || level === 'n4') ? 60 : 70;
          setTimeLeft(minutes * 60);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [examId, section]);

  // Timer logic
  useEffect(() => {
    if (!isLoading && sectionData && !isSubmitted) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isLoading, sectionData, isSubmitted]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (qId, choiceIndex) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [qId]: choiceIndex }));
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    setShowAnswers(true);
    clearInterval(timerRef.current);
    
    // Calculate score
    let correct = 0;
    sectionData.questions.forEach(q => {
      if (answers[q.id] === q.correct_answer_index) correct++;
    });
    setScore(correct);
    window.scrollTo(0, 0);
  };

  if (isLoading) return <div className="exam-loading">Đang tải phòng thi...</div>;
  if (!sectionData) return <div className="exam-loading">Phần thi này chưa có dữ liệu.</div>;

  const renderQuestion = (q, idx) => {
    const isCorrect = answers[q.id] === q.correct_answer_index;
    
    return (
      <div key={q.id} id={`q-${q.id}`} className={`question-card ${showAnswers ? (isCorrect ? 'is-correct' : 'is-wrong') : ''}`}>
        <div className="question-header">
          <span className="q-number">Câu {idx + 1}</span>
          {showAnswers && (
            <span className={`q-status ${isCorrect ? 'text-green' : 'text-red'}`}>
              {isCorrect ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}
            </span>
          )}
        </div>

        <div className="q-text" dangerouslySetInnerHTML={{ __html: q.question_text }} />

        {q.image_url && <img src={q.image_url} alt="Question Graphic" className="q-image" />}
        {q.audio_url && (
          <audio controls className="q-audio">
            <source src={q.audio_url} type="audio/mpeg" />
            Trình duyệt của bạn không hỗ trợ phát âm thanh.
          </audio>
        )}

        <div className="q-choices">
          {q.choices.map((choiceText, cIdx) => {
            let choiceClass = 'choice-item';
            if (answers[q.id] === cIdx) choiceClass += ' selected';
            if (showAnswers) {
              if (cIdx === q.correct_answer_index) choiceClass += ' answer-true';
              else if (answers[q.id] === cIdx && cIdx !== q.correct_answer_index) choiceClass += ' answer-false';
            }

            return (
              <div 
                key={cIdx} 
                className={choiceClass}
                onClick={() => handleSelectAnswer(q.id, cIdx)}
              >
                <div className="choice-radio"></div>
                <div dangerouslySetInnerHTML={{ __html: choiceText.replace(/^\d+\.\s*/, '') }} />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="exam-room-layout">
      {/* Sidebar with Navigation & Timer */}
      <div className="exam-sidebar">
        <div className="timer-box">
          <Clock size={24} color={timeLeft < 300 ? '#ef4444' : '#3b82f6'} />
          <span className={`time-text ${timeLeft < 300 ? 'danger' : ''}`}>{formatTime(timeLeft)}</span>
        </div>
        
        <button 
          className="submit-btn" 
          onClick={handleSubmit}
          disabled={isSubmitted}
        >
          {isSubmitted ? 'Đã Nộp Bài' : 'Nộp Bài'}
        </button>
        
        {isSubmitted && (
          <button 
            className="submit-btn" 
            style={{marginTop: '1rem', background: showAnswers ? '#f59e0b' : '#10b981'}}
            onClick={() => setShowAnswers(!showAnswers)}
          >
            {showAnswers ? 'Ẩn đáp án' : 'Xem đáp án'}
          </button>
        )}

        <div className="question-nav">
          <h3>Danh sách câu hỏi</h3>
          <div className="nav-grid">
            {sectionData.questions.map((q, idx) => {
              let statusClass = '';
              if (showAnswers) {
                if (answers[q.id] === q.correct_answer_index) statusClass = 'correct';
                else statusClass = 'incorrect';
              } else if (answers[q.id] !== undefined) {
                statusClass = 'answered';
              }
              
              return (
                <button 
                  key={q.id} 
                  className={`nav-bubble ${statusClass}`}
                  onClick={() => document.getElementById(`q-${q.id}`).scrollIntoView({ behavior: 'smooth', block: 'center' })}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`exam-main ${showAnswers ? 'show-answers' : 'hide-answers'}`}>
        {isSubmitted && (
          <div className="result-banner">
            <h2>Kết Quả Bài Thi</h2>
            <p className="score">Bạn trả lời đúng: <strong>{score} / {sectionData.questions.length}</strong> câu</p>
          </div>
        )}

        {(() => {
          let displayMondais = sectionData.mondais || [];
          if (displayMondais.length === 0 && sectionData.questions.length > 0) {
            const mondaiIds = [...new Set(sectionData.questions.map(q => q.mondai_id))].filter(id => id != null);
            mondaiIds.sort((a, b) => a - b);
            const defaultTitles = {
              vocabulary: [
                '<ruby>問題<rp>(</rp><rt>もんだい</rt><rp>)</rp></ruby>１ ＿＿＿のことばの<ruby>読<rp>(</rp><rt>よ</rt><rp>)</rp></ruby>み<ruby>方<rp>(</rp><rt>かた</rt><rp>)</rp></ruby>として<ruby>最<rp>(</rp><rt>もっと</rt><rp>)</rp></ruby>もよいものを、1・2・3・4 から<ruby>一<rp>(</rp><rt>ひと</rt><rp>)</rp></ruby>つ えらびなさい。',
                '<ruby>問題<rp>(</rp><rt>もんだい</rt><rp>)</rp></ruby>2＿＿＿のことばを漢字(かんじ)で書(か)くとき、最(もっと)もよいものを、1・2・3・4から一(ひと)つ選(えら)びなさい。',
                '<ruby>問題<rp>(</rp><rt>もんだい</rt><rp>)</rp></ruby>3 （ ）に入(い)れるのに最(もっと)もよいものを、1・2・3・4から一(ひと)つえらびなさい。',
                '<ruby>問題<rp>(</rp><rt>もんだい</rt><rp>)</rp></ruby>4____に意味(いみ)が最(もっと)も近(ちか)いものを、1・2・3・4から一(ひと)つ選(えら)びなさい。',
                '<ruby>問題<rp>(</rp><rt>もんだい</rt><rp>)</rp></ruby>５ 次(つぎ)の言葉(ことば)の使(つか)い方(かた)として最(もっと)も近(ちか)いものを、１・２・３・４から一(ひと)つ選(えら)びなさい।'
              ],
              grammar_reading: [
                '<ruby>問題<rp>(</rp><rt>もんだい</rt><rp>)</rp></ruby>1 つぎの文の( )に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。',
                '<ruby>問題<rp>(</rp><rt>もんだい</rt><rp>)</rp></ruby>2 次の文の ★ に入る最もよいものを、1・2・3・4から一つ選びなさい。',
                '<ruby>問題<rp>(</rp><rt>もんだい</rt><rp>)</rp></ruby>3 次の文章を読んで、文章の中の ( ) に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。',
                '<ruby>問題<rp>(</rp><rt>もんだい</rt><rp>)</rp></ruby>4 次の(1)から(4)の文章を読んで、後の問いに対する答えとして最もよいものを、1・2・3・4から一つ選びなさい。',
                '<ruby>問題<rp>(</rp><rt>もんだい</rt><rp>)</rp></ruby>5 次の文章を読んで、後の問いに対する答えとして最もよいものを、1・2・3・4から一つ選びなさい。',
                '<ruby>問題<rp>(</rp><rt>もんだい</rt><rp>)</rp></ruby>6 次の文章を読んで、後の問いに対する答えとして最もよいものを、1・2・3・4から一つ選びなさい。',
                '<ruby>問題<rp>(</rp><rt>もんだい</rt><rp>)</rp></ruby>7 右のページを読んで、後の問いに対する答えとして最もよいものを、1・2・3・4から一つ選びなさい。'
              ]
            };
            displayMondais = mondaiIds.map((id, index) => ({
              id,
              title: defaultTitles[section] && defaultTitles[section][index] ? defaultTitles[section][index] : `問題${index + 1}`
            }));
          }

          if (displayMondais.length > 0) {
            return (
              <div className="mondais-container">
                {displayMondais.map((mondai) => {
                  const mondaiQuestions = sectionData.questions.filter(q => q.mondai_id === mondai.id);
                  if (mondaiQuestions.length === 0) return null;
                  return (
                    <div key={mondai.id} className="mondai-block" style={{marginBottom: '3rem'}}>
                      <div className="mondai-header" style={{background: '#f1f5f9', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem'}}>
                        <h3 className="mondai-title" style={{fontSize: '1.2rem', fontWeight: 700, color: '#1e293b'}} dangerouslySetInnerHTML={{ __html: mondai.title }} />
                        {(mondai.local_audio || mondai.audio_url) && (
                          <audio controls className="q-audio" style={{marginTop: '1rem', width: '100%'}}>
                            <source src={mondai.local_audio || mondai.audio_url} type="audio/mpeg" />
                            Trình duyệt của bạn không hỗ trợ phát âm thanh.
                          </audio>
                        )}
                      </div>
                      <div className="questions-container">
                        {mondaiQuestions.map(q => {
                          const idx = sectionData.questions.findIndex(sq => sq.id === q.id);
                          return renderQuestion(q, idx);
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }
          return (
            <div className="questions-container">
              {sectionData.questions.map((q, idx) => renderQuestion(q, idx))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
