/* Tela REDAÇÃO — a Prova Dissertativa (Parte II): 1 redação, máx. 30 linhas, 0 a 40 pontos. */

import { el, cartao, chip, num, iso, HOJE, campoEditavel } from "../ui.js";
import { estado, mudar, novoId } from "../store.js";
import { CORTE_RED } from "./simulados.js";

export function viewRedacao(d) {
  const frag = document.createDocumentFragment();
  const alvo = el("div");

  frag.appendChild(cartao("O que a banca avalia", "Resumo do Capítulo VIII do edital.", [
    el("ul", { estilo: { margin: 0, paddingLeft: "20px", fontSize: "13.5px", display: "grid", gap: "6px" } },
      d.redacaoCriterios.map((c) => el("li", { texto: c }))),
  ]));
  frag.appendChild(alvo);

  function pintar() {
    alvo.innerHTML = "";
    const lista = estado.redacoes;
    const notas = lista.map((r) => num(r.nota)).filter((x) => x !== null);
    const corpo = el("div", { class: "tabela-wrap" });
    const tbody = el("tbody");
    lista.forEach((r, idx) => {
      const sit = el("td");
      const atualiza = () => {
        sit.innerHTML = "";
        const n = num(r.nota);
        if (n !== null) sit.appendChild(chip(n >= CORTE_RED ? "Habilitada" : "Abaixo de 20", n >= CORTE_RED ? "ok" : "bad"));
        const l = num(r.linhas);
        if (l !== null && l > 30) sit.appendChild(el("span", { estilo: { marginLeft: "4px" } }, [chip("Passou de 30 linhas", "bad")]));
      };
      const grava = (c) => (v) => { mudar((e) => { e.redacoes[idx][c] = v; }); r[c] = v; atualiza(); };
      atualiza();
      tbody.appendChild(el("tr", {}, [
        el("td", {}, [el("input", { type: "date", value: r.data, onchange: (e) => grava("data")(e.target.value) })]),
        el("td", { estilo: { minWidth: "220px" } }, [campoEditavel({ valor: r.tema, ao: grava("tema"), placeholder: "Tema proposto" })]),
        el("td", { class: "cen" }, [campoEditavel({ valor: r.linhas, tipo: "number", largura: "mini", ao: grava("linhas"), placeholder: "≤30" })]),
        el("td", { class: "cen" }, [campoEditavel({ valor: r.minutos, tipo: "number", largura: "mini", ao: grava("minutos"), placeholder: "min" })]),
        el("td", { class: "cen" }, [campoEditavel({ valor: r.nota, tipo: "number", largura: "mini", ao: grava("nota"), placeholder: "0–40", passo: "0.5" })]),
        sit,
        el("td", { estilo: { minWidth: "200px" } }, [campoEditavel({ valor: r.obs, ao: grava("obs"), placeholder: "O que errar de novo?" })]),
        el("td", {}, [el("button", { class: "btn btn--peq btn--fantasma", type: "button", "aria-label": "Excluir redação",
          onclick: () => { if (confirm("Excluir esta redação?")) { mudar((e) => { e.redacoes.splice(idx, 1); }); pintar(); } }, texto: "🗑" })]),
      ]));
    });
    corpo.appendChild(el("table", { class: "tb" }, [
      el("thead", {}, [el("tr", {}, ["Data", "Tema", "Linhas", "Tempo (min)", "Nota /40", "Situação", "Observação", ""].map((t) => el("th", { class: ["Linhas", "Tempo (min)", "Nota /40"].includes(t) ? "cen" : "", texto: t })))]),
      tbody,
    ]));

    alvo.appendChild(cartao("Minhas redações",
      notas.length ? `${notas.length} avaliada(s) · média ${(notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1).replace(".", ",")}/40 · habilitação: ${CORTE_RED}/40` : "Registre a nota autoavaliada (ou do professor) para acompanhar a evolução.",
      [lista.length ? corpo : el("div", { class: "vazio" }, [el("span", { class: "vazio__ic", texto: "✍" }), "Nenhuma redação registrada ainda."])],
      [el("button", { class: "btn btn--primario btn--peq", type: "button", onclick: () => {
        mudar((e) => { e.redacoes.push({ id: novoId(), data: iso(HOJE()), tema: "", linhas: "", minutos: "", nota: "", obs: "" }); });
        pintar();
      }, texto: "＋ Nova redação" })], true));
  }
  pintar();
  return frag;
}
