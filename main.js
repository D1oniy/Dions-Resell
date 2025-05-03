// main.js

/**********************
 * 0) Konstanten
 **********************/
const TAX_RATE     = 0.081;   // 8.1 % MwSt.
const SHIPPING_FEE = 5.90;    // pauschal

/**********************
 * 1) Navigation
 **********************/
function goToLogin  () { location.href = "login.html"; }
function goHome     () { location.href = "index.html"; }
function goBack     () { history.length>1 ? history.back() : goHome(); }
function goRegister () { location.href = "register.html"; }
window.goToLogin = goToLogin;
window.goHome    = goHome;
window.goBack    = goBack;
window.goRegister= goRegister;

/**********************
 * 2) Login / Register
 **********************/
function handleLoginFormSubmit(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    const email = document.getElementById("loginEmail")?.value;
    alert(`Login (Platzhalter) für ${email}`);
    goHome();
  });
}
function handleRegisterFormSubmit(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    const email = document.getElementById("regEmail")?.value;
    alert(`Registrierung (Platzhalter) für ${email}`);
    goHome();
  });
}
window.handleLoginFormSubmit    = handleLoginFormSubmit;
window.handleRegisterFormSubmit = handleRegisterFormSubmit;

/**********************
 * 3) Storage-Helper
 **********************/
function getUserProducts() {
  return JSON.parse(localStorage.getItem("userProducts") || "[]");
}
function setUserProducts(arr) {
  localStorage.setItem("userProducts", JSON.stringify(arr));
}
function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}
function setCart(arr) {
  localStorage.setItem("cart", JSON.stringify(arr));
}

/**********************
 * 4) Produktseite
 **********************/
// Kategorie aus URL ermitteln, z.B. "elektronik.html" → "elektronik"
function detectCategory() {
  const match = location.pathname.match(/([^/]+)\.html$/);
  return match ? match[1] : null;
}
function initProductPage() {
  const category = detectCategory();
  if (!category || category==="checkout"||category==="login"||category==="register") return;
  window.currentCategory = category;
  renderProducts();
  setupSearch();
  setupNewProductForm();
}
function renderProducts(filteredList) {
  const all = getUserProducts().filter(p => p.category===window.currentCategory);
  window.allProducts = all;
  const list = filteredList||all;
  const container = document.getElementById("productsSection");
  container.innerHTML = "";
  list.forEach(p=> createProductCard(p));
}
function createProductCard(p) {
  const container = document.getElementById("productsSection");
  const card = document.createElement("div"); card.className="product";
  // Bild
  const imgDiv = document.createElement("div"); imgDiv.className="product-image";
  const img = document.createElement("img"); img.src=p.imageUrl; img.alt=p.name;
  imgDiv.appendChild(img); card.appendChild(imgDiv);
  // Details
  const det = document.createElement("div"); det.className="product-details";
  // Name
  const nm = document.createElement("p"); nm.className="product-name"; nm.textContent=p.name;
  det.appendChild(nm);
  // Desc
  if(p.desc) {
    const dc = document.createElement("p"); dc.className="product-desc"; dc.textContent=p.desc;
    det.appendChild(dc);
  }
  // Menge
  const qt = document.createElement("p"); qt.className="available-qty";
  qt.textContent="Menge: "+p.qty; det.appendChild(qt);
  // Bottom row (Preis + Warenkorb)
  const br = document.createElement("div"); br.className="bottom-row";
  const sp = document.createElement("span"); sp.className="price"; sp.textContent="CHF"+p.price.toFixed(2);
  br.appendChild(sp);
  const add = document.createElement("button"); add.className="cart-btn"; add.textContent="In den Warenkorb";
  add.addEventListener("click", ()=> addToCart(p.name,p.price));
  br.appendChild(add);
  det.appendChild(br);
  // Entfernen-Button
  const rem = document.createElement("button"); rem.className="remove-card"; rem.textContent="❌";
  rem.title="Artikel löschen";
  rem.addEventListener("click", ()=>{
    if(confirm("Artikel wirklich löschen?")) {
      const arr = getUserProducts().filter(x=>x.id!==p.id);
      setUserProducts(arr);
      renderProducts();
    }
  });
  det.appendChild(rem);
  card.appendChild(det);
  container.appendChild(card);
}

// Suche
function setupSearch(){
  const inp = document.getElementById("searchInput");
  if(!inp) return;
  inp.addEventListener("input", ()=>{
    const t = inp.value.trim().toLowerCase();
    const filtered = window.allProducts.filter(p=>
      p.name.toLowerCase().includes(t) ||
      (p.desc||"").toLowerCase().includes(t)
    );
    renderProducts(filtered);
  });
}

// Neues Produkt hinzufügen
function setupNewProductForm(){
  const btn  = document.getElementById("toggleProductBtn");
  const form = document.getElementById("newProductForm");
  if(!btn||!form) return;
  let open=false;
  btn.addEventListener("click", ()=>{
    open = !open;
    form.classList.toggle("open", open);
    btn.textContent = open?"Schließen":"Neues Produkt hinzufügen";
  });
  form.addEventListener("submit", e=>{
    e.preventDefault();
    const fileI = document.getElementById("imageFile");
    const name  = document.getElementById("productName").value.trim();
    const desc  = document.getElementById("productDesc").value.trim();
    const price = parseFloat(document.getElementById("productPrice").value);
    const qty   = parseInt(document.getElementById("productQuantity").value)||1;
    
    const reader = new FileReader();
    reader.onload = evt=>{
      const imgD = evt.target.result;
      const arr = getUserProducts();
      const id  = Date.now();
      arr.push({ id, category:window.currentCategory, imageUrl:imgD, name, desc, price, qty });
      setUserProducts(arr);
      renderProducts();
      form.reset();
      form.classList.remove("open");
      btn.textContent="Neues Produkt hinzufügen";
      open=false;
    };
    reader.readAsDataURL(fileI.files[0]);
  });
}

/**********************
 * 5) Warenkorb-Funktionen
 **********************/
function addToCart(name,price){
  const prod = window.allProducts.find(p=>p.name===name);
  const maxQ = prod? prod.qty: Infinity;
  const cart = getCart();
  const ex = cart.find(i=>i.name===name);
  if(ex){
    if(ex.quantity < maxQ) ex.quantity++;
    else return alert("Maximale Menge erreicht!");
  } else {
    cart.push({ name, price, quantity:1 });
  }
  setCart(cart);
  updateCartUI();
}
function removeFromCart(idx){
  const cart = getCart();
  if(cart[idx].quantity>1) cart[idx].quantity--;
  else cart.splice(idx,1);
  setCart(cart);
  updateCartUI();
}
function updateCartUI(){
  const cart = getCart();
  const ul   = document.getElementById("cartItems");
  if(!ul) return;
  ul.innerHTML="";
  let sum=0;
  cart.forEach((i,idx)=>{
    const li = document.createElement("li"); li.className="cart-item";
    li.textContent=`${i.name} x${i.quantity} – CHF${(i.price*i.quantity).toFixed(2)}`;
    const btn = document.createElement("button"); btn.className="remove-card"; btn.textContent="-";
    btn.addEventListener("click",()=>removeFromCart(idx));
    li.appendChild(btn);
    ul.appendChild(li);
    sum += i.price*i.quantity;
  });
  document.getElementById("totalValue").textContent = sum.toFixed(2);
}

/**********************
 * 6) Checkout-Seite
 **********************/
function updateCheckoutCart(){
  const cart = getCart();
  const ul   = document.getElementById("cartItems");
  if(!ul) return;
  ul.innerHTML="";
  let sub=0;
  cart.forEach((i,idx)=>{
    const li = document.createElement("li"); li.className="cart-item";
    li.textContent=`${i.name} x${i.quantity} – CHF${(i.price*i.quantity).toFixed(2)}`;
    const btn = document.createElement("button"); btn.className="remove-card"; btn.textContent="-";
    btn.addEventListener("click",()=>{
      removeFromCart(idx);
      updateCheckoutCart();
      updateSummary();
    });
    li.appendChild(btn);
    ul.appendChild(li);
    sub += i.price*i.quantity;
  });
  document.getElementById("totalValue").textContent = sub.toFixed(2);
  updateSummary(sub);
}
function updateSummary(subtotal){
  const ship = SHIPPING_FEE;
  const tax  = (subtotal+ship)*TAX_RATE;
  const tot  = subtotal+ship+tax;
  // Annahme: du hast IDs summarySubtotal, summaryShipping, summaryTax, summaryTotal
  document.getElementById("summaryShipping").textContent = ship.toFixed(2);
  document.getElementById("summaryTax").textContent      = tax.toFixed(2);
  document.getElementById("summaryTotal").textContent    = tot.toFixed(2);
}
function checkoutPayment(){
  alert("Bezahlung abgeschlossen. Danke!");
  localStorage.removeItem("cart");
  goHome();
}
window.checkoutPayment = checkoutPayment;

/**********************
 * 7) DOMContentLoaded
 **********************/
document.addEventListener("DOMContentLoaded", () => {
  initProductPage();
  updateCartUI();
  if (document.body.classList.contains("checkout-page")) {
    updateCheckoutCart();
  }
  
});
// main.js

// 1) Hilfsfunktionen zum Lesen/Schreiben des Carts
function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}
function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// 2) Beim Laden einmal Warenkorb und Übersicht rendern
document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  renderSummary();
});

// 3) Warenkorb rendern
function renderCart() {
  const cart = getCart();
  const ul = document.getElementById("cartItems");
  ul.innerHTML = "";

  cart.forEach((item, idx) => {
    const li = document.createElement("li");
    li.className = "cart-item";

    // Text: "Name xMenge – CHFXX.XX"
    const text = document.createElement("span");
    text.textContent = `${item.name} x${item.quantity} – CHF${(item.price * item.quantity).toFixed(2)}`;

    // Entfernen-Button
    const btn = document.createElement("button");
    btn.className = "remove-btn";        // CSS-Klasse für Styling (siehe unten)
    btn.textContent = "Entfernen";
    btn.onclick = () => {
      removeFromCart(idx);
    };

    li.append(text, btn);
    ul.appendChild(li);
  });
}

// 4) Remove-Logic: Menge-- oder Item raus, dann neu rendern und speichern
function removeFromCart(index) {
  const cart = getCart();
  if (cart[index].quantity > 1) {
    cart[index].quantity--;
  } else {
    cart.splice(index, 1);
  }
  saveCart(cart);
  renderCart();
  renderSummary();
}

// 5) Zusammenfassung rendern (Artikel-Summe, Versand, MwSt., Gesamt)
function renderSummary() {
  const cart = getCart();

  const itemsTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = itemsTotal > 0 ? 5.00 : 0.00;       // Beispiel: CHF 5 Versand
  const tax = itemsTotal * 0.081;                     // 8,1 % MwSt.
  const grandTotal = itemsTotal + shipping + tax;

  // Artikel-Anzahl (alle Mengen aufsummiert)
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById("itemCount").textContent = count;

  document.getElementById("itemsTotal").textContent    = `CHF ${itemsTotal.toFixed(2)}`;
  document.getElementById("shippingCost").textContent = `CHF ${shipping.toFixed(2)}`;
  document.getElementById("taxAmount").textContent    = `CHF ${tax.toFixed(2)}`;
  document.getElementById("grandTotal").textContent   = `CHF ${grandTotal.toFixed(2)}`;
}

// 6) Bezahl-Funktion (wie gehabt)
function checkoutPayment() {
  alert("Bezahlung abgeschlossen. Vielen Dank!");
  localStorage.removeItem("cart");
  goBack();
}

// Exporte (wenn aus externem Script referenziert)
window.checkoutPayment = checkoutPayment;
// main.js

