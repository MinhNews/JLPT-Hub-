'use client';

import { useState, useEffect } from 'react';
import { MapPin, Info, ExternalLink, Calendar, CheckSquare, Square } from 'lucide-react';

export default function ResourcesPage() {
  const [items, setItems] = useState([
    { id: 1, text: 'Phiếu báo danh dự thi (Test Voucher) - Bản gốc', checked: false },
    { id: 2, text: 'Căn cước công dân (CCCD) / Hộ chiếu (bản gốc hợp lệ)', checked: false },
    { id: 3, text: 'Bút chì 2B hoặc 3B (ít nhất 2 cây gọt sẵn để tô đáp án)', checked: false },
    { id: 4, text: 'Tẩy bút chì loại tốt (không bị lem nhem khi tẩy)', checked: false },
    { id: 5, text: 'Đồng hồ đeo tay kim (không sử dụng smartwatch hay đồng hồ điện tử phát tiếng)', checked: false },
    { id: 6, text: 'Chai nước lọc nhựa trong suốt (phải bóc sạch hoàn toàn nhãn mác thương hiệu)', checked: false },
  ]);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('jlpt_exam_checklist');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const toggleItem = (id) => {
    const nextItems = items.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setItems(nextItems);
    localStorage.setItem('jlpt_exam_checklist', JSON.stringify(nextItems));
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Thông tin Phòng thi & Tài liệu N3</h1>
        <p className="page-description">Theo dõi lịch thi, phòng thi tại Đà Nẵng và danh sách chuẩn bị đồ dùng mang vào phòng thi.</p>
      </div>

      <div className="dashboard-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Danang Exam Room Info */}
          <div className="dashboard-card">
            <h2 className="dashboard-card-title">
              <MapPin className="text-primary-light" size={20} />
              <span>Điểm thi JLPT tại Đà Nẵng</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14.5px', color: 'var(--text-secondary)' }}>
              <p>
                <strong>📍 Địa điểm:</strong> Trường Đại học Ngoại ngữ - Đại học Đà Nẵng.
              </p>
              <p>
                <strong>🏢 Địa chỉ:</strong> 131 Lương Nhữ Hộc, Khuê Trung, Cẩm Lệ, Đà Nẵng.
              </p>
              <div style={{
                padding: '12px 16px',
                background: 'var(--bg-color)',
                borderLeft: '3px solid var(--primary)',
                borderRadius: '4px',
                fontSize: '13.5px'
              }}>
                <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>💡 Cách tra cứu Số báo danh & Phòng thi:</p>
                Trang web chính thức của Hội đồng thi Đà Nẵng là <a href="http://jlpt.ufl.udn.vn/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-light)', textDecoration: 'underline' }}>jlpt.ufl.udn.vn <ExternalLink size={12} style={{ display: 'inline' }} /></a>. 
                Trong trường hợp trang web quá tải không truy cập được (thường xảy ra sát ngày thi), bạn có thể kiểm tra danh sách phòng thi cập nhật trên fanpage của trường Đại học Ngoại ngữ hoặc xem bảng thông báo dán trực tiếp tại cổng trường trước ngày thi 1 ngày.
              </div>
            </div>
          </div>

          {/* Useful links */}
          <div className="dashboard-card">
            <h2 className="dashboard-card-title">
              <Info className="text-primary-light" size={20} />
              <span>Liên kết Học tập Hữu ích</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <a
                href="https://www.vnjpclub.com/mimikara-n3-tu-vung"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-link"
                style={{ justifyContent: 'space-between', border: '1px solid var(--border-color)' }}
              >
                <span>📖 Giáo trình Từ Vựng Mimikara N3 - VNJP Club</span>
                <ExternalLink size={16} />
              </a>

              <a
                href="https://www.vnjpclub.com/mimi-kara-n3-bunpo/"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-link"
                style={{ justifyContent: 'space-between', border: '1px solid var(--border-color)' }}
              >
                <span>✏️ Giáo trình Ngữ Pháp Mimikara N3 - VNJP Club</span>
                <ExternalLink size={16} />
              </a>

              <a
                href="https://www.vnjpclub.com/mimi-kara-n3-chokai/"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-link"
                style={{ justifyContent: 'space-between', border: '1px solid var(--border-color)' }}
              >
                <span>🎧 Luyện nghe Nghe hiểu Mimikara N3 - VNJP Club</span>
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Bring Checklist */}
        <div className="dashboard-card" style={{ height: 'fit-content' }}>
          <h2 className="dashboard-card-title">
            <CheckSquare className="text-primary-light" size={20} />
            <span>Checklist Ngày Thi</span>
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Đánh dấu những vật dụng bạn đã chuẩn bị sẵn sàng cho kì thi sắp tới:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px',
                  background: item.checked ? 'var(--success-glow)' : 'var(--bg-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                <div style={{ marginTop: '2px', color: item.checked ? 'var(--success)' : 'var(--text-muted)' }}>
                  {item.checked ? <CheckSquare size={18} /> : <Square size={18} />}
                </div>
                <span style={{
                  fontSize: '13.5px',
                  color: item.checked ? 'var(--text-primary)' : 'var(--text-secondary)',
                  textDecoration: item.checked ? 'line-through' : 'none'
                }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
