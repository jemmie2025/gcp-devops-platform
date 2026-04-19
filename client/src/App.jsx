import React, { useState, useMemo } from 'react';
import './App.css';

// ── DATA ──────────────────────────────────────────────────────────────────
const CATS = ['All','Power Tools','Hand Tools','Cleaning','Spices','Portraits','Safety','Lighting'];

const PRODUCTS = [
  // Power Tools
  { id: 1,  name: 'Heavy-Duty Power Drill',     price: 89,  originalPrice: 119, category: 'Power Tools',  gradient: 'linear-gradient(135deg,#e74c3c,#c0392b)', icon: '🔧', rating: 4.7, reviews: 312, badge: 'Best Seller', img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&h=300&q=80', description: 'Variable-speed 18V brushless motor with torque control. Includes carry case and 2 lithium batteries.', size: '18V / 13mm Chuck' },
  { id: 2,  name: 'Cordless Screwdriver Set',    price: 54,  originalPrice: 75,  category: 'Power Tools',  gradient: 'linear-gradient(135deg,#e67e22,#d35400)', icon: '🪛', rating: 4.4, reviews: 189, badge: null,           img: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=400&h=300&q=80', description: 'Compact 12V driver with 40-piece bit set. LED work light and magnetic tip holder.', size: '12V / 40pc Set' },
  { id: 3,  name: 'Professional Circular Saw',   price: 129, originalPrice: 160, category: 'Power Tools',  gradient: 'linear-gradient(135deg,#c0392b,#922b21)', icon: '🪚', rating: 4.8, reviews: 456, badge: 'Sale',          img: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=400&h=300&q=80', description: '1400W motor with laser guide and dust extraction port. Bevel cuts up to 45 degrees.', size: '185mm Blade / 1400W' },
  // Hand Tools
  { id: 4,  name: 'Hardened Steel Claw Hammer',  price: 22,  originalPrice: 22,  category: 'Hand Tools',   gradient: 'linear-gradient(135deg,#2ecc71,#1a9950)', icon: '🔨', rating: 4.5, reviews: 98,  badge: null,           img: 'https://images.unsplash.com/photo-1586864387789-628af9feed72?auto=format&fit=crop&w=400&h=300&q=80', description: 'Drop-forged carbon steel head with shock-absorbing fibreglass handle. Anti-vibration grip.', size: '16oz / 330mm' },
  { id: 5,  name: 'Pro Tape Measure 30ft',        price: 18,  originalPrice: 25,  category: 'Hand Tools',   gradient: 'linear-gradient(135deg,#27ae60,#1e8449)', icon: '📏', rating: 4.3, reviews: 214, badge: 'Sale',          img: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=400&h=300&q=80', description: 'Self-locking blade with imperial and metric markings. Nylon-coated for durability.', size: '30ft / 9m' },
  { id: 6,  name: 'Adjustable Wrench 12"',        price: 31,  originalPrice: 31,  category: 'Hand Tools',   gradient: 'linear-gradient(135deg,#16a085,#0e6655)', icon: '🔩', rating: 4.6, reviews: 175, badge: null,           img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&h=300&q=80', description: 'Chrome vanadium steel with precision jaw mechanism. Wide 38mm opening capacity.', size: '12" / 300mm' },
  // Cleaning
  { id: 7,  name: '2200W Bagless Vacuum',         price: 149, originalPrice: 199, category: 'Cleaning',     gradient: 'linear-gradient(135deg,#9b59b6,#76448a)', icon: '🧹', rating: 4.9, reviews: 621, badge: 'New',           img: 'https://images.pexels.com/photos/4107277/pexels-photo-4107277.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', description: 'Cyclonic filtration with HEPA filter. 3L dust canister and 8m cord reach.', size: '2200W / 3L Capacity' },
  { id: 8,  name: 'Electric Pressure Washer',     price: 199, originalPrice: 249, category: 'Cleaning',     gradient: 'linear-gradient(135deg,#8e44ad,#6c3483)', icon: '💧', rating: 4.7, reviews: 388, badge: null,           img: 'https://images.pexels.com/photos/4876669/pexels-photo-4876669.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', description: '150 bar max pressure with patio cleaner attachment. Integrated detergent tank.', size: '150 Bar / 2100W' },
  { id: 9,  name: 'Deluxe Mop & Bucket Set',      price: 39,  originalPrice: 55,  category: 'Cleaning',     gradient: 'linear-gradient(135deg,#6c3483,#512e5f)', icon: '🪣', rating: 4.2, reviews: 143, badge: 'Sale',          img: 'https://images.pexels.com/photos/12585524/pexels-photo-12585524.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', description: 'Self-wringing microfibre mop with foot pedal bucket. 360° rotating head.', size: '12L Bucket / 130cm Handle' },
  // Safety
  { id: 10, name: 'Aluminium Ladder 8ft',          price: 119, originalPrice: 119, category: 'Safety',       gradient: 'linear-gradient(135deg,#f39c12,#d68910)', icon: '🪜', rating: 4.5, reviews: 267, badge: null,           img: 'https://images.pexels.com/photos/5691618/pexels-photo-5691618.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', description: 'Lightweight aircraft-grade aluminium with anti-slip feet. 150kg max load capacity.', size: '8ft / 2.4m / 150kg' },
  { id: 11, name: 'Cut-Resistant Work Gloves',     price: 14,  originalPrice: 20,  category: 'Safety',       gradient: 'linear-gradient(135deg,#d35400,#a04000)', icon: '🧤', rating: 4.3, reviews: 509, badge: 'Sale',          img: 'https://images.pexels.com/photos/9754819/pexels-photo-9754819.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', description: 'Level 5 cut protection with nitrile palm coating. Breathable and touchscreen compatible.', size: 'M / L / XL' },
  // Lighting
  { id: 12, name: 'Rechargeable LED Work Light',   price: 67,  originalPrice: 89,  category: 'Lighting',     gradient: 'linear-gradient(135deg,#1abc9c,#148f77)', icon: '💡', rating: 4.6, reviews: 334, badge: 'Sale',          img: 'https://images.pexels.com/photos/34171441/pexels-photo-34171441.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', description: '3000 lumens with 3 brightness modes. USB-C rechargeable, 8hr runtime. IP65 rated.', size: '3000lm / IP65' },
  // Spices
  { id: 13, name: 'Premium Black Pepper 500g',     price: 8,   originalPrice: 12,  category: 'Spices',       gradient: 'linear-gradient(135deg,#2c2c2c,#111)',    icon: '🫙', rating: 4.8, reviews: 892, badge: 'Best Seller', img: 'https://images.pexels.com/photos/8559086/pexels-photo-8559086.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', description: 'Tellicherry whole peppercorns, hand-picked and sun-dried. Bold aroma with complex heat.', size: '500g' },
  { id: 14, name: 'Organic Turmeric Powder 250g',  price: 5,   originalPrice: 8,   category: 'Spices',       gradient: 'linear-gradient(135deg,#f1c40f,#d4ac0d)', icon: '🌿', rating: 4.7, reviews: 445, badge: null,           img: 'https://images.pexels.com/photos/6104651/pexels-photo-6104651.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', description: 'USDA certified organic with 5% curcumin content. Sourced from Indian highlands.', size: '250g' },
  { id: 15, name: 'Smoked Paprika 200g',           price: 6,   originalPrice: 9,   category: 'Spices',       gradient: 'linear-gradient(135deg,#c0392b,#922b21)', icon: '🌶️', rating: 4.6, reviews: 311, badge: 'New',           img: 'https://images.pexels.com/photos/6104650/pexels-photo-6104650.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', description: 'Spanish oak-smoked La Vera paprika. Rich, sweet and smoky flavour profile.', size: '200g' },
  { id: 16, name: 'Whole Cumin Seeds 300g',        price: 7,   originalPrice: 10,  category: 'Spices',       gradient: 'linear-gradient(135deg,#8b6914,#6e5410)', icon: '🌱', rating: 4.5, reviews: 228, badge: null,           img: 'https://images.pexels.com/photos/5774814/pexels-photo-5774814.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', description: 'Whole seeds for toasting and grinding. Warm earthy notes, essential for curry blends.', size: '300g' },
  { id: 17, name: 'Ceylon Cinnamon Sticks 150g',   price: 9,   originalPrice: 14,  category: 'Spices',       gradient: 'linear-gradient(135deg,#a0522d,#7d4320)', icon: '🪵', rating: 4.9, reviews: 673, badge: 'Premium',       img: 'https://images.pexels.com/photos/5475175/pexels-photo-5475175.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', description: 'True Ceylon cinnamon, thin-barked and delicately sweet. Lower coumarin than cassia.', size: '150g / ~12 Sticks' },
  { id: 18, name: 'Chilli Flakes Crushed 100g',    price: 6,   originalPrice: 8,   category: 'Spices',       gradient: 'linear-gradient(135deg,#e74c3c,#c0392b)', icon: '🔥', rating: 4.7, reviews: 519, badge: 'Hot',           img: 'https://images.pexels.com/photos/6087275/pexels-photo-6087275.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', description: 'Medium-heat crushed red pepper flakes. Perfect for pizza, pasta and stir-fry finishes.', size: '100g' },
  { id: 19, name: 'Authentic Garam Masala 250g',   price: 8,   originalPrice: 11,  category: 'Spices',       gradient: 'linear-gradient(135deg,#b7410e,#922b21)', icon: '✨', rating: 4.8, reviews: 784, badge: null,           img: 'https://images.pexels.com/photos/2802527/pexels-photo-2802527.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', description: '12-spice recipe blended in small batches. Aromatic warmth without overpowering heat.', size: '250g' },
  { id: 20, name: 'Green Cardamom Pods 80g',       price: 11,  originalPrice: 15,  category: 'Spices',       gradient: 'linear-gradient(135deg,#27ae60,#1a9950)', icon: '💚', rating: 4.9, reviews: 341, badge: 'Premium',       img: 'https://images.pexels.com/photos/6086300/pexels-photo-6086300.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', description: 'Guatemalan green cardamom, intensely fragrant. Use whole in rice or crush for desserts.', size: '80g / ~120 Pods' },
  // Portraits
  { id: 21, name: 'Crimson Sunset — 60×80cm',      price: 149, originalPrice: 199, category: 'Portraits',    gradient: 'linear-gradient(135deg,#c0392b,#e74c3c,#f39c12)', icon: '🖼️', rating: 4.9, reviews: 67, badge: 'New',     img: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=400&h=300&q=80', description: 'Gallery-quality giclée print on 300gsm cotton canvas. Ready to hang with keyhole mount.', size: '60 × 80 cm' },
  { id: 22, name: 'Ocean Blue Abstract — 50×70cm', price: 189, originalPrice: 189, category: 'Portraits',    gradient: 'linear-gradient(135deg,#2980b9,#1abc9c,#16a085)', icon: '🎨', rating: 4.7, reviews: 43, badge: null,     img: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=400&h=300&q=80', description: 'Hand-stretched canvas with pine wood frame. Vivid archival inks, fade-resistant for 75+ years.', size: '50 × 70 cm' },
  { id: 23, name: 'Golden Hour — 70×90cm',         price: 219, originalPrice: 279, category: 'Portraits',    gradient: 'linear-gradient(135deg,#f39c12,#e67e22,#f1c40f)', icon: '🖼️', rating: 4.8, reviews: 91, badge: 'Best Seller', img: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=400&h=300&q=80', description: 'Museum-grade canvas with gallery wrap edges. Warm golden tones for living room statement pieces.', size: '70 × 90 cm' },
  { id: 24, name: 'Emerald Forest — 60×80cm',      price: 169, originalPrice: 210, category: 'Portraits',    gradient: 'linear-gradient(135deg,#27ae60,#2ecc71,#1a9950)', icon: '🎨', rating: 4.5, reviews: 38, badge: null,     img: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=400&h=300&q=80', description: 'Deep emerald forest scene printed on textured matte canvas. Solid wood stretcher bars.', size: '60 × 80 cm' },
  { id: 25, name: 'Violet Dusk — 80×100cm',        price: 199, originalPrice: 250, category: 'Portraits',    gradient: 'linear-gradient(135deg,#8e44ad,#9b59b6,#6c3483)', icon: '🖼️', rating: 4.8, reviews: 55, badge: 'Premium', img: 'https://images.unsplash.com/photo-1576502200916-3808e07386a5?auto=format&fit=crop&w=400&h=300&q=80', description: 'Large-format canvas ideal for feature walls. Premium UV-coated surface resists dust and moisture.', size: '80 × 100 cm' },
  { id: 26, name: 'Midnight Indigo — 50×70cm',     price: 229, originalPrice: 229, category: 'Portraits',    gradient: 'linear-gradient(135deg,#1a1a6e,#2c3e8c,#1a237e)', icon: '🎨', rating: 4.6, reviews: 29, badge: null,     img: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=400&h=300&q=80', description: 'Abstract indigo composition with metallic ink accents. Floating frame finish available.', size: '50 × 70 cm' },
];

const CATEGORIES = ['All', 'Power Tools', 'Hand Tools', 'Cleaning', 'Safety', 'Lighting', 'Spices', 'Portraits'];

function Stars({ rating }) {
  return (
    <span className="stars">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={i <= Math.round(rating) ? 'star filled' : 'star'}>★</span>
      ))}
      <span className="rating-num">{rating} ({i => i})</span>
    </span>
  );
}

function StarRow({ rating, reviews }) {
  return (
    <div className="star-row">
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(rating) ? '#f0a500' : '#ddd', fontSize: '0.95rem' }}>★</span>
      ))}
      <span className="review-count">({reviews})</span>
    </div>
  );
}

function formatCard(v) { return v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim(); }
function formatExpiry(v) { return v.replace(/\D/g,'').slice(0,4).replace(/^(\d{2})(\d)/,'$1/$2'); }
function formatCVV(v) { return v.replace(/\D/g,'').slice(0,3); }

export default function App() {
  const [cart, setCart]         = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch]     = useState('');
  const [view, setView]         = useState('shop');
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast]       = useState(null);
  const [cardForm, setCardForm] = useState({ name:'', number:'', expiry:'', cvv:'', address:'' });

  const filtered = useMemo(() => PRODUCTS.filter(p =>
    (category === 'All' || p.category === category) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  ), [category, search]);

  const cartCount = cart.reduce((s,i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s,i) => s + i.price * i.qty, 0);
  const cartSaved = cart.reduce((s,i) => s + (i.originalPrice - i.price) * i.qty, 0);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const addToCart = (p) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      return ex ? prev.map(i => i.id === p.id ? {...i, qty: i.qty+1} : i) : [...prev, {...p, qty:1}];
    });
    setCartOpen(true);
    showToast(`${p.name} added to cart`);
  };

  const updateQty = (id, d) => setCart(prev => prev.map(i => i.id===id ? {...i,qty:i.qty+d}:i).filter(i=>i.qty>0));

  const toggleWish = (id) => setWishlist(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev,id]);

  const handleCard = (e) => {
    const {name, value} = e.target;
    let v = value;
    if (name==='number') v = formatCard(value);
    if (name==='expiry') v = formatExpiry(value);
    if (name==='cvv')    v = formatCVV(value);
    setCardForm(prev => ({...prev, [name]:v}));
  };

  const placeOrder = (e) => { e.preventDefault(); setCart([]); setView('success'); setCartOpen(false); };

  return (
    <div className="site">
      {toast && <div className="toast">{toast}</div>}

      {/* ── TOP BAR ── */}
      <div className="topbar">
        <span>🚚 Free delivery on orders over $100</span>
        <span>📞 Support: 0800-JEMMIE | Mon–Sat 9am–6pm</span>
        <span>⭐ Rated 4.8/5 by 10,000+ customers</span>
      </div>

      {/* ── NAVBAR ── */}
      <nav className="navbar">
        <div className="nav-logo" onClick={() => { setView('shop'); setSearch(''); }}>
          <div className="logo-mark">J</div>
          <div className="logo-text"><strong>Jemmie's</strong><span>Store</span></div>
        </div>

        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            placeholder="Search products…"
            value={search}
            onChange={e => { setSearch(e.target.value); setView('shop'); setCartOpen(false); }}
          />
          {search && <button className="clear-search" onClick={() => setSearch('')}>✕</button>}
        </div>

        <div className="nav-actions">
          <button className="nav-action" onClick={() => { setView('shop'); }}>
            <span className="nav-action-icon">❤️</span>
            <span className="nav-action-label">Wishlist<br/><small>{wishlist.length} items</small></span>
          </button>
          <button className="nav-action cart-action" onClick={() => { setCartOpen(o=>!o); setView('shop'); }}>
            <span className="nav-action-icon">🛒</span>
            <span className="nav-action-label">Cart<br/><small>${cartTotal.toFixed(2)}</small></span>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </nav>

      {/* ── CATEGORY NAV ── */}
      <div className="cat-nav">
        {CATEGORIES.map(c => (
          <button key={c}
            className={`cat-nav-btn ${category===c && view==='shop' ? 'active':''}`}
            onClick={() => { setCategory(c); setView('shop'); setCartOpen(false); setSearch(''); }}>
            {c}
          </button>
        ))}
      </div>

      {/* ── HERO ── */}
      {view === 'shop' && !search && category === 'All' && (
        <div className="hero">
          <div className="hero-content">
            <p className="hero-eyebrow">Welcome to Jemmie's Store</p>
            <h1>Your One-Stop<br/><em>Home & Lifestyle</em><br/>Destination</h1>
            <p className="hero-sub">Tools · Spices · Art · Everyday Essentials</p>
            <div className="hero-buttons">
              <button className="btn-primary" onClick={() => setCategory('All')}>Shop Now</button>
              <button className="btn-secondary" onClick={() => setCategory('Spices')}>Explore Spices</button>
            </div>
          </div>
          <div className="hero-badges">
            <div className="hero-badge"><span>🚚</span><div><strong>Free Delivery</strong><small>Over $100</small></div></div>
            <div className="hero-badge"><span>↩️</span><div><strong>30-Day Returns</strong><small>No hassle</small></div></div>
            <div className="hero-badge"><span>🔒</span><div><strong>Secure Payment</strong><small>256-bit SSL</small></div></div>
          </div>
        </div>
      )}

      <div className="page-layout">
        <main className="main-content">

          {/* ── SHOP ── */}
          {view === 'shop' && (
            <>
              <div className="results-bar">
                <h2 className="results-title">
                  {search ? `Results for "${search}"` : category === 'All' ? 'All Products' : category}
                </h2>
                <span className="results-count">{filtered.length} products</span>
              </div>

              {filtered.length === 0 ? (
                <div className="no-results">
                  <p>😔 No products found for "<strong>{search}</strong>"</p>
                  <button className="btn-primary" onClick={() => setSearch('')}>Clear Search</button>
                </div>
              ) : category === 'All' && !search ? (
                CATEGORIES.filter(c => c !== 'All').map(cat => {
                  const items = filtered.filter(p => p.category === cat);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat} className="category-section">
                      <h3 className="category-section-title">{cat}</h3>
                      <div className="product-grid">
                        {items.map(p => (
                    <div key={p.id} className="product-card">
                      <div className="product-img" style={{ background: `url(${p.img}) center/cover no-repeat, ${p.gradient}` }}>
                        {p.badge && <span className={`badge badge-${p.badge === 'Sale' || p.badge === 'Hot' ? 'red' : p.badge === 'New' ? 'green' : 'amber'}`}>{p.badge}</span>}
                        <button
                          className={`wish-btn ${wishlist.includes(p.id) ? 'wished' : ''}`}
                          onClick={() => toggleWish(p.id)}
                          title="Add to wishlist"
                        >
                          {wishlist.includes(p.id) ? '❤️' : '🤍'}
                        </button>
                      </div>
                      <div className="product-body">
                        <p className="product-cat">{p.category}</p>
                        <h3 className="product-name">{p.name}</h3>
                        <p className="product-desc">{p.description}</p>
                        <p className="product-size">📐 {p.size}</p>
                        <StarRow rating={p.rating} reviews={p.reviews} />
                        <div className="product-pricing">
                          <span className="price-current">${p.price}</span>
                          {p.originalPrice > p.price && (
                            <>
                              <span className="price-original">${p.originalPrice}</span>
                              <span className="price-save">Save ${p.originalPrice - p.price}</span>
                            </>
                          )}
                        </div>
                        <button className="add-to-cart-btn" onClick={() => addToCart(p)}>
                          🛒 Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                    </div>
                  );
                })
              ) : (
                <div className="product-grid">
                  {filtered.map(p => (
                    <div key={p.id} className="product-card">
                      <div className="product-img" style={{ background: `url(${p.img}) center/cover no-repeat, ${p.gradient}` }}>
                        {p.badge && <span className={`badge badge-${p.badge === 'Sale' || p.badge === 'Hot' ? 'red' : p.badge === 'New' ? 'green' : 'amber'}`}>{p.badge}</span>}
                        <button
                          className={`wish-btn ${wishlist.includes(p.id) ? 'wished' : ''}`}
                          onClick={() => toggleWish(p.id)}
                          title="Add to wishlist"
                        >
                          {wishlist.includes(p.id) ? '❤️' : '🤍'}
                        </button>
                      </div>
                      <div className="product-body">
                        <p className="product-cat">{p.category}</p>
                        <h3 className="product-name">{p.name}</h3>
                        <p className="product-desc">{p.description}</p>
                        <p className="product-size">📐 {p.size}</p>
                        <StarRow rating={p.rating} reviews={p.reviews} />
                        <div className="product-pricing">
                          <span className="price-current">${p.price}</span>
                          {p.originalPrice > p.price && (
                            <>
                              <span className="price-original">${p.originalPrice}</span>
                              <span className="price-save">Save ${p.originalPrice - p.price}</span>
                            </>
                          )}
                        </div>
                        <button className="add-to-cart-btn" onClick={() => addToCart(p)}>
                          🛒 Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── CHECKOUT ── */}
          {view === 'checkout' && (
            <div className="checkout-page">
              <div className="breadcrumb">
                <button onClick={() => setView('shop')}>Home</button> /
                <button onClick={() => setCartOpen(true)}>Cart</button> /
                <span>Checkout</span>
              </div>
              <h2 className="page-title">Secure Checkout</h2>
              <div className="checkout-layout">
                <form className="checkout-form" onSubmit={placeOrder}>
                  <section className="form-section">
                    <h3>🚚 Delivery Address</h3>
                    <label>Full Name
                      <input required name="name" placeholder="Jemmie Smith" value={cardForm.name} onChange={handleCard} />
                    </label>
                    <label>Delivery Address
                      <input required name="address" placeholder="123 High Street, London, EC1A 1BB" value={cardForm.address} onChange={handleCard} />
                    </label>
                  </section>

                  <section className="form-section">
                    <h3>💳 Payment Details</h3>
                    <div className="card-visual">
                      <div className="cv-top">
                        <span className="cv-brand">JEMMIE'S STORE</span>
                        <span className="cv-chip">▮▮</span>
                      </div>
                      <div className="cv-number">{cardForm.number || '•••• •••• •••• ••••'}</div>
                      <div className="cv-bottom">
                        <div><small>CARD HOLDER</small><br/>{cardForm.name || 'YOUR NAME'}</div>
                        <div><small>EXPIRES</small><br/>{cardForm.expiry || 'MM/YY'}</div>
                      </div>
                    </div>
                    <label>Card Number
                      <input required name="number" placeholder="1234 5678 9012 3456" value={cardForm.number} onChange={handleCard} />
                    </label>
                    <div className="form-row">
                      <label>Expiry Date
                        <input required name="expiry" placeholder="MM/YY" value={cardForm.expiry} onChange={handleCard} />
                      </label>
                      <label>CVV
                        <input required name="cvv" placeholder="•••" value={cardForm.cvv} onChange={handleCard} />
                      </label>
                    </div>
                    <div className="secure-note">🔒 Your payment is secured with 256-bit SSL encryption</div>
                  </section>

                  <div className="form-actions">
                    <button type="button" className="btn-back" onClick={() => { setCartOpen(true); setView('shop'); }}>← Back to Cart</button>
                    <button type="submit" className="btn-pay">Place Order · ${cartTotal.toFixed(2)}</button>
                  </div>
                </form>

                <aside className="order-summary">
                  <h3>Order Summary</h3>
                  <div className="summary-items">
                    {cart.map(i => (
                      <div key={i.id} className="summary-row">
                        <div className="summary-img" style={{ background: `url(${i.img}) center/cover no-repeat, ${i.gradient}` }} />
                        <div className="summary-info">
                          <span>{i.name}</span>
                          <small>Qty: {i.qty}</small>
                        </div>
                        <span className="summary-price">${(i.price * i.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="summary-lines">
                    <div className="summary-line"><span>Subtotal</span><span>${cartTotal.toFixed(2)}</span></div>
                    {cartSaved > 0 && <div className="summary-line saved"><span>You saved</span><span>-${cartSaved.toFixed(2)}</span></div>}
                    <div className="summary-line"><span>Delivery</span><span>{cartTotal >= 100 ? 'FREE' : '$5.99'}</span></div>
                    <div className="summary-line total"><span>Total</span><span>${(cartTotal + (cartTotal >= 100 ? 0 : 5.99)).toFixed(2)}</span></div>
                  </div>
                </aside>
              </div>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {view === 'success' && (
            <div className="success-page">
              <div className="success-card">
                <div className="success-icon">✅</div>
                <h2>Order Confirmed!</h2>
                <p>Thank you for shopping at <strong>Jemmie's Store</strong>.</p>
                <p>A confirmation email has been sent. Your order will arrive in 3–5 business days.</p>
                <button className="btn-primary" onClick={() => setView('shop')}>Continue Shopping</button>
              </div>
            </div>
          )}
        </main>

        {/* ── CART SIDEBAR ── */}
        {cartOpen && (
          <aside className="cart-sidebar">
            <div className="cart-head">
              <h3>Shopping Cart <span>({cartCount})</span></h3>
              <button className="close-btn" onClick={() => setCartOpen(false)}>✕</button>
            </div>
            {cart.length === 0 ? (
              <div className="cart-empty">
                <p>🛒</p>
                <p>Your cart is empty</p>
                <button className="btn-primary" onClick={() => setCartOpen(false)}>Start Shopping</button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map(i => (
                    <div key={i.id} className="cart-item">
                      <div className="ci-img" style={{ background: `url(${i.img}) center/cover no-repeat, ${i.gradient}` }} />
                      <div className="ci-info">
                        <p className="ci-name">{i.name}</p>
                        <p className="ci-price">${i.price} each</p>
                        <div className="ci-qty">
                          <button onClick={() => updateQty(i.id,-1)}>−</button>
                          <span>{i.qty}</span>
                          <button onClick={() => updateQty(i.id,1)}>+</button>
                        </div>
                      </div>
                      <span className="ci-total">${(i.price*i.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="cart-foot">
                  {cartSaved > 0 && <p className="cart-saved">🎉 You're saving ${cartSaved.toFixed(2)}!</p>}
                  <div className="cart-total-row">
                    <span>Subtotal ({cartCount} items)</span>
                    <strong>${cartTotal.toFixed(2)}</strong>
                  </div>
                  <p className="delivery-note">{cartTotal >= 100 ? '✅ Qualifies for free delivery!' : `Add $${(100-cartTotal).toFixed(2)} more for free delivery`}</p>
                  <button className="btn-checkout" onClick={() => { setView('checkout'); setCartOpen(false); }}>
                    Proceed to Checkout →
                  </button>
                  <button className="btn-continue" onClick={() => setCartOpen(false)}>Continue Shopping</button>
                </div>
              </>
            )}
          </aside>
        )}
      </div>

      {/* ── FOOTER ── */}
      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-col">
            <div className="footer-logo">
              <div className="logo-mark">J</div><strong>Jemmie's Store</strong>
            </div>
            <p>Your trusted home & lifestyle destination. Quality products, fair prices, fast delivery.</p>
          </div>
          <div className="footer-col">
            <h4>Shop</h4>
            {CATEGORIES.slice(1).map(c => <button key={c} onClick={() => { setCategory(c); setView('shop'); window.scrollTo(0,0); }}>{c}</button>)}
          </div>
          <div className="footer-col">
            <h4>Help</h4>
            <p>Contact Us</p><p>Delivery Info</p><p>Returns Policy</p><p>Track Order</p><p>FAQs</p>
          </div>
          <div className="footer-col">
            <h4>Newsletter</h4>
            <p>Get exclusive deals and new arrivals direct to your inbox.</p>
            <div className="newsletter">
              <input placeholder="Your email address" />
              <button>Subscribe</button>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Jemmie's Store. All rights reserved.</span>
          <span>🔒 Secure Payments &nbsp;|&nbsp; 🚚 Fast Delivery &nbsp;|&nbsp; ↩️ Easy Returns</span>
        </div>
      </footer>
    </div>
  );
}

