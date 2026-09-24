/* Utilidades de interface — criação de elementos, datas e formatação. */

export function el(tag, attrs = {}, filhos = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") n.className = v;
    else if (k === "html") n.innerHTML = v;
    else if (k === "texto") n.textContent = v;
    else if (k === "estilo") Object.assign(n.style, v);
    else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
    else if (k === "dataset") Object.assign(n.dataset, v);
    else n.setAttribute(k, v === true ? "" : v);
  }
  for (const f of [].concat(filhos)) {
    if (f === null || f === undefined || f === false) continue;
    n.appendChild(typeof f === "string" || typeof f === "number" ? document.createTextNode(String(f)) : f);
  }
  return n;
}

export const $ = (sel, raiz = document) => raiz.querySelector(sel);

/* ------------------------------------------------------------------- datas */
export const HOJE = () => new Date();

export function iso(d) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

export function deIso(s) {
  if (!s) return null;
  const [a, m, d] = s.split("-").map(Number);
  return new Date(a, m - 1, d);
}

export function dias(ate, de = HOJE()) {
  const A = deIso(ate); if (!A) return null;
  const B = new Date(de.getFullYear(), de.getMonth(), de.getDate());
  return Math.round((A - B) / 86400000);
}

export function somarDias(isoStr, n) {
  const d = deIso(isoStr); if (!d) return "";
  d.setDate(d.getDate() + n);
  return iso(d);
}

const FMT_DATA = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const FMT_CURTA = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
const FMT_EXT = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });

export const fData = (s) => (deIso(s) ? FMT_DATA.format(deIso(s)) : "—");
export const fCurta = (s) => (deIso(s) ? FMT_CURTA.format(deIso(s)) : "—");
export const fExtenso = (d) => FMT_EXT.format(d);

/** 0 = domingo … 6 = sábado  →  índice da grade (0 = segunda … 6 = domingo) */
export const indiceDia = (d = HOJE()) => (d.getDay() + 6) % 7;

/** Nº da semana de estudo (1 = semana de `inicioIso`), limitado a [1, max]. */
export function numeroSemana(inicioIso, d = HOJE(), max = 24) {
  const ini = deIso(inicioIso); if (!ini) return 1;
  const hoje = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const n = Math.floor((hoje - ini) / (7 * 86400000)) + 1;
  return Math.min(max, Math.max(1, n));
}

export function inicioDaSemana(inicioIso, n) {
  return somarDias(inicioIso, (n - 1) * 7);
}

/** Segunda-feira (ISO) da semana que contém a data. */
export function segundaDe(d = HOJE()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - indiceDia(x));
  return iso(x);
}

/** "19:30" → 1170 · 1170 → "19:30" */
export const hmParaMin = (t) => { const m = String(t || "").match(/^(\d{1,2}):(\d{2})$/); return m ? +m[1] * 60 + +m[2] : null; };
export const minParaHm = (n) => `${String(Math.floor(n / 60) % 24).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

const MES_ABR = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
export function chaveMes(d = HOJE()) {
  return `${MES_ABR[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
}

/* ---------------------------------------------------------------- horários */
/** "14:15–15:45" → {ini: 855, fim: 945} em minutos desde meia-noite. */
export function faixaHorario(txt) {
  const m = String(txt).match(/(\d{2}):(\d{2}).(\d{2}):(\d{2})/);
  if (!m) return null;
  const ini = +m[1] * 60 + +m[2];
  let fim = +m[3] * 60 + +m[4];
  if (fim <= ini) fim += 24 * 60;   // atravessa a meia-noite (o bloco de sono)
  return { ini, fim };
}

export const agoraMin = (d = HOJE()) => d.getHours() * 60 + d.getMinutes();

/* ------------------------------------------------------------- formatação */
export const nInt = new Intl.NumberFormat("pt-BR");
export const n1 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const n2 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function pct(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return `${Math.round(v * 100)}%`;
}

export const num = (v) => {
  if (v === "" || v === null || v === undefined) return null;
  const x = Number(String(v).replace(",", "."));
  return Number.isFinite(x) ? x : null;
};

export const soma = (arr) => arr.reduce((a, b) => a + (num(b) || 0), 0);

/* ------------------------------------------------------------- componentes */
export function barraProgresso(fracao, cor) {
  return el("div", { class: "prog" }, [
    el("div", { class: "prog__trilho" }, [
      el("div", { class: "prog__barra", estilo: { width: `${Math.min(100, Math.max(0, fracao * 100))}%`, background: cor } }),
    ]),
    el("span", { class: "prog__n", texto: pct(fracao) }),
  ]);
}

export function chip(texto, tipo = "", cor = null) {
  const c = el("span", { class: `chip ${tipo ? "chip--" + tipo : ""}` });
  if (cor) c.appendChild(el("span", { class: "chip__ponto", estilo: { background: cor } }));
  c.appendChild(document.createTextNode(texto));
  return c;
}

export function cartao(titulo, sub, corpo, acoes = null, semPadding = false) {
  const cab = titulo
    ? el("div", { class: "card__cab" }, [
        el("h2", { texto: titulo }),
        acoes ? el("div", { estilo: { marginLeft: "auto", display: "flex", gap: "8px" } }, acoes) : null,
        sub ? el("p", { texto: sub }) : null,
      ])
    : null;
  return el("section", { class: "card" }, [
    cab,
    el("div", { class: `card__corpo ${semPadding ? "card__corpo--liso" : ""}` }, corpo),
  ]);
}

export function vazio(icone, texto) {
  return el("div", { class: "vazio" }, [el("span", { class: "vazio__ic", texto: icone }), texto]);
}

let toastTimer = null;
export function toast(msg) {
  let t = $("#toast");
  if (!t) { t = el("div", { class: "toast", id: "toast" }); document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("toast--ver");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("toast--ver"), 2200);
}

/** input que grava ao sair do campo / mudar, sem re-renderizar a tela toda */
export function campoEditavel({ valor, tipo = "text", ao, largura, opcoes, placeholder, passo }) {
  if (opcoes) {
    const s = el("select", { onchange: (e) => ao(e.target.value) });
    for (const o of opcoes) {
      s.appendChild(el("option", { value: o, texto: o || "—", selected: (valor || "") === o }));
    }
    return s;
  }
  const at = {
    type: tipo, value: valor ?? "",
    class: largura === "mini" ? "mini" : "",
    onchange: (e) => ao(e.target.value),
  };
  if (placeholder) at.placeholder = placeholder;
  if (passo) at.step = passo;
  if (tipo === "number") at.inputmode = "decimal";
  return el("input", at);
}
