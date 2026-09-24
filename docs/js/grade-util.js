/* Funções puras da grade semanal — usadas pelas telas Grade e Hoje. */

import { hmParaMin } from "./ui.js";

/** Cor do evento: a escolhida à mão > a da matéria > a do tipo. */
export function corDe(ev, d) {
  return ev.cor || (ev.materia && d.materias[ev.materia]?.cor) || d.tipos[ev.tipo]?.cor || "#6B7280";
}

/** Faixa em minutos. Fim menor ou igual ao início = vai até a meia-noite. */
export function faixa(ev) {
  const ini = hmParaMin(ev.ini) ?? 0;
  let fim = hmParaMin(ev.fim) ?? ini + 30;
  if (fim <= ini) fim = 24 * 60;
  return { ini, fim };
}

export const doDia = (lista, dia) =>
  lista.filter((e) => e.dia === dia).sort((a, b) => faixa(a).ini - faixa(b).ini || faixa(a).fim - faixa(b).fim);

/** Distribui eventos que se sobrepõem em colunas lado a lado. */
export function empacotar(eventos) {
  const fx = eventos.map((e) => ({ e, ...faixa(e) })).sort((a, b) => a.ini - b.ini || b.fim - a.fim);
  const grupos = [];
  let atual = null;
  for (const x of fx) {
    if (!atual || x.ini >= atual.fim) { atual = { fim: x.fim, itens: [] }; grupos.push(atual); }
    atual.fim = Math.max(atual.fim, x.fim);
    atual.itens.push(x);
  }
  const out = [];
  for (const g of grupos) {
    const colunas = [];
    for (const x of g.itens) {
      let c = colunas.findIndex((fimCol) => fimCol <= x.ini);
      if (c === -1) { c = colunas.length; colunas.push(0); }
      colunas[c] = x.fim;
      x.col = c;
    }
    for (const x of g.itens) out.push({ ...x, cols: colunas.length });
  }
  return out;
}

/** Horas por matéria (só eventos ligados a uma matéria) numa lista de eventos. */
export function horasPorMateria(lista) {
  const h = {};
  for (const e of lista) {
    if (!e.materia) continue;
    const { ini, fim } = faixa(e);
    h[e.materia] = (h[e.materia] || 0) + (fim - ini) / 60;
  }
  return h;
}

export function horasPorTipo(lista) {
  const h = {};
  for (const e of lista) {
    const { ini, fim } = faixa(e);
    h[e.tipo] = (h[e.tipo] || 0) + (fim - ini) / 60;
  }
  return h;
}

export const fHoras = (h) => `${h.toFixed(1).replace(".", ",")} h`;
