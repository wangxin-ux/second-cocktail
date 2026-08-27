import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { randomUUID } from "node:crypto";
import { WebSocket, WebSocketServer } from "ws";

const port = Number(process.env.PORT ?? 3000);
const publicDir = join(process.cwd(), "out");
const roundMs = 5 * 60 * 1000;
const ibaCocktailDatabase = JSON.parse(readFileSync(join(process.cwd(), "data/cocktails/iba-cocktails-web.json"), "utf8"));
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".woff2": "font/woff2" };

let activeQueue = [];
const pairs = new Map();
const waitingSinceByClient = new Map();

const server = createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url ?? "/", `http://${request.headers.host}`).pathname);
  if (path === "/api/presence") {
    const online = [...wss.clients].filter((socket) => socket.person && socket.mode !== "inactive" && socket.readyState === WebSocket.OPEN).length;
    response.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    response.end(JSON.stringify({ online, activelyWaiting: activeQueue.length }));
    return;
  }
  const relative = normalize(path === "/" ? "/index.html" : path.endsWith("/") ? `${path}index.html` : path).replace(/^[/\\]+/, "");
  const candidate = join(publicDir, relative);
  const file = existsSync(candidate) && statSync(candidate).isDirectory() ? join(candidate, "index.html") : candidate;
  if (!file.startsWith(publicDir) || !existsSync(file)) { response.writeHead(404); response.end("Not found"); return; }
  const cacheControl = "no-store, no-cache, must-revalidate";
  response.writeHead(200, { "Content-Type": mime[extname(file)] ?? "application/octet-stream", "Cache-Control": cacheControl });
  const stream = createReadStream(file);
  stream.on("error", () => { if (!response.writableEnded) response.end(); });
  stream.pipe(response);
});

const wss = new WebSocketServer({ server, path: "/ws" });

function send(socket, payload) { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload)); }
function safePerson(value) {
  const input = value && typeof value === "object" ? value : {};
  const clean = (item, limit) => typeof item === "string" ? item.trim().slice(0, limit) : "";
  const number = (item, min, max) => typeof item === "number" && Number.isFinite(item) && item >= min && item <= max ? Math.round(item) : undefined;
  return { name: clean(input.name, 24) || "Someone", age: number(input.age, 18, 99), heightCm: number(input.heightCm, 120, 230), location: clean(input.location, 80) };
}
function publicPerson(person) { return { name: person.name, age: person.age, heightCm: person.heightCm }; }
function cleanClientId(value) { return typeof value === "string" ? value.trim().slice(0, 80) : ""; }
function removeFromQueues(socket) {
  activeQueue = activeQueue.filter((item) => item !== socket);
}
function eligible(queue, socket) {
  const now = Date.now();
  return queue.filter((candidate) => candidate !== socket && candidate.readyState === WebSocket.OPEN && (!socket.clientId || candidate.clientId !== socket.clientId) && !(socket.cooldownUntil > now && socket.cooldownClientId === candidate.clientId) && !(candidate.cooldownUntil > now && candidate.cooldownClientId === socket.clientId));
}
function takeOldest(queue, socket) {
  const candidate = eligible(queue, socket)[0];
  if (candidate) removeFromQueues(candidate);
  return candidate;
}
function queueOnly(socket) {
  removeFromQueues(socket);
  socket.pairId = undefined;
  if (socket.nextMode) { socket.mode = socket.nextMode; socket.nextMode = undefined; socket.queuedAt = Date.now(); }
  if (socket.mode === "active") {
    socket.queuedAt = waitingSinceByClient.get(socket.clientId) ?? socket.queuedAt ?? Date.now();
    waitingSinceByClient.set(socket.clientId, socket.queuedAt);
    activeQueue.push(socket);
    activeQueue.sort((a, b) => a.queuedAt - b.queuedAt);
    send(socket, { type: "waiting", queuedAt: socket.queuedAt });
  } else {
    waitingSinceByClient.delete(socket.clientId);
    send(socket, { type: "inactive" });
  }
}
function armApproachTimeout(activePair) {
  clearTimeout(activePair.approachTimer);
  activePair.approachTimer = setTimeout(() => {
    if (!activePair.started && pairs.has(activePair.id)) returnAfterDecline(activePair, "timeout");
  }, 30_000);
  activePair.approachTimer.unref();
}
function createApproach(approacher, target) {
  removeFromQueues(approacher); removeFromQueues(target);
  waitingSinceByClient.delete(approacher.clientId); waitingSinceByClient.delete(target.clientId);
  const pairId = randomUUID();
  const activePair = { id: pairId, approacher, target, accepted: new Set(), started: false, finished: false, endsAt: 0 };
  approacher.pairId = pairId; target.pairId = pairId;
  pairs.set(pairId, activePair);
  send(approacher, { type: "matched", role: "approacher", partner: publicPerson(target.person) });
  send(target, { type: "approach_request", role: "target", partner: publicPerson(approacher.person) });
  armApproachTimeout(activePair);
}
function findPairByClientId(clientId) {
  return [...pairs.values()].find((activePair) => activePair.approacher.clientId === clientId || activePair.target.clientId === clientId);
}
function restorePairSocket(socket, activePair) {
  const isApproacher = activePair.approacher.clientId === socket.clientId;
  const oldSocket = isApproacher ? activePair.approacher : activePair.target;
  if (oldSocket !== socket) {
    oldSocket.replaced = true;
    if (oldSocket.readyState === WebSocket.OPEN) oldSocket.close(4001, "replaced");
    if (isApproacher) activePair.approacher = socket; else activePair.target = socket;
    if (activePair.accepted.has(oldSocket)) { activePair.accepted.delete(oldSocket); activePair.accepted.add(socket); }
    if (activePair.surveys?.has(oldSocket)) { const saved = activePair.surveys.get(oldSocket); activePair.surveys.delete(oldSocket); activePair.surveys.set(socket, saved); }
    if (activePair.rejoined?.has(oldSocket)) { activePair.rejoined.delete(oldSocket); activePair.rejoined.add(socket); }
  }
  socket.pairId = activePair.id;
  clearTimeout(activePair.disconnectTimers?.get(socket.clientId));
  activePair.disconnectTimers?.delete(socket.clientId);
  const other = otherMember(activePair, socket);
  if (activePair.finished || (activePair.started && Date.now() >= activePair.endsAt)) {
    activePair.finished = true;
    send(socket, { type: "talk_ended" });
    const ownSurvey = activePair.surveys?.get(socket);
    if (ownSurvey) {
      send(socket, { type: "survey_saved" });
      send(socket, { type: "impression_drink", drink: ownSurvey.drink });
    }
  } else if (activePair.started) {
    send(socket, { type: "talk_started", endsAt: activePair.endsAt, meetingLocation: activePair.meetingLocation, role: isApproacher ? "approacher" : "target", partner: publicPerson(other.person) });
  } else if (isApproacher) {
    send(socket, { type: "matched", role: "approacher", partner: publicPerson(other.person) });
    if (activePair.accepted.has(socket)) send(socket, { type: "accept_recorded" });
    if (activePair.accepted.has(other)) send(socket, { type: "partner_accepted" });
    armApproachTimeout(activePair);
  } else {
    send(socket, { type: "approach_request", role: "target", partner: publicPerson(other.person) });
    if (activePair.accepted.has(socket)) send(socket, { type: "accept_recorded" });
    if (activePair.accepted.has(other)) send(socket, { type: "partner_accepted" });
    armApproachTimeout(activePair);
  }
}
function enqueue(socket) {
  removeFromQueues(socket);
  if (socket.mode === "inactive") { queueOnly(socket); return; }
  socket.queuedAt = socket.queuedAt || Date.now();
  const olderActive = takeOldest(activeQueue, socket);
  if (olderActive) { createApproach(olderActive, socket); return; }
  queueOnly(socket);
}
function finish(activePair) {
  if (activePair.finished) return;
  activePair.finished = true;
  send(activePair.approacher, { type: "talk_ended" });
  send(activePair.target, { type: "talk_ended" });
}
function otherMember(activePair, socket) { return activePair.approacher === socket ? activePair.target : activePair.approacher; }
const cultureCards = {
  warm: [
    { name: "Irish Coffee", nameZh: "爱尔兰咖啡", baseZh: "爱尔兰威士忌 · 热咖啡 · 鲜奶油 · 糖", cultureZh: "诞生于 1940 年代爱尔兰福因斯机场。调酒师 Joe Sheridan 用威士忌与热咖啡温暖远道而来的旅客。", cultureEn: "Created at Ireland's Foynes Airport in the 1940s, where Joe Sheridan warmed delayed travelers with whiskey and hot coffee.", whyZh: "温暖并不喧闹，而是一种让人愿意停留的照顾。", whyEn: "Warmth without noise—the kind of care that makes someone stay." },
    { name: "Clover Club", nameZh: "三叶草俱乐部", baseZh: "金酒 · 覆盆子 · 柠檬 · 蛋白", cultureZh: "得名于费城的 Clover Club，是禁酒令前美国俱乐部文化留下的粉色经典。", cultureEn: "Named for Philadelphia's Clover Club, this pink classic carries the polish of pre-Prohibition club culture.", whyZh: "柔和的第一眼之下，藏着完整而细腻的层次。", whyEn: "A soft first impression with a composed, detailed center." },
  ],
  mysterious: [
    { name: "Negroni", nameZh: "内格罗尼", baseZh: "金酒 · 金巴利 · 甜味美思", cultureZh: "相传 1919 年诞生于佛罗伦萨，Camillo Negroni 伯爵把 Americano 里的苏打换成了金酒。", cultureEn: "Tradition places its birth in 1919 Florence, when Count Camillo Negroni replaced soda in an Americano with gin.", whyZh: "苦、甜与草本彼此牵制，像一段不会一次说完的人格。", whyEn: "Bitter, sweet, and botanical—someone who does not reveal everything at once." },
    { name: "Sazerac", nameZh: "萨泽拉克", baseZh: "干邑 · 苦艾酒 · 方糖 · Peychaud 苦精", cultureZh: "新奥尔良最具代表性的古典鸡尾酒之一，苦艾酒杯壁与 Peychaud 苦精构成它独特的仪式。", cultureEn: "A defining New Orleans classic, built around the ritual of an absinthe-rinsed glass and Peychaud's bitters.", whyZh: "有距离感，也有清晰的城市记忆和仪式感。", whyEn: "Distant at first, but full of ritual and a sharply remembered place." },
  ],
  bright: [
    { name: "French 75", nameZh: "法国 75", baseZh: "金酒 · 柠檬 · 糖浆 · 香槟", cultureZh: "名字来自第一次世界大战时期的法国 75 毫米野战炮，用气泡与柑橘表达干脆利落的冲击。", cultureEn: "Named after the French 75 mm field gun, its champagne and citrus deliver a famously crisp impact.", whyZh: "明亮、直接，出现时会让整个场面醒过来。", whyEn: "Bright and immediate—the kind of presence that wakes up the room." },
    { name: "Paloma", nameZh: "帕洛玛", baseZh: "龙舌兰 · 青柠 · 盐 · 西柚汽水", cultureZh: "这杯墨西哥高球的确切起源仍有争议，但龙舌兰与西柚早已成为当地酒吧文化的经典组合。", cultureEn: "Its exact origin is debated, but tequila and grapefruit have made it a lasting icon of Mexican highball culture.", whyZh: "清爽、坦率，同时保留一点盐分带来的锋利。", whyEn: "Fresh and candid, with a saline edge that keeps it vivid." },
  ],
  calm: [
    { name: "Dry Martini", nameZh: "干马天尼", baseZh: "金酒 · 干味美思", cultureZh: "由 19 世纪末的 Martinez 等配方逐渐演变而来，以极少的材料成为克制与精确的象征。", cultureEn: "Evolving from late-19th-century drinks such as the Martinez, it became an icon of restraint and precision.", whyZh: "不需要很多语言，边界清楚，本身就足够完整。", whyEn: "Few words, clear edges, and complete without excess." },
    { name: "Mojito", nameZh: "莫吉托", baseZh: "古巴白朗姆 · 青柠 · 薄荷 · 糖 · 苏打", cultureZh: "源自古巴的长饮传统，薄荷、青柠与朗姆把炎热的夜晚变得轻松而漫长。", cultureEn: "Rooted in Cuban long-drink tradition, mint, lime, and rum turn a hot night into something easy and unhurried.", whyZh: "平静不是沉默，而是让周围的人自然放松。", whyEn: "Calm is not silence; it is the ability to let everyone around you relax." },
  ],
  bold: [
    { name: "Old Fashioned", nameZh: "古典鸡尾酒", baseZh: "波本或黑麦威士忌 · 方糖 · 苦精", cultureZh: "它保留了 19 世纪最早的鸡尾酒公式：烈酒、糖、水与苦精，也因此得到“老式喝法”的名字。", cultureEn: "It preserves the 19th-century cocktail formula—spirit, sugar, water, and bitters—and took its name from ordering the old-fashioned way.", whyZh: "方向明确，不用装饰掩盖自己的力量。", whyEn: "Direct in purpose, with no decoration hiding its strength." },
    { name: "Boulevardier", nameZh: "花花公子", baseZh: "波本或黑麦威士忌 · 金巴利 · 甜味美思", cultureZh: "1920 年代由旅居巴黎的作家 Erskine Gwynne 推广，像一杯穿着晚礼服的威士忌。", cultureEn: "Popularized in 1920s Paris by writer Erskine Gwynne, it drinks like whiskey dressed for the evening.", whyZh: "大胆但有分寸，知道什么时候应该向前一步。", whyEn: "Bold with control—someone who knows when to step forward." },
  ],
  playful: [
    { name: "Mai-Tai", nameZh: "迈泰", baseZh: "牙买加朗姆 · 马提尼克朗姆 · 橙味利口酒 · 杏仁糖浆 · 青柠", cultureZh: "Trader Vic 于 1944 年在奥克兰创作；名字据说来自塔希提语 maita'i，意为“非常好”。", cultureEn: "Created by Trader Vic in Oakland in 1944; its name is linked to the Tahitian maita'i, meaning 'very good.'", whyZh: "熟悉里总有意外，下一句话永远猜不到方向。", whyEn: "Familiar enough to welcome you, surprising enough to change direction." },
    { name: "Espresso Martini", nameZh: "浓缩咖啡马天尼", baseZh: "伏特加 · 咖啡利口酒 · 糖浆 · 浓缩咖啡", cultureZh: "1980 年代由伦敦调酒师 Dick Bradsell 创作，把夜生活需要的清醒与兴奋装进同一只杯子。", cultureEn: "Created in 1980s London by Dick Bradsell, combining the alertness and energy of nightlife in one glass.", whyZh: "反应快、有趣，而且总能让气氛再亮一格。", whyEn: "Quick, playful, and able to lift the room another notch." },
  ],
};
function safeSurvey(value) {
  const input = value && typeof value === "object" ? value : {};
  const impression = Object.hasOwn(cultureCards, input.impression) ? input.impression : "bright";
  const vibe = ["easy", "deep", "playful"].includes(input.vibe) ? input.vibe : "easy";
  const again = ["yes", "maybe", "no"].includes(input.again) ? input.again : "maybe";
  return { impression, vibe, again };
}
function generateDrink(survey) {
  const choices = cultureCards[survey.impression];
  const card = choices[Math.floor(Math.random() * choices.length)];
  const recipe = ibaCocktailDatabase.find((item) => item.name === card.name);
  if (!recipe) throw new Error(`IBA cocktail not found: ${card.name}`);
  return {
    id: recipe.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    nameZh: card.nameZh,
    nameEn: recipe.name,
    baseZh: card.baseZh,
    baseEn: recipe.ingredients.map((item) => item.ingredient).join(" · "),
    noteZh: card.whyZh,
    noteEn: card.whyEn,
    cultureZh: card.cultureZh,
    cultureEn: card.cultureEn,
    category: recipe.category,
    methodEn: recipe.method,
    garnishEn: recipe.garnish ?? "",
  };
}
function returnAfterDecline(activePair, reason = "declined") {
  clearTimeout(activePair.approachTimer);
  pairs.delete(activePair.id);
  for (const member of [activePair.approacher, activePair.target]) member.pairId = undefined;
  activePair.approacher.cooldownClientId = activePair.target.clientId;
  activePair.target.cooldownClientId = activePair.approacher.clientId;
  activePair.approacher.cooldownUntil = Date.now() + 30_000;
  activePair.target.cooldownUntil = Date.now() + 30_000;
  const resultType = reason === "timeout" ? "approach_timeout" : "approach_declined";
  send(activePair.approacher, { type: resultType });
  send(activePair.target, { type: resultType });
  enqueue(activePair.approacher);
  enqueue(activePair.target);
}