// Hilfsfunktionen
function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}
function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// Wenn DOM ready
document.addEventListener("DOMContentLoaded", () => {
  if (document.body.classList.contains("checkout-page")) {
    initCheckout();
  } else {
    initMiniCart();
  }
});

/* ─── Mini-Warenkorb auf Produkt-Seiten ───────────────────────────────────── */

function initMiniCart() {
  renderMiniCart();
}
function renderMiniCart() {
  const cart = getCart();
  const ul = document.getElementById("cartItems");
  if (!ul) return;
  ul.innerHTML = "";
  let total = 0;
  cart.forEach((item, i) => {
    const li = document.createElement("li");
    li.className = "cart-item";

    // Text
    li.textContent = `${item.name} x${item.quantity} – CHF${(item.price * item.quantity).toFixed(2)}`;

    // Kleiner "-"-Button
    const btn = document.createElement("button");
    btn.textContent = "–";
    btn.className = "mini-remove";
    btn.onclick = () => {
      removeMiniItem(i);
    };
    li.appendChild(btn);

    ul.appendChild(li);
    total += item.price * item.quantity;
  });
  const totalEl = document.getElementById("totalValue");
  if (totalEl) totalEl.textContent = total.toFixed(2);
}

function removeMiniItem(index) {
  const cart = getCart();
  if (cart[index].quantity > 1) cart[index].quantity--;
  else cart.splice(index, 1);
  saveCart(cart);
  renderMiniCart();
}

/* ─── Checkout-Warenkorb ─────────────────────────────────────────────────── */

function initCheckout() {
  renderCheckoutCart();
  renderSummary();
}

function renderCheckoutCart() {
  const cart = getCart();
  const ul = document.getElementById("cartItems");
  if (!ul) return;
  ul.innerHTML = "";

  cart.forEach((item, idx) => {
    const li = document.createElement("li");
    li.className = "cart-item";

    // Text
    const txt = document.createElement("span");
    txt.textContent = `${item.name} x${item.quantity} – CHF${(item.price * item.quantity).toFixed(2)}`;

    // Entfernen-Button (ganz anders gestylt)
    const btn = document.createElement("button");
    btn.className = "remove-btn";
    btn.textContent = "Entfernen";
    btn.onclick = () => {
      removeCheckoutItem(idx);
    };

    li.append(txt, btn);
    ul.appendChild(li);
  });
}

function removeCheckoutItem(index) {
  const cart = getCart();
  if (cart[index].quantity > 1) cart[index].quantity--;
  else cart.splice(index, 1);
  saveCart(cart);
  renderCheckoutCart();
  renderSummary();
}

function renderSummary() {
  const cart = getCart();
  const itemsTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping    = itemsTotal > 0 ? 5.00 : 0.00;
  const tax         = itemsTotal * 0.081;  // 8,1 %
  const grandTotal  = itemsTotal + shipping + tax;
  const count       = cart.reduce((sum, i) => sum + i.quantity, 0);

  document.getElementById("itemCount").textContent    = count;
  document.getElementById("itemsTotal").textContent  = `CHF ${itemsTotal.toFixed(2)}`;
  document.getElementById("shippingCost").textContent= `CHF ${shipping.toFixed(2)}`;
  document.getElementById("taxAmount").textContent   = `CHF ${tax.toFixed(2)}`;
  document.getElementById("grandTotal").textContent  = `CHF ${grandTotal.toFixed(2)}`;
}

function checkoutPayment() {
  alert("Bezahlung abgeschlossen. Vielen Dank!");
  localStorage.removeItem("cart");
  goBack();
}

// Export, falls nötig
window.checkoutPayment = checkoutPayment;
// ─── Mini-Warenkorb auf Produktseiten ────────────────────────────────────

// Jedes Mal, wenn die Seite lädt, den Mini-Warenkorb rendern:
document.addEventListener("DOMContentLoaded", () => {
  renderMiniCart();
});

