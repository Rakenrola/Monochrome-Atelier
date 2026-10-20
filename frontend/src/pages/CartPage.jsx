import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  removeFromCart,
  updateQuantity,
  clearCart
} from '../store/cartSlice';

export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector((state) => state.cart?.items || []);
  const user = useSelector((state) => state.auth?.user);

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('gcash'); // 'gcash' | 'cod' | 'bank'
  const [shippingData, setShippingData] = useState({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'PHILIPPINES',
    gcashNumber: '',
    gcashRefNumber: '',
    bankAccountName: '',
    bankRefNumber: ''
  });

  const [formErrors, setFormErrors] = useState({});

  // Financial Calculations
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0
  );
  const shippingFee = subtotal > 200 || subtotal === 0 ? 0 : 25;
  const grandTotal = subtotal + shippingFee;

  const handleInputChange = (field, value) => {
    setShippingData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    if (!user) {
      setIsCheckoutOpen(false);
      return;
    }

    const errors = {};

    if (!shippingData.fullName.trim()) errors.fullName = 'REQUIRED';
    if (!shippingData.address.trim()) errors.address = 'REQUIRED';
    if (!shippingData.city.trim()) errors.city = 'REQUIRED';

    if (paymentMethod === 'gcash') {
      if (!shippingData.gcashNumber.trim()) errors.gcashNumber = 'REQUIRED';
      if (!shippingData.gcashRefNumber.trim()) errors.gcashRefNumber = 'REQUIRED';
    }

    if (paymentMethod === 'bank') {
      if (!shippingData.bankAccountName.trim()) errors.bankAccountName = 'REQUIRED';
      if (!shippingData.bankRefNumber.trim()) errors.bankRefNumber = 'REQUIRED';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const orderDate = new Date();
    const receipt = {
      orderNumber: `GG-${orderDate.getTime()}`,
      createdAt: orderDate.toISOString(),
      user: {
        username: user.username,
        email: user.email
      },
      shipping: {
        fullName: shippingData.fullName.trim(),
        address: shippingData.address.trim(),
        city: shippingData.city.trim(),
        postalCode: shippingData.postalCode.trim(),
        country: shippingData.country.trim()
      },
      items: cartItems.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        price: Number(item.price),
        quantity: item.quantity || 1
      })),
      subtotal,
      shippingFee,
      grandTotal
    };

    dispatch(clearCart());
    setIsCheckoutOpen(false);
    navigate('/receipt', { state: { receipt } });
  };

  // Reusable input styling for ultra high visibility
  const highVisibilityInputStyle = (hasError) => ({
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid #333333',
    borderBottom: hasError ? '2px solid #ffffff' : '1px solid #666666',
    color: '#ffffff',
    padding: '12px 14px',
    fontSize: '0.88rem',
    outline: 'none',
    letterSpacing: '0.05em',
    boxSizing: 'border-box'
  });

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-black)',
        minHeight: 'calc(100vh - 120px)',
        color: 'var(--text-primary)',
        padding: '50px 24px 100px'
      }}
    >
      <div
        className="animate-hero-entry"
        style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}
      >
        {/* Page Title */}
        <h1
          style={{
            fontSize: '1.4rem',
            letterSpacing: '0.25em',
            fontWeight: '700',
            textTransform: 'uppercase',
            marginBottom: '40px',
            borderBottom: '1px solid var(--border-dark)',
            paddingBottom: '16px'
          }}
        >
          YOUR CART ({cartItems.length})
        </h1>

        {cartItems.length === 0 ? (
          /* Empty Cart View */
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              border: '1px dashed var(--border-dark)'
            }}
          >
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.15em',
                marginBottom: '25px',
                textTransform: 'uppercase'
              }}
            >
              YOUR BAG IS CURRENTLY EMPTY
            </p>
            <Link
              to="/"
              className="btn-tech"
              style={{
                padding: '14px 32px',
                backgroundColor: 'var(--text-primary)',
                color: '#000000',
                textDecoration: 'none',
                fontSize: '0.75rem',
                fontWeight: '700',
                letterSpacing: '0.2em',
                display: 'inline-block'
              }}
            >
              EXPLORE HARDWARE
            </Link>
          </div>
        ) : (
          /* Cart Grid Layout */
          <div
            className="cart-grid-layout"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 360px',
              gap: '50px',
              alignItems: 'start'
            }}
          >
            {/* Item List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="cart-item-row"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-dark)',
                    padding: '20px',
                    display: 'grid',
                    gridTemplateColumns: '90px 1fr auto',
                    gap: '20px',
                    alignItems: 'center'
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: '90px',
                      height: '70px',
                      backgroundColor: 'var(--bg-subtle)',
                      overflow: 'hidden'
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  {/* Info */}
                  <div>
                    <span
                      style={{
                        fontSize: '0.62rem',
                        letterSpacing: '0.15em',
                        color: 'var(--text-muted)',
                        display: 'block',
                        marginBottom: '4px'
                      }}
                    >
                      {item.category || 'COMPONENTS'}
                    </span>
                    <h3
                      style={{
                        fontSize: '0.9rem',
                        letterSpacing: '0.08em',
                        fontWeight: '600',
                        marginBottom: '8px'
                      }}
                    >
                      {item.title}
                    </h3>
                    <button
                      type="button"
                      onClick={() => dispatch(removeFromCart(item.id))}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '0.65rem',
                        letterSpacing: '0.15em',
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline'
                      }}
                      onMouseOver={(e) => (e.target.style.color = 'var(--text-primary)')}
                      onMouseOut={(e) => (e.target.style.color = 'var(--text-muted)')}
                    >
                      REMOVE
                    </button>
                  </div>

                  {/* Quantity & Price */}
                  <div
                    className="cart-item-price-col"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '12px'
                    }}
                  >
                    <span style={{ fontSize: '0.95rem', fontWeight: '700' }}>
                      ${(item.price * (item.quantity || 1)).toLocaleString()}
                    </span>

                    {/* Quantity Selector */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        border: '1px solid var(--border-dark)'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          dispatch(
                            updateQuantity({
                              id: item.id,
                              quantity: Math.max(1, (item.quantity || 1) - 1)
                            })
                          )
                        }
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-primary)',
                          width: '28px',
                          height: '28px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        -
                      </button>
                      <span
                        style={{
                          padding: '0 10px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}
                      >
                        {item.quantity || 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          dispatch(
                            updateQuantity({
                              id: item.id,
                              quantity: (item.quantity || 1) + 1
                            })
                          )
                        }
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-primary)',
                          width: '28px',
                          height: '28px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary Box */}
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-dark)',
                padding: '28px'
              }}
            >
              <h2
                style={{
                  fontSize: '0.9rem',
                  letterSpacing: '0.2em',
                  fontWeight: '700',
                  marginBottom: '25px',
                  borderBottom: '1px solid var(--border-dark)',
                  paddingBottom: '12px'
                }}
              >
                ORDER SUMMARY
              </h2>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.08em',
                  marginBottom: '25px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>SUBTOTAL</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    ${subtotal.toLocaleString()}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>EXPRESS SHIPPING</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {shippingFee === 0 ? 'COMPLIMENTARY' : `$${shippingFee}`}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justify: 'space-between',
                    borderTop: '1px solid var(--border-dark)',
                    paddingTop: '16px',
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    color: 'var(--text-primary)'
                  }}
                >
                  <span>TOTAL</span>
                  <span>${grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <button
                type="button"
                className="btn-tech"
                disabled={!user}
                onClick={() => {
                  if (user) setIsCheckoutOpen(true);
                }}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: user ? 'var(--text-primary)' : '#555555',
                  color: user ? '#000000' : '#bbbbbb',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  letterSpacing: '0.22em',
                  cursor: user ? 'pointer' : 'not-allowed'
                }}
                onMouseOver={(e) => {
                  if (user) e.target.style.backgroundColor = '#cccccc';
                }}
                onMouseOut={(e) => {
                  if (user) e.target.style.backgroundColor = 'var(--text-primary)';
                }}
              >
                PROCEED TO CHECKOUT
              </button>
              {!user && (
                <p
                  style={{
                    marginTop: '14px',
                    fontSize: '0.72rem',
                    lineHeight: 1.6,
                    color: 'var(--text-muted)',
                    textAlign: 'center'
                  }}
                >
                  Sign in or create an account to continue. Your cart will be kept.
                  {' '}
                  <Link to="/login" style={{ color: 'var(--text-primary)' }}>
                    SIGN IN / REGISTER
                  </Link>
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------------------- */}
      {/* CHECKOUT DRAWER WITH HIGH-CONTRAST VISIBLE FORM FIELDS                     */}
      {/* -------------------------------------------------------------------------- */}
      {isCheckoutOpen && (
        <div className="modal-backdrop" onClick={() => setIsCheckoutOpen(false)}>
          <div className="shipping-modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-dark)',
                paddingBottom: '18px',
                marginBottom: '28px'
              }}
            >
              <h2
                style={{
                  fontSize: '0.9rem',
                  letterSpacing: '0.22em',
                  fontWeight: '700',
                  textTransform: 'uppercase'
                }}
              >
                CHECKOUT DETAILS
              </h2>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Recipient Name */}
              <div>
                <label style={{ fontSize: '0.68rem', letterSpacing: '0.18em', color: '#ffffff', fontWeight: '700', display: 'block', marginBottom: '8px' }}>
                  RECIPIENT NAME
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Mercer"
                  value={shippingData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  style={highVisibilityInputStyle(formErrors.fullName)}
                />
                {formErrors.fullName && (
                  <span style={{ fontSize: '0.62rem', color: '#ffffff', marginTop: '4px', display: 'block', fontWeight: 'bold' }}>
                    * {formErrors.fullName}
                  </span>
                )}
              </div>

              {/* Street Address */}
              <div>
                <label style={{ fontSize: '0.68rem', letterSpacing: '0.18em', color: '#ffffff', fontWeight: '700', display: 'block', marginBottom: '8px' }}>
                  SHIPPING ADDRESS
                </label>
                <input
                  type="text"
                  placeholder="Street, Building, Unit Number"
                  value={shippingData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  style={highVisibilityInputStyle(formErrors.address)}
                />
                {formErrors.address && (
                  <span style={{ fontSize: '0.62rem', color: '#ffffff', marginTop: '4px', display: 'block', fontWeight: 'bold' }}>
                    * {formErrors.address}
                  </span>
                )}
              </div>

              {/* City & Postal Code */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.68rem', letterSpacing: '0.18em', color: '#ffffff', fontWeight: '700', display: 'block', marginBottom: '8px' }}>
                    CITY
                  </label>
                  <input
                    type="text"
                    placeholder="City"
                    value={shippingData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    style={highVisibilityInputStyle(formErrors.city)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.68rem', letterSpacing: '0.18em', color: '#ffffff', fontWeight: '700', display: 'block', marginBottom: '8px' }}>
                    POSTAL CODE
                  </label>
                  <input
                    type="text"
                    placeholder="Postal Code"
                    value={shippingData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    style={highVisibilityInputStyle(false)}
                  />
                </div>
              </div>

              {/* Country / Region */}
              <div>
                <label style={{ fontSize: '0.68rem', letterSpacing: '0.18em', color: '#ffffff', fontWeight: '700', display: 'block', marginBottom: '8px' }}>
                  COUNTRY / REGION
                </label>
                <input
                  type="text"
                  readOnly
                  value={shippingData.country}
                  style={{
                    ...highVisibilityInputStyle(false),
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    fontWeight: '700',
                    color: '#ffffff'
                  }}
                />
              </div>

              {/* Payment Selection Section */}
              <div style={{ marginTop: '6px' }}>
                <label
                  style={{
                    fontSize: '0.68rem',
                    letterSpacing: '0.18em',
                    color: '#ffffff',
                    fontWeight: '700',
                    display: 'block',
                    marginBottom: '12px',
                    textTransform: 'uppercase'
                  }}
                >
                  SELECT PAYMENT GATEWAY
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* GCash Tile */}
                  <div
                    onClick={() => setPaymentMethod('gcash')}
                    style={{
                      padding: '16px',
                      backgroundColor: paymentMethod === 'gcash' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                      color: paymentMethod === 'gcash' ? '#000000' : '#ffffff',
                      border: paymentMethod === 'gcash' ? '2px solid #ffffff' : '1px solid #444444',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', letterSpacing: '0.15em', fontWeight: '800' }}>
                        GCASH E-WALLET
                      </span>
                      <span style={{ fontSize: '0.65rem', letterSpacing: '0.12em', fontWeight: '700' }}>
                        INSTANT
                      </span>
                    </div>
                  </div>

                  {/* COD Tile */}
                  <div
                    onClick={() => setPaymentMethod('cod')}
                    style={{
                      padding: '16px',
                      backgroundColor: paymentMethod === 'cod' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                      color: paymentMethod === 'cod' ? '#000000' : '#ffffff',
                      border: paymentMethod === 'cod' ? '2px solid #ffffff' : '1px solid #444444',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', letterSpacing: '0.15em', fontWeight: '800' }}>
                        CASH ON DELIVERY (COD)
                      </span>
                      <span style={{ fontSize: '0.65rem', letterSpacing: '0.12em', fontWeight: '700' }}>
                        VERIFIED DISPATCH
                      </span>
                    </div>
                  </div>

                  {/* Direct Bank Transfer Tile */}
                  <div
                    onClick={() => setPaymentMethod('bank')}
                    style={{
                      padding: '16px',
                      backgroundColor: paymentMethod === 'bank' ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                      color: paymentMethod === 'bank' ? '#000000' : '#ffffff',
                      border: paymentMethod === 'bank' ? '2px solid #ffffff' : '1px solid #444444',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', letterSpacing: '0.15em', fontWeight: '800' }}>
                        DIRECT BANK TRANSFER
                      </span>
                      <span style={{ fontSize: '0.65rem', letterSpacing: '0.12em', fontWeight: '700' }}>
                        WIRE / BDO / BPI
                      </span>
                    </div>
                  </div>
                </div>

                {/* GCash Form Inputs */}
                {paymentMethod === 'gcash' && (
                  <div
                    className="animate-elevate"
                    style={{
                      marginTop: '16px',
                      padding: '18px',
                      backgroundColor: '#111111',
                      border: '1px solid #444444',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#aaaaaa' }}>
                      <span>MERCHANT:</span>
                      <strong style={{ color: '#ffffff' }}>SHEESH MONOCHROME PH</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#aaaaaa' }}>
                      <span>ACCOUNT NO:</span>
                      <strong style={{ color: '#ffffff' }}>0917-888-9000</strong>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.65rem', letterSpacing: '0.15em', color: '#ffffff', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                        SENDER GCASH MOBILE NUMBER
                      </label>
                      <input
                        type="text"
                        placeholder="09XXXXXXXXX"
                        value={shippingData.gcashNumber}
                        onChange={(e) => handleInputChange('gcashNumber', e.target.value)}
                        style={highVisibilityInputStyle(formErrors.gcashNumber)}
                      />
                      {formErrors.gcashNumber && (
                        <span style={{ fontSize: '0.6rem', color: '#ffffff', marginTop: '4px', display: 'block', fontWeight: 'bold' }}>
                          * {formErrors.gcashNumber}
                        </span>
                      )}
                    </div>

                    <div>
                      <label style={{ fontSize: '0.65rem', letterSpacing: '0.15em', color: '#ffffff', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                        TRANSACTION REFERENCE NO. (13 DIGITS)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1002938475839"
                        value={shippingData.gcashRefNumber}
                        onChange={(e) => handleInputChange('gcashRefNumber', e.target.value)}
                        style={highVisibilityInputStyle(formErrors.gcashRefNumber)}
                      />
                      {formErrors.gcashRefNumber && (
                        <span style={{ fontSize: '0.6rem', color: '#ffffff', marginTop: '4px', display: 'block', fontWeight: 'bold' }}>
                          * {formErrors.gcashRefNumber}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* COD Details */}
                {paymentMethod === 'cod' && (
                  <div
                    className="animate-elevate"
                    style={{
                      marginTop: '16px',
                      padding: '18px',
                      backgroundColor: '#111111',
                      border: '1px solid #444444',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#ffffff', letterSpacing: '0.1em' }}>
                      CASH ON DELIVERY DISPATCH
                    </span>
                    <p style={{ fontSize: '0.75rem', color: '#cccccc', lineHeight: '1.6', margin: 0 }}>
                      Prepare exact cash of <strong>${grandTotal.toLocaleString()}</strong> upon courier dispatch.
                    </p>
                  </div>
                )}

                {/* Direct Bank Details */}
                {paymentMethod === 'bank' && (
                  <div
                    className="animate-elevate"
                    style={{
                      marginTop: '16px',
                      padding: '18px',
                      backgroundColor: '#111111',
                      border: '1px solid #444444',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: '#aaaaaa', lineHeight: '1.6' }}>
                      <div>BANK: <strong style={{ color: '#ffffff' }}>BDO UNIBANK / BPI</strong></div>
                      <div>ACCOUNT NAME: <strong style={{ color: '#ffffff' }}>SHEESH HARDWARE CORP</strong></div>
                      <div>ACCOUNT NO: <strong style={{ color: '#ffffff' }}>0071-8800-4321</strong></div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.65rem', letterSpacing: '0.15em', color: '#ffffff', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                        SENDER ACCOUNT NAME
                      </label>
                      <input
                        type="text"
                        placeholder="Name on bank account"
                        value={shippingData.bankAccountName}
                        onChange={(e) => handleInputChange('bankAccountName', e.target.value)}
                        style={highVisibilityInputStyle(formErrors.bankAccountName)}
                      />
                      {formErrors.bankAccountName && (
                        <span style={{ fontSize: '0.6rem', color: '#ffffff', marginTop: '4px', display: 'block', fontWeight: 'bold' }}>
                          * {formErrors.bankAccountName}
                        </span>
                      )}
                    </div>

                    <div>
                      <label style={{ fontSize: '0.65rem', letterSpacing: '0.15em', color: '#ffffff', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                        BANK WIRE REFERENCE / SLIP NO.
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. TR-99882311"
                        value={shippingData.bankRefNumber}
                        onChange={(e) => handleInputChange('bankRefNumber', e.target.value)}
                        style={highVisibilityInputStyle(formErrors.bankRefNumber)}
                      />
                      {formErrors.bankRefNumber && (
                        <span style={{ fontSize: '0.6rem', color: '#ffffff', marginTop: '4px', display: 'block', fontWeight: 'bold' }}>
                          * {formErrors.bankRefNumber}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                className="btn-tech"
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: '800',
                  letterSpacing: '0.22em',
                  cursor: 'pointer',
                  marginTop: '15px'
                }}
              >
                PLACE ORDER (${grandTotal.toLocaleString()})
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}