const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

const els = {
  subtitle: document.getElementById("subtitle"),
  statusBox: document.getElementById("statusBox"),
  categories: document.getElementById("categories"),
  products: document.getElementById("products"),
  categoryTpl: document.getElementById("categoryTpl"),
  productTpl: document.getElementById("productTpl"),
  activeCategoryBadge: document.getElementById("activeCategoryBadge"),
  refreshBtn: document.getElementById("refreshBtn"),
};

const state = { categories: [], productsByCategory: new Map(), activeCategoryId: null, imageMap: {} };
const backendFromQuery = new URLSearchParams(window.location.search).get("backend") || "";
const BACKEND_BASE = (backendFromQuery || window.__BOT_BACKEND__ || "").trim().replace(/\/$/, "");

function apiUrl(path) { return BACKEND_BASE ? `${BACKEND_BASE}${path}` : path; }
function showError(msg) { els.statusBox.textContent = msg; els.statusBox.classList.remove("hidden"); }
function hideError() { els.statusBox.classList.add("hidden"); els.statusBox.textContent = ""; }
function getAuthHeaders() { return { "Content-Type": "application/json", "X-Telegram-Init-Data": tg?.initData || "" }; }

async function safeFetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}

async function loadImageMap() {
  try {
    const map = await safeFetchJson("assets/product-images.json");
    if (map && typeof map === "object") state.imageMap = map;
  } catch (_) {
    state.imageMap = {};
  }
}

function slugify(text) {
  return String(text || "").toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, "-").replace(/^-+|-+$/g, "");
}

function resolveImage(product) {
  if (product.image_url) return product.image_url;
  const idKey = `id:${product.id}`;
  if (state.imageMap[idKey]) return state.imageMap[idKey];
  const slugKey = `slug:${slugify(product.name)}`;
  if (state.imageMap[slugKey]) return state.imageMap[slugKey];
  const name = String(product.name || "").toLowerCase();
  for (const [k, v] of Object.entries(state.imageMap)) {
    if (!k.startsWith("kw:")) continue;
    const kw = k.slice(3).toLowerCase();
    if (kw && name.includes(kw)) return v;
  }
  return "assets/default-app.svg";
}

function renderCategories() {
  els.categories.innerHTML = "";
  for (const cat of state.categories) {
    const node = els.categoryTpl.content.firstElementChild.cloneNode(true);
    node.textContent = cat.name;
    if (cat.id === state.activeCategoryId) node.classList.add("active");
    node.addEventListener("click", () => { state.activeCategoryId = cat.id; renderCategories(); renderProducts(); });
    els.categories.appendChild(node);
  }
}

function renderProducts() {
  els.products.innerHTML = "";
  const category = state.categories.find((c) => c.id === state.activeCategoryId);
  const products = state.productsByCategory.get(state.activeCategoryId) || [];
  if (category) { els.activeCategoryBadge.classList.remove("hidden"); els.activeCategoryBadge.textContent = category.name; }
  else { els.activeCategoryBadge.classList.add("hidden"); }

  for (const product of products) {
    const node = els.productTpl.content.firstElementChild.cloneNode(true);
    const img = node.querySelector(".thumb");
    const name = node.querySelector(".name");
    const meta = node.querySelector(".meta");
    const buyBtn = node.querySelector(".buy-btn");
    img.src = resolveImage(product);
    img.alt = product.name || "product";
    name.textContent = product.name || "خدمة بدون اسم";
    meta.textContent = product.description || "";

    buyBtn.addEventListener("click", async () => {
      buyBtn.disabled = true;
      try {
        const result = await safeFetchJson(apiUrl("/webapp/checkout"), {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ product_id: product.id, category_id: state.activeCategoryId }),
        });
        tg?.showPopup({ title: "تم", message: result?.message || "تم إرسال الطلب", buttons: [{ type: "ok" }] });
      } catch (err) {
        showError(`تعذر تنفيذ الطلب: ${err.message}`);
      } finally {
        buyBtn.disabled = false;
      }
    });

    els.products.appendChild(node);
  }
}

async function loadBootstrap() {
  hideError();
  els.subtitle.textContent = "جاري تحميل البيانات...";
  try {
    await loadImageMap();
    const data = await safeFetchJson(apiUrl("/webapp/bootstrap"), {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({}),
    });
    state.categories = data.categories || [];
    state.productsByCategory = new Map();
    for (const c of state.categories) state.productsByCategory.set(c.id, data.products_by_category?.[c.id] || []);
    state.activeCategoryId = state.categories[0]?.id || null;
    renderCategories();
    renderProducts();
    els.subtitle.textContent = `تم التحميل: ${state.categories.length} أقسام`;
  } catch (err) {
    showError("تعذر تحميل البيانات. تأكد أن Backend البوت يوفر /webapp/bootstrap ويتحقق من Telegram initData.");
    els.subtitle.textContent = "فشل التحميل";
  }
}

els.refreshBtn.addEventListener("click", loadBootstrap);
loadBootstrap();
