import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { K, ADMIN_PHONE, ADMIN_CODE, DB, ensureSeed, fmt, normPhone, getMsgs, addMsg } from '../lib/store';

export default function AdminApp() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState('orders');
  const [authErr, setAuthErr] = useState('');
  const [form, setForm] = useState({ phone: '', code: '' });
  const [chatWith, setChatWith] = useState(null);
  const [msgText, setMsgText] = useState('');
  const [pf, setPf] = useState(null);
  const [toast, setToast] = useState('');
  const [tick, setTick] = useState(0);
  const toastTimer = useRef(null);
  const msgsEnd = useRef(null);

  useEffect(() => {
    ensureSeed();
    const s = DB.get(K.SESSION, null);
    if (s && s.admin) setSession(s);
    setReady(true);
  }, []);
  useEffect(() => {
    const onStorage = e => { if (e.key && e.key.startsWith('dw_')) setTick(t => t + 1); };
    window.addEventListener('storage', onStorage);
    let ch = null;
    if ('BroadcastChannel' in window) { ch = new BroadcastChannel('dw-chat'); ch.onmessage = () => setTick(t => t + 1); }
    return () => { window.removeEventListener('storage', onStorage); if (ch) ch.close(); };
  }, []);
  useEffect(() => { if (msgsEnd.current) msgsEnd.current.scrollIntoView({ block: 'end' }); }, [tab, tick, chatWith]);

  if (!ready) return <div className="screen" />;

  const showToast = m => { setToast(m); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 2000); };
  const products = () => DB.get(K.PRODUCTS, []);
  const orders = () => DB.get(K.ORDERS, []);

  // ================= LOGIN =================
  if (!session) {
    const submit = () => {
      if (normPhone(form.phone) === ADMIN_PHONE && form.code.trim() === ADMIN_CODE) {
        const s = { admin: true }; DB.set(K.SESSION, s); setSession(s);
        showToast('Xush kelibsiz, Administrator!');
      } else setAuthErr("Telefon yoki maxfiy kod noto'g'ri");
    };
    return (<>
      <div className="auth-wrap">
        <div className="auth-glow" />
        <div className="auth-logo" style={{ background: 'linear-gradient(135deg,#17171e,#8b5cf6)', color: '#f4f4f8' }}>🛡️</div>
        <div className="auth-title font-display">Admin <span className="grad-text">panel</span></div>
        <div className="auth-sub">Faqat administratorlar uchun maxfiy kirish</div>
        {authErr && <div className="auth-err">{authErr}</div>}
        <div className="field"><label>Admin telefon raqami</label><input inputMode="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="998 90 123 45 67" /></div>
        <div className="field"><label>Maxfiy kod</label><input type="password" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="Maxfiy kod" /></div>
        <button className="btn-primary" onClick={submit}>Kirish</button>
        <div className="auth-switch"><Link href="/"><b>← Do'konga qaytish</b></Link></div>
      </div>
      <div className={'toast' + (toast ? ' show' : '')}>{toast}</div>
    </>);
  }

  // ================= ORDERS =================
  const ST = { pending: ['Kutilmoqda', 'st-pending'], confirmed: ['Tasdiqlandi', 'st-confirmed'], rejected: ['Rad etildi', 'st-rejected'] };
  const setStatus = (id, status) => {
    const ords = orders(); ords.find(o => o.id === id).status = status;
    DB.set(K.ORDERS, ords); setTick(t => t + 1);
    showToast(status === 'confirmed' ? 'Buyurtma tasdiqlandi ✓' : 'Buyurtma rad etildi');
  };
  const ordersTab = () => {
    const ords = orders().sort((a, b) => b.id - a.id);
    if (!ords.length) return <div className="empty"><div className="big">📦</div>Yangi buyurtmalar yo'q</div>;
    const pend = ords.filter(o => o.status === 'pending').length;
    return (<>
      {ords.map(o => (
        <div key={o.id} className="admin-card">
          <div className="order-top"><h4>Buyurtma №{o.id}</h4><span className={'status ' + ST[o.status][1]}>{ST[o.status][0]}</span></div>
          <p><b>Mijoz:</b> {o.name} · +{o.phone}<br /><b>Manzil:</b> {o.addr}<br />
            <b>Tarkib:</b> {o.items.map(i => i.name + ' × ' + i.qty).join('; ')}<br />
            <b>Jami:</b> {fmt(o.total)} · {o.date}</p>
          {o.status === 'pending' && <div className="admin-actions">
            <button className="btn-sm btn-ok" onClick={() => setStatus(o.id, 'confirmed')}>✓ Tasdiqlash</button>
            <button className="btn-sm btn-no" onClick={() => setStatus(o.id, 'rejected')}>✗ Rad etish</button>
          </div>}
        </div>
      ))}
      {pend > 0 && <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12, paddingBottom: 10 }}>{pend} ta yangi buyurtma kutilmoqda</div>}
    </>);
  };

  // ================= PRODUCTS =================
  const saveProduct = () => {
    const name = pf.name.trim(), price = +pf.price, old = +pf.old || 0;
    const emoji = pf.emoji.trim() || '👕', cat = pf.cat.trim() || 'Erkaklar';
    const desc = pf.desc.split(',').map(s => s.trim()).filter(Boolean);
    if (!name || !price) return showToast('Nomi va narxni kiriting');
    const prods = products();
    if (pf.id) Object.assign(prods.find(x => x.id === pf.id), { name, price, old, cat, desc, inStock: pf.inStock });
    else prods.push({ id: Date.now(), name, price, old, cat, desc, inStock: pf.inStock, img: '/images/p1.png', rating: 5.0, reviews: 0, deliver: "Toshkent bo'ylab 1-2 kun.", chars: ['Brend: DIDU wear'] });
    DB.set(K.PRODUCTS, prods); setPf(null); setTick(t => t + 1); showToast('Saqlandi ✓');
  };
  const delProduct = id => { if (!confirm("Mahsulotni o'chirishga ishonchingiz komilmi?")) return; DB.set(K.PRODUCTS, products().filter(x => x.id !== id)); setTick(t => t + 1); showToast("Mahsulot o'chirildi"); };
  const productsTab = () => {
    if (pf) return (
      <div className="admin-card" style={{ marginTop: 0 }}>
        <h4>{pf.id ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}</h4>
        <div className="field"><label>Nomi</label><input value={pf.name} onChange={e => setPf({ ...pf, name: e.target.value })} /></div>
        <div className="field"><label>Narx (so'm)</label><input type="number" value={pf.price} onChange={e => setPf({ ...pf, price: e.target.value })} /></div>
        <div className="field"><label>Eski narx</label><input type="number" value={pf.old} onChange={e => setPf({ ...pf, old: e.target.value })} /></div>
        <div className="field"><label>Rasm URL (masalan /images/p3.png)</label><input value={pf.img} onChange={e => setPf({ ...pf, img: e.target.value })} /></div>
        <div className="field"><label>Toifa</label><input value={pf.cat} onChange={e => setPf({ ...pf, cat: e.target.value })} /></div>
        <div className="field"><label>Tavsif (vergul bilan)</label><textarea rows="2" value={pf.desc} onChange={e => setPf({ ...pf, desc: e.target.value })} /></div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, margin: '6px 0 14px', color: 'var(--text)' }}>
          <input type="checkbox" checked={pf.inStock} onChange={e => setPf({ ...pf, inStock: e.target.checked })} style={{ width: 18, height: 18 }} /> Mavjud (sotuvda)
        </label>
        <div className="admin-actions">
          <button className="btn-sm btn-ok" onClick={saveProduct}>💾 Saqlash</button>
          <button className="btn-sm btn-no" onClick={() => setPf(null)}>Bekor qilish</button>
        </div>
      </div>);
    return (<>
      <div style={{ padding: '0 14px 12px' }}>
        <button className="btn-primary" onClick={() => setPf({ id: null, name: '', price: '', old: '', img: '/images/p1.png', cat: 'Erkaklar', desc: '', inStock: true })}>+ Yangi mahsulot qo'shish</button>
      </div>
      {products().map(p => (
        <div key={p.id} className="admin-card">
          <div className="row">
            <img className="adm-img" src={p.img} alt="" />
            <div style={{ flex: 1 }}>
              <div className="order-top"><h4 style={{ margin: 0 }}>{p.name}</h4>
                <span className="stock-toggle" style={{ background: p.inStock ? 'rgba(52,211,153,.13)' : 'rgba(251,77,109,.13)', color: p.inStock ? 'var(--green)' : 'var(--red)' }}>{p.inStock ? 'Mavjud' : "Yo'q"}</span></div>
              <p style={{ marginTop: 4 }}>{fmt(p.price)}{p.old ? <> · <s>{fmt(p.old)}</s></> : null} · {p.cat}</p>
            </div>
          </div>
          <div className="admin-actions">
            <button className="btn-sm btn-edit" onClick={() => setPf({ id: p.id, name: p.name, price: p.price, old: p.old || '', img: p.img, cat: p.cat, desc: (p.desc || []).join(', '), inStock: p.inStock })}>✏️ Tahrirlash</button>
            <button className="btn-sm btn-del" onClick={() => delProduct(p.id)}>🗑 O'chirish</button>
          </div>
        </div>
      ))}
    </>);
  };

  // ================= CHATS =================
  const sendMsg = () => {
    const t = msgText.trim();
    if (!t || !chatWith) return;
    addMsg(chatWith, 'admin', t); setMsgText(''); setTick(x => x + 1);
  };
  const chatsTab = () => {
    const users = DB.get(K.USERS, []);
    const withMsgs = users.filter(u => getMsgs(u.phone).length);
    const u = users.find(x => x.phone === chatWith);
    return (<>
      <div className="chat-list" style={{ marginBottom: 0 }}>
        {withMsgs.length ? withMsgs.map(x => {
          const m = getMsgs(x.phone); const last = m[m.length - 1];
          return (<button key={x.phone} className="chat-user" onClick={() => setChatWith(x.phone)}>
            <div className="chat-av">{(x.name[0] || '?').toUpperCase()}</div>
            <div><div className="chat-un">{x.name} {x.surname}</div>
              <div className="chat-last">{last.from === 'admin' ? 'Siz: ' : ''}{last.text}</div></div>
          </button>);
        }) : <div className="empty"><div className="big">💬</div>Hozircha chatlar yo'q</div>}
      </div>
      {chatWith && (
        <div className="chat-window" style={{ height: 'calc(100vh - 410px)', minHeight: 280 }}>
          <div className="msgs">
            {getMsgs(chatWith).map((m, i) => (
              <div key={i} className={'msg ' + (m.from === 'admin' ? 'me' : 'them')}>{m.text}<div className="msg-time">{m.time}</div></div>
            ))}
            <div ref={msgsEnd} />
          </div>
          <div className="chat-input">
            <input value={msgText} onChange={e => setMsgText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg()} placeholder={(u ? u.name : 'Mijoz') + ' ga xabar...'} />
            <button onClick={sendMsg}>➤</button>
          </div>
        </div>)}
    </>);
  };

  // ================= LAYOUT =================
  return (<>
    <div className="screen">
      <div className="page-head"><h1>🛡️ Admin panel</h1>
        <button className="icon-btn" style={{ marginLeft: 'auto' }} onClick={() => { localStorage.removeItem(K.SESSION); setSession(null); setChatWith(null); }}>🚪</button></div>
      <div className="admin-tabs">
        <button className={'admin-tab' + (tab === 'orders' ? ' active' : '')} onClick={() => { setTab('orders'); setPf(null); }}>Buyurtmalar</button>
        <button className={'admin-tab' + (tab === 'products' ? ' active' : '')} onClick={() => { setTab('products'); setPf(null); }}>Mahsulotlar</button>
        <button className={'admin-tab' + (tab === 'chats' ? ' active' : '')} onClick={() => { setTab('chats'); setPf(null); }}>Chatlar</button>
      </div>
      {tab === 'orders' && ordersTab()}
      {tab === 'products' && productsTab()}
      {tab === 'chats' && chatsTab()}
    </div>
    <div className={'toast' + (toast ? ' show' : '')}>{toast}</div>
  </>);
}
