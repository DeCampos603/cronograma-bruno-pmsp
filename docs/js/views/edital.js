/* Tela EDITAL — o que o Edital DP-3/321/26 exige, em resumo. Fonte: o PDF do edital. */

import { el, cartao, chip } from "../ui.js";

export function viewEdital(d) {
  const e = d.edital;
  const frag = document.createDocumentFragment();

  frag.appendChild(el("div", { class: "aviso aviso--warn" }, [el("div", {}, [
    el("b", { texto: "Prova remarcada" }),
    `O edital previa a prova para ${e.prova_original}. A nova data informada é: ${e.prova_nova}. `,
    "Confirme sempre no Diário Oficial do Estado, no Portal de Concursos (concursopublico.sp.gov.br) e em ",
    el("a", { href: "https://www.vunesp.com.br/PMES2601", target: "_blank", rel: "noopener noreferrer", texto: "vunesp.com.br/PMES2601" }), ".",
  ])]));

  const dl = (pares) => el("dl", { class: "dl" }, pares.flatMap(([k, v]) => [el("dt", { texto: k }), el("dd", { texto: v })]));

  frag.appendChild(cartao(e.numero, "Resumo — vale sempre o texto oficial.", [dl([
    ["Cargo", "Aluno-Soldado PM do Quadro de Praças (QP)"],
    ["Banca", e.banca],
    ["Publicação", e.publicacao],
    ["Vagas", e.vagas],
    ["Remuneração inicial", e.remuneracao],
    ["Inscrições", e.inscricoes],
  ])]));

  frag.appendChild(cartao("Requisitos", null, [
    el("ul", { estilo: { margin: 0, paddingLeft: "20px", fontSize: "13.5px", display: "grid", gap: "5px" } }, e.requisitos.map((r) => el("li", { texto: r }))),
    el("p", { estilo: { fontSize: "12px", color: "var(--ink-2)", margin: "10px 0 0" },
      texto: "Tatuagem é permitida, exceto nas hipóteses do Capítulo II (símbolos ofensivos, apologia a extremismo ou discriminação, entre outras)." }),
  ]));

  frag.appendChild(cartao("A prova de conhecimentos", "Capítulos V e VIII.", [
    el("ul", { estilo: { margin: "0 0 14px", paddingLeft: "20px", fontSize: "13.5px", display: "grid", gap: "5px" } }, e.prova_estrutura.map((r) => el("li", { texto: r }))),
    el("div", { class: "tabela-wrap" }, [el("table", { class: "tb" }, [
      el("thead", {}, [el("tr", {}, [el("th", { texto: "Bloco" }), el("th", { class: "cen", texto: "Questões" })])]),
      el("tbody", {}, d.grupos.map((g) => el("tr", {}, [el("td", { texto: g.nome + (g.obs ? ` (${g.obs})` : "") }), el("td", { class: "cen", texto: String(g.questoes) })]))),
    ])]),
  ]));

  frag.appendChild(cartao("Etapas do concurso", "Todas eliminatórias; a primeira também classifica.", [
    el("div", { class: "tabela-wrap" }, [el("table", { class: "tb" }, [
      el("thead", {}, [el("tr", {}, [el("th", { class: "cen", texto: "#" }), el("th", { texto: "Etapa" }), el("th", { texto: "Caráter" }), el("th", { class: "cen", texto: "Cap." })])]),
      el("tbody", {}, e.etapas.map((s) => el("tr", {}, [el("td", { class: "cen", texto: String(s.n) }), el("td", { texto: s.nome }), el("td", {}, [chip(s.carater)]), el("td", { class: "cen", texto: s.cap })]))),
    ])]),
  ], null, true));

  return frag;
}
