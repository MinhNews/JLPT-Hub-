'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BookOpen, Headphones, PenTool } from 'lucide-react';
import './exams.css';

export default function ExamList() {
  const [exams, setExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const level = params?.level || 'n3';

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/exams/${level}`)
      .then(res => res.json())
      .then(data => {
        setExams(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [level]);

  if (isLoading) return <div className="exam-loading">Đang tải danh sách đề thi...</div>;

  return (
    <div className="exam-container">
      <div className="exam-header">
        <h1 className="exam-title">Luyện đề thi JLPT {level.toUpperCase()}</h1>
        <p className="exam-subtitle">Lựa chọn năm và tháng để bắt đầu thi thử</p>
      </div>

      <div className="exam-grid">
        {exams.length > 0 ? (
          exams.map(exam => (
            <Link href={`/exams/${level}/${exam.id}`} key={exam.id} className="exam-card">
              <div className="exam-card-year">{level === 'n3' ? exam.year : `Mock Test 0${exam.month === '7' || exam.month === 7 ? '1' : '2'}`}</div>
              {level === 'n3' && <div className="exam-card-month">Tháng {exam.month}</div>}
              {level !== 'n3' && <div className="exam-card-month" style={{visibility: 'hidden'}}>Mock</div>}
              
              <div className="exam-card-tags">
                {exam.hasVocabulary && <span className="tag tag-vocab">Từ vựng</span>}
                {exam.hasGrammar && <span className="tag tag-grammar">Ngữ pháp</span>}
                {exam.hasListening && <span className="tag tag-listen">Nghe hiểu</span>}
              </div>
            </Link>
          ))
        ) : (
          <div className="exam-empty">Hiện tại chưa có đề thi nào cho {level.toUpperCase()}.</div>
        )}
      </div>
    </div>
  );
}
