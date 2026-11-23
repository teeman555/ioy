// --- ส่วนที่ 1: ระบบวาดภาพกระทงเอง ---
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
const drawPad = document.getElementById("drawPad");
const dCtx = drawPad.getContext("2d");
let isDrawing = false;
let penColor = "#4caf50";
let hasDrawn = false;

dCtx.lineCap = "round";
dCtx.lineJoin = "round";
dCtx.lineWidth = 4;

function setPenColor(color) {
  penColor = color;
}

function clearPad() {
  dCtx.clearRect(0, 0, drawPad.width, drawPad.height);
  hasDrawn = false;
}

function getPos(e) {
  const rect = drawPad.getBoundingClientRect();
  const clientX = e.touches ? e.touches.clientX : e.clientX;
  const clientY = e.touches ? e.touches.clientY : e.clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function startDraw(e) {
  isDrawing = true;
  hasDrawn = true;
  const pos = getPos(e);
  dCtx.beginPath();
  dCtx.moveTo(pos.x, pos.y);
}

function moveDraw(e) {
  if (!isDrawing) return;
  e.preventDefault();
  const pos = getPos(e);
  dCtx.strokeStyle = penColor;
  dCtx.lineTo(pos.x, pos.y);
  dCtx.stroke();
}

function stopDraw() {
  isDrawing = false;
}

drawPad.addEventListener("mousedown", startDraw);
drawPad.addEventListener("mousemove", moveDraw);
window.addEventListener("mouseup", stopDraw);

drawPad.addEventListener("touchstart", startDraw, { passive: false });
drawPad.addEventListener("touchmove", moveDraw, { passive: false });
window.addEventListener("touchend", stopDraw);

// --- ส่วนที่ 2: ระบบแม่น้ำและการลอยกระทง ---
const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");
let w, h;
const krathongs = [];
let selectedType = "custom";

const MAX_WISHES = 3;
let usedCount = parseInt(localStorage.getItem("t2_krathong_count") || "0", 10);

function updateQuotaUI() {
  const remaining = Math.max(0, MAX_WISHES - usedCount);
  const btn = document.getElementById("launchBtn");
  const text = document.getElementById("quotaText");

  if (remaining > 0) {
    btn.disabled = false;
    btn.textContent = `ลอยกระทง (เหลือ ${remaining} ครั้ง)`;
    text.textContent = `สิทธิ์การลอยกระทงของคุณ: เหลือ ${remaining} จาก ${MAX_WISHES} ครั้ง`;
  } else {
    btn.disabled = true;
    btn.textContent = "ครบ 3 ครั้งแล้ว";
    text.textContent = "ขอบคุณที่ร่วมลอยกระทงกับ ท.๒ (คุณใช้สิทธิ์ครบ 3 ครั้งแล้ว)";
    text.style.color = "#ffcc80";
  }
}

document.querySelectorAll(".type-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".type-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedType = btn.dataset.type;

    const drawBox = document.getElementById("drawBox");
    if (selectedType === "custom") {
      drawBox.classList.add("show");
    } else {
      drawBox.classList.remove("show");
    }
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
    alert("กรุณาวาดกระทงของคุณบนกระดานก่อนกดลอยนะครับ!");
    return;
  }

  let customImage = null;
  if (selectedType === "custom") {
    customImage = new Image();
    customImage.src = drawPad.toDataURL("image/png");
  }

  usedCount++;
  localStorage.setItem("t2_krathong_count", usedCount.toString());
  updateQuotaUI();
  spawnKrathong(selectedType, null, null, customImage);

  if (selectedType === "custom") {
    clearPad();
  }
}

function spawnKrathong(type, defaultSender, defaultWish, customImg) {
  const senderInput = document.getElementById("senderInput");
  const wishInput = document.getElementById("wishInput");

  const sender = defaultSender || senderInput.value.trim() || "ชาว ท.๒";
  const wish = defaultWish || wishInput.value.trim() || "ขอให้เรียนเก่งๆ สมหวังทุกประการ";

  krathongs.push({
    x: Math.random() * (w - 220) + 110,
    y: h * 0.52 + Math.random() * (h * 0.22),
    speed: 0.35 + Math.random() * 0.4,
    phase: Math.random() * Math.PI * 2,
    type: type || "banana",
    customImg,
    sender,
    wish
  });

  if (!defaultWish) {
    wishInput.value = "";
  }
}

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
  const bob = Math.sin(t * 0.003 + k.phase) * 4;
  const x = k.x;
  const y = k.y + bob;

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
  for (let i = krathongs.length - 1; i >= 0; i--) {
    const k = krathongs[i];
    k.x += k.speed;
    drawKrathong(k, t);
    if (k.x > w + 130) krathongs.splice(i, 1);
  }
  requestAnimationFrame(loop);
}

updateQuotaUI();
spawnKrathong("lotus", "ตัวแทนนักเรียน ท.๒", "สุขสันต์วันลอยกระทง ชาว ท.๒");
requestAnimationFrame(loop);
