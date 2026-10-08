// ============ MA'LUMOTLAR QATLAMI (localStorage) ============
export const K = { USERS:'dw_users', PRODUCTS:'dw_products', ORDERS:'dw_orders', SESSION:'dw_session' };
export const ADMIN_PHONE = '998901234567';
export const ADMIN_CODE = 'DIDU-2026';
export const CATS = ['Hammasi','Erkaklar','Ayollar','Krossovka','Aksessuar'];

export const DB = {
  get(k, d){ try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch(e){ return d; } },
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
};
export const normPhone = p => (p || '').replace(/[\s\-()]/g, '');

const seed = [
  { id:1,  name:"Oversize hoodie 'CLOUD' — kulrang", price:349000, old:429000, inStock:true, img:'/images/p1.png',  cat:'Erkaklar', rating:4.9, reviews:312, deliver:"Toshkent bo'ylab ertaga yetkaziladi. Boshqa viloyatlarga 2-4 kun.", desc:["300 g/m² zich frenc terry mato","Oversize kesim — zamonaviy siluet","Rang yuvganda o'chmaydi, kamlik yo'q"], chars:["Mato: 80% paxta, 20% poliester","O'lchamlar: S, M, L, XL, XXL","Rang: kulrang melanj","Brend: DIDU wear"] },
  { id:2,  name:"Qora oversize hoodie 'NIGHT'", price:329000, old:399000, inStock:true, img:'/images/p2.png', cat:'Erkaklar', rating:4.8, reviews:204, deliver:"Buyurtmadan keyin 24 soat ichida jo'natiladi.", desc:["Qorong'u grafit rang — kapsulaviy model","Pastki chiziqli manjetlar","Ichki qismi zig'ir — jilva va iliq"], chars:["Mato: french terry 300 g/m²","O'lchamlar: S – XXL","Rang: qora","Brend: DIDU wear"] },
  { id:3,  name:"Fутболка 'STONE' — premium print", price:129000, old:169000, inStock:true, img:'/images/p3.png', cat:'Erkaklar', rating:4.7, reviews:158, deliver:"Toshkent bo'ylab 1 kun.", desc:["Zich paxta 220 g/m²","Dublikat bo'yinchoq — shakl saqlaydi","Minimalistik STONE print"], chars:["Mato: 100% paxta","O'lchamlar: XS – XL","Rang: oq/bej","Brend: DIDU wear"] },
  { id:4,  name:"Oq klassik futbolka — pocket", price:99000, old:129000, inStock:true, img:'/images/p4.png', cat:'Erkaklar', rating:4.8, reviews:266, deliver:"Toshkent bo'ylab 1 kun, viloyatlarga 3 kun.", desc:["Universal bazoviy model","Ko'krak cho'ntagi","Yumshoq choyshab mato"], chars:["Mato: 100% paxta","O'lchamlar: S – XXL","Rang: oq","Brend: DIDU wear"] },
  { id:5,  name:"Runner krossovkalar 'VELOCITY'", price:549000, old:699000, inStock:true, img:'/images/p5.png', cat:'Krossovka', rating:4.9, reviews:421, deliver:"Buyurtmadan keyin 24 soatda jo'natish.", desc:["Gel amarti — bosimni yengillashtiradi","Nafas oluvchi setka","Kundalik yugurish va shahar uchun"], chars:["Ustki qism: tekstil + zamsh","Podoshva: EVA + kauchuk","O'lchamlar: 36 – 45","Brend: DIDU wear"] },
  { id:6,  name:"Oq premium krossovkalar 'PURE'", price:649000, old:0, inStock:true, img:'/images/p6.png', cat:'Krossovka', rating:5.0, reviews:189, deliver:"Yetkazib berish bepul — 2 kun ichida.", desc:["Tabiiy charm + zamsh detallar","Oq/karamel kombinatsiyasi","Cheklangan seriya 2026"], chars:["Ustki qism: tabiiy charm","Podoshva: kauchuk","O'lchamlar: 36 – 44","Brend: DIDU wear"] },
  { id:7,  name:"Qizil maxi ko'ylak 'SCARLET'", price:299000, old:379000, inStock:true, img:'/images/p7.png', cat:'Ayollar', rating:4.9, reviews:97, deliver:"Toshkent bo'ylab ertaga yetkaziladi.", desc:["Aylanma kamar — belani ta'kidlaydi","Jonli qizil rang — kapsula 2026","Ish yoki tadbir uchun universal"], chars:["Mato: crêpe paxta","O'lchamlar: XS – L","Rang: qizil (scarlet)","Brend: DIDU wear"] },
  { id:8,  name:"Yengil denim kurтка 'INDIGO'", price:449000, old:529000, inStock:true, img:'/images/p8.png', cat:'Erkaklar', rating:4.8, reviews:143, deliver:"Toshkent bo'ylab 1-2 kun.", desc:["Relaxed fit — erkin kesim","Yumshoq yuvilgan denim","4 fasdonlik kesim"], chars:["Mato: 12 oz denim","O'lchamlar: S – XXL","Rang: och indigo","Brend: DIDU wear"] },
  { id:9,  name:"To'q denim kurтка 'URBAN'", price:479000, old:0, inStock:true, img:'/images/p9.png', cat:'Erkaklar', rating:4.7, reviews:76, deliver:"Toshkent bo'ylab 1-2 kun.", desc:["Harrington uslubi — zamonaviy klassika","To'q ko'k yuvish","Baland bo'yinchoqli"], chars:["Mato: denim paxta","O'lchamlar: M – XXL","Rang: to'q ko'k","Brend: DIDU wear"] },
  { id:10, name:"Premium charm ryukzak 'MUSTARD'", price:259000, old:319000, inStock:false, img:'/images/p10.png', cat:'Aksessuar', rating:4.6, reviews:64, deliver:"Hozirda sotuvda yo'q.", desc:["Tabiiy charm, qo'lda tikilgan","Zardo'z tikuvlar","Noutbuk bo'lmasi 15.6""], chars:["Material: tabiiy charm","Hajmi: 18 l","Rang: xantal (mustard)","Brend: DIDU wear"] }
];
export function ensureSeed(){ if (!DB.get(K.PRODUCTS, null)) DB.set(K.PRODUCTS, seed); }

export const fmt = n => Number(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " so'm";

export const msgKey = phone => 'dw_msgs_' + phone;
export const getMsgs = phone => DB.get(msgKey(phone), []);
export function addMsg(phone, from, text){
  const msgs = getMsgs(phone);
  msgs.push({ from, text, time: new Date().toLocaleTimeString('uz-UZ',{hour:'2-digit',minute:'2-digit'}) });
  DB.set(msgKey(phone), msgs);
  if (typeof BroadcastChannel !== 'undefined'){ const ch = new BroadcastChannel('dw-chat'); ch.postMessage({phone}); ch.close(); }
}
export const getOrders = () => DB.get(K.ORDERS, []);
export const saveOrders = o => DB.set(K.ORDERS, o);
export const ST = { pending:['Kutilmoqda','st-pending'], confirmed:['Tasdiqlandi','st-confirmed'], rejected:['Rad etildi','st-rejected'] };