// Liest den Warenkorb aus localStorage
function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}
// Speichert den Warenkorb in localStorage
function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// Baut den Mini-Warenkorb neu auf
function renderMiniCart() {
  const cart = getCart();
  const ul = document.getElementById("cartItems");
  if (!ul) return;
  ul.innerHTML = "";
  let total = 0;

  cart.forEach((item, i) => {
    const li = document.createElement("li");
    li.className = "cart-item";
    li.textContent = `${item.name} x${item.quantity} – CHF${(item.price * item.quantity).toFixed(2)}`;

    // Kleiner Minus-Button
    const btn = document.createElement("button");
    btn.className = "mini-remove";
    btn.textContent = "–";
    btn.onclick = () => {
      removeMiniItem(i);
    };

    li.appendChild(btn);
    ul.appendChild(li);
    total += item.price * item.quantity;
  });

  // Total aktualisieren
  const totalEl = document.getElementById("totalValue");
  if (totalEl) totalEl.textContent = total.toFixed(2);
}

// Entfernt entweder eine Einheit oder das Item komplett
function removeMiniItem(index) {
  const cart = getCart();
  if (cart[index].quantity > 1) {
    cart[index].quantity--;
  } else {
    cart.splice(index, 1);
  }
  saveCart(cart);
  renderMiniCart();     // ← ganz wichtig!
}

// Fügt ein Produkt hinzu und updated sofort den Mini-Warenkorb
function addToCart(name, price) {
  const cart = getCart();
  const existing = cart.find(i => i.name === name);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ name, price, quantity: 1 });
  }
  saveCart(cart);
  renderMiniCart();     // ← auch hier
}
// ────────────────────────────────────────────────────────────────────────────────
// 1) HILFS-FUNKTIONEN
// ────────────────────────────────────────────────────────────────────────────────
function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}
function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// ────────────────────────────────────────────────────────────────────────────────
// 2) MINI-WARENKORB (PRODUKTSEITEN)
// ────────────────────────────────────────────────────────────────────────────────
function renderMiniCart() {
  const cart = getCart();
  const ul = document.getElementById("cartItems");
  if (!ul) return;
  ul.innerHTML = "";
  let total = 0;

  cart.forEach((item, i) => {
    const line = item.price * item.quantity;
    total += line;

    const li = document.createElement("li");
    li.className = "cart-item";
    li.textContent = `${item.name} x${item.quantity} – CHF${line.toFixed(2)}`;

    const btn = document.createElement("button");
    btn.className = "mini-remove";
    btn.textContent = "–";
    btn.onclick = () => {
      removeMiniItem(i);
    };

    li.appendChild(btn);
    ul.appendChild(li);
  });

  const totalEl = document.getElementById("totalValue");
  if (totalEl) totalEl.textContent = total.toFixed(2);
}

// Entfernt eine Einheit oder das Item ganz
function removeMiniItem(index) {
  const cart = getCart();
  if (cart[index].quantity > 1) {
    cart[index].quantity--;
  } else {
    cart.splice(index, 1);
  }
  saveCart(cart);
  renderMiniCart();
}

// Fügt zum Mini-Warenkorb hinzu, beachtet max. Menge aus allProducts
function addToCart(name, price) {
  const cart = getCart();
  const prod = window.allProducts?.find(p => p.name === name);
  const maxQty = prod ? parseInt(prod.qty) : Infinity;
  const existing = cart.find(i => i.name === name);

  if (existing) {
    if (existing.quantity < maxQty) {
      existing.quantity++;
    } else {
      alert("Maximale Menge erreicht!");
      return;
    }
  } else {
    if (maxQty > 0) {
      cart.push({ name, price, quantity: 1 });
    } else {
      alert("Produkt ist nicht verfügbar!");
      return;
    }
  }
  saveCart(cart);
  renderMiniCart();
}
// ────────────────────────────────────────────────────────────────────────────────
// CHECKOUT-FUNKTIONEN
// ────────────────────────────────────────────────────────────────────────────────

