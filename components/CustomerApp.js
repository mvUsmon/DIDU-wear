import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { K, CATS, DB, ensureSeed, fmt, normPhone, getMsgs, addMsg, getOrders, saveOrders, ST } from '../lib/store';

export default function CustomerApp() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null);
  const [route, setRoute] = useState('auth-login');
  const [pid, setPid] = useState(null);
  const [cart, setCart] = useState({});
  const [searchQ, setSearchQ] = useState('');
  const [activeCat, setActiveCat] = useState('Hammasi');
  const [toast, setToast] = useState('');
  const [authErr, setAuthErr] = useState('');
  const [form, setForm] = useState({ name: '', surname: '', phone: '', pass: '' });
  const [co, setCo] = useState({ name: '', phone: '', addr: '' });
  const [msgText, setMsgText] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [favs, setFavs] = useState({});
  const [tick, setTick] = useState(0);
  const toastTimer = useRef(null);
  const msgsEnd = useRef(null);

  useEffect(() => {
    ensureSeed();
    const s = DB.get(K.SESSION, null);
    if (s && !s.admin) { setSession(s); setCart(DB.get('dw_cart_' + s.phone, {})); setRoute('shop'); }
    setReady(true);
  }, []);

  useEffect(() => {
    const onStorage = e => { if (e.key && e.key.startsWith('dw_')) setTick(t => t + 1); };
    window.addEventListener('storage', onStorage);
    let ch = null;
    if ('BroadcastChannel' in window) { ch = new BroadcastChannel('dw-chat'); ch.onmessage = () => setTick(t => t + 1); }
    return () => { window.removeEventListener('storage', onStorage); if (ch) ch.close(); };
  }, []);

  // scroll-reveal анимации
  useEffect(() => {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('rv'); io.unobserve(e.target); } }), { threshold: .1 });
    document.querySelectorAll('[data-reveal]:not(.rv)').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [route, tick, activeCat, searchQ]);

  useEffect(() => { if (msgsEnd.current) msgsEnd.current.scrollIntoView({ block: 'end' }); }, [route, tick]);

  if (!ready) return <div className="screen" />;

  const showToast = m => { setToast(m); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 2000); };
  const goto = (r, params) => { setRoute(r); if (params && params.id !== undefined) setPid(params.id); setAuthErr(''); window.scrollTo(0, 0); };
  const products = () => DB.get(K.PRODUCTS, []);
  const user = () => DB.get(K.USERS, []).find(u => u.phone === session.phone);
  const cartCount = () => Object.values(cart).reduce((a, b) => a + b, 0);
  const saveCart = c => { setCart(c); DB.set('dw_cart_' + session.phone, c); };

  // ================= AUTH =================
  const submitAuth = isReg => {
    const phone = normPhone(form.phone), pass = form.pass;
    const err = m => setAuthErr(m);
    if (!phone || !pass) return err("Barcha maydonlarni to'ldiring");
    if (!/^998\d{9}$/.test(phone)) return err("Telefon 998XXXXXXXXX formatida bo'lishi kerak");
    if (pass.length < 4) return err("Parol kamida 4 belgidan iborat bo'lsin");
    const users = DB.get(K.USERS, []);
    if (isReg) {
      const { name, surname } = form;
      if (!name.trim() || !surname.trim()) return err("Ism va familiyani kiriting");
      if (users.some(u => u.phone === phone)) return err("Bu raqam allaqachon ro'yxatdan o'tgan");
      users.push({ name: name.trim(), surname: surname.trim(), phone, pass });
      DB.set(K.USERS, users);
      const s = { phone }; DB.set(K.SESSION, s); setSession(s); setCart({});
      setRoute('shop'); showToast("Xush kelibsiz, " + name.trim() + "!");
    } else {
      const u = users.find(u => u.phone === phone && u.pass === pass);
      if (!u) return err("Raqam yoki parol noto'g'ri");
      const s = { phone }; DB.set(K.SESSION, s); setSession(s);
      setCart(DB.get('dw_cart_' + phone, {}));
      setRoute('shop'); showToast("Xush kelibsiz!");
    }
  };

  const authScreen = isReg => (
    <div className="auth-wrap">
      <div className="auth-glow" />
      <div className="auth-logo">DW</div>
      <div className="auth-title font-display">DIDU <span className="grad-text">wear</span></div>
      <div className="auth-sub">2026 kapsulaviy kolleksiya — kiyimingiz bilan gaplashing</div>
      {authErr && <div className="auth-err">{authErr}</div>}
      {isReg && <>
        <div className="field"><label>Ism</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ismingiz" /></div>
        <div className="field"><label>Familiya</label><input value={form.surname} onChange={e => setForm({ ...form, surname: e.target.value })} placeholder="Familiyangiz" /></div>
      </>}
      <div className="field"><label>Telefon raqam</label><input inputMode="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="998 90 123 45 67" /></div>
      <div className="field"><label>Parol</label><input type="password" value={form.pass} onChange={e => setForm({ ...form, pass: e.target.value })} placeholder="••••••••" /></div>
      <button className="btn-primary" onClick={() => submitAuth(isReg)}>{isReg ? "Ro'yxatdan o'tish" : "Kirish"}</button>
      {!isReg ? <>
        <div className="auth-switch">Akkaunt yo'qmi? <b onClick={() => goto('auth-register')}>Ro'yxatdan o'tish</b></div>
        <div className="auth-switch">Administrator? <Link href="/admin"><b style={{ color: 'var(--muted)' }}>Admin panel</b></Link></div>
      </> : <div className="auth-switch">Akkauntingiz bormi? <b onClick={() => goto('auth-login')}>Kirish</b></div>}
    </div>
  );

  // ================= SHOP =================
  const addToCart = id => {
    const p = products().find(p => p.id === id);
    if (!p.inStock) return showToast("Mahsulot sotuvda yo'q");
    saveCart({ ...cart, [id]: (cart[id] || 0) + 1 });
    showToast("Savatga qo'shildi ✓");
  };

  const marquee = "YANGI KOLEKSIYA 2026,YETKAZIB BERISH BEPUL,−24% GACHA CHEGIRMA,DIDU WEAR";
  const shopScreen = () => {
    let list = products();
    if (activeCat !== 'Hammasi') list = list.filter(p => p.cat === activeCat);
    if (searchQ) list = list.filter(p => p.name.toLowerCase().includes(searchQ.toLowerCase()));
    return (<>
      <div className="header">
        <div className="top-row">
          <div className="logo">DIDU<em>wear</em></div>
          <button className="icon-btn" style={{ marginLeft: 'auto' }} onClick={() => goto('chat')}>💬</button>
        </div>
        <div className="search-row">
          <div className="search-box">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9a9ab0" strokeWidth="2.4"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Kiyim, krossovka, aksessuar qidiring..." />
          </div>
        </div>
      </div>

      <div className="hero" data-reveal>
        <span className="hero-tag">Kapsula · 2026</span>
        <h1>STIL —<br /><span className="grad-text">SENING</span><br />QO'SHIG'ING</h1>
        <p>Premium sifat, cheklangan seriyalar. O'zgarish vaqti keldi.</p>
        <button className="btn-lime" onClick={() => document.getElementById('grid-anchor')?.scrollIntoView({ behavior: 'smooth' })}>Kolleksiyani ko'rish ↓</button>
        <img className="hero-img" src="/images/p5.png" alt="hero" />
      </div>

      <div className="marquee"><div className="marquee-track">{(marquee + ',').repeat(2).split(',').map((t, i) => <span key={i}>{t}<b>✦</b></span>)}</div></div>

      <div className="filters">{CATS.map(c => <button key={c} className={'chip' + (c === activeCat ? ' active' : '')} onClick={() => setActiveCat(c)}>{c}</button>)}</div>

      <div id="grid-anchor" className="section-title"><h3>Yangi kelganlar</h3><span>Barchasi →</span></div>
      <div className="grid">
        {list.length ? list.map((p, i) => (
          <div key={p.id} className="p-card" data-reveal style={{ transitionDelay: (i % 4) * 60 + 'ms' }} onClick={() => goto('product', { id: p.id })}>
            <div className="p-img">
              {p.old ? <span className="p-badge">−{Math.round((1 - p.price / p.old) * 100)}%</span> : null}
              <button className="p-fav" onClick={e => { e.stopPropagation(); setFavs({ ...favs, [p.id]: !favs[p.id] }); }}>{favs[p.id] ? '❤️' : '🤍'}</button>
              <img src={p.img} alt={p.name} loading="lazy" />
            </div>
            <div className="p-info">
              <div className="p-cat">{p.cat}</div>
              <div className="p-name">{p.name}</div>
              <div className="p-price">{fmt(p.price)}{p.old ? <span className="p-old">{fmt(p.old)}</span> : null}</div>
              <button className="p-add" onClick={e => { e.stopPropagation(); addToCart(p.id); }}>+ Savatga</button>
            </div>
          </div>
        )) : <div className="empty" style={{ gridColumn: '1/3' }}><div className="big">🔍</div>Hech narsa topilmadi</div>}
      </div>
    </>);
  };

  // ================= PRODUCT DETAIL =================
  const productScreen = () => {
    const p = products().find(p => p.id === pid);
    if (!p) return null;
    const disc = p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
    return (<>
      <div className="page-head"><button className="back-btn" onClick={() => goto('shop')}>←</button><h1>Mahsulot</h1></div>
      <div className="pd-img"><img src={p.img} alt={p.name} /></div>
      <div className="pd-body">
        <div><span className="pd-price">{fmt(p.price)}</span>{disc ? <span className="pd-disc">−{disc}%</span> : null}</div>
        {p.old ? <div className="pd-old">{fmt(p.old)}</div> : null}
        <div className="pd-name">{p.name}</div>
        <div className="pd-rating"><b>{p.rating}</b><span className="stars">★★★★★</span><span style={{ color: 'var(--muted)', fontSize: 12 }}>{p.reviews} ta sharh</span></div>
        <div className={'pd-stock ' + (p.inStock ? 'in' : 'out')}>{p.inStock ? '● Mavjud' : "○ Sotuvda yo'q"}</div>
        <div className="pd-section"><h4>Mahsulot haqida</h4><ul>{p.desc.map((d, i) => <li key={i}>{d}</li>)}</ul></div>
        <div className="pd-section"><h4>Xususiyatlari</h4><ul>{p.chars.map((c, i) => <li key={i}>{c}</li>)}</ul></div>
        <div className="pd-section"><h4>Yetkazib berish</h4><p>{p.deliver}</p><p style={{ marginTop: 6 }}>To'lov: naqd yoki karta orqali qabul qilganingizda.</p></div>
      </div>
      <div className="cta-bar"><button className="btn-primary" disabled={!p.inStock} onClick={() => addToCart(p.id)}>{p.inStock ? "+ Savatga qo'shish" : "Sotuvda yo'q"}</button></div>
    </>);
  };

  // ================= CART =================
  const cartItems = () => Object.entries(cart).map(([id, qty]) => ({ p: products().find(x => x.id == id), qty })).filter(x => x.p);
  const cartScreen = () => {
    const items = cartItems();
    if (!items.length) return (<>
      <div className="page-head"><h1>Savat</h1></div>
      <div className="empty"><div className="big">🛍️</div><h3 style={{ color: 'var(--text)' }}>Savat hozircha bo'sh</h3>
        <p style={{ marginTop: 8, fontSize: 13 }}>2026 kolleksiyasidan o'zingizga nima yoqishini toping</p>
        <button className="btn-primary" style={{ marginTop: 22 }} onClick={() => goto('shop')}>Xarid qilish</button></div>
    </>);
    const total = items.reduce((a, { p, qty }) => a + p.price * qty, 0);
    return (<>
      <div className="page-head"><h1>Savat</h1><span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 13 }}>{items.length} ta</span></div>
      {items.map(({ p, qty }) => (
        <div key={p.id} className="cart-item">
          <div className="ci-img"><img src={p.img} alt={p.name} /></div>
          <div className="ci-info">
            <div className="ci-name">{p.name}</div>
            <div className="ci-price">{fmt(p.price * qty)}</div>
            <div className="qty-row">
              <button className="qty-btn" onClick={() => { const c = { ...cart }; c[p.id]--; if (c[p.id] <= 0) delete c[p.id]; saveCart(c); }}>−</button>
              <span className="qty-val">{qty}</span>
              <button className="qty-btn" onClick={() => saveCart({ ...cart, [p.id]: qty + 1 })}>+</button>
            </div>
          </div>
          <button className="ci-del" onClick={() => { const c = { ...cart }; delete c[p.id]; saveCart(c); }}>🗑️</button>
        </div>
      ))}
      <div className="cart-summary">
        <div className="sum-row"><span>Mahsulotlar ({items.reduce((a, x) => a + x.qty, 0)} ta)</span><span>{fmt(total)}</span></div>
        <div className="sum-row"><span>Yetkazib berish</span><span style={{ color: 'var(--green)', fontWeight: 700 }}>Bepul</span></div>
        <div className="sum-row sum-total"><span>Jami</span><span>{fmt(total)}</span></div>
      </div>
      <div style={{ padding: '0 14px' }}><button className="btn-primary" onClick={() => { const u = user(); setCo({ name: u.name, phone: u.phone, addr: '' }); goto('checkout'); }}>Buyurtmani rasmiylashtirish →</button></div>
    </>);
  };

  // ================= CHECKOUT =================
  const submitOrder = () => {
    const name = co.name.trim(), phone = normPhone(co.phone), addr = co.addr.trim();
    if (!name || !/^998\d{9}$/.test(phone) || !addr) return showToast("Barcha maydonlarni to'g'ri to'ldiring");
    const items = cartItems();
    const total = items.reduce((a, { p, qty }) => a + p.price * qty, 0);
    const ords = getOrders();
    ords.push({ id: Date.now(), userPhone: session.phone, name, phone, addr, items: items.map(({ p, qty }) => ({ name: p.name, price: p.price, qty })), total, status: 'pending', date: new Date().toLocaleString('uz-UZ') });
    saveOrders(ords); saveCart({});
    goto('orders'); showToast("Buyurtma qabul qilindi ✓");
  };
  const checkoutScreen = () => {
    const items = cartItems();
    const total = items.reduce((a, { p, qty }) => a + p.price * qty, 0);
    return (<>
      <div className="page-head"><button className="back-btn" onClick={() => goto('cart')}>←</button><h1>Rasmiylashtirish</h1></div>
      <div style={{ padding: '0 14px' }}>
        <div className="pd-section"><h4>Qabul qiluvchi</h4>
          <div className="field"><label>Ism</label><input value={co.name} onChange={e => setCo({ ...co, name: e.target.value })} /></div>
          <div className="field"><label>Telefon</label><input value={co.phone} onChange={e => setCo({ ...co, phone: e.target.value })} /></div>
          <div className="field"><label>Manzil</label><textarea rows="2" value={co.addr} onChange={e => setCo({ ...co, addr: e.target.value })} placeholder="Shahar, ko'cha, uy, xonadon" /></div>
        </div>
        <div className="pd-section"><h4>Buyurtma tarkibi</h4>
          {items.map(({ p, qty }) => <div key={p.id} className="sum-row"><span>{p.name} × {qty}</span><span>{fmt(p.price * qty)}</span></div>)}
          <div className="sum-row sum-total"><span>Jami to'lov</span><span>{fmt(total)}</span></div>
        </div>
        <div style={{ marginTop: 14 }}><button className="btn-primary" onClick={submitOrder}>Buyurtmani tasdiqlash ✓</button></div>
      </div>
    </>);
  };

  // ================= ORDERS =================
  const ordersScreen = () => {
    const mine = getOrders().filter(o => o.userPhone === session.phone).sort((a, b) => b.id - a.id);
    return (<>
      <div className="page-head"><button className="back-btn" onClick={() => goto('profile')}>←</button><h1>Buyurtmalarim</h1></div>
      {!mine.length ? <div className="empty"><div className="big">📦</div><h3 style={{ color: 'var(--text)' }}>Buyurtmalar yo'q</h3></div>
        : mine.map(o => (
          <div key={o.id} className="order-card" data-reveal>
            <div className="order-top"><span className="order-id">Buyurtma №{o.id}</span><span className={'status ' + ST[o.status][1]}>{ST[o.status][0]}</span></div>
            <div className="order-items">{o.items.map((i, x) => <div key={x}>{i.name} × {i.qty}</div>)}</div>
            <div className="order-total">Jami: {fmt(o.total)}</div>
            <div className="order-addr">{o.addr} · {o.date}</div>
          </div>
        ))}
    </>);
  };

  // ================= PROFILE =================
  const profileScreen = () => {
    const u = user();
    return (<>
      <div className="prof-head">
        <div className="avatar">{(u.name[0] || '?').toUpperCase()}</div>
        <div><div className="prof-name">{u.name} {u.surname}</div><div className="prof-phone">+{u.phone}</div></div>
      </div>
      <div className="menu-list">
        <button className="menu-item" onClick={() => goto('orders')}><span className="mi-ico">🧾</span>Buyurtmalarim<span className="arrow">›</span></button>
        <button className="menu-item" onClick={() => goto('chat')}><span className="mi-ico">💬</span>Qo'llab-quvvatlash chati<span className="arrow">›</span></button>
        <button className="menu-item" onClick={() => setShowInfo(!showInfo)}><span className="mi-ico">📋</span>Shaxsiy ma'lumotlar<span className="arrow">›</span></button>
      </div>
      {showInfo && <div className="pd-section" style={{ margin: '0 14px' }}>
        <h4>Shaxsiy ma'lumotlar</h4>
        <p>Ism: <b>{u.name}</b><br />Familiya: <b>{u.surname}</b><br />Telefon: <b>+{u.phone}</b></p>
      </div>}
      <button className="logout-btn" onClick={() => { localStorage.removeItem(K.SESSION); setSession(null); setCart({}); goto('auth-login'); }}>🚪 Chiqish</button>
    </>);
  };

  // ================= CHAT =================
  const sendMsg = () => {
    const t = msgText.trim();
    if (!t) return;
    addMsg(session.phone, 'user', t);
    setMsgText(''); setTick(x => x + 1);
    setTimeout(() => { addMsg(session.phone, 'admin', "Rahmat! Xabaringiz qabul qilindi. Tez orada javob beramiz. 😊"); setTick(x => x + 1); }, 1200);
  };
  const chatScreen = () => {
    const msgs = getMsgs(session.phone);
    return (<>
      <div className="page-head"><button className="back-btn" onClick={() => goto('profile')}>←</button><h1>Qo'llab-quvvatlash</h1></div>
      <div className="chat-window">
        <div className="msgs">
          {msgs.length ? msgs.map((m, i) => (
            <div key={i} className={'msg ' + (m.from === 'user' ? 'me' : 'them')}>{m.text}<div className="msg-time">{m.time}</div></div>
          )) : <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginTop: 30 }}>👋 Salom! Savollaringiz bo'lsa yozing —<br />administrator javob beradi.</div>}
          <div ref={msgsEnd} />
        </div>
        <div className="chat-input">
          <input value={msgText} onChange={e => setMsgText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg()} placeholder="Xabar yozing..." />
          <button onClick={sendMsg}>➤</button>
        </div>
      </div>
    </>);
  };

  // ================= LAYOUT =================
  const noNav = ['auth-login', 'auth-register', 'product', 'checkout', 'chat'].includes(route);
  const active = route === 'shop' ? 'shop' : (route === 'cart' || route === 'checkout') ? 'cart' : 'profile';
  const Nav = !noNav && (
    <nav className="bottom-nav">
      <button className={'nav-item' + (active === 'shop' ? ' active' : '')} onClick={() => goto('shop')}><span className="ico">🏠</span>Bosh sahifa</button>
      <button className={'nav-item' + (active === 'cart' ? ' active' : '')} onClick={() => goto('cart')}><span className="ico">🛍️{cartCount() > 0 && <span className="badge-dot">{cartCount()}</span>}</span>Savat</button>
      <button className={'nav-item' + (active === 'profile' ? ' active' : '')} onClick={() => goto('profile')}><span className="ico">👤</span>Profil</button>
    </nav>
  );

  let content = null;
  if (route === 'auth-login') content = authScreen(false);
  else if (route === 'auth-register') content = authScreen(true);
  else if (!session) content = authScreen(false);
  else if (route === 'shop') content = shopScreen();
  else if (route === 'product') content = productScreen();
  else if (route === 'cart') content = cartScreen();
  else if (route === 'checkout') content = checkoutScreen();
  else if (route === 'orders') content = ordersScreen();
  else if (route === 'profile') content = profileScreen();
  else if (route === 'chat') content = chatScreen();

  return (<>
    <div className="screen">{content}</div>
    {Nav}
    <div className={'toast' + (toast ? ' show' : '')}>{toast}</div>
  </>);
}
