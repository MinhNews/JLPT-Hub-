'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Headphones, PenTool, Clock, ChevronRight } from 'lucide-react';
import '../exams.css';

export default function ExamGateway() {
  const { level, examId } = useParams();
  const router = useRouter();
  const [exam, setExam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/api/exams/${level}/${examId}`)
      .then(res => res.json())
      .then(data => {
        setExam(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [level, examId]);

  if (isLoading) return <div className="exam-loading">Đang mở cổng phòng thi...</div>;
  if (!exam) return <div className="exam-loading">Không tìm thấy đề thi này.</div>;

  const grammarLink = exam.grammar_reading ? `/exams/${level}/${examId}/grammar_reading` : `/exams/${level}/${examId}/grammar`;

  return (
    <div className="exam-container">
      <Link href={`/exams/${level}`} className="back-link">
        <ArrowLeft size={20} /> Quay lại danh sách đề
      </Link>

      <div className="gateway-header">
        <h1 className="gateway-title">{level === 'n3' ? exam.title : `JLPT ${level.toUpperCase()} - Mock Test 0${exam.month === '7' || exam.month === 7 ? '1' : '2'}`}</h1>
        <p className="gateway-subtitle">{level === 'n3' ? `Kỳ thi diễn ra vào tháng ${exam.month} năm ${exam.year}` : `Đề thi thử tổng hợp kiến thức ${level.toUpperCase()}`}</p>
      </div>

      <div className="gateway-sections">
        {exam.vocabulary && (
          <Link href={`/exams/${level}/${examId}/vocabulary`} className="section-card vocab">
            <div className="section-icon"><PenTool size={32} /></div>
            <div className="section-info">
              <h2>Từ vựng (Vocabulary)</h2>
              <p><Clock size={16} /> 30 phút</p>
            </div>
            <ChevronRight size={24} className="section-arrow" />
          </Link>
        )}

        {(exam.grammar || exam.grammar_reading) && (
          <Link href={grammarLink} className="section-card grammar">
            <div className="section-icon"><BookOpen size={32} /></div>
            <div className="section-info">
              <h2>Ngữ pháp & Đọc hiểu</h2>
              <p><Clock size={16} /> {level === 'n5' || level === 'n4' ? '60 phút' : '70 phút'}</p>
            </div>
            <ChevronRight size={24} className="section-arrow" />
          </Link>
        )}

        {exam.listening && (
          <Link href={`/exams/${level}/${examId}/listening`} className="section-card listening">
            <div className="section-icon"><Headphones size={32} /></div>
            <div className="section-info">
              <h2>Nghe hiểu (Listening)</h2>
              <p><Clock size={16} /> {level === 'n5' ? '30 phút' : level === 'n4' ? '35 phút' : '40 phút'}</p>
            </div>
            <ChevronRight size={24} className="section-arrow" />
          </Link>
        )}
      </div>
    </div>
  );
}
