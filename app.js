"use strict";

const games = [...document.querySelectorAll(".game")];
const filters = [...document.querySelectorAll("[data-filter]")];

for (const filter of filters) {
  filter.addEventListener("click", () => {
    for (const button of filters) button.setAttribute("aria-pressed", String(button === filter));
    for (const game of games) {
      game.hidden = filter.dataset.filter !== "all" && !game.dataset.platform.split(" ").includes(filter.dataset.filter);
    }
  });
}

const cart = document.querySelector("#cart");
const items = document.querySelector("#cart-items");
const empty = document.querySelector("#cart-empty");
const summary = document.querySelector("#cart-summary");
const checkoutStatus = document.querySelector("#checkout-status");
const announcement = document.querySelector("#cart-announcement");
const count = document.querySelector("#cart-count");
const cartTotal = document.querySelector("#cart-total");
const selected = new Set();
const euros = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });

function renderCart() {
  items.replaceChildren();
  let cents = 0;
  for (const game of selected) {
    cents += Number(game.dataset.price);
    const row = document.createElement("li");
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "button secondary";
    remove.textContent = "Remover";
    remove.setAttribute("aria-label", "Remover " + game.dataset.title);
    remove.addEventListener("click", () => {
      const next = row.nextElementSibling || row.previousElementSibling;
      const nextTitle = next?.dataset.title;
      selected.delete(game);
      renderCart();
      const nextRow = [...items.children].find(item => item.dataset.title === nextTitle);
      (nextRow?.querySelector("button") || cart.querySelector(".icon-button")).focus();
    });
    row.dataset.title = game.dataset.title;
    row.append(game.dataset.title + " · " + euros.format(Number(game.dataset.price) / 100), remove);
    items.append(row);
  }
  for (const game of games) {
    const button = game.querySelector(".add");
    const inCart = selected.has(game);
    button.textContent = inCart ? "Adicionado" : "Adicionar";
    button.disabled = inCart;
  }
  count.textContent = selected.size;
  empty.hidden = selected.size > 0;
  summary.hidden = selected.size === 0;
  cartTotal.textContent = euros.format(cents / 100);
}

for (const game of games) {
  game.querySelector(".add").addEventListener("click", () => {
    selected.add(game);
    renderCart();
    announcement.textContent = game.dataset.title + " foi adicionado ao carrinho.";
  });
}

document.querySelector("#open-cart").addEventListener("click", () => {
  checkoutStatus.textContent = "";
  cart.showModal();
});

document.querySelector("#checkout").addEventListener("click", () => {
  selected.clear();
  renderCart();
  checkoutStatus.textContent = "Compra simulada com sucesso.";
  cart.querySelector(".icon-button").focus();
});

const chat = document.querySelector("#chat");
const toggle = document.querySelector("#chat-toggle");
const input = document.querySelector("#chat-input");
const form = document.querySelector("#chat-form");
const log = document.querySelector("#chat-log");
const chatMode = document.querySelector("#chat-mode");
const quickReplies = [...document.querySelectorAll("[data-prompt]")];
const submit = form.querySelector("button");
const webhookUrl = window.PIXELVAULT_WEBHOOK_URL || "";
const sessionId = globalThis.crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
let opener = toggle;

chatMode.textContent = webhookUrl ? "Apoio da loja" : "Modo de demonstração";

function setChat(open, trigger = opener) {
  chat.hidden = !open;
  toggle.setAttribute("aria-expanded", String(open));
  if (open) {
    opener = trigger;
    input.focus();
    log.scrollTop = log.scrollHeight;
  } else {
    opener.focus();
  }
}

toggle.addEventListener("click", () => setChat(chat.hidden, toggle));
document.querySelector("#close-chat").addEventListener("click", () => setChat(false));
for (const button of document.querySelectorAll("[data-chat]")) {
  button.setAttribute("aria-controls", "chat");
  button.addEventListener("click", () => setChat(true, button));
}
chat.addEventListener("keydown", event => {
  if (event.key === "Escape") setChat(false);
});

function addMessage(text, author) {
  const message = document.createElement("p");
  message.className = "message " + author;
  message.textContent = text;
  log.append(message);
  log.scrollTop = log.scrollHeight;
  return message;
}

function demoReply(message) {
  const text = message.toLocaleLowerCase("pt-PT");
  if (/(plataforma|xbox|playstation|consola|\bpc\b)/.test(text)) {
    return "Temos jogos para PC, PlayStation e Xbox. Usa os filtros do catálogo para ver os jogos de cada plataforma.";
  }
  if (/(compr|pagamento|carrinho|preço)/.test(text)) {
    return "Adiciona um jogo ao carrinho e seleciona «Simular compra». A PixelVault é fictícia e não cobra pagamentos.";
  }
  if (/rift|corrida/.test(text)) return "Rift Circuit é um jogo de corridas futuristas para PC e Xbox.";
  if (/dunas|aventura/.test(text)) return "Dunas de Íon é uma aventura para PC e PlayStation.";
  if (/abissal|mistério/.test(text)) return "Eco Abissal é um jogo de mistério para PlayStation e Xbox.";
  return "Posso ajudar com o catálogo, as plataformas e a compra simulada. Qual é a tua dúvida?";
}

async function requestReply(message) {
  const url = new URL(webhookUrl);
  if (url.protocol !== "https:") throw new Error("O webhook deve usar HTTPS.");
  const response = await fetch(url, {
    method: "POST",
    body: new URLSearchParams({ message, sessionId, source: "pixelvault" }),
    credentials: "omit",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("HTTP " + response.status);
  const data = await response.json();
  const reply = data?.reply ?? data?.output;
  if (typeof reply !== "string" || !reply.trim()) throw new Error("Resposta inválida.");
  return reply.trim();
}

async function sendMessage(text) {
  const message = text.trim();
  if (!message || submit.disabled) return;
  input.value = "";
  addMessage(message, "visitor");
  if (!webhookUrl) {
    addMessage(demoReply(message), "agent");
    return;
  }

  const controls = [submit, ...quickReplies];
  for (const control of controls) control.disabled = true;
  const pending = addMessage("A aguardar resposta…", "agent");
  try {
    pending.textContent = await requestReply(message);
    chatMode.textContent = "Apoio da loja";
  } catch {
    chatMode.textContent = "Modo de demonstração";
    pending.textContent = "O apoio está indisponível. Resposta de demonstração: " + demoReply(message);
  } finally {
    for (const control of controls) control.disabled = false;
    log.scrollTop = log.scrollHeight;
  }
}

form.addEventListener("submit", event => {
  event.preventDefault();
  sendMessage(input.value);
});
for (const button of quickReplies) {
  button.addEventListener("click", () => {
    input.focus();
    sendMessage(button.dataset.prompt);
  });
}