wss.on("connection", (socket) => {
  socket.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      if (data.type === "join") {
        if (data.protocolVersion !== 2) { send(socket, { type: "update_required" }); socket.close(4004, "update required"); return; }
        socket.person = safePerson(data.person);
        socket.clientId = cleanClientId(data.clientId) || randomUUID();
        socket.mode = data.mode === "active" ? "active" : "inactive";
        socket.queuedAt = socket.mode === "active" ? waitingSinceByClient.get(socket.clientId) ?? Date.now() : Date.now();
        if (!socket.person.name || socket.person.name === "Someone" || !socket.person.age || !socket.person.heightCm || !socket.person.location) {
          send(socket, { type: "profile_incomplete" }); return;
        }
        const restorablePair = findPairByClientId(socket.clientId);
        if (restorablePair) { restorePairSocket(socket, restorablePair); return; }
        for (const other of wss.clients) {
          if (other !== socket && other.clientId === socket.clientId) {
            other.replaced = true; removeFromQueues(other); other.close(4001, "replaced");
          }
        }
        enqueue(socket);
        return;
      }
      const activePair = socket.pairId ? pairs.get(socket.pairId) : undefined;
      if (data.type === "set_mode") {
        const nextMode = data.mode === "active" ? "active" : "inactive";
        if (activePair) { socket.nextMode = nextMode; return; }
        if (socket.mode !== nextMode) {
          socket.mode = nextMode;
          socket.queuedAt = Date.now();
          enqueue(socket);
        }
        return;
      }
      if (!activePair) return;
      if (data.type === "accept" && !activePair.started && (socket === activePair.approacher || socket === activePair.target)) {
        activePair.accepted.add(socket);
        const other = otherMember(activePair, socket);
        send(socket, { type: "accept_recorded" });
        send(other, { type: "partner_accepted" });
        if (activePair.accepted.size === 2) {
          clearTimeout(activePair.approachTimer);
          activePair.started = true;
          activePair.endsAt = Date.now() + roundMs;
          const location = activePair.target.person.location;
          activePair.meetingLocation = location;
          send(activePair.approacher, { type: "talk_started", endsAt: activePair.endsAt, meetingLocation: location, role: "approacher", partner: publicPerson(activePair.target.person) });
          send(activePair.target, { type: "talk_started", endsAt: activePair.endsAt, meetingLocation: location, role: "target", partner: publicPerson(activePair.approacher.person) });
          const timer = setTimeout(() => finish(activePair), roundMs + 250);
          timer.unref();
        }
        return;
      }
      if (data.type === "decline" && !activePair.started) { returnAfterDecline(activePair); return; }
      if (data.type === "finish") finish(activePair);
      if (data.type === "survey_submit" && activePair.finished) {
        activePair.surveys ??= new Map();
        if (!activePair.surveys.has(socket)) {
          const survey = safeSurvey(data.survey);
          const drink = generateDrink(survey);
          activePair.surveys.set(socket, { survey, drink });
          send(socket, { type: "survey_saved" });
          send(socket, { type: "impression_drink", drink });
        }
        return;
      }
      if (data.type === "rejoin" && activePair.finished) {
        activePair.rejoined ??= new Set();
        activePair.rejoined.add(socket);
        socket.pairId = undefined;
        socket.queuedAt = Date.now();
        queueOnly(socket);
        if (activePair.rejoined.size === 2) pairs.delete(activePair.id);
      }
    } catch (error) {
      console.error("social websocket message failed", error);
      send(socket, { type: "error", message: "Unable to join the match queue." });
    }
  });
  socket.on("close", () => {
    removeFromQueues(socket);
    if (socket.replaced) return;
    const activePair = socket.pairId ? pairs.get(socket.pairId) : undefined;
    if (!activePair) return;
    clearTimeout(activePair.approachTimer);
    activePair.disconnectTimers ??= new Map();
    clearTimeout(activePair.disconnectTimers.get(socket.clientId));
    const disconnectTimer = setTimeout(() => {
      if (!pairs.has(activePair.id)) return;
      const currentMember = activePair.approacher.clientId === socket.clientId ? activePair.approacher : activePair.target;
      if (currentMember !== socket || currentMember.readyState === WebSocket.OPEN) return;
      pairs.delete(activePair.id);
      const other = activePair.approacher === socket ? activePair.target : activePair.approacher;
      other.pairId = undefined;
      send(other, { type: "partner_left" });
      if (!activePair.started && other.readyState === WebSocket.OPEN) enqueue(other);
    }, 45_000);
    disconnectTimer.unref();
    activePair.disconnectTimers.set(socket.clientId, disconnectTimer);
  });
});

server.listen(port, () => console.log(`second is listening on :${port}`));
