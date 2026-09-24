/* Tela PLANO — fases e o que estudar em cada mês (calculado das datas de Ajustes). */

import { el, cartao, chip, somarDias, deIso, fCurta, dias, iso } from "../ui.js";
import { estado, topico, CONCLUIDOS } from "../store.js";

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export function viewMensal(d) {
  const frag = document.createDocumentFragment();
  const total = d.concurso.semanas;

  /* fases */
  frag.appendChild(cartao("As 4 fases do plano", "Mesma grade semanal — muda o que se faz dentro dos blocos.",
    d.fases.map((f) => {
      const a = somarDias(estado.datas.inicio, (f.semanas[0] - 1) * 7);
      const b = somarDias(estado.datas.inicio, f.semanas[1] * 7 - 1);
      return el("details", { class: "acordeao", open: f === d.fases[0] }, [
        el("summary", {}, [el("span", { texto: f.nome }), chip(`${fCurta(a)} a ${fCurta(b)}`), chip(`sem. ${f.semanas[0]}–${f.semanas[1]}`)]),
        el("div", {}, [
          el("p", { estilo: { fontSize: "13px" } }, [el("b", { texto: "O que muda: " }), f.muda]),
          el("p", { estilo: { fontSize: "12.5px", color: "var(--ink-2)" } }, [el("b", { texto: "Por quê: " }), f.porque]),
          el("p", { estilo: { fontSize: "12.5px", margin: 0 } }, [el("b", { texto: "Meta: " }), f.meta]),
        ]),
      ]);
    })));

  /* meses: agrupa as semanas pelo mês da segunda-feira */
  const meses = [];
  for (let w = 1; w <= total; w++) {
    const seg = somarDias(estado.datas.inicio, (w - 1) * 7);
    const dt = deIso(seg);
    const chave = `${dt.getFullYear()}-${dt.getMonth()}`;
    let m = meses.find((x) => x.chave === chave);
    if (!m) { m = { chave, rot: `${MESES[dt.getMonth()]}/${dt.getFullYear()}`, semanas: [] }; meses.push(m); }
    m.semanas.push(w);
  }

  const hojeIso = iso(new Date());
  const corpo = meses.map((m) => {
    const primeira = m.semanas[0], ultima = m.semanas[m.semanas.length - 1];
    const ini = somarDias(estado.datas.inicio, (primeira - 1) * 7);
    const fim = somarDias(estado.datas.inicio, ultima * 7 - 1);
    const atual = hojeIso >= ini && hojeIso <= fim;
    const fases = [...new Set(m.semanas.map((w) => d.fases.find((f) => w >= f.semanas[0] && w <= f.semanas[1])?.nome).filter(Boolean))];
    const tops = d.topicos.filter((t) => m.semanas.includes(t.sem));

    const porMat = d.ordem.map((mid) => ({ mid, lista: tops.filter((t) => t.materia === mid) })).filter((x) => x.lista.length);
    return el("details", { class: "acordeao", open: atual }, [
      el("summary", {}, [el("span", { texto: m.rot }), chip(`sem. ${primeira}–${ultima}`), ...fases.map((f) => chip(f.split(" — ")[1] || f)), atual ? chip("mês atual", "ok") : null]),
      el("div", {}, porMat.length
        ? porMat.map(({ mid, lista }) => el("div", { estilo: { display: "flex", gap: "10px", padding: "8px 0", borderTop: "1px solid var(--line)" } }, [
            el("span", { class: "trilho-mat", estilo: { background: d.materias[mid].cor } }),
            el("div", { estilo: { flex: 1 } }, [
              el("b", { estilo: { fontSize: "13px", color: d.materias[mid].cor }, texto: d.materias[mid].nome }),
              ...lista.map((t) => {
                const ok = CONCLUIDOS.includes(topico(t.id).status);
                return el("div", { estilo: { fontSize: "12.5px", marginTop: "2px", color: ok ? "var(--ink-3)" : "inherit", textDecoration: ok ? "line-through" : "none" },
                  texto: `${ok ? "✓ " : "• "}${t.topico} (sem. ${t.sem})` });
              }),
            ]),
          ]))
        : [el("p", { estilo: { fontSize: "13px", color: "var(--ink-2)" },
            texto: "Sem tópicos novos: este período é de revisão, questões e simulados, conforme a fase acima." })]),
    ]);
  });
  frag.appendChild(cartao("Mês a mês", "Tópicos previstos para a 1ª passagem. Nas fases 2 a 4, o foco é revisar pelos erros.", corpo));

  const dp = dias(estado.datas.prova);
  frag.appendChild(el("div", { class: "aviso aviso--warn" }, [el("div", {}, [
    el("b", { texto: "Datas do plano" }),
    `Início em ${fCurta(estado.datas.inicio)} e prova estimada em ${fCurta(estado.datas.prova)}${dp !== null && dp >= 0 ? ` (faltam ${dp} dias)` : ""}. ` +
    "Quando a VUNESP divulgar a data oficial, corrija em Ajustes — os contadores se reajustam.",
  ])]));
  return frag;
}
