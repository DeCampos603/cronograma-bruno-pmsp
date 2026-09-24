/* Tela TAF — Exame de Aptidão Física (Anexo D). Todos os testes são eliminatórios. */

import { el, cartao, chip, iso, HOJE, campoEditavel } from "../ui.js";
import { estado, mudar, novoId } from "../store.js";

/** "13:05" → 13.0833 · "13,5" → 13.5 · "8,25" → 8.25 · vazio → null */
export function lerTempo(txt, minutos) {
  const s = String(txt ?? "").trim().replace(",", ".");
  if (!s) return null;
  if (minutos && s.includes(":")) {
    const [m, seg] = s.split(":").map(Number);
    return Number.isFinite(m) && Number.isFinite(seg) ? m + seg / 60 : null;
  }
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
}

const fmtMin = (m) => `${Math.floor(m)}'${String(Math.round((m - Math.floor(m)) * 60)).padStart(2, "0")}"`;
const fmtIsf = (t, sexo) => {
  const v = sexo === "F" ? t.isf_f : t.isf_m;
  if (t.id === "c2400") return `até ${fmtMin(v)}`;
  if (t.id === "c50") return `até ${String(v).replace(".", ",")} s`;
  return `${t.sentido === "maior" ? "mínimo " : ""}${v} ${sexo === "F" ? t.un_f : t.un_m}`;
};

/** true = apto, false = inapto, null = sem lançamento */
export function passou(t, bruto, sexo) {
  const v = lerTempo(bruto, t.id === "c2400");
  if (v === null) return null;
  const isf = sexo === "F" ? t.isf_f : t.isf_m;
  return t.sentido === "maior" ? v >= isf : v <= isf;
}

export function viewTaf(d) {
  const frag = document.createDocumentFragment();
  const alvo = el("div");
  const sexo = () => estado.sexo || "M";

  function pintar() {
    alvo.innerHTML = "";
    const sx = sexo();

    alvo.appendChild(cartao("Índice de Suficiência Física (ISF)",
      "É o mínimo em cada teste. Ficar abaixo em qualquer um elimina.", [
        el("div", { class: "filtros", estilo: { marginBottom: "12px" } }, [
          el("span", { estilo: { fontSize: "12.5px", color: "var(--ink-2)" }, texto: "Tabela para:" }),
          el("div", { class: "seg" }, [["M", "Masculino"], ["F", "Feminino"]].map(([v, r]) =>
            el("button", { type: "button", "aria-pressed": String(sx === v), texto: r, onclick: () => { mudar((e) => { e.sexo = v; }); pintar(); } }))),
        ]),
        el("div", { class: "tabela-wrap" }, [el("table", { class: "tb" }, [
          el("thead", {}, [el("tr", {}, [el("th", { texto: "Teste" }), el("th", { texto: "Meta (ISF)" })])]),
          el("tbody", {}, d.taf.testes.map((t) => el("tr", {}, [
            el("td", { texto: sx === "F" ? t.nome_f : t.nome_m }), el("td", {}, [el("b", { texto: fmtIsf(t, sx) })]),
          ]))),
        ])]),
        el("p", { estilo: { fontSize: "12px", color: "var(--ink-2)", margin: "10px 0 0" },
          texto: "Estatura mínima medida no primeiro dia: 160 cm (homem) e 155 cm (mulher). Aquecimento por conta do candidato." }),
      ]));

    const corpo = el("div", { class: "tabela-wrap" });
    const tbody = el("tbody");
    estado.taf.forEach((r, idx) => {
      const sitCel = el("td");
      const celulas = [];
      const atualiza = () => {
        sitCel.innerHTML = "";
        const res = d.taf.testes.map((t) => passou(t, r[t.id], sexo()));
        if (res.every((x) => x === null)) return;
        const reprovados = res.filter((x) => x === false).length;
        const faltam = res.filter((x) => x === null).length;
        sitCel.appendChild(reprovados ? chip(`${reprovados} abaixo do ISF`, "bad") : faltam ? chip(`Apto até aqui · faltam ${faltam}`, "warn") : chip("Apto em todos", "ok"));
        d.taf.testes.forEach((t, i) => { const c = celulas[i]; c.style.background = res[i] === null ? "" : res[i] ? "var(--ok-bg)" : "var(--bad-bg)"; });
      };
      const grava = (c) => (v) => { mudar((e) => { e.taf[idx][c] = v; }); r[c] = v; atualiza(); };
      const tds = d.taf.testes.map((t) => {
        const td = el("td", { class: "cen" }, [campoEditavel({ valor: r[t.id], largura: "mini", ao: grava(t.id), placeholder: t.id === "c2400" ? "mm:ss" : t.id === "c50" ? "s,cc" : "n" })]);
        celulas.push(td);
        return td;
      });
      atualiza();
      tbody.appendChild(el("tr", {}, [
        el("td", {}, [el("input", { type: "date", value: r.data, onchange: (e) => grava("data")(e.target.value) })]),
        ...tds, sitCel,
        el("td", { estilo: { minWidth: "160px" } }, [campoEditavel({ valor: r.obs, ao: grava("obs"), placeholder: "Sensação, local…" })]),
        el("td", {}, [el("button", { class: "btn btn--peq btn--fantasma", type: "button", "aria-label": "Excluir treino",
          onclick: () => { if (confirm("Excluir este registro?")) { mudar((e) => { e.taf.splice(idx, 1); }); pintar(); } }, texto: "🗑" })]),
      ]));
    });
    corpo.appendChild(el("table", { class: "tb" }, [
      el("thead", {}, [el("tr", {}, [el("th", { texto: "Data" }),
        ...d.taf.testes.map((t) => el("th", { class: "cen", texto: t.id === "barra" ? (sx === "F" ? "Isometria (s)" : "Barra (rep)") : t.id === "abd" ? "Abdominal (rep)" : t.id === "c50" ? "50 m (s)" : "2.400 m" })),
        el("th", { texto: "Situação" }), el("th", { texto: "Observação" }), el("th")])]),
      tbody,
    ]));

    alvo.appendChild(cartao("Meus treinos e testes", "Lance os resultados; a célula fica verde quando bate o ISF e vermelha quando não bate.",
      [estado.taf.length ? corpo : el("div", { class: "vazio" }, [el("span", { class: "vazio__ic", texto: "🏃" }), "Nenhum registro ainda."])],
      [el("button", { class: "btn btn--primario btn--peq", type: "button", onclick: () => {
        mudar((e) => { e.taf.push({ id: novoId(), data: iso(HOJE()), barra: "", abd: "", c50: "", c2400: "", obs: "" }); });
        pintar();
      }, texto: "＋ Novo registro" })], true));

    alvo.appendChild(cartao("Regras do teste", "Anexo D e Capítulo IX do edital.", [
      el("ul", { estilo: { margin: 0, paddingLeft: "20px", fontSize: "13.5px", display: "grid", gap: "6px" } }, d.taf.regras.map((x) => el("li", { texto: x }))),
    ]));
  }

  pintar();
  frag.appendChild(alvo);
  return frag;
}
