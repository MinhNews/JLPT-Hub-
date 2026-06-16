'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronRight } from 'lucide-react';
import './kanjill.css';

const API_BASE_URL = 'http://localhost:5000/api';

export default function KanjiLLDashboard() {
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ mastered: 0, progress: 0 });
  const [lessonProgressMap, setLessonProgressMap] = useState({});

  useEffect(() => {
    fetchLessons();
    
    let totalMastered = 0;
    let progressMap = {};
    for (let i = 1; i <= 32; i++) {
      const saved = localStorage.getItem(`kanjill_mastered_${i}`);
      if (saved) {
        try {
          const arr = JSON.parse(saved);
          totalMastered += arr.length;
          progressMap[i] = arr.length;
        } catch (e) {}
      }
    }
    setStats({
      mastered: totalMastered,
      progress: Math.round((totalMastered / 512) * 100) || 0
    });
    setLessonProgressMap(progressMap);
  }, []);

  const fetchLessons = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/kanjill`);
      if (res.ok) {
        const data = await res.json();
        setLessons(data);
      }
    } catch (err) {
      console.error('Failed to fetch Kanji LL lessons');
    } finally {
      setIsLoading(false);
    }
  };

  const all32Lessons = Array.from({ length: 32 }, (_, i) => i + 1);

  return (
    <div className="kll-container">
      {/* Premium Header */}
      <div className="kll-header">
        <h1 className="kll-title">
          <div className="kll-icon-box">
            <BookOpen size={28} />
          </div>
          <span>Kanji Look & Learn</span>
        </h1>
        <p className="kll-subtitle">
          Hệ thống ghi nhớ Hán tự qua hình ảnh minh họa độc đáo. Nắm vững 512 Kanji thông dụng nhất chỉ trong 32 bài học.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="kll-stats-grid">
        <div className="kll-stat-card">
          <span className="kll-stat-label">Tổng bài học</span>
          <span className="kll-stat-val" style={{ backgroundImage: 'linear-gradient(to right, #34d399, #14b8a6)' }}>32</span>
        </div>
        <div className="kll-stat-card">
          <span className="kll-stat-label">Chữ Kanji</span>
          <span className="kll-stat-val" style={{ backgroundImage: 'linear-gradient(to right, #22d3ee, #3b82f6)' }}>512</span>
        </div>
        <div className="kll-stat-card">
          <span className="kll-stat-label">Đã hoàn thành</span>
          <span className="kll-stat-val" style={{ backgroundImage: 'linear-gradient(to right, #c084fc, #6366f1)' }}>{stats.mastered}</span>
        </div>
        <div className="kll-stat-card">
          <span className="kll-stat-label">Tiến độ</span>
          <span className="kll-stat-val" style={{ backgroundImage: 'linear-gradient(to right, #fb7185, #f97316)' }}>{stats.progress}%</span>
        </div>
      </div>

      {/* Grid of Lessons */}
      <div className="kll-grid">
        {all32Lessons.map((num) => {
          const apiData = lessons.find(l => l.lessonId === num);
          const isAvailable = !!apiData;
          const totalKanjis = apiData ? apiData.kanjiCount : 16;
          const masteredCount = lessonProgressMap[num] || 0;
          const lessonProg = Math.round((masteredCount / totalKanjis) * 100) || 0;
          
          return (
            <Link href={isAvailable ? `/kanjill/${num}` : '#'} key={num} className={`kll-card ${isAvailable ? 'available' : 'disabled'}`}>
              <div className="kll-card-content">
                <div className="kll-card-header">
                  <div className={`kll-badge ${isAvailable ? 'available' : 'disabled'}`}>
                    {num}
                  </div>
                  {isAvailable && <ChevronRight size={20} color="#64748b" />}
                </div>
                
                <h3 className="kll-card-title">Bài {num}</h3>
                <p className="kll-card-desc">
                  {isAvailable ? `${masteredCount} / ${totalKanjis} Kanji đã thuộc` : 'Chưa tải dữ liệu'}
                </p>
              </div>

              {/* Progress bar line at bottom */}
              <div className="kll-progress-bar">
                <div className="kll-progress-fill" style={{ width: `${lessonProg}%` }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
