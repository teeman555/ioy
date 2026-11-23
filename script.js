// ==========================================
// 1. เชื่อมต่อฐานข้อมูล Firebase (โปรเจกต์ loyt2-74b03)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCIvH24wvisGyfOltwq6BCNhu7Bg3bKatY",
  authDomain: "://firebaseapp.com",
  databaseURL: "https://firebasedatabase.app",
  projectId: "loyt2-74b03",
  storageBucket: "loyt2-74b03.firebasestorage.app",
  messagingSenderId: "1056488680492",
  appId: "1:1056488680492:web:9c10bbf90bba1aab17f589",
  measurementId: "G-G7GEC8B7J6"
};

firebase.initializeApp(firebaseConfig);
const krathongsRef = firebase.database().ref("t2_krathongs");

// ==========================================
// 2. ระบบวาดภาพกระทง
// ==========================================
const drawPad = document.getElementById("drawPad");
const dCtx = drawPad.getContext("2d");
let isDrawing = false;
let penColor = "#4caf50";
let hasDrawn = false;

dCtx.lineCap = "round";
dCtx.lineJoin = "round";
dCtx.lineWidth = 4;

function setPenColor(c) { penColor = c; }
function clearPad() {
  dCtx.clearRect(0, 0, drawPad.width, drawPad.height);
  hasDrawn = false;
}
function getPos(e) {
  const r = drawPad.getBoundingClientRect();
  const cx = e.touches ? e.touches[0].clientX : e.clientX;
  const cy = e.touches ? e.touches[0].clientY : e.clientY;
  return { x: cx - r.left, y: cy - r.top };
}
function startDraw(e) {
  isDrawing = true;
  hasDrawn = true;
  const p = getPos(e);
  dCtx.beginPath();
  dCtx.moveTo(p.x, p.y);
}
function moveDraw(e) {
  if (!isDrawing) return;
  e.preventDefault();
  const p = getPos(e);
  dCtx.strokeStyle = penColor;
  dCtx.lineTo(p.x, p.y);
  dCtx.stroke();
}
function stopDraw() { isDrawing = false; }

drawPad.addEventListener("mousedown", startDraw);
drawPad.addEventListener("mousemove", moveDraw);
window.addEventListener("mouseup", stopDraw);
drawPad.addEventListener("touchstart", startDraw, { passive: false });
drawPad.addEventListener("touchmove", moveDraw, { passive: false });
window.addEventListener("touchend", stopDraw);

// ==========================================
// 3. ระบบแม่น้ำและการลอยกระทงออนไลน์
// ==========================================
const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");
let w, h;
let selectedType = "custom";
const krathongs = [];
const MAX_WISHES = 3;
let usedCount = parseInt(localStorage.getItem("t2_krathong_count") || "0", 10);

function updateQuotaUI() {
  const rem = Math.max(0, MAX_WISHES - usedCount);
  const btn = document.getElementById("launchBtn");
  const text = document.getElementById("quotaText");
  btn.disabled = rem <= 0;
  btn.textContent = rem > 0 ? `ลอยกระทง (เหลือ ${rem} ครั้ง)` : "ครบ 3 ครั้งแล้ว";
  text.textContent = rem > 0 ? `สิทธิ์การลอยกระทงของคุณ: เหลือ ${rem} จาก ${MAX_WISHES} ครั้ง` : "ขอบคุณที่ร่วมลอยกระทงกับ ท.๒ (ครบ 3 ครั้งแล้ว)";
}

document.querySelectorAll(".type-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".type-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedType = btn.dataset.type;
    document.getElementById("drawBox").classList.toggle("show", selectedType === "custom");
  });
});

function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

