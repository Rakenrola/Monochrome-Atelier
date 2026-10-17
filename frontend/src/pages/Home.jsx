import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addToCart } from '../store/cartSlice';
import mockProducts from '../data/mockProducts.json';

export default function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Category State
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Extract Categories Dynamically
  const categories = ['ALL', ...new Set(mockProducts.map((p) => p.category || 'COMPONENTS'))];

  // Filter Products
  const filteredProducts =
    selectedCategory === 'ALL'
      ? mockProducts
      : mockProducts.filter((p) => p.category === selectedCategory);

  const handleAddToCart = (product) => {
    dispatch(addToCart(product));
  };

  const handleBuyNow = (product) => {
    dispatch(addToCart(product));
    navigate('/cart');
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-black)',
        minHeight: '100vh',
        paddingBottom: '80px',
        color: 'var(--text-primary)'
      }}
    >
      {/* -------------------------------------------------------------------------- */}
      {/* HERO SECTION stuff                */}
      {/* -------------------------------------------------------------------------- */}
      <section
        style={{
          padding: '40px 20px',
          backgroundColor: 'var(--bg-black)'
        }}
      >
        <div
          className="hero-hardware-banner animate-hero-entry"
          style={{
            minHeight: '65vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justify: 'center',
            textAlign: 'center',
            padding: '60px 24px'
          }}
        >
          {/* Subtitle */}
          <span
            style={{
              fontSize: '0.75rem',
              letterSpacing: '0.35em',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '20px',
              textTransform: 'uppercase',
              fontWeight: '500'
            }}
          >
            NEXT-GEN SYSTEMS & COMPONENTS
          </span>

{/* Main Hero Title */}
<h1
  style={{
    fontSize: 'clamp(1.75rem, 6vw, 4.5rem)',
    letterSpacing: '0.08em',
    fontWeight: '700',
    lineHeight: '1.15',
    marginBottom: '20px',
    textTransform: 'uppercase',
    color: '#ffffff',
    textAlign: 'center',
    width: '100%',
    boxSizing: 'border-box',
    padding: '0 10px'
  }}
>
  MONOCHROME RIGS
</h1>

          {/* Description */}
          <p
            style={{
              fontSize: '0.88rem',
              color: 'rgba(255, 255, 255, 0.8)',
              maxWidth: '540px',
              letterSpacing: '0.08em',
              lineHeight: '1.7',
              marginBottom: '40px'
            }}
          >
            Enthusiast-grade hardware engineered for raw performance, stealth aesthetics, and silent thermal management.
          </p>

          {/* Call To Action Button */}
          <a
            href="#catalog"
            className="btn-tech"
            style={{
              padding: '16px 36px',
              backgroundColor: 'var(--text-primary)',
              color: '#000000',
              textDecoration: 'none',
              fontSize: '0.78rem',
              fontWeight: '700',
              letterSpacing: '0.22em',
              display: 'inline-block'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#cccccc';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'var(--text-primary)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            BROWSE HARDWARE
          </a>
        </div>
      </section>

      {/* -------------------------------------------------------------------------- */}
      {/* CATALOG & CATEGORY RIBBON                                                  */}
      {/* -------------------------------------------------------------------------- */}
      <main
        id="catalog"
        style={{
          maxWidth: '1300px',
          margin: '0 auto',
          padding: '40px 24px 0'
        }}
      >
        {/* Category Filter Navigation */}
        <div
          className="category-ribbon"
          style={{
            display: 'flex',
            gap: '35px',
            overflowX: 'auto',
            borderBottom: '1px solid var(--border-dark)',
            paddingBottom: '16px',
            marginBottom: '45px',
            justifyContent: 'center'
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className="btn-tech"
              style={{
                background: 'none',
                border: 'none',
                color: selectedCategory === cat ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '0.8rem',
                letterSpacing: '0.18em',
                fontWeight: selectedCategory === cat ? '700' : '400',
                cursor: 'pointer',
                padding: '0 0 8px 0',
                borderBottom: selectedCategory === cat ? '2px solid var(--text-primary)' : '2px solid transparent',
                whiteSpace: 'nowrap',
                transition: 'all 0.3s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Hardware Product Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '40px 30px'
          }}
        >
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              className="hardware-card animate-elevate"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-dark)',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                padding: '18px',
                animationDelay: `${index * 0.08}s`
              }}
            >
              <div>
                {/* Product Hardware Image */}
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '16/10',
                    backgroundColor: 'var(--bg-subtle)',
                    overflow: 'hidden',
                    marginBottom: '16px',
                    position: 'relative'
                  }}
                >
                  <img
                    className="hardware-image"
                    src={product.image}
                    alt={product.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>

                {/* Category Label */}
                <span
                  style={{
                    fontSize: '0.65rem',
                    letterSpacing: '0.15em',
                    color: 'var(--text-muted)',
                    display: 'block',
                    marginBottom: '6px'
                  }}
                >
                  {product.category || 'COMPONENTS'}
                </span>

                {/* Product Title */}
                <h3
                  style={{
                    fontSize: '0.95rem',
                    letterSpacing: '0.08em',
                    fontWeight: '600',
                    marginBottom: '6px',
                    lineHeight: '1.4'
                  }}
                >
                  {product.title}
                </h3>

                {/* Specs */}
                <p
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    marginBottom: '14px',
                    letterSpacing: '0.05em'
                  }}
                >
                  {product.specs}
                </p>

                {/* Price Display */}
                <p
                  style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    marginBottom: '20px'
                  }}
                >
                  ${product.price}
                </p>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px'
                }}
              >
                <button
                  type="button"
                  className="btn-tech"
                  onClick={() => handleAddToCart(product)}
                  style={{
                    padding: '12px 6px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-dark)',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    letterSpacing: '0.12em',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => (e.target.style.borderColor = 'var(--text-primary)')}
                  onMouseOut={(e) => (e.target.style.borderColor = 'var(--border-dark)')}
                >
                  ADD TO CART
                </button>

                <button
                  type="button"
                  className="btn-tech"
                  onClick={() => handleBuyNow(product)}
                  style={{
                    padding: '12px 6px',
                    backgroundColor: 'var(--text-primary)',
                    color: '#000000',
                    border: 'none',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    letterSpacing: '0.12em',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => (e.target.style.backgroundColor = '#cccccc')}
                  onMouseOut={(e) => (e.target.style.backgroundColor = 'var(--text-primary)')}
                >
                  BUY NOW
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}