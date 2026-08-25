import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { randomUUID } from "node:crypto";
import { WebSocket, WebSocketServer } from "ws";

const port = Number(process.env.PORT ?? 3000);
const publicDir = join(process.cwd(), "out");
const roundMs = 5 * 60 * 1000;
const passiveFallbackMs = 90 * 1000;
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".woff2": "font/woff2" };

let activeQueue = [];
let passiveQueue = [];
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
  passiveQueue = passiveQueue.filter((item) => item !== socket);
  if (socket.fallbackTimer) { clearTimeout(socket.fallbackTimer); socket.fallbackTimer = undefined; }
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
function takeRandomPassive(socket) {
  const candidates = eligible(passiveQueue, socket);
  const candidate = candidates[Math.floor(Math.random() * candidates.length)];
  if (candidate) removeFromQueues(candidate);
  return candidate;
}
function takeOldestMatureActive(socket) {
  const now = Date.now();
  const candidate = eligible(activeQueue, socket).find((item) => now - item.queuedAt >= passiveFallbackMs);
  if (candidate) removeFromQueues(candidate);
  return candidate;
}
function schedulePassiveFallback(socket) {
  const delay = Math.max(0, socket.queuedAt + passiveFallbackMs - Date.now());
  socket.fallbackTimer = setTimeout(() => {
    socket.fallbackTimer = undefined;
    if (socket.mode !== "active" || socket.pairId || !activeQueue.includes(socket) || socket.readyState !== WebSocket.OPEN) return;
    const passive = takeRandomPassive(socket);
    if (passive) createApproach(socket, passive);
  }, delay);
  socket.fallbackTimer.unref();
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
    schedulePassiveFallback(socket);
    send(socket, { type: "waiting", queuedAt: socket.queuedAt, expandsAt: socket.queuedAt + passiveFallbackMs });
  } else if (socket.mode === "passive") {
    waitingSinceByClient.delete(socket.clientId);
    passiveQueue.push(socket);
    send(socket, { type: "online" });
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
  const activePair = { id: pairId, approacher, target, accepted: new Set([approacher]), started: false, finished: false, endsAt: 0 };
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
    if (activePair.surveys?.has(socket)) send(socket, { type: "survey_saved" });
    const otherSurvey = activePair.surveys?.get(other);
    if (otherSurvey) send(socket, { type: "drink_gift", drink: otherSurvey.drink, from: other.person.name });
  } else if (activePair.started) {
    send(socket, { type: "talk_started", endsAt: activePair.endsAt, meetingLocation: activePair.meetingLocation, role: isApproacher ? "approacher" : "target", partner: publicPerson(other.person) });
  } else if (isApproacher) {
    send(socket, { type: "matched", role: "approacher", partner: publicPerson(other.person) });
    armApproachTimeout(activePair);
  } else {
    send(socket, { type: "approach_request", role: "target", partner: publicPerson(other.person) });
    armApproachTimeout(activePair);
  }
}
function enqueue(socket) {
  removeFromQueues(socket);
  if (socket.mode === "inactive") { queueOnly(socket); return; }
  if (socket.mode === "passive") {
    const approacher = takeOldestMatureActive(socket);
    if (approacher) createApproach(approacher, socket); else queueOnly(socket);
    return;
  }
  socket.queuedAt = socket.queuedAt || Date.now();
  const olderActive = takeOldest(activeQueue, socket);
  if (olderActive) { createApproach(olderActive, socket); return; }
  if (Date.now() - socket.queuedAt >= passiveFallbackMs) {
    const passive = takeRandomPassive(socket);
    if (passive) { createApproach(socket, passive); return; }
  }
  queueOnly(socket);
}
function finish(activePair) {
  if (activePair.finished) return;
  activePair.finished = true;
  send(activePair.approacher, { type: "talk_ended" });
  send(activePair.target, { type: "talk_ended" });
}
function otherMember(activePair, socket) { return activePair.approacher === socket ? activePair.target : activePair.approacher; }
const impressionDrinks = {
  warm: [
    { id: "honey-amber", nameZh: "蜂蜜琥珀", nameEn: "Honey Amber", baseZh: "波本 · 蜂蜜 · 柠檬", baseEn: "Bourbon · honey · lemon", noteZh: "温暖、柔和，尾调留一点明亮。", noteEn: "Warm and soft, with a bright finish." },
    { id: "golden-hour", nameZh: "黄金时刻", nameEn: "Golden Hour", baseZh: "朗姆 · 杏桃 · 苏打", baseEn: "Rum · apricot · soda", noteZh: "像刚认识却不陌生的一次碰杯。", noteEn: "A toast that already feels familiar." },
  ],
  mysterious: [
    { id: "midnight-negroni", nameZh: "午夜内格罗尼", nameEn: "Midnight Negroni", baseZh: "金酒 · 苦味酒 · 黑莓", baseEn: "Gin · bitter aperitivo · blackberry", noteZh: "第一口克制，之后才慢慢显出层次。", noteEn: "Reserved at first, layered after a moment." },
    { id: "velvet-shadow", nameZh: "天鹅绒暗影", nameEn: "Velvet Shadow", baseZh: "威士忌 · 咖啡 · 可可", baseEn: "Whisky · coffee · cacao", noteZh: "深色、安静，还有一点未说完。", noteEn: "Dark, quiet, and intentionally unfinished." },
  ],
  bright: [
    { id: "citrus-signal", nameZh: "柑橘信号", nameEn: "Citrus Signal", baseZh: "伏特加 · 西柚 · 青柠", baseEn: "Vodka · grapefruit · lime", noteZh: "清爽直接，像一句让人笑出来的话。", noteEn: "Crisp and direct, like a line that makes you smile." },
    { id: "daylight-spritz", nameZh: "日光气泡", nameEn: "Daylight Spritz", baseZh: "起泡酒 · 橙花 · 白桃", baseEn: "Sparkling wine · orange blossom · peach", noteZh: "轻盈、明快，适合把聊天继续下去。", noteEn: "Light and vivid, made to keep a conversation going." },
  ],
  calm: [
    { id: "quiet-garden", nameZh: "安静花园", nameEn: "Quiet Garden", baseZh: "金酒 · 黄瓜 · 接骨木花", baseEn: "Gin · cucumber · elderflower", noteZh: "不抢话，却让人愿意多停留一会儿。", noteEn: "Never loud, but easy to stay with." },
    { id: "slow-tide", nameZh: "慢潮", nameEn: "Slow Tide", baseZh: "清酒 · 梨 · 茉莉", baseEn: "Sake · pear · jasmine", noteZh: "清淡而有余韵，适合慢慢认识。", noteEn: "Delicate, lingering, and made for taking time." },
  ],
  bold: [
    { id: "fireline-paloma", nameZh: "火线帕洛玛", nameEn: "Fireline Paloma", baseZh: "龙舌兰 · 西柚 · 辣椒", baseEn: "Tequila · grapefruit · chilli", noteZh: "有冲劲，也不打算隐藏自己的方向。", noteEn: "Forward, vivid, and sure of its direction." },
    { id: "red-letter", nameZh: "红色来信", nameEn: "Red Letter", baseZh: "梅斯卡尔 · 石榴 · 海盐", baseEn: "Mezcal · pomegranate · sea salt", noteZh: "带一点烟熏，留下很清楚的记忆。", noteEn: "A trace of smoke and a very clear memory." },
  ],
  playful: [
    { id: "spark-collins", nameZh: "火花柯林斯", nameEn: "Spark Collins", baseZh: "金酒 · 柠檬 · 跳跳糖", baseEn: "Gin · lemon · popping candy", noteZh: "好奇、轻松，下一秒可能又有新话题。", noteEn: "Curious, easy, and ready for another tangent." },
    { id: "plot-twist", nameZh: "剧情反转", nameEn: "Plot Twist", baseZh: "朗姆 · 菠萝 · 罗勒", baseEn: "Rum · pineapple · basil", noteZh: "入口熟悉，转身却给你一个意外。", noteEn: "Familiar at first, surprising one beat later." },
  ],
};
function safeSurvey(value) {
  const input = value && typeof value === "object" ? value : {};
  const impression = Object.hasOwn(impressionDrinks, input.impression) ? input.impression : "bright";
  const vibe = ["easy", "deep", "playful"].includes(input.vibe) ? input.vibe : "easy";
  const again = ["yes", "maybe", "no"].includes(input.again) ? input.again : "maybe";
  return { impression, vibe, again };
}
function generateDrink(survey) {
  const choices = impressionDrinks[survey.impression];
  return choices[Math.floor(Math.random() * choices.length)];
}
function returnAfterDecline(activePair, reason = "declined") {
  clearTimeout(activePair.approachTimer);
  pairs.delete(activePair.id);
  for (const member of [activePair.approacher, activePair.target]) member.pairId = undefined;
  activePair.approacher.cooldownClientId = activePair.target.clientId;
  activePair.target.cooldownClientId = activePair.approacher.clientId;
  activePair.approacher.cooldownUntil = Date.now() + 30_000;
  activePair.target.cooldownUntil = Date.now() + 30_000;
  send(activePair.approacher, { type: reason === "timeout" ? "approach_timeout" : "approach_declined" });
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
        socket.mode = data.mode === "active" ? "active" : data.mode === "passive" ? "passive" : "inactive";
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
        const nextMode = data.mode === "active" ? "active" : data.mode === "passive" ? "passive" : "inactive";
        if (activePair) { socket.nextMode = nextMode; return; }
        if (socket.mode !== nextMode) {
          socket.mode = nextMode;
          socket.queuedAt = Date.now();
          enqueue(socket);
        }
        return;
      }
      if (!activePair) return;
      if (data.type === "accept" && socket === activePair.target && !activePair.started) {
        activePair.accepted.add(socket);
        const other = otherMember(activePair, socket);
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
          send(otherMember(activePair, socket), { type: "drink_gift", drink, from: socket.person.name });
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
