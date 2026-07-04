// Firebase import'ları — EN ÜSTTE OLMALI
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// =====================
// AYARLAR
// =====================
const WHATSAPP_NUMARA = "905XXXXXXXXX"; // Kafenin WhatsApp numarası
const KAFE_ADI = "Köşe Kafe";

const firebaseConfig = {
  apiKey: "AIzaSyALDEl3MN5frBidfX7AZ4op0qGFGlPRZ88",
  authDomain: "nula-coffee.firebaseapp.com",
  databaseURL: "https://nula-coffee-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "nula-coffee",
  storageBucket: "nula-coffee.firebasestorage.app",
  messagingSenderId: "601885483227",
  appId: "1:601885483227:web:dde659834f539be9e02cfe"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// =====================
// MENÜ VERİSİ
// =====================
const menu = [
  {
    kategori: "☕ Sıcak İçecekler",
    urunler: [
      { id: 1, ad: "Espresso",       aciklama: "Yoğun, saf, iki shot",          fiyat: 45 },
      { id: 2, ad: "Cappuccino",     aciklama: "Espresso + süt köpüğü",         fiyat: 65 },
      { id: 3, ad: "Flat White",     aciklama: "Çift shot, ince süt",           fiyat: 70 },
      { id: 4, ad: "Latte",          aciklama: "Espresso + buharlı süt",        fiyat: 70 },
      { id: 5, ad: "Türk Kahvesi",   aciklama: "Geleneksel pişirim",            fiyat: 55 },
      { id: 6, ad: "Sıcak Çikolata", aciklama: "Gerçek kakao, koyu",           fiyat: 75 },
    ]
  },
  {
    kategori: "🧊 Soğuk İçecekler",
    urunler: [
      { id: 7,  ad: "Cold Brew",  aciklama: "12 saat demleme",               fiyat: 80 },
      { id: 8,  ad: "Iced Latte", aciklama: "Espresso, süt, buz",            fiyat: 75 },
      { id: 9,  ad: "Frappe",     aciklama: "Blended, çikolatalı +10₺",      fiyat: 85 },
      { id: 10, ad: "Limonata",   aciklama: "Taze sıkılmış, fesleğenli",     fiyat: 65 },
    ]
  },
  {
    kategori: "🥪 Yiyecekler",
    urunler: [
      { id: 11, ad: "Tost",              aciklama: "Köy ekmeği, kaşar, domates",        fiyat: 90  },
      { id: 12, ad: "Avokadolu Sandviç", aciklama: "Ekşi maya ekmek",                  fiyat: 130 },
      { id: 13, ad: "Günlük Kek",        aciklama: "Her gün değişir",                  fiyat: 60  },
      { id: 14, ad: "Waffle",            aciklama: "Muz & Nutella veya tuzlu karamel", fiyat: 120 },
    ]
  }
];

// =====================
// DURUM
// =====================
let sepet = {};
let masaNo = 1;

function getMasaNo() {
  const params = new URLSearchParams(window.location.search);
  const m = parseInt(params.get("masa"));
  if (m && m >= 1 && m <= 10) return m;
  return 1;
}

// =====================
// MENÜ RENDER
// =====================
function renderMenu() {
  const container = document.getElementById("menu-container");
  const tabs = document.getElementById("cat-tabs");
  container.innerHTML = "";
  tabs.innerHTML = "";

  menu.forEach((kat, ki) => {
    const tab = document.createElement("button");
    tab.className = "cat-tab" + (ki === 0 ? " active" : "");
    tab.textContent = kat.kategori;
    tab.onclick = () => {
      document.querySelectorAll(".cat-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById("sec-" + ki).scrollIntoView({ behavior: "smooth", block: "start" });
    };
    tabs.appendChild(tab);

    const sec = document.createElement("div");
    sec.className = "menu-section";
    sec.id = "sec-" + ki;

    const title = document.createElement("div");
    title.className = "menu-section-title";
    title.textContent = kat.kategori;
    sec.appendChild(title);

    const items = document.createElement("div");
    items.className = "menu-items";

    kat.urunler.forEach(urun => {
      const qty = sepet[urun.id] || 0;
      const el = document.createElement("div");
      el.className = "menu-item" + (qty > 0 ? " in-cart" : "");
      el.id = "item-" + urun.id;
      el.innerHTML = `
        <div class="menu-item-info">
          <div class="menu-item-name">${urun.ad}</div>
          <div class="menu-item-desc">${urun.aciklama}</div>
        </div>
        <div class="menu-item-price">${urun.fiyat} ₺</div>
        <div class="item-controls">
          ${qty > 0 ? `<button class="qty-btn" onclick="change(${urun.id}, -1)">−</button>
          <span class="qty-display">${qty}</span>` : ""}
          <button class="qty-btn add" onclick="change(${urun.id}, 1)">+</button>
        </div>
      `;
      items.appendChild(el);
    });

    sec.appendChild(items);
    container.appendChild(sec);
  });
}

function change(id, delta) {
  sepet[id] = Math.max(0, (sepet[id] || 0) + delta);
  if (sepet[id] === 0) delete sepet[id];
  updateItem(id);
  updateCartCount();
}

function updateItem(id) {
  const el = document.getElementById("item-" + id);
  if (!el) return;
  const qty = sepet[id] || 0;
  el.className = "menu-item" + (qty > 0 ? " in-cart" : "");
  el.querySelector(".item-controls").innerHTML = `
    ${qty > 0 ? `<button class="qty-btn" onclick="change(${id}, -1)">−</button>
    <span class="qty-display">${qty}</span>` : ""}
    <button class="qty-btn add" onclick="change(${id}, 1)">+</button>
  `;
}

function findUrun(id) {
  for (const kat of menu) {
    const u = kat.urunler.find(u => u.id === id);
    if (u) return u;
  }
  return null;
}

function updateCartCount() {
  const total = Object.values(sepet).reduce((a, b) => a + b, 0);
  document.getElementById("cart-count").textContent = total;
}

// =====================
// SEPET
// =====================
function toggleCart() {
  const overlay = document.getElementById("cart-overlay");
  const drawer = document.getElementById("cart-drawer");
  const open = drawer.classList.contains("open");
  if (open) {
    drawer.classList.remove("open");
    overlay.classList.remove("open");
  } else {
    renderCart();
    drawer.classList.add("open");
    overlay.classList.add("open");
  }
}

function renderCart() {
  const container = document.getElementById("cart-items");
  const footer = document.getElementById("cart-footer");
  const ids = Object.keys(sepet);

  if (ids.length === 0) {
    container.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">☕</div>Sepetiniz boş.<br>Menüden ürün ekleyin.</div>`;
    footer.style.display = "none";
    return;
  }

  let total = 0;
  container.innerHTML = "";

  ids.forEach(id => {
    const urun = findUrun(parseInt(id));
    if (!urun) return;
    const qty = sepet[id];
    const subtotal = urun.fiyat * qty;
    total += subtotal;
    const el = document.createElement("div");
    el.className = "cart-item";
    el.innerHTML = `
      <div style="flex:1">
        <div class="cart-item-name">${urun.ad}</div>
        <div class="cart-item-qty">${qty} adet × ${urun.fiyat} ₺</div>
      </div>
      <span class="cart-item-price">${subtotal} ₺</span>
      <button class="cart-item-remove" onclick="removeFromCart(${urun.id})">×</button>
    `;
    container.appendChild(el);
  });

  document.getElementById("cart-total").textContent = total + " ₺";
  footer.style.display = "block";
}

function removeFromCart(id) {
  delete sepet[id];
  updateItem(id);
  updateCartCount();
  renderCart();
}

// =====================
// WHATSAPP + FİREBASE
// =====================
async function sendWhatsApp() {
  const ids = Object.keys(sepet);
  if (ids.length === 0) return;

  const not = document.getElementById("order-note").value.trim();
  let mesaj = `🏪 *${KAFE_ADI}* — Yeni Sipariş\n`;
  mesaj += `📍 *Masa ${masaNo}*\n`;
  mesaj += `────────────────\n`;

  let toplam = 0;
  const urunlerListesi = [];

  ids.forEach(id => {
    const urun = findUrun(parseInt(id));
    if (!urun) return;
    const qty = sepet[id];
    const sub = urun.fiyat * qty;
    toplam += sub;
    mesaj += `• ${urun.ad} × ${qty} — ${sub} ₺\n`;
    urunlerListesi.push({ ad: urun.ad, adet: qty, fiyat: urun.fiyat });
  });

  mesaj += `────────────────\n`;
  mesaj += `💰 *Toplam: ${toplam} ₺*\n`;
  if (not) mesaj += `📝 Not: ${not}`;

  try {
    const yeniSiparis = {
      masa: masaNo,
      urunler: urunlerListesi,
      toplam: toplam,
      not: not || "",
      durum: "bekliyor",
      zaman: Date.now()
    };
    await push(ref(db, "siparisler"), yeniSiparis);
  } catch(e) {
    console.error("Firebase hatası:", e);
  }

  const encoded = encodeURIComponent(mesaj);
  window.open(`https://wa.me/${WHATSAPP_NUMARA}?text=${encoded}`, "_blank");

  setTimeout(() => {
    document.getElementById("cart-drawer").classList.remove("open");
    document.getElementById("cart-overlay").classList.remove("open");
    document.getElementById("success-screen").classList.add("show");
  }, 500);
}

function resetOrder() {
  sepet = {};
  document.getElementById("order-note").value = "";
  document.getElementById("success-screen").classList.remove("show");
  updateCartCount();
  renderMenu();
}

// window üzerine bağla (HTML onclick için gerekli)
window.toggleCart = toggleCart;
window.change = change;
window.removeFromCart = removeFromCart;
window.sendWhatsApp = sendWhatsApp;
window.resetOrder = resetOrder;

// =====================
// BAŞLAT
// =====================
masaNo = getMasaNo();
document.getElementById("masa-label").textContent = "Masa " + masaNo;
document.title = KAFE_ADI + " — Masa " + masaNo;
renderMenu();
