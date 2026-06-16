'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Check, ShieldCheck, ArrowLeft, Loader2, Sparkles, CreditCard, QrCode } from 'lucide-react';
import Link from 'next/link';

const API_BASE_URL = 'http://localhost:5000/api';

export default function PricingPage() {
  const { user, token, isVip, subscription, checkSubscription, loading } = useAuth();
  const router = useRouter();

  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [checkoutTx, setCheckoutTx] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/membership/plans`);
        if (res.ok) {
          const data = await res.json();
          setPlans(data);
        }
      } catch (err) {
        console.error('Failed to fetch pricing plans:', err);
      } finally {
        setPlansLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const checkPaymentStatus = async (silent = false) => {
    if (!checkoutTx || !token) return false;
    if (!silent) setPaymentLoading(true);
    
    try {
      const res = await fetch(`${API_BASE_URL}/membership/transactions/${checkoutTx._id}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'completed') {
          setSuccessMsg('Thanh toán thành công! Gói VIP đã được kích hoạt tự động. 🎉');
          await checkSubscription(token);
          
          setTimeout(() => {
            setCheckoutTx(null);
            setSelectedPlan(null);
            setSuccessMsg('');
            router.push('/');
          }, 3000);
          return true;
        } else {
          // If manually checked and still pending
          if (!silent) {
            alert('Hệ thống chưa nhận được tín hiệu thanh toán chuyển khoản của bạn. Nếu bạn đã chuyển tiền thành công, vui lòng đợi 10-30 giây để hệ thống ngân hàng cập nhật hoặc liên hệ Admin hỗ trợ.');
          }
        }
      }
    } catch (err) {
      console.error('Failed to check payment status:', err);
    } finally {
      if (!silent) setPaymentLoading(false);
    }
    return false;
  };

  useEffect(() => {
    let intervalId = null;
    
    if (checkoutTx && token && !successMsg) {
      // Poll every 5 seconds
      intervalId = setInterval(async () => {
        const completed = await checkPaymentStatus(true);
        if (completed) {
          clearInterval(intervalId);
        }
      }, 5000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [checkoutTx, token, successMsg]);

  const handleSubscribe = async (plan) => {
    if (!user) {
      router.push('/auth');
      return;
    }
    
    setSelectedPlan(plan);
    setPaymentLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/membership/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planId: plan._id,
          paymentMethod: 'bank_transfer'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCheckoutTx(data.transaction);
      } else {
        const error = await res.json();
        alert(error.message || 'Lỗi khi khởi tạo thanh toán');
      }
    } catch (err) {
      console.error(err);
      alert('Không thể kết nối đến máy chủ.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!checkoutTx || !token) return;
    setPaymentLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/membership/simulate-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          transactionId: checkoutTx.transactionId
        })
      });

      if (res.ok) {
        await checkPaymentStatus(false);
      } else {
        const error = await res.json();
        alert(error.message || 'Lỗi khi kích hoạt');
      }
    } catch (err) {
      console.error(err);
      alert('Không thể kết nối máy chủ.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading || plansLoading) {
    return (
      <div className="pricing-loading">
        <Loader2 className="spinner animate-spin" size={36} />
        <p>Đang tải bảng giá dịch vụ...</p>
      </div>
    );
  }

  return (
    <div className="pricing-wrapper fade-in">
      <Link href="/" className="back-btn">
        <ArrowLeft size={16} />
        <span>Quay lại Dashboard</span>
      </Link>

      <div className="pricing-container">
        {/* Header */}
        <div className="pricing-header">
          <Sparkles className="header-icon" size={36} />
          <h1>Nâng Cấp Thành Viên VIP</h1>
          <p className="description">
            Đồng hành cùng JLPT Hub để chinh phục điểm tuyệt đối kỳ thi JLPT N3. Mở khóa 100% kho đề và tính năng cao cấp.
          </p>
        </div>

        {/* VIP Info Banner */}
        {isVip && subscription && (
          <div className="vip-active-banner">
            <ShieldCheck className="vip-banner-icon" size={24} />
            <div>
              <h3>Tài khoản VIP Đang Hoạt Động!</h3>
              <p>
                Gói đang dùng: <strong>{subscription.planId?.title || 'VIP'}</strong> — Có hiệu lực đến ngày:{' '}
                <strong>{formatDate(subscription.endDate)}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Main Content (Plans or Checkout) */}
        {!checkoutTx ? (
          <div className="plans-grid">
            {plans.map((plan) => (
              <div 
                key={plan._id} 
                className={`plan-card ${plan.price > 150000 ? 'lifetime-card' : ''}`}
              >
                {plan.price > 150000 && (
                  <div className="popular-badge">👑 TRỌN ĐỜI TIẾT KIỆM nhất</div>
                )}
                
                <h2 className="plan-title">{plan.title}</h2>
                <p className="plan-desc">{plan.description}</p>
                
                <div className="plan-price-row">
                  <span className="price-amount">{formatPrice(plan.price)}</span>
                  <span className="price-duration">
                    {plan.durationDays > 365 ? 'sở hữu vĩnh viễn' : `/ ${plan.durationDays} ngày`}
                  </span>
                </div>

                <div className="plan-divider" />

                <ul className="plan-features">
                  {plan.features.map((feat, idx) => (
                    <li key={idx}>
                      <Check className="feature-check" size={16} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  className={`subscribe-btn ${plan.price > 150000 ? 'lifetime' : ''}`}
                  onClick={() => handleSubscribe(plan)}
                  disabled={paymentLoading || (isVip && plan.durationDays < 365)}
                >
                  {isVip ? 'Gia hạn gói VIP' : 'Mua ngay'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* Mock Bank Checkout Interface */
          <div className="checkout-card">
            <h2>Hóa Đơn Thanh Toán</h2>
            <p className="checkout-subtitle">Mã hóa đơn: <strong>{checkoutTx.transactionId}</strong></p>

            <div className="checkout-body">
              {successMsg ? (
                <div className="checkout-success-state fade-in">
                  <div className="success-icon animate-bounce">🎉</div>
                  <h3>{successMsg}</h3>
                  <p>Hệ thống đang chuyển bạn về trang chủ...</p>
                </div>
              ) : (
                <>
                  <div className="bank-info-panel">
                    <h3>Thông tin chuyển khoản Ngân hàng (VietinBank)</h3>
                    <div className="info-row">
                      <span>Số tài khoản:</span>
                      <strong>101882913508</strong>
                    </div>
                    <div className="info-row">
                      <span>Tên chủ thẻ:</span>
                      <strong>NGUYEN DUC MINH</strong>
                    </div>
                    <div className="info-row">
                      <span>Số tiền:</span>
                      <strong className="amount">{formatPrice(checkoutTx.amount)}</strong>
                    </div>
                    <div className="info-row">
                      <span>Cú pháp chuyển khoản:</span>
                      <strong className="content-code">SEVQR JLPTHUB{checkoutTx.transactionId}</strong>
                    </div>
                    <div className="payment-warning">
                      * Chuyển đúng số tiền và cú pháp bắt buộc trên để hệ thống tự động nhận dạng và kích hoạt VIP ngay lập tức.
                    </div>
                  </div>

                  <div className="qr-panel">
                    <img 
                      src={`https://img.vietqr.io/image/vietinbank-101882913508-compact2.png?amount=${checkoutTx.amount}&addInfo=SEVQR%20JLPTHUB${checkoutTx.transactionId}&accountName=NGUYEN%20DUC%20MINH`}
                      alt="VietQR VietinBank"
                      className="vietqr-img"
                    />
                    <p className="qr-caption">Quét mã VietQR để tự động điền thông tin</p>

                    <button 
                      className="check-payment-btn"
                      onClick={() => checkPaymentStatus(false)}
                      disabled={paymentLoading}
                    >
                      {paymentLoading ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          <span>Đang xác thực giao dịch...</span>
                        </>
                      ) : (
                        <span>Tôi đã chuyển khoản thành công ⚡</span>
                      )}
                    </button>

                    <button 
                      className="simulate-success-btn"
                      onClick={handleSimulatePayment}
                      disabled={paymentLoading}
                      style={{ fontSize: '10px', padding: '6px', opacity: 0.7, background: '#1e293b', marginTop: '12px' }}
                    >
                      Giả lập thanh toán (Developer Test)
                    </button>
                    
                    <button 
                      className="cancel-checkout-btn"
                      onClick={() => { setCheckoutTx(null); setSelectedPlan(null); }}
                    >
                      Hủy giao dịch
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .pricing-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          color: var(--text-secondary);
          gap: 12px;
        }
        .pricing-loading .spinner {
          color: var(--primary);
        }
        .pricing-wrapper {
          padding: 40px 24px;
          min-height: 100vh;
          background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.05) 0%, transparent 40%), var(--bg-color);
        }
        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          background: var(--card-bg);
          margin-bottom: 32px;
          transition: var(--transition);
        }
        .back-btn:hover {
          color: var(--text-primary);
          border-color: var(--primary);
        }
        .pricing-container {
          max-width: 960px;
          margin: 0 auto;
        }
        .pricing-header {
          text-align: center;
          margin-bottom: 48px;
        }
        .header-icon {
          color: var(--primary-light);
          margin-bottom: 16px;
          animation: pulse 2s infinite;
        }
        .pricing-header h1 {
          font-size: 32px;
          font-weight: 850;
          margin-bottom: 8px;
          background: var(--primary-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .description {
          color: var(--text-secondary);
          font-size: 15px;
          max-width: 600px;
          margin: 0 auto;
        }
        .vip-active-banner {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: var(--success);
          padding: 16px 24px;
          border-radius: var(--radius-lg);
          margin-bottom: 40px;
        }
        .vip-banner-icon {
          color: var(--success);
        }
        .vip-active-banner h3 {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 2px;
        }
        .vip-active-banner p {
          font-size: 14px;
          opacity: 0.9;
        }
        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 32px;
        }
        .plan-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 36px;
          position: relative;
          box-shadow: var(--shadow-md);
          display: flex;
          flex-direction: column;
          transition: var(--transition);
        }
        .plan-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
          border-color: rgba(99, 102, 241, 0.2);
        }
        .lifetime-card {
          border-color: var(--primary);
          background: linear-gradient(180deg, rgba(99, 102, 241, 0.04) 0%, transparent 100%), var(--card-bg);
        }
        .popular-badge {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--primary-gradient);
          color: white;
          padding: 4px 16px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          box-shadow: 0 4px 10px rgba(99, 102, 241, 0.25);
        }
        .plan-title {
          font-size: 20px;
          font-weight: 800;
          margin-bottom: 8px;
        }
        .plan-desc {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 24px;
          min-height: 40px;
        }
        .plan-price-row {
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
        }
        .price-amount {
          font-size: 32px;
          font-weight: 900;
          color: var(--text-primary);
        }
        .price-duration {
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 600;
        }
        .plan-divider {
          height: 1px;
          background: var(--border-color);
          margin-bottom: 24px;
        }
        .plan-features {
          list-style: none;
          margin-bottom: 32px;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .plan-features li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 14px;
          color: var(--text-secondary);
        }
        .feature-check {
          color: var(--primary-light);
          flex-shrink: 0;
          margin-top: 2px;
        }
        .subscribe-btn {
          width: 100%;
          padding: 14px;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition);
        }
        .subscribe-btn:hover {
          background: var(--card-bg-hover);
          border-color: var(--text-secondary);
        }
        .subscribe-btn.lifetime {
          background: var(--primary-gradient);
          color: white;
          border: none;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
        }
        .subscribe-btn.lifetime:hover {
          opacity: 0.95;
        }
        .subscribe-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Checkout Styles */
        .checkout-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 40px;
          box-shadow: var(--shadow-lg);
          max-width: 720px;
          margin: 0 auto;
        }
        .checkout-card h2 {
          font-size: 24px;
          font-weight: 800;
          text-align: center;
          margin-bottom: 4px;
        }
        .checkout-subtitle {
          text-align: center;
          color: var(--text-secondary);
          font-size: 14px;
          margin-bottom: 32px;
        }
        .checkout-body {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 32px;
        }
        @media (max-width: 640px) {
          .checkout-body {
            grid-template-columns: 1fr;
          }
        }
        .bank-info-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .bank-info-panel h3 {
          font-size: 15px;
          font-weight: 750;
          color: var(--text-primary);
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 8px;
        }
        .info-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .info-row span {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 600;
        }
        .info-row strong {
          font-size: 15px;
          color: var(--text-primary);
        }
        .info-row strong.amount {
          font-size: 20px;
          color: var(--warning);
          font-weight: 850;
        }
        .info-row strong.content-code {
          background: rgba(99, 102, 241, 0.08);
          border: 1px dashed rgba(99, 102, 241, 0.2);
          color: var(--primary-light);
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-family: monospace;
          align-self: flex-start;
          letter-spacing: 0.5px;
        }
        .payment-warning {
          font-size: 11px;
          color: var(--text-muted);
          font-style: italic;
          margin-top: 8px;
        }
        .qr-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .vietqr-img {
          width: 170px;
          height: 170px;
          background: white;
          padding: 8px;
          border-radius: var(--radius-md);
          margin-bottom: 12px;
          object-fit: contain;
        }
        .qr-caption {
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 16px;
        }
        .check-payment-btn {
          width: 100%;
          padding: 12px;
          background: var(--success);
          color: white;
          border: none;
          font-weight: 750;
          border-radius: var(--radius-md);
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.25);
          transition: var(--transition);
        }
        .check-payment-btn:hover {
          opacity: 0.95;
        }
        .simulate-success-btn {
          width: 100%;
          padding: 12px;
          background: var(--primary-gradient);
          color: white;
          border: none;
          font-weight: 750;
          border-radius: var(--radius-md);
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(99, 102, 241, 0.25);
          margin-bottom: 12px;
          transition: var(--transition);
        }
        .simulate-success-btn:hover {
          opacity: 0.95;
        }
        .cancel-checkout-btn {
          width: 100%;
          padding: 10px;
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-weight: 600;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: var(--transition);
        }
        .cancel-checkout-btn:hover {
          background: rgba(239, 68, 68, 0.05);
          border-color: rgba(239, 68, 68, 0.2);
          color: var(--danger);
        }
        .checkout-success-state {
          grid-column: 1 / span 2;
          text-align: center;
          padding: 40px 0;
        }
        .success-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        .checkout-success-state h3 {
          font-size: 20px;
          font-weight: 800;
          color: var(--success);
          margin-bottom: 8px;
        }
        .checkout-success-state p {
          color: var(--text-secondary);
          font-size: 14px;
        }
        .animate-bounce {
          animation: bounce 1s infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