function handleUserSpawn() {
  if (usedCount >= MAX_WISHES) return;
  if (selectedType === "custom" && !hasDrawn) {
    alert("กรุณาวาดกระทงก่อนกดลอยนะครับ!");
    return;
  }

  const sender = document.getElementById("senderInput").value.trim() || "ชาว ท.๒";
  const wish = document.getElementById("wishInput").value.trim() || "ขอให้สมหวังทุกประการ";
  const imageData = selectedType === "custom" ? drawPad.toDataURL("image/webp", 0.5) : null;

  krathongsRef.push({
    type: selectedType,
    imageData: imageData,
    sender: sender,
    wish: wish,
    yRatio: 0.52 + Math.random() * 0.25,
    speed: 0.35 + Math.random() * 0.35
  });

  usedCount++;
  localStorage.setItem("t2_krathong_count", usedCount.toString());
  updateQuotaUI();
  document.getElementById("wishInput").value = "";
  if (selectedType === "custom") clearPad();
}

krathongsRef.limitToLast(40).on("child_added", (snap) => {
  const data = snap.val();
  if (!data) return;
  let customImg = null;
  if (data.type === "custom" && data.imageData) {
    customImg = new Image();
    customImg.src = data.imageData;
  }
  krathongs.push({
    x: Math.random() * (w - 200) + 50,
    yRatio: data.yRatio || 0.6,
    speed: data.speed || 0.4,
    phase: Math.random() * Math.PI * 2,
    type: data.type || "banana",
    customImg: customImg,
    sender: data.sender || "ชาว ท.๒",
    wish: data.wish || ""
  });
});

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.48);
  sky.addColorStop(0, "#040a17");
  sky.addColorStop(1, "#132c52");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.48);

  ctx.save();
  ctx.shadowColor = "#fff3b0";
  ctx.shadowBlur = 25;
  ctx.beginPath();
  ctx.arc(w * 0.82, h * 0.15, 36, 0, Math.PI * 2);
  ctx.fillStyle = "#fff5b8";
  ctx.fill();
  ctx.restore();

  const water = ctx.createLinearGradient(0, h * 0.48, 0, h);
  water.addColorStop(0, "#0c2842");
  water.addColorStop(1, "#051120");
  ctx.fillStyle = water;
  ctx.fillRect(0, h * 0.48, w, h * 0.52);
}

function drawPresetKrathong(x, y, type) {
  if (type === "banana") {
    ctx.fillStyle = "#2e7d32";
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 40, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffb300";
    ctx.beginPath();
    ctx.ellipse(x, y + 5, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "lotus") {
    ctx.fillStyle = "#388e3c";
    ctx.beginPath();
    ctx.ellipse(x, y + 12, 38, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f06292";
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.ellipse(x + i * 8, y + 5, 7, 12, i * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === "bread") {
    ctx.fillStyle = "#d9822b";
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 36, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e67e22";
    ctx.beginPath();
    ctx.arc(x + 38, y + 8, 7, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawKrathong(k, t) {
  const x = k.x;
  const y = (h * k.yRatio) + Math.sin(t * 0.003 + k.phase) * 4;
  if (k.type === "custom" && k.customImg) {
    ctx.drawImage(k.customImg, x - 55, y - 35, 110, 62);
  } else {
    drawPresetKrathong(x, y, k.type);
    ctx.fillStyle = "#fff8e1";
    ctx.fillRect(x - 2, y - 14, 4, 14);
    ctx.beginPath();
    ctx.arc(x, y - 18, 5 + Math.sin(t * 0.02 + k.phase) * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = "#ff9800";
    ctx.fill();
  }
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffe082";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText(k.wish, x, y - 50);
  ctx.fillStyle = "#b3e5fc";
  ctx.font = "12px sans-serif";
  ctx.fillText(`(${k.sender})`, x, y - 35);
}

function loop(t) {
  drawBackground();
  for (let i = 0; i < krathongs.length; i++) {
    const k = krathongs[i];
    k.x += k.speed;
    drawKrathong(k, t);
    if (k.x > w + 130) k.x = -130;
  }
  requestAnimationFrame(loop);
}

updateQuotaUI();
requestAnimationFrame(loop);
