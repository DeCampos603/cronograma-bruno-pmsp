/* ==========================================================================
   Persistência.

   Camada 1 — localStorage: grava a cada alteração; funciona offline e sem
              configuração nenhuma.
   Camada 2 — Supabase (opcional): sincroniza o mesmo documento entre
              aparelhos. Ligada preenchendo js/config.js.
   Camada 3 — Backup manual: exportar/importar JSON, em Ajustes.

   O estado é UM documento JSON. Conflito entre aparelhos: quem gravou por
   último vence (compara atualizado_em).

   GRADE EDITÁVEL: `gradePadrao` é a semana-modelo; `gradeSemana[segunda]` é uma
   cópia personalizada só daquela semana. Se a semana não tem cópia, vale o padrão.
   Enquanto o usuário nunca editou, gradePadrao é null e vale a grade do plano.json.
   ========================================================================== */

import { APP, SUPABASE, supabaseLigado } from "./config.js";

const VERSAO_ESTADO = 1;
let dadosPlano = null;

function estadoVazio() {
  const c = dadosPlano?.concurso || {};
  return {
    v: VERSAO_ESTADO,
    datas: { inicio: c.inicio || "2026-09-28", prova: c.prova || "2027-03-14" },
    sexo: "M",
    topicos: {},      // id -> {status, dataEstudo, confianca, acerto, obs}
    semanas: {},      // n -> {meta, horas, questoes, certas, treinos, obs}
    dia: {},          // "YYYY-MM-DD" -> {idDoEvento: true}
    simulados: [],
    redacoes: [],
    taf: [],
    gradePadrao: null,
    gradeSemana: {},
    tema: "auto",
    atualizado_em: null,
  };
}

/* ------------------------------------------------------------------ eventos */
const ouvintes = new Set();
export const aoMudar = (fn) => { ouvintes.add(fn); return () => ouvintes.delete(fn); };
const emitir = () => ouvintes.forEach((f) => { try { f(estado); } catch (e) { console.error(e); } });

/* ------------------------------------------------------------------- estado */
export let estado = estadoVazio();

export const sync = { modo: "local", situacao: "ok", detalhe: "", email: null };

function carregarLocal() {
  try {
    const cru = localStorage.getItem(APP.chaveLocal);
    if (!cru) return null;
    const obj = JSON.parse(cru);
    return obj && typeof obj === "object" ? obj : null;
  } catch (e) {
    console.warn("estado local ilegível", e);
    return null;
  }
}

function migrar(obj) {
  const base = estadoVazio();
  const novo = { ...base, ...obj };
  novo.datas = { ...base.datas, ...(obj.datas || {}) };
  for (const k of ["topicos", "semanas", "dia", "gradeSemana"]) novo[k] = { ...(obj[k] || {}) };
  for (const k of ["simulados", "redacoes", "taf"]) novo[k] = Array.isArray(obj[k]) ? obj[k] : [];
  novo.gradePadrao = Array.isArray(obj.gradePadrao) ? obj.gradePadrao : null;
  novo.v = VERSAO_ESTADO;
  return novo;
}

let gravarTimer = null;

function gravarLocal() {
  try {
    localStorage.setItem(APP.chaveLocal, JSON.stringify(estado));
    return true;
  } catch (e) {
    console.error("falha ao gravar local", e);
    sync.situacao = "erro";
    sync.detalhe = "Sem espaço no navegador. Exporte um backup em Ajustes.";
    return false;
  }
}

/** Altera o estado, grava na hora e agenda a sincronização na nuvem. */
export function mudar(fn) {
  fn(estado);
  estado.atualizado_em = new Date().toISOString();
  gravarLocal();
  emitir();
  if (sync.modo === "nuvem") {
    clearTimeout(gravarTimer);
    sync.situacao = "gravando";
    gravarTimer = setTimeout(() => { enviarNuvem().catch(() => {}); }, 1200);
  }
}

/* ---------------------------------------------------------------- atalhos */
export const topico = (id) =>
  estado.topicos[id] || { status: "", dataEstudo: "", confianca: "", acerto: "", obs: "" };

export const semana = (n) =>
  estado.semanas[n] || { meta: "", horas: "", questoes: "", certas: "", treinos: "", obs: "" };

export const CONCLUIDOS = ["Concluído", "Revisado"];

/* ------------------------------------------------------------------- grade */
const copia = (x) => JSON.parse(JSON.stringify(x));

/** Grade em vigor na semana que começa em `segundaIso`. */
export function gradeDaSemana(segundaIso) {
  const propria = estado.gradeSemana[segundaIso];
  if (Array.isArray(propria)) return { lista: propria, personalizada: true };
  return { lista: estado.gradePadrao || dadosPlano?.grade || [], personalizada: false };
}

/**
 * Edita a grade. escopo "padrao" mexe no modelo de todas as semanas;
 * escopo "semana" mexe só na semana `segundaIso` (criando a cópia se preciso).
 * `fn` recebe um array que pode ser alterado livremente.
 */
export function editarGrade(escopo, segundaIso, fn) {
  mudar((s) => {
    if (escopo === "semana") {
      const base = Array.isArray(s.gradeSemana[segundaIso])
        ? s.gradeSemana[segundaIso]
        : copia(s.gradePadrao || dadosPlano?.grade || []);
      fn(base);
      s.gradeSemana[segundaIso] = base;
    } else {
      const base = s.gradePadrao ? s.gradePadrao : copia(dadosPlano?.grade || []);
      fn(base);
      s.gradePadrao = base;
    }
  });
}

export function restaurarSemana(segundaIso) {
  mudar((s) => { delete s.gradeSemana[segundaIso]; });
}

export function restaurarGradeOriginal() {
  mudar((s) => { s.gradePadrao = null; s.gradeSemana = {}; });
}

export function copiarSemanaParaPadrao(segundaIso) {
  mudar((s) => {
    const src = s.gradeSemana[segundaIso];
    if (Array.isArray(src)) s.gradePadrao = copia(src);
  });
}

export function copiarSemanaPara(origemIso, destinoIso) {
  mudar((s) => {
    const src = s.gradeSemana[origemIso] || s.gradePadrao || dadosPlano?.grade || [];
    s.gradeSemana[destinoIso] = copia(src);
  });
}

export const novoId = () => "e" + Math.random().toString(36).slice(2, 9);

/* --------------------------------------------------------------- Supabase */
let sb = null;

async function clienteSupabase() {
  if (sb) return sb;
  if (!supabaseLigado()) return null;
  const { createClient } = await import("./vendor/supabase.js");
  sb = createClient(SUPABASE.url, SUPABASE.chavePublishable, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return sb;
}

export async function entrar(email, senha) {
  const c = await clienteSupabase();
  if (!c) throw new Error("Supabase não configurado em js/config.js");
  const { error } = await c.auth.signInWithPassword({ email, password: senha });
  if (error) throw error;
  await iniciarNuvem();
}

export async function sair() {
  const c = await clienteSupabase();
  if (c) await c.auth.signOut();
  sync.modo = "local"; sync.email = null; sync.situacao = "ok"; sync.detalhe = "";
  emitir();
}

async function usuario() {
  const c = await clienteSupabase();
  if (!c) return null;
  const { data } = await c.auth.getUser();
  return data?.user || null;
}

async function iniciarNuvem() {
  const c = await clienteSupabase();
  if (!c) return;
  const u = await usuario();
  if (!u) { sync.modo = "local"; sync.situacao = "deslogado"; emitir(); return; }

  sync.modo = "nuvem"; sync.email = u.email; sync.situacao = "gravando"; emitir();

  const { data, error } = await c
    .from("progresso").select("dados, atualizado_em").eq("usuario_id", u.id).maybeSingle();

  if (error) {
    sync.situacao = "erro";
    sync.detalhe = "Não consegui ler da nuvem. Seus dados locais estão intactos.";
    emitir();
    return;
  }

  const remoto = data?.dados || null;
  const tRemoto = data?.atualizado_em ? Date.parse(data.atualizado_em) : 0;
  const tLocal = estado.atualizado_em ? Date.parse(estado.atualizado_em) : 0;

  if (remoto && tRemoto > tLocal) {
    estado = migrar(remoto);
    gravarLocal();
  }
  await enviarNuvem();
  emitir();
}

async function enviarNuvem() {
  const c = await clienteSupabase();
  if (!c) return;
  const u = await usuario();
  if (!u) { sync.situacao = "deslogado"; emitir(); return; }
  const { error } = await c.from("progresso").upsert({
    usuario_id: u.id,
    dados: estado,
    atualizado_em: estado.atualizado_em || new Date().toISOString(),
  }, { onConflict: "usuario_id" });

  if (error) {
    sync.situacao = navigator.onLine ? "erro" : "ok";
    sync.detalhe = navigator.onLine
      ? "Falha ao gravar na nuvem — o dado está salvo neste aparelho."
      : "Sem rede. Salvo neste aparelho; sincroniza quando voltar.";
  } else {
    sync.situacao = "ok"; sync.detalhe = "";
  }
  emitir();
}

window.addEventListener("online", () => {
  if (sync.modo === "nuvem") enviarNuvem().catch(() => {});
});

/* ------------------------------------------------------------ backup manual */
export function exportarJSON() {
  const blob = new Blob([JSON.stringify(estado, null, 1)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const hoje = new Date().toISOString().slice(0, 10);
  a.href = url; a.download = `cronograma-bruno-pmsp-${hoje}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function importarJSON(arquivo) {
  const txto = await arquivo.text();
  const obj = JSON.parse(txto);
  if (!obj || typeof obj !== "object" || !("topicos" in obj)) {
    throw new Error("Este arquivo não parece um backup do cronograma.");
  }
  estado = migrar(obj);
  estado.atualizado_em = new Date().toISOString();
  gravarLocal();
  emitir();
  if (sync.modo === "nuvem") await enviarNuvem();
}

export function apagarTudo() {
  estado = estadoVazio();
  localStorage.removeItem(APP.chaveLocal);
  emitir();
  if (sync.modo === "nuvem") enviarNuvem().catch(() => {});
}

/* ------------------------------------------------------------------ arranque */
export async function iniciar(dados) {
  dadosPlano = dados;
  estado = estadoVazio();
  const local = carregarLocal();
  if (local) estado = migrar(local);
  if (supabaseLigado()) {
    try { await iniciarNuvem(); }
    catch (e) { console.warn("nuvem indisponível", e); sync.situacao = "erro"; }
  }
  emitir();
}
