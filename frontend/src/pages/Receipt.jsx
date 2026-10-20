import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { toPng } from 'html-to-image';

function formatCurrency(value) {
  return `$${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function Receipt() {
  const location = useLocation();
  const receipt = location.state?.receipt;
  const receiptRef = useRef(null);
  const automaticDownloadStarted = useRef(false);
  const [downloadState, setDownloadState] = useState('preparing');

  const downloadReceipt = useCallback(async () => {
    if (!receiptRef.current) return;

    setDownloadState('preparing');
    try {
      const imageUrl = await toPng(receiptRef.current, {
        backgroundColor: '#0a0a0a',
        cacheBust: true,
        pixelRatio: 2
      });
      const downloadLink = document.createElement('a');
      downloadLink.download = `gadgetgo-receipt-${receipt.orderNumber}.png`;
      downloadLink.href = imageUrl;
      downloadLink.click();
      setDownloadState('downloaded');
    } catch (error) {
      console.error('Receipt PNG generation failed:', error);
      setDownloadState('failed');
    }
  }, [receipt]);

  useEffect(() => {
    if (!receipt || automaticDownloadStarted.current) return;
    automaticDownloadStarted.current = true;
    downloadReceipt();
  }, [downloadReceipt, receipt]);

  if (!receipt || !Array.isArray(receipt.items) || receipt.items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const addressLines = [
    receipt.shipping.address,
    [receipt.shipping.city, receipt.shipping.postalCode].filter(Boolean).join(', '),
    receipt.shipping.country
  ].filter(Boolean);

  const labelStyle = {
    color: 'var(--text-muted)',
    fontSize: '0.64rem',
    letterSpacing: '0.14em'
  };
  const valueStyle = {
    color: 'var(--text-primary)',
    fontSize: '0.8rem',
    overflowWrap: 'anywhere'
  };

  return (
    <main
      style={{
        minHeight: 'calc(100vh - 120px)',
        backgroundColor: 'var(--bg-black)',
        color: 'var(--text-primary)',
        padding: '44px 20px 80px'
      }}
    >
      <div style={{ maxWidth: '840px', margin: '0 auto' }}>
        <section
          ref={receiptRef}
          style={{
            backgroundColor: '#0a0a0a',
            border: '1px solid #333333',
            padding: 'clamp(22px, 6vw, 48px)',
            fontFamily: 'var(--font-sans)'
          }}
        >
          <header
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '20px',
              flexWrap: 'wrap',
              paddingBottom: '24px',
              borderBottom: '1px solid #333333'
            }}
          >
            <div>
              <p
                style={{
                  marginBottom: '8px',
                  color: '#999999',
                  fontSize: '0.62rem',
                  letterSpacing: '0.22em'
                }}
              >
                GADGETGO / MONOCHROME ATELIER
              </p>
              <h1
                style={{
                  fontSize: '1.55rem',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase'
                }}
              >
                Order Receipt
              </h1>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={labelStyle}>ORDER NUMBER</p>
              <p style={{ ...valueStyle, marginTop: '6px', fontWeight: '700' }}>
                {receipt.orderNumber}
              </p>
              <p style={{ ...labelStyle, marginTop: '12px' }}>DATE</p>
              <p style={{ ...valueStyle, marginTop: '6px' }}>
                {formatDate(receipt.createdAt)}
              </p>
            </div>
          </header>

          <section
            aria-label="Customer and delivery details"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '28px',
              padding: '24px 0',
              borderBottom: '1px solid #333333'
            }}
          >
            <div>
              <h2 style={{ ...labelStyle, marginBottom: '14px' }}>CUSTOMER</h2>
              <p style={valueStyle}>{receipt.user.username}</p>
              <p style={{ ...valueStyle, marginTop: '7px' }}>{receipt.user.email}</p>
            </div>
            <div>
              <h2 style={{ ...labelStyle, marginBottom: '14px' }}>DELIVER TO</h2>
              <p style={valueStyle}>{receipt.shipping.fullName}</p>
              {addressLines.map((line, index) => (
                <p key={`${line}-${index}`} style={{ ...valueStyle, marginTop: '7px' }}>
                  {line}
                </p>
              ))}
            </div>
          </section>

          <section style={{ padding: '24px 0' }}>
            <h2 style={{ ...labelStyle, marginBottom: '14px' }}>ORDER ITEMS</h2>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  minWidth: '480px',
                  borderCollapse: 'collapse',
                  textAlign: 'left'
                }}
              >
                <thead>
                  <tr>
                    {['ITEM', 'UNIT PRICE', 'QTY', 'TOTAL'].map((heading) => (
                      <th
                        key={heading}
                        scope="col"
                        style={{
                          padding: '12px 8px',
                          borderBottom: '1px solid #444444',
                          color: '#999999',
                          fontSize: '0.62rem',
                          letterSpacing: '0.1em'
                        }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {receipt.items.map((item) => (
                    <tr key={item.id}>
                      <td style={{ padding: '14px 8px', borderBottom: '1px solid #222222' }}>
                        <p style={{ ...valueStyle, fontWeight: '600' }}>{item.title}</p>
                        {item.category && (
                          <p style={{ ...labelStyle, marginTop: '5px' }}>{item.category}</p>
                        )}
                      </td>
                      <td style={{ ...valueStyle, padding: '14px 8px', borderBottom: '1px solid #222222', whiteSpace: 'nowrap' }}>
                        {formatCurrency(item.price)}
                      </td>
                      <td style={{ ...valueStyle, padding: '14px 8px', borderBottom: '1px solid #222222' }}>
                        {item.quantity}
                      </td>
                      <td style={{ ...valueStyle, padding: '14px 8px', borderBottom: '1px solid #222222', whiteSpace: 'nowrap' }}>
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section
            aria-label="Receipt totals"
            style={{
              maxWidth: '340px',
              marginLeft: 'auto',
              paddingTop: '18px',
              borderTop: '1px solid #444444'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', padding: '7px 0' }}>
              <span style={labelStyle}>SUBTOTAL</span>
              <span style={valueStyle}>{formatCurrency(receipt.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', padding: '7px 0' }}>
              <span style={labelStyle}>SHIPPING</span>
              <span style={valueStyle}>
                {receipt.shippingFee === 0 ? 'COMPLIMENTARY' : formatCurrency(receipt.shippingFee)}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '20px',
                paddingTop: '15px',
                marginTop: '8px',
                borderTop: '1px solid #444444'
              }}
            >
              <span style={{ ...labelStyle, color: '#ffffff', fontWeight: '700' }}>TOTAL</span>
              <span style={{ ...valueStyle, fontSize: '1rem', fontWeight: '800' }}>
                {formatCurrency(receipt.grandTotal)}
              </span>
            </div>
          </section>

          <footer
            style={{
              paddingTop: '24px',
              marginTop: '24px',
              borderTop: '1px solid #333333',
              color: '#999999',
              fontSize: '0.67rem',
              letterSpacing: '0.08em',
              textAlign: 'center'
            }}
          >
            THANK YOU FOR SHOPPING WITH GADGETGO
          </footer>
        </section>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            marginTop: '18px'
          }}
        >
          <p role="status" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            {downloadState === 'preparing'
              ? 'Preparing your PNG receipt…'
              : downloadState === 'downloaded'
                ? 'Your receipt download has started.'
                : 'Automatic download failed. Use the button to try again.'}
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-tech"
              onClick={downloadReceipt}
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--text-primary)',
                color: 'var(--bg-black)',
                border: 'none',
                fontSize: '0.68rem',
                fontWeight: '700',
                letterSpacing: '0.12em',
                cursor: 'pointer'
              }}
            >
              DOWNLOAD PNG
            </button>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '12px 16px',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-light)',
                fontSize: '0.68rem',
                fontWeight: '700',
                letterSpacing: '0.12em',
                textDecoration: 'none'
              }}
            >
              RETURN TO STORE
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}