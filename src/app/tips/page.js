'use client';

import { Award, BookOpen, Clock, Compass, ShieldCheck } from 'lucide-react';

export default function TipsPage() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Cấu trúc Đề thi & Mẹo ôn luyện JLPT N3</h1>
        <p className="page-description">Tìm hiểu cấu trúc chi tiết của kì thi JLPT N3 thực tế và tham khảo chiến thuật phân bổ thời gian hiệu quả.</p>
      </div>

      <div className="tips-grid">
        {/* Exam Structure */}
        <div className="tip-card">
          <h2 className="tip-title">
            <Clock className="text-primary-light" size={20} />
            <span>Cấu trúc Đề thi JLPT N3 Chính thức</span>
          </h2>
          <div className="tip-content">
            <p style={{ marginBottom: '16px' }}>Đề thi JLPT N3 được chia thành 3 phần thi lớn riêng biệt:</p>
            <div className="list-table-wrapper" style={{ marginBottom: '16px' }}>
              <table className="list-table">
                <thead>
                  <tr>
                    <th>Phần thi</th>
                    <th>Thời gian làm bài</th>
                    <th>Số lượng câu hỏi chính</th>
                    <th>Điểm tối đa</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Phần 1: Kiến thức ngôn ngữ (Từ vựng)</strong></td>
                    <td>30 phút</td>
                    <td>~35 câu (Tìm cách đọc Kanji, Cách viết Hiragana, Chọn từ điền trống...)</td>
                    <td>60 điểm (Tính gộp chung với phần Ngữ pháp)</td>
                  </tr>
                  <tr>
                    <td><strong>Phần 2: Kiến thức ngôn ngữ (Ngữ pháp) & Đọc hiểu</strong></td>
                    <td>70 phút</td>
                    <td>
                      * Ngữ pháp: ~23 câu (Điền mẫu câu, Sắp xếp dấu sao, Ngữ pháp trong đoạn văn)<br />
                      * Đọc hiểu: ~16 câu (Đoản văn, Trung văn, Trường văn, Tìm kiếm thông tin)
                    </td>
                    <td>
                      * Ngữ pháp: Tính chung với Từ vựng<br />
                      * Đọc hiểu: 60 điểm
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Phần 3: Nghe hiểu (Choukai)</strong></td>
                    <td>40 phút</td>
                    <td>~28 câu (Nghe tranh, Nghe tìm ý chính, Nghe phản xạ phản hồi...)</td>
                    <td>60 điểm</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
              ⚠️ <strong>Lưu ý về điểm liệt:</strong> Mỗi phần thi (1. Từ vựng/Ngữ pháp, 2. Đọc hiểu, 3. Nghe hiểu) đều có mức điểm sàn liệt là <strong>19/60 điểm</strong>. Chỉ cần 1 phần dưới 19 điểm, bạn sẽ bị trượt bất kể tổng điểm cao đến đâu!
            </p>
          </div>
        </div>

        {/* Time Allocation Strategy */}
        <div className="tip-card">
          <h2 className="tip-title">
            <Compass className="text-primary-light" size={20} />
            <span>Phân bổ Thời gian Làm bài (Gợi ý tối ưu)</span>
          </h2>
          <div className="tip-content">
            <p style={{ marginBottom: '12px' }}>Đối với <strong>Phần 2 (Ngữ pháp & Đọc hiểu - 70 phút)</strong>, đây là phần dễ cháy giáo án nhất. Hãy áp dụng chiến thuật căn giờ sau:</p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Ngữ pháp (20 phút):</strong>
                <ul>
                  <li>Điền mẫu câu đơn: 10 phút (~30 giây/câu). Câu nào không biết bỏ qua ngay.</li>
                  <li>Sắp xếp dấu sao: 5 phút. Hãy ghép các cụm từ đi liền nhau trước.</li>
                  <li>Ngữ pháp đoạn văn: 5 phút. Chỉ đọc lướt xung quanh khoảng trống để điền liên từ/đầu đuôi.</li>
                </ul>
              </li>
              <li><strong>Đọc hiểu (50 phút):</strong>
                <ul>
                  <li>Đoản văn (4 bài - 15 phút): Đọc trực tiếp câu hỏi trước rồi quét thông tin bài.</li>
                  <li>Trung văn (2 bài - 15 phút): Mỗi bài đọc chia làm 3 câu hỏi tương ứng 3 đoạn nhỏ. Chia để trị.</li>
                  <li>Trường văn (1 bài - 10 phút): Đọc kĩ kết luận của tác giả thường nằm ở đoạn đầu hoặc đoạn cuối.</li>
                  <li>Tìm kiếm thông tin (1 bài - 10 phút): Thường là câu ăn điểm. Đọc kỹ điều kiện loại trừ của đề trước khi so sánh với bảng biểu quảng cáo.</li>
                </ul>
              </li>
            </ul>
          </div>
        </div>

        {/* Learning tips */}
        <div className="tip-card">
          <h2 className="tip-title">
            <ShieldCheck className="text-primary-light" size={20} />
            <span>Mẹo Ôn tập & Đi thi thực chiến</span>
          </h2>
          <div className="tip-content">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>💡 Mẹo học Từ vựng & Kanji:</h3>
                <ul style={{ fontSize: '13.5px', paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '6px' }}>Học từ vựng phải đi kèm với <strong>Hán Việt</strong>. Âm Hán Việt giúp bạn đoán nghĩa của các từ ghép lạ trong phòng thi rất tốt.</li>
                  <li style={{ marginBottom: '6px' }}>Mỗi từ vựng nên đọc lướt qua ít nhất 1 câu ví dụ đi kèm để hiểu văn cảnh sử dụng (tránh dùng sai từ đồng nghĩa).</li>
                  <li style={{ marginBottom: '6px' }}>Sử dụng tính năng Flashcard lướt nhanh hàng ngày thay vì cố ngồi viết thuộc từng chữ. Gặp đi gặp lại nhiều lần sẽ tự động nhớ.</li>
                </ul>
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>💡 Mẹo làm bài Nghe hiểu:</h3>
                <ul style={{ fontSize: '13.5px', paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '6px' }}>Tận dụng thời gian băng đọc hướng dẫn ban đầu (hơn 1 phút) để xem trước tranh vẽ hoặc đọc lướt các đáp án dạng chữ.</li>
                  <li style={{ marginBottom: '6px' }}>Phần 3 và 5 không in câu hỏi lên đề, bạn **bắt buộc phải ghi chép (memo)** lại nhân vật nói gì, tránh nghe xong quên sạch.</li>
                  <li style={{ marginBottom: '6px' }}>Tập phản xạ câu trả lời nhanh ở phần 4 (nghe phản xạ ngắn). Đây là dạng câu gỡ điểm cực nhanh nếu bạn quen cấu trúc chào hỏi xã giao, kính ngữ.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
