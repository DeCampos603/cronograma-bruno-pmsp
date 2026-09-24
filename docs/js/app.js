/* Roteador e casca da aplicação. */

import { APP, supabaseLigado } from "./config.js";
import { iniciar, aoMudar, sync, estado, mudar } from "./store.js";
import { el, $, toast } from "./ui.js";

import { viewHoje } from "./views/hoje.js";
import { viewPainel } from "./views/painel.js";
import { viewGrade } from "./views/grade.js";
import { viewConteudo } from "./views/conteudo.js";
import { viewMensal } from "./views/mensal.js";
import { viewSemanas } from "./views/semanas.js";
import { viewSimulados } from "./views/simulados.js";
import { viewRedacao } from "./views/redacao.js";
import { viewTaf } from "./views/taf.js";
import { viewEdital } from "./views/edital.js";
import { viewAjustes } from "./views/ajustes.js";

export let dados = null;

const ROTAS = [
  { id: "hoje",      ic: "☀",  rot: "Hoje",       sub: "O que fazer agora",                     view: viewHoje,      tab: true },
  { id: "grade",     ic: "🗓", rot: "Grade",      sub: "Sua semana — edite horários e eventos", view: viewGrade,     tab: true },
  { id: "conteudo",  ic: "✅", rot: "Conteúdo",   sub: "Anexo B do edital, tópico a tópico",    view: viewConteudo,  tab: true },
  { id: "painel",    ic: "📊", rot: "Painel",     sub: "Quanto falta e como você está",         view: viewPainel,    tab: true },
  { id: "mensal",    ic: "📅", rot: "Plano",      sub: "Fases e o que estudar em cada mês",     view: viewMensal },
  { id: "semanas",   ic: "📈", rot: "Semanas",    sub: "Registro semana a semana",              view: viewSemanas },
  { id: "simulados", ic: "📝", rot: "Simulados",  sub: "Nota por matéria contra o corte do edital", view: viewSimulados },
  { id: "redacao",   ic: "✍",  rot: "Redação",    sub: "Prova dissertativa — 30 linhas, 0 a 40", view: viewRedacao },
  { id: "taf",       ic: "🏃", rot: "TAF",        sub: "Exame de aptidão física — Anexo D",     view: viewTaf },
  { id: "edital",    ic: "📄", rot: "Edital",     sub: "O que o edital DP-3/321/26 exige",      view: viewEdital },
  { id: "ajustes",   ic: "⚙",  rot: "Ajustes",    sub: "Datas, backup e sincronização",         view: viewAjustes,   tab: true },
];
const TAB_MAIS = { id: "mais", ic: "⋯", rot: "Mais", sub: "Todas as seções", view: viewMais, tab: true };

function viewMais() {
  const lista = el("div", { class: "grade-cards" });
  for (const r of ROTAS) {
    lista.appendChild(el("a", { class: "btn", href: `#/${r.id}`, estilo: { justifyContent: "flex-start" } },
      [el("span", { class: "btn__ic", texto: r.ic }), el("span", {}, [el("b", { texto: r.rot }), el("div", { estilo: { fontSize: "11px", color: "var(--ink-2)", fontWeight: 400 }, texto: r.sub })])]));
  }
  return lista;
}

