/* Tela PAINEL — contagem regressiva, progresso por matéria e indicadores. */

import { el, dias, fData, cartao, barraProgresso, chip, num, soma, n1, nInt, numeroSemana } from "../ui.js";
import { estado, CONCLUIDOS } from "../store.js";
import { totalObjetiva, CORTE_OBJ, CORTE_RED } from "./simulados.js";
import { passou } from "./taf.js";

export function viewPainel(d) {
  const frag = document.createDocumentFragment();
  const dProva = dias(estado.datas.prova);

  /* ---- progresso por matéria ---- */
  const linhas = d.ordem.filter((m) => d.topicos.some((t) => t.materia === m)).map((m) => {
    const tops = d.topicos.filter((t) => t.materia === m);
    const feitos = tops.filter((t) => CONCLUIDOS.includes(estado.topicos[t.id]?.status));
    const confs = tops.map((t) => num(estado.topicos[t.id]?.confianca)).filter((x) => x !== null);
    const acs = tops.map((t) => num(estado.topicos[t.id]?.acerto)).filter((x) => x !== null);
    return {
      m, total: tops.length, feitos: feitos.length,
      frac: tops.length ? feitos.length / tops.length : 0,
      conf: confs.length ? confs.reduce((a, b) => a + b, 0) / confs.length : null,
      ac: acs.length ? acs.reduce((a, b) => a + b, 0) / acs.length : null,
    };
  });
  const totTop = linhas.reduce((a, l) => a + l.total, 0);
  const totFeitos = linhas.reduce((a, l) => a + l.feitos, 0);

  /* ---- indicadores ---- */
  const semanasReg = Object.values(estado.semanas);
  const horas = soma(semanasReg.map((s) => s.horas));
  const questoes = soma(semanasReg.map((s) => s.questoes));
  const certas = soma(semanasReg.map((s) => s.certas));
  const totais = estado.simulados.map(totalObjetiva).filter((x) => x !== null);
  const ultObj = totais.length ? totais[totais.length - 1] : null;
  const redNotas = estado.redacoes.map((r) => num(r.nota)).filter((x) => x !== null);
  const ultRed = redNotas.length ? redNotas[redNotas.length - 1] : null;
  const ultTaf = estado.taf.length ? estado.taf[estado.taf.length - 1] : null;
  const sx = estado.sexo || "M";
  const tafRes = ultTaf ? d.taf.testes.map((t) => passou(t, ultTaf[t.id], sx)) : [];
  const tafOk = tafRes.filter((x) => x === true).length;

  const cont = el("div", { class: "contador" }, [
    el("div", { class: "contador__rot", texto: "Prova PM-SP · Aluno-Soldado" }),
    el("div", { class: "contador__n", texto: dProva === null ? "—" : dProva < 0 ? "✓" : String(dProva) }),
    el("div", { class: "contador__u", texto: dProva === null ? "" : dProva < 0 ? "prova realizada" : "dias restantes" }),
    el("div", { class: "contador__pe", texto: `${fData(estado.datas.prova)} · data estimada, ajuste em Ajustes` }),
  ]);

  const kpi = (rot, val, meta, cls = "") => el("div", { class: `kpi__item ${cls}` }, [
    el("div", { class: "kpi__rot", texto: rot }), el("div", { class: "kpi__val", texto: val }), el("div", { class: "kpi__meta", texto: meta }),
  ]);

  frag.appendChild(el("div", { class: "grade-cards", estilo: { marginBottom: "16px", alignItems: "stretch" } }, [
    cont,
    el("div", { class: "kpi", estilo: { gridColumn: "span 1" } }, [
      kpi("Tópicos concluídos", `${totFeitos}/${totTop}`, totTop ? `${Math.round((100 * totFeitos) / totTop)}% do Anexo B` : ""),
      kpi("Horas registradas", n1.format(horas), "soma das semanas"),
      kpi("Questões feitas", nInt.format(questoes), questoes ? `${Math.round((100 * certas) / questoes)}% de acerto` : "registre em Semanas"),
      kpi("Último simulado", ultObj === null ? "—" : `${ultObj}/60`, `corte: ${CORTE_OBJ}`, ultObj !== null ? (ultObj >= CORTE_OBJ ? "kpi__item--ok" : "kpi__item--alerta") : ""),
      kpi("Última redação", ultRed === null ? "—" : `${String(ultRed).replace(".", ",")}/40`, `corte: ${CORTE_RED}`, ultRed !== null ? (ultRed >= CORTE_RED ? "kpi__item--ok" : "kpi__item--alerta") : ""),
      kpi("TAF (último registro)", ultTaf ? `${tafOk}/${d.taf.testes.length}` : "—", ultTaf ? "testes dentro do ISF" : "registre em TAF", ultTaf ? (tafOk === d.taf.testes.length ? "kpi__item--ok" : "") : ""),
    ]),
  ]));

  const tabela = el("div", { class: "tabela-wrap" }, [el("table", { class: "tb" }, [
    el("thead", {}, [el("tr", {}, [
      el("th"), el("th", { texto: "Matéria" }), el("th", { class: "cen", texto: "Na prova" }),
      el("th", { class: "cen", texto: "Feitos" }), el("th", { texto: "Progresso", estilo: { minWidth: "170px" } }),
      el("th", { class: "cen", texto: "Confiança" }), el("th", { class: "cen", texto: "% acerto" }),
    ])]),
    el("tbody", {}, linhas.map((l) => {
      const info = d.materias[l.m];
      return el("tr", {}, [
        el("td", { estilo: { width: "6px", padding: "0", background: info.cor } }),
        el("td", {}, [el("b", { texto: info.nome })]),
        el("td", { class: "cen", texto: info.questoes ? `${info.questoes} q.` : "—" }),
        el("td", { class: "cen", texto: `${l.feitos}/${l.total}` }),
        el("td", {}, [barraProgresso(l.frac, info.cor)]),
        el("td", { class: "cen", texto: l.conf === null ? "—" : n1.format(l.conf) }),
        el("td", { class: "cen", texto: l.ac === null ? "—" : `${Math.round(l.ac)}%` }),
      ]);
    })),
  ])]);
  frag.appendChild(cartao("Progresso por matéria", "Conta como feito o tópico marcado Concluído ou Revisado.", [tabela], null, true));

  /* ---- peso na prova ---- */
  frag.appendChild(cartao("Onde estão os pontos", "Prova objetiva de 60 questões (1 ponto cada) + redação de 0 a 40.", [
    el("div", { class: "grade-cards" }, d.grupos.map((g) => el("div", {}, [
      el("div", { estilo: { display: "flex", justifyContent: "space-between", fontSize: "13px" } }, [
        el("b", { texto: g.nome }), el("span", { texto: `${g.questoes} questões · ${Math.round((100 * g.questoes) / 60)}%` }),
      ]),
      el("div", { class: "prog", estilo: { marginTop: "4px" } }, [el("div", { class: "prog__trilho" }, [el("div", { class: "prog__barra", estilo: { width: `${(100 * g.questoes) / 20}%` } })])]),
      g.obs ? el("div", { estilo: { fontSize: "11.5px", color: "var(--ink-3)", marginTop: "3px" }, texto: g.obs }) : null,
    ]))),
  ]));

  /* ---- semana atual ---- */
  const nSem = numeroSemana(estado.datas.inicio, new Date(), d.concurso.semanas);
  const fase = d.fases.find((f) => nSem >= f.semanas[0] && nSem <= f.semanas[1]);
  if (fase) {
    frag.appendChild(cartao(`Agora: ${fase.nome}`, `Semana ${nSem} de ${d.concurso.semanas} · ${fase.periodo}`, [
      el("p", { estilo: { fontSize: "13.5px" } }, [el("b", { texto: "O que fazer: " }), fase.muda]),
      el("p", { estilo: { fontSize: "13px", color: "var(--ink-2)", margin: 0 } }, [el("b", { texto: "Meta da fase: " }), fase.meta]),
    ]));
  }
  return frag;
}