// 1) Entfernen-Handler im Checkout
function removeCheckoutItem(idx) {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  // Menge verringern oder ganz entfernen
  if (cart[idx].quantity > 1) {
    cart[idx].quantity--;
  } else {
    cart.splice(idx, 1);
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCheckoutCart();
}

// 2) Checkout erneut rendern + Übersicht berechnen
function updateCheckoutCart() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const ul = document.getElementById("cartItems");
  if (!ul) return;

  ul.innerHTML = "";
  let itemsTotal = 0;
  let itemCount = 0;

  cart.forEach((item, i) => {
    const line = item.price * item.quantity;
    itemsTotal += line;
    itemCount += item.quantity;

    // LI mit Text und Entfernen-Button
    const li = document.createElement("li");
    li.className = "cart-item";
    li.innerHTML = `
      ${item.name} x${item.quantity} – CHF${line.toFixed(2)}
      <button class="btn remove-btn" onclick="removeCheckoutItem(${i})">Entfernen</button>
    `;
    ul.appendChild(li);
  });

  // Steuerberechnung
  const taxRate = 0.081;
  const taxAmount    = itemsTotal * taxRate;
  const shippingCost = itemsTotal > 0 ? 5.90 : 0;  // Beispiel-Versand
  const grandTotal   = itemsTotal + shippingCost + taxAmount;

  // Werte in der Übersicht eintragen
  document.getElementById("itemCount")    .textContent = itemCount;
  document.getElementById("itemsTotal")   .textContent = `CHF ${itemsTotal.toFixed(2)}`;
  document.getElementById("shippingCost") .textContent = `CHF ${shippingCost.toFixed(2)}`;
  document.getElementById("taxAmount")    .textContent = `CHF ${taxAmount.toFixed(2)}`;
  document.getElementById("grandTotal")   .textContent = `CHF ${grandTotal.toFixed(2)}`;
}

// 3) Beim Laden der Checkout-Seite sofort rendern
document.addEventListener("DOMContentLoaded", () => {
  updateCheckoutCart();
});
// ──────────────────────────────────────────────────────
// 1) Simulation: Login-Status in localStorage speichern
// ──────────────────────────────────────────────────────
function simulateLogin() {
  // wenn der echte Login-Button geklickt wird
  const loginBtn = document.querySelector('.btn-login');
  if (loginBtn) {
    loginBtn.addEventListener('click', e => {
      e.preventDefault();
      // Status setzen
      localStorage.setItem('simLoggedIn', 'true');
      // Zur Startseite weiterleiten
      window.location.href = 'index.html';
    });
  }
}

// ──────────────────────────────────────────────────────
// 2) UI aktualisieren: Login-Button ersetzen durch "Angemeldet"
// ──────────────────────────────────────────────────────
function updateLoginUI() {
  const container = document.getElementById('loginButton');
  if (!container) return;
    // ersetze den kompletten Inhalt durch einen disabled-Button
    container.innerHTML = `
      <button class="btn" disabled>
        Angemeldet
      </button>
    `;
  }

document.addEventListener('DOMContentLoaded', () => {
  simulateLogin();
  updateLoginUI();
});
// ──────────────────────────────────────────────────────────────
// 1) Klick auf „Anmelden“ abfangen, Login speichern & Popup zeigen
// ──────────────────────────────────────────────────────────────
function simulateLogin() {
  const loginBtn = document.querySelector('.btn-login');
  if (!loginBtn) return;

  loginBtn.addEventListener('click', e => {
    e.preventDefault();                    // echtes Absenden verhindern
    localStorage.setItem('simLoggedIn', 'true');  // Login-Status merken
    alert('Login erfolgreich!');           // Popup
    window.location.href = 'index.html';   // zur Startseite weiterleiten
  });
}

// ──────────────────────────────────────────────────────────────
// 2) Nach dem Laden: UI oben rechts anpassen, falls bereits eingeloggt
// ──────────────────────────────────────────────────────────────
function updateLoginUI() {
  const container = document.getElementById('loginButton');
  if (!container) return;

    container.innerHTML = `
      <button class="btn" disabled>
        Angemeldet
      </button>
    `;
  }