const TODAS = [...ROTAS, TAB_MAIS];
const rotaAtual = () => {
  const id = (location.hash.replace(/^#\/?/, "") || "hoje").split("?")[0];
  return TODAS.find((r) => r.id === id) || ROTAS[0];
};

/* --------------------------------------------------------------- navegação */
function montarNav() {
  const nav = $("#nav");
  nav.innerHTML = "";
  for (const r of ROTAS) {
    nav.appendChild(el("a", { class: "navlink", href: `#/${r.id}`, dataset: { rota: r.id } },
      [el("span", { class: "navlink__ic", texto: r.ic }), r.rot]));
  }
  const tb = $("#tabbar");
  tb.innerHTML = "";
  const abas = [...ROTAS.filter((x) => x.tab && x.id !== "ajustes"), TAB_MAIS];
  for (const r of abas) {
    tb.appendChild(el("button", {
      dataset: { rota: r.id }, type: "button",
      onclick: () => { location.hash = `#/${r.id}`; },
    }, [el("i", { texto: r.ic }), r.rot]));
  }
}

function marcarAtivo(id) {
  for (const n of document.querySelectorAll("[data-rota]")) {
    const ativo = n.dataset.rota === id || (n.dataset.rota === "mais" && !ROTAS.filter((r) => r.tab && r.id !== "ajustes").some((r) => r.id === id));
    if (ativo) n.setAttribute("aria-current", "page"); else n.removeAttribute("aria-current");
  }
}

/* ------------------------------------------------------------ indicador sync */
function pintarSync() {
  const box = $("#sync");
  if (!box) return;
  const nuvem = sync.modo === "nuvem";
  let classe = "sync", txt;
  if (sync.situacao === "erro") { classe += " sync--erro"; txt = "Erro ao sincronizar"; }
  else if (sync.situacao === "gravando") { classe += " sync--nuvem"; txt = "Sincronizando…"; }
  else if (nuvem) { classe += " sync--nuvem"; txt = "Na nuvem"; }
  else { classe += " sync--ok"; txt = "Salvo neste aparelho"; }
  box.className = classe;
  box.innerHTML = "";
  box.appendChild(el("span", { class: "sync__ponto" }));
  box.appendChild(el("span", { texto: txt }));
  box.title = sync.detalhe || (nuvem ? `Conectado como ${sync.email || ""}` : "Salvo automaticamente no navegador deste aparelho");
}

/* ------------------------------------------------------------------- tema */
function aplicarTema() {
  const t = estado.tema || "auto";
  const escuro = t === "escuro" || (t === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.tema = escuro ? "escuro" : "claro";
  const b = $("#btnTema");
  if (b) b.textContent = escuro ? "☀" : "🌙";
}

/* ---------------------------------------------------------------- render */
let renderando = false;

export function render() {
  if (renderando) return;
  renderando = true;
  // setTimeout e não requestAnimationFrame: rAF não dispara em aba de fundo,
  // o que deixaria o site preso em "Carregando…" até receber foco.
  setTimeout(() => {
    renderando = false;
    const r = rotaAtual();
    marcarAtivo(r.id);
    $("#tituloPagina").textContent = r.rot;
    $("#subPagina").textContent = r.sub;
    const alvo = $("#view");
    alvo.innerHTML = "";
    try {
      alvo.appendChild(r.view(dados));
    } catch (e) {
      console.error(e);
      alvo.appendChild(el("div", { class: "aviso" }, [
        el("div", {}, [el("b", { texto: "Algo quebrou nesta tela." }), String(e.message || e)]),
      ]));
    }
    pintarSync();
    aplicarTema();
    window.scrollTo(0, 0);
  }, 0);
}

/* ----------------------------------------------------------------- arranque */
async function main() {
  montarNav();

  try {
    const resp = await fetch(APP.arquivoDados, { cache: "no-cache" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    dados = await resp.json();
  } catch (e) {
    $("#view").innerHTML = "";
    $("#view").appendChild(el("div", { class: "aviso" }, [
      el("div", {}, [
        el("b", { texto: "Não consegui carregar o plano." }),
        "Verifique se o arquivo dados/plano.json está publicado junto com o site. Detalhe: " + (e.message || e),
      ]),
    ]));
    return;
  }

  await iniciar(dados);
  aoMudar(() => { pintarSync(); });

  window.addEventListener("hashchange", render);

  $("#btnTema").addEventListener("click", () => {
    const atual = document.documentElement.dataset.tema;
    mudar((s) => { s.tema = atual === "escuro" ? "claro" : "escuro"; });
    aplicarTema();
  });

  render();

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("./sw.js").then((reg) => { reg.update(); }).catch(() => {});
  }

  if (!supabaseLigado()) {
    try {
      if (!localStorage.getItem("bruno-pmsp.avisoLocal")) {
        localStorage.setItem("bruno-pmsp.avisoLocal", "1");
        setTimeout(() => toast("Tudo que você marcar ou editar fica salvo neste aparelho."), 900);
      }
    } catch { /* navegador sem localStorage: sem aviso */ }
  }
}

main();
