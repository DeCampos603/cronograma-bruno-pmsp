/* Tela CONTEÚDO — o Anexo B do edital, tópico a tópico, com status, confiança e acerto. */

import { el, cartao, chip, barraProgresso, campoEditavel, fCurta, iso, HOJE, inicioDaSemana } from "../ui.js";
import { estado, mudar, topico, CONCLUIDOS } from "../store.js";

const STATUS = ["", "Estudando", "Concluído", "Revisado"];
const ROTULO_STATUS = { "": "Não iniciado" };

const filtro = { materia: "", status: "", busca: "", soPendentes: false };

export function viewConteudo(d) {
  const frag = document.createDocumentFragment();
  const alvo = el("div");

  const selMat = el("select", { "aria-label": "Matéria", onchange: (e) => { filtro.materia = e.target.value; pintar(); } }, [
    el("option", { value: "", texto: "Todas as matérias" }),
    ...d.ordem.filter((m) => d.topicos.some((t) => t.materia === m)).map((m) => el("option", { value: m, texto: d.materias[m].nome, selected: filtro.materia === m })),
  ]);
  const selSt = el("select", { "aria-label": "Situação", onchange: (e) => { filtro.status = e.target.value; pintar(); } }, [
    el("option", { value: "", texto: "Qualquer situação" }),
    ...STATUS.map((s) => el("option", { value: s || "__vazio", texto: ROTULO_STATUS[s] || s, selected: filtro.status === (s || "__vazio") })),
  ]);
  const busca = el("input", { type: "text", placeholder: "Buscar tópico…", value: filtro.busca, "aria-label": "Buscar",
    oninput: (e) => { filtro.busca = e.target.value; pintar(); } });

  frag.appendChild(el("div", { class: "filtros", estilo: { marginBottom: "14px" } }, [selMat, selSt, busca]));
  frag.appendChild(alvo);

  function passa(t) {
    if (filtro.materia && t.materia !== filtro.materia) return false;
    const st = topico(t.id).status;
    if (filtro.status === "__vazio" && st) return false;
    if (filtro.status && filtro.status !== "__vazio" && st !== filtro.status) return false;
    if (filtro.busca && !(t.topico + " " + t.unidade).toLowerCase().includes(filtro.busca.toLowerCase())) return false;
    return true;
  }

  function pintar() {
    alvo.innerHTML = "";
    let algum = false;
    for (const m of d.ordem) {
      const todos = d.topicos.filter((t) => t.materia === m);
      if (!todos.length) continue;
      const visiveis = todos.filter(passa);
      if (!visiveis.length) continue;
      algum = true;
      alvo.appendChild(blocoMateria(d, m, todos, visiveis));
    }
    if (!algum) alvo.appendChild(el("div", { class: "vazio" }, [el("span", { class: "vazio__ic", texto: "🔍" }), "Nenhum tópico com esse filtro."]));
  }
  pintar();
  return frag;
}

function blocoMateria(d, m, todos, visiveis) {
  const info = d.materias[m];
  const contarFeitos = () => todos.filter((t) => CONCLUIDOS.includes(topico(t.id).status)).length;
  const barraBox = el("div", { estilo: { minWidth: "160px", flex: "1", maxWidth: "260px" } });
  const contagem = el("span", { class: "chip" });
  const atualizaCab = () => {
    const f = contarFeitos();
    barraBox.innerHTML = "";
    barraBox.appendChild(barraProgresso(todos.length ? f / todos.length : 0, info.cor));
    contagem.textContent = `${f}/${todos.length}`;
  };

  const cab = el("div", { class: "card__cab" }, [
    el("div", { class: "mat-cab", estilo: { flex: "1" } }, [
      el("span", { class: "cor", estilo: {} }),
      el("h2", { texto: info.nome }),
      contagem,
      info.questoes ? chip(`${info.questoes} questões na prova`, "warn") : null,
    ]),
    barraBox,
  ]);
  cab.querySelector(".cor").style.setProperty("--c", info.cor);
  atualizaCab();

  const corpo = el("div");
  corpo.appendChild(el("div", { class: "top-lin top-lin--cab" }, [
    el("span", { texto: "Tópico" }), el("span", { texto: "Situação" }),
    el("span", { texto: "Confiança 1–5" }), el("span", { texto: "% acerto" }), el("span", { texto: "Anotação" }),
  ]));

  let unidadeAnt = null;
  for (const t of visiveis) {
    if (t.unidade !== unidadeAnt) {
      unidadeAnt = t.unidade;
      corpo.appendChild(el("div", { class: "top-lin top-lin--cab", estilo: { display: "block", fontWeight: 650 }, texto: t.unidade }));
    }
    const cur = topico(t.id);
    const grava = (campo) => (v) => {
      mudar((s) => { s.topicos[t.id] = { ...topico(t.id), [campo]: v }; });
      atualizaCab();
    };
    corpo.appendChild(el("div", { class: "top-lin" }, [
      el("div", {}, [t.topico, el("small", { texto: t.sem ? `1ª passagem prevista: semana ${t.sem}` : "" })]),
      el("select", { "aria-label": "Situação", onchange: (e) => {
        const v = e.target.value;
        mudar((s) => {
          const atual = topico(t.id);
          s.topicos[t.id] = { ...atual, status: v, dataEstudo: v && !atual.dataEstudo ? iso(HOJE()) : atual.dataEstudo };
        });
        atualizaCab();
      } }, STATUS.map((s) => el("option", { value: s, texto: ROTULO_STATUS[s] || s, selected: cur.status === s }))),
      campoEditavel({ valor: cur.confianca, tipo: "number", ao: grava("confianca"), placeholder: "1–5", passo: "1" }),
      campoEditavel({ valor: cur.acerto, tipo: "number", ao: grava("acerto"), placeholder: "%", passo: "1" }),
      campoEditavel({ valor: cur.obs, ao: grava("obs"), placeholder: "…" }),
    ]));
  }
  return el("section", { class: "card" }, [cab, corpo]);
}
