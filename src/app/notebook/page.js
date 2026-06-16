'use client';

import { useState, useEffect } from 'react';
import { Save, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = 'http://localhost:5000/api';

export default function NotebookPage() {
  const { token, user } = useAuth();
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Load notes on mount/auth change
  useEffect(() => {
    const loadNotes = async () => {
      setIsInitialLoading(true);
      
      // Try local storage first
      const localNotes = localStorage.getItem('jlpt_n3_notebook');
      const localTime = localStorage.getItem('jlpt_n3_notebook_time');
      if (localNotes) setNotes(localNotes);
      if (localTime) setLastSaved(localTime);

      // If logged in, fetch from DB
      if (token) {
        try {
          const res = await fetch(`${API_BASE_URL}/notebook`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            const globalNote = data.find(n => n.type === 'global' && n.originalId === 'global');
            if (globalNote) {
              setNotes(globalNote.note);
              const formattedTime = new Date(globalNote.updatedAt).toLocaleTimeString('vi-VN', { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
              });
              setLastSaved(formattedTime + ' (Đồng bộ đám mây)');
            }
          }
        } catch (err) {
          console.error('Failed to load notebook notes from server:', err);
        }
      }
      setIsInitialLoading(false);
    };

    loadNotes();
  }, [token]);

  // Handle auto-save (debounce)
  useEffect(() => {
    if (isInitialLoading) return;

    setIsSaving(true);
    const timeout = setTimeout(async () => {
      const now = new Date().toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });

      // Save to localStorage
      localStorage.setItem('jlpt_n3_notebook', notes);
      localStorage.setItem('jlpt_n3_notebook_time', now);
      setLastSaved(now);

      // Sync to backend DB if logged in
      if (token) {
        try {
          const res = await fetch(`${API_BASE_URL}/notebook`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              type: 'global',
              originalId: 'global',
              note: notes
            })
          });
          if (res.ok) {
            setLastSaved(now + ' (Đồng bộ đám mây)');
          }
        } catch (err) {
          console.error('Failed to auto-save notebook to server:', err);
          setLastSaved(now + ' (Lỗi đồng bộ - Đã lưu ngoại tuyến)');
        }
      }
      setIsSaving(false);
    }, 1000); // save after 1 second of inactivity

    return () => clearTimeout(timeout);
  }, [notes, token, isInitialLoading]);

  const handleManualSave = async () => {
    const now = new Date().toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });

    localStorage.setItem('jlpt_n3_notebook', notes);
    localStorage.setItem('jlpt_n3_notebook_time', now);
    setLastSaved(now);

    if (token) {
      setIsSaving(true);
      try {
        const res = await fetch(`${API_BASE_URL}/notebook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            type: 'global',
            originalId: 'global',
            note: notes
          })
        });
        if (res.ok) {
          setLastSaved(now + ' (Đồng bộ đám mây)');
          alert('Đã lưu và đồng bộ sổ tay lên đám mây thành công!');
        }
      } catch (err) {
        alert('Đã lưu ngoại tuyến. Không thể đồng bộ lên đám mây do lỗi kết nối.');
      } finally {
        setIsSaving(false);
      }
    } else {
      alert('Đã lưu vào bộ nhớ trình duyệt thành công! Đăng nhập để đồng bộ trực tuyến.');
    }
  };

  if (isInitialLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-secondary)' }}>
        <Loader2 className="animate-spin" size={36} style={{ color: 'var(--primary)', marginBottom: '12px' }} />
        <p>Đang nạp ghi chú...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Sổ tay Ghi chú Cá nhân</h1>
        <p className="page-description">
          Lưu trữ ghi chú học tập, các từ vựng dễ nhầm lẫn hoặc ngữ pháp cần lưu ý đặc biệt.
          {user ? ' Dữ liệu đã được đồng bộ hóa với tài khoản đám mây của bạn.' : ' Đăng nhập để đồng bộ hóa ghi chú trên mọi thiết bị.'}
        </p>
      </div>

      <div className="notebook-container">
        <textarea
          className="notebook-textarea"
          placeholder="Bắt đầu viết ghi chú học tập tại đây... Ví dụ:
- Cách phân biệt chữ 年 (Niên) và 午 (Ngọ)
- Mẫu ngữ pháp dễ nhầm: ~わけではない (không hẳn là) và ~わけがない (không đời nào)
- Chú ý phòng thi: Nên tô đáp án trắc nghiệm sau mỗi bài đọc, tránh để cuối giờ dồn toa..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          <div className="notebook-status">
            <FileText size={16} />
            {isSaving ? (
              <span>Đang lưu tự động...</span>
            ) : lastSaved ? (
              <span>Đã lưu tự động lần cuối lúc: {lastSaved}</span>
            ) : (
              <span>Sổ tay rỗng. Hãy viết gì đó để tự động lưu.</span>
            )}
          </div>

          <button className="action-btn" onClick={handleManualSave} style={{ gap: '6px', display: 'flex', alignItems: 'center' }}>
            <Save size={16} />
            <span>Lưu thủ công</span>
          </button>
        </div>
      </div>
    </div>
  );
}