document.addEventListener('DOMContentLoaded', () => {
  simulateLogin();
  updateLoginUI();
});
// ganz unten in main.js
document.addEventListener('DOMContentLoaded', () => {
  // … deine anderen Init-Funktionen …

  // Login-Button-Container auf der Index-Seite entfernen, wenn schon eingeloggt
    document.getElementById('loginButton')?.remove();
  }
);
// 1) Navigation-Funktionen
function goToLogin()   { location.href = "login.html"; }
function goBack()      { history.length>1 ? history.back() : goToLogin(); }

// 2) Login-Simulation: Wenn auf "Anmelden" geklickt wird
cheery-fox-a857df

  // 3) Index.html: Ersetze Login-Button durch User-Info, falls eingeloggt

  // 4) Rest der Index-Logik
  document.getElementById("produkteBtn")?.addEventListener("click", () => {
    document.getElementById("categoriesContainer").classList.toggle("expanded");
  });
  document.getElementById("infoBtn")?.addEventListener("click", () => {
    window.location.href = "info.html";
  });
  document.getElementById("kontaktBtn")?.addEventListener("click", () => {
    window.location.href = "kontakt.html";
  });
;
async function loadProducts() {
  try {
    const res = await fetch('http://localhost:5000/api/products');
    const products = await res.json();

    const container = document.getElementById('product-list');
    if (!container) return;

    container.innerHTML = products.map(p => `
      <div class="product">
        <img src="${p.image}" alt="${p.name}" width="100">
        <h3>${p.name}</h3>
        <p>${p.description}</p>
        <strong>${p.price} CHF</strong>
        <button onclick="deleteProduct('${p._id}')">🗑️ Löschen</button>
      </div>
    `).join('');
  } catch (err) {
    console.error('Fehler beim Laden der Produkte:', err);
  }
}

async function deleteProduct(id) {
  await fetch(`http://localhost:5000/api/products/${id}`, { method: 'DELETE' });
  loadProducts(); // Seite neu laden
}

document.addEventListener('DOMContentLoaded', loadProducts);
const form = document.getElementById('product-form');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const product = {
      name: document.getElementById('name').value,
      description: document.getElementById('description').value,
      price: parseFloat(document.getElementById('price').value),
      quantity: parseInt(document.getElementById('quantity').value),
      image: document.getElementById('image').value
    };

    try {
      await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      alert('Produkt gespeichert!');
      form.reset();
    } catch (err) {
      alert('Fehler beim Speichern');
      console.error(err);
    }
  });
}
function setupNewProductForm() {
  const btn = document.getElementById("toggleProductBtn");
  const form = document.getElementById("newProductForm");
  if (!btn || !form) return;

  let open = false;

  // Toggle form visibility
  btn.addEventListener("click", () => {
    open = !open;
    form.classList.toggle("open", open);
    btn.textContent = open ? "Schließen" : "Neues Produkt hinzufügen";
  });

  // Remove any existing event listener before adding a new one
  form.removeEventListener("submit", handleFormSubmit);
  form.addEventListener("submit", handleFormSubmit);
}

function handleFormSubmit(e) {
  e.preventDefault();

  const fileI = document.getElementById("imageFile");
  const name = document.getElementById("productName").value.trim();
  const desc = document.getElementById("productDesc").value.trim();
  const price = parseFloat(document.getElementById("productPrice").value);
  const qty = parseInt(document.getElementById("productQuantity").value) || 1;

  if (!fileI.files[0] || !name || !price || !qty) {
    alert("Bitte alle Felder ausfüllen!");
    return;
  }

  const reader = new FileReader();
  reader.onload = evt => {
    const imgD = evt.target.result;
    const arr = getUserProducts();
    const id = Date.now();
    arr.push({ id, category: window.currentCategory, imageUrl: imgD, name, desc, price, qty });
    setUserProducts(arr);
    renderProducts();
    document.getElementById("newProductForm").reset();
    document.getElementById("newProductForm").classList.remove("open");
    document.getElementById("toggleProductBtn").textContent = "Neues Produkt hinzufügen";
  };
  reader.readAsDataURL(fileI.files[0]);
}
