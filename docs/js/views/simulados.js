/* Tela SIMULADOS — nota por bloco contra o corte do edital (30/60 na objetiva, 20/40 na redação). */

import { el, cartao, chip, num, n1, fCurta, iso, HOJE, campoEditavel } from "../ui.js";
import { estado, mudar, novoId } from "../store.js";

export const CORTE_OBJ = 30;
export const CORTE_RED = 20;

const BLOCOS = [
  ["pt", "Português", 20], ["mat", "Matemática", 15], ["cg", "Conhec. Gerais", 15],
  ["info", "Informática", 5], ["adm", "Adm. Pública", 5],
];

export const totalObjetiva = (s) => {
  const v = BLOCOS.map(([k]) => num(s[k]));
  return v.every((x) => x === null) ? null : v.reduce((a, b) => a + (b || 0), 0);
};

export function viewSimulados() {
  const frag = document.createDocumentFragment();
  const alvo = el("div");
  frag.appendChild(el("div", { class: "aviso aviso--info" }, [el("div", {}, [
    el("b", { texto: "Como o edital corta" }),
    "Objetiva: 60 questões, 1 ponto cada; é preciso 30 pontos para ter a redação corrigida. Redação: 0 a 40, habilitado com 20 ou mais. Os dois são eliminatórios.",
  ])]));
  frag.appendChild(alvo);

  function pintar() {
    alvo.innerHTML = "";
    const lista = estado.simulados;
    const totais = lista.map(totalObjetiva).filter((x) => x !== null);
    const ult = totais.length ? totais[totais.length - 1] : null;
    const media3 = totais.length ? totais.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, totais.length) : null;
    const melhor = totais.length ? Math.max(...totais) : null;

    alvo.appendChild(el("div", { class: "kpi", estilo: { marginBottom: "16px" } }, [
      kpi("Último (objetiva)", ult === null ? "—" : `${ult}/60`, ult === null ? "" : ult >= CORTE_OBJ ? "acima do corte" : "abaixo do corte de 30", ult !== null && ult < CORTE_OBJ),
      kpi("Média dos 3 últimos", media3 === null ? "—" : n1.format(media3), "objetiva /60"),
      kpi("Melhor", melhor === null ? "—" : `${melhor}/60`, ""),
      kpi("Simulados feitos", String(lista.length), ""),
    ]));

    if (totais.length >= 2) alvo.appendChild(cartao("Evolução da objetiva", "A linha tracejada é o corte de 30 pontos.", [grafico(totais)]));

    const corpo = el("div", { class: "tabela-wrap" });
    const tb = el("table", { class: "tb" }, [
      el("thead", {}, [el("tr", {}, [
        el("th", { texto: "Data" }), el("th", { texto: "Simulado" }),
        ...BLOCOS.map(([, r, m]) => el("th", { class: "cen", texto: `${r} /${m}` })),
        el("th", { class: "cen", texto: "Total /60" }), el("th", { class: "cen", texto: "Redação /40" }),
        el("th", { texto: "Situação" }), el("th"),
      ])]),
    ]);
    const tbody = el("tbody");
    lista.forEach((s, idx) => tbody.appendChild(linha(s, idx)));
    tb.appendChild(tbody);
    corpo.appendChild(tb);

    alvo.appendChild(cartao("Meus simulados", "Digite os acertos de cada bloco; o total e a situação se calculam sozinhos.",
      [lista.length ? corpo : el("div", { class: "vazio" }, [el("span", { class: "vazio__ic", texto: "📝" }), "Nenhum simulado ainda."])],
      [el("button", { class: "btn btn--primario btn--peq", type: "button", onclick: () => {
        mudar((e) => { e.simulados.push({ id: novoId(), data: iso(HOJE()), nome: `Simulado ${e.simulados.length + 1}`, pt: "", mat: "", cg: "", info: "", adm: "", red: "" }); });
        pintar();
      }, texto: "＋ Novo simulado" })], true));
  }

  function linha(s, idx) {
    const tot = el("td", { class: "cen" });
    const sit = el("td");
    const atualiza = () => {
      const t = totalObjetiva(s);
      tot.textContent = t === null ? "—" : String(t);
      sit.innerHTML = "";
      const r = num(s.red);
      if (t !== null) sit.appendChild(chip(t >= CORTE_OBJ ? "Obj. habilitado" : "Obj. abaixo de 30", t >= CORTE_OBJ ? "ok" : "bad"));
      if (r !== null) sit.appendChild(el("span", { estilo: { marginLeft: "4px" } }, [chip(r >= CORTE_RED ? "Red. habilitada" : "Red. abaixo de 20", r >= CORTE_RED ? "ok" : "bad")]));
    };
    const grava = (campo) => (v) => { mudar((e) => { e.simulados[idx][campo] = v; }); s[campo] = v; atualiza(); };
    const cel = (campo, max) => el("td", { class: "cen" }, [campoEditavel({ valor: s[campo], tipo: "number", largura: "mini", ao: grava(campo), placeholder: `0–${max}`, passo: "1" })]);
    atualiza();
    return el("tr", {}, [
      el("td", {}, [el("input", { type: "date", value: s.data, onchange: (e) => grava("data")(e.target.value) })]),
      el("td", {}, [campoEditavel({ valor: s.nome, ao: grava("nome") })]),
      ...BLOCOS.map(([k, , m]) => cel(k, m)),
      tot, cel("red", 40), sit,
      el("td", {}, [el("button", { class: "btn btn--peq btn--fantasma", type: "button", "aria-label": "Excluir simulado",
        onclick: () => { if (confirm("Excluir este simulado?")) { mudar((e) => { e.simulados.splice(idx, 1); }); pintar(); } }, texto: "🗑" })]),
    ]);
  }

  pintar();
  return frag;
}

function kpi(rot, val, meta, alerta = false) {
  return el("div", { class: `kpi__item ${alerta ? "kpi__item--alerta" : ""}` }, [
    el("div", { class: "kpi__rot", texto: rot }), el("div", { class: "kpi__val", texto: val }), el("div", { class: "kpi__meta", texto: meta }),
  ]);
}

function grafico(pontos) {
  const W = 640, H = 150, P = 24;
  const x = (i) => P + (i * (W - 2 * P)) / Math.max(1, pontos.length - 1);
  const y = (v) => H - P - (v / 60) * (H - 2 * P);
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Evolução da nota da objetiva nos simulados");
  svg.style.width = "100%"; svg.style.maxHeight = "190px";
  const add = (tag, attrs) => { const n = document.createElementNS(ns, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); svg.appendChild(n); return n; };
  add("line", { x1: P, x2: W - P, y1: y(CORTE_OBJ), y2: y(CORTE_OBJ), stroke: "var(--bad-fg)", "stroke-dasharray": "5 4", "stroke-width": 1.5 });
  add("text", { x: W - P, y: y(CORTE_OBJ) - 4, "text-anchor": "end", "font-size": 11, fill: "var(--bad-fg)" }).textContent = "corte 30";
  add("polyline", { points: pontos.map((v, i) => `${x(i)},${y(v)}`).join(" "), fill: "none", stroke: "var(--pri)", "stroke-width": 2.5 });
  pontos.forEach((v, i) => {
    add("circle", { cx: x(i), cy: y(v), r: 4, fill: "var(--pri)" });
    add("text", { x: x(i), y: y(v) - 8, "text-anchor": "middle", "font-size": 11, fill: "var(--ink-2)" }).textContent = String(v);
  });
  return svg;
}
