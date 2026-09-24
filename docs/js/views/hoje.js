/* Tela HOJE — o bloco de agora em destaque, o foco por matéria e o checklist do dia. */

import { el, iso, HOJE, fExtenso, fData, dias, cartao, chip, segundaDe, indiceDia, agoraMin,
         numeroSemana, toast, deIso, fCurta } from "../ui.js";
import { estado, mudar, gradeDaSemana, topico, CONCLUIDOS } from "../store.js";
import { corDe, faixa, doDia } from "../grade-util.js";

const capitalizar = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function viewHoje(d) {
  const agora = HOJE();
  const hojeIso = iso(agora);
  const di = indiceDia(agora);
  const min = agoraMin(agora);
  const marcados = estado.dia[hojeIso] || {};
  const totalSem = d.concurso.semanas;

  const frag = document.createDocumentFragment();

  /* ---- cabeçalho do dia ---- */
  const nBruto = Math.floor((agora - deIso(estado.datas.inicio)) / (7 * 86400000)) + 1;
  const nSem = numeroSemana(estado.datas.inicio, agora, totalSem);
  const fase = d.fases.find((f) => nSem >= f.semanas[0] && nSem <= f.semanas[1]);
  const diasProva = dias(estado.datas.prova, agora);
  const antes = nBruto < 1;
  const depois = diasProva !== null && diasProva < 0;

  frag.appendChild(el("section", { class: "card" }, [
    el("div", { class: "card__corpo" }, [
      el("div", { estilo: { display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" } }, [
        el("h2", { estilo: { fontSize: "17px" }, texto: capitalizar(fExtenso(agora)) }),
        antes ? chip("O plano começa em " + fData(estado.datas.inicio), "warn")
              : depois ? chip("Prova realizada", "ok")
              : chip(`Semana ${nSem} de ${totalSem}`),
        !antes && !depois && fase ? chip(fase.nome) : null,
      ]),
      el("div", { class: "grade-cards", estilo: { marginTop: "16px" } }, [contador(diasProva)]),
    ]),
  ]));

  /* ---- agenda de hoje (a grade em vigor nesta semana) ---- */
  const { lista } = gradeDaSemana(segundaDe(agora));
  const doDiaLista = doDia(lista, di);
  const marcavel = (e) => d.tiposMarcaveis.includes(e.tipo);

  /* ---- cursinho: procurar a matéria/tópico que está estudando e marcar ---- */
  const materiasHoje = [...new Set(doDiaLista.map((e) => e.materia).filter((m) => m && d.topicos.some((t) => t.materia === m)))];
  frag.appendChild(painelCursinho(d, materiasHoje, hojeIso));

  /* ---- agenda ---- */
  const feitosDoDia = doDiaLista.filter(marcavel);
  const resumo = el("div", { estilo: { fontSize: "12.5px", color: "var(--ink-2)" } });
  const atualizaResumo = () => {
    const m = estado.dia[hojeIso] || {};
    resumo.textContent = `${feitosDoDia.filter((e) => m[e.id]).length} de ${feitosDoDia.length} blocos concluídos hoje`;
  };
  atualizaResumo();

  const agenda = el("div", { class: "agenda" });
  for (const e of doDiaLista) {
    const f = faixa(e);
    const ehAgora = min >= f.ini && min < f.fim;
    const passou = min >= f.fim;
    const feito = Boolean(marcados[e.id]);
    const bloco = el("div", {
      class: `bloco ${ehAgora ? "bloco--agora" : ""} ${passou && !ehAgora ? "bloco--passou" : ""} ${feito ? "bloco--feito" : ""}`,
    }, [
      el("div", { class: "bloco__h", texto: `${e.ini}–${e.fim}` }),
      el("div", { class: "bloco__txt" }, [
        el("span", { texto: e.titulo }),
        ehAgora ? el("span", { class: "selo-agora", texto: "AGORA" }) : null,
        el("div", { class: "bloco__meta", texto: [d.tipos[e.tipo]?.rotulo, e.materia ? d.materias[e.materia]?.nome : "", e.obs].filter(Boolean).join(" · ") }),
      ]),
      marcavel(e) ? el("label", { class: "bloco__chk" }, [el("input", {
        type: "checkbox", checked: feito, "aria-label": "concluído",
        onchange: (ev) => {
          const v = ev.target.checked;
          mudar((s) => {
            s.dia[hojeIso] = s.dia[hojeIso] || {};
            if (v) s.dia[hojeIso][e.id] = true; else delete s.dia[hojeIso][e.id];
          });
          bloco.classList.toggle("bloco--feito", v);
          atualizaResumo();
        },
      })]) : null,
    ]);
    bloco.style.setProperty("--c", corDe(e, d));
    agenda.appendChild(bloco);
  }

  frag.appendChild(cartao("Sua agenda de hoje", null, [
    doDiaLista.length
      ? el("div", {}, [resumo, el("div", { estilo: { height: "10px" } }), agenda])
      : el("div", { class: "vazio" }, [el("span", { class: "vazio__ic", texto: "🗓" }), "Nada agendado para hoje. ",
          el("a", { href: "#/grade", texto: "Abrir a grade e criar eventos" })]),
  ], [el("a", { class: "btn btn--peq", href: "#/grade", texto: "✎ Editar grade" })]));

  /* ---- atalhos ---- */
  frag.appendChild(cartao("Registro rápido", "Atalhos para o que você faz todo dia.", [
    el("div", { estilo: { display: "flex", gap: "8px", flexWrap: "wrap" } }, [
      el("a", { class: "btn", href: "#/taf" }, ["🏃 Lançar treino do TAF"]),
      el("a", { class: "btn", href: "#/simulados" }, ["📝 Lançar simulado"]),
      el("a", { class: "btn", href: "#/redacao" }, ["✍ Lançar redação"]),
      el("a", { class: "btn", href: "#/conteudo" }, ["✅ Marcar tópico estudado"]),
      el("a", { class: "btn", href: "#/semanas" }, ["📈 Fechar a semana"]),
    ]),
  ]));

  return frag;
}

function contador(n) {
  const dt = estado.datas.prova;
  return el("div", { class: "contador" }, [
    el("div", { class: "contador__rot", texto: "Prova PM-SP · Aluno-Soldado" }),
    el("div", { class: "contador__n", texto: n === null ? "—" : n < 0 ? "✓" : String(n) }),
    el("div", { class: "contador__u", texto: n === null ? "" : n < 0 ? "prova realizada" : n === 1 ? "dia restante" : "dias restantes" }),
    el("div", { class: "contador__pe", texto: n === null || n < 0 ? fData(dt) : `${Math.max(1, Math.round(n / 7))} semanas · ${fData(dt)} (data estimada)` }),
  ]);
}

/* ------------------------------------------------------------------------------
   Painel do cursinho: lista TODOS os tópicos do edital (o cursinho pode seguir outra
   ordem que o plano), com busca, filtro "matérias de hoje / estudando / todas",
   situação, campo "aula do cursinho" e marcação de concluído.
   ------------------------------------------------------------------------------ */
const STATUS = ["", "Estudando", "Concluído", "Revisado"];
const ROT = { "": "Não iniciado" };
const vis = { escopo: "hoje", busca: "" };   // sobrevive aos re-renders

function painelCursinho(d, materiasHoje, hojeIso) {
  if (!materiasHoje.length && vis.escopo === "hoje") vis.escopo = "todas";
  const semBusca = (t) => (t.topico + " " + t.unidade + " " + d.materias[t.materia].nome + " " + (topico(t.id).aula || "")).toLowerCase();
  const alvo = el("div");

  const seg = el("div", { class: "seg", role: "group" });
  const busca = el("input", { type: "search", placeholder: "Procurar matéria ou tópico da aula…", value: vis.busca,
    "aria-label": "Procurar tópico", oninput: (e) => { vis.busca = e.target.value; pintar(); } });

  function pintarSeg() {
    seg.innerHTML = "";
    for (const [v, r] of [["hoje", "Matérias de hoje"], ["andamento", "Estudando"], ["todas", "Todas"]]) {
      seg.appendChild(el("button", { type: "button", "aria-pressed": String(vis.escopo === v), texto: r,
        onclick: () => { vis.escopo = v; pintarSeg(); pintar(); } }));
    }
  }

  function pintar() {
    alvo.innerHTML = "";
    const q = vis.busca.trim().toLowerCase();
    const lista = d.topicos.filter((t) => {
      if (q) return semBusca(t).includes(q);            // a busca vale para todas as matérias
      if (vis.escopo === "hoje") return materiasHoje.includes(t.materia);
      if (vis.escopo === "andamento") return topico(t.id).status === "Estudando";
      return true;
    });
    if (!lista.length) {
      alvo.appendChild(el("div", { class: "vazio" }, [el("span", { class: "vazio__ic", texto: "🔍" }),
        q ? "Nenhum tópico encontrado. Tente outra palavra."
          : vis.escopo === "andamento" ? "Nenhum tópico marcado como “Estudando”. Marque um abaixo ao começar a aula." : "Nada por aqui."]));
      return;
    }
    for (const m of d.ordem) {
      const doMat = lista.filter((t) => t.materia === m);
      if (!doMat.length) continue;
      alvo.appendChild(grupo(d, m, doMat, hojeIso, Boolean(q) || materiasHoje.includes(m) || vis.escopo === "andamento"));
    }
  }

  pintarSeg(); pintar();
  return cartao("Cursinho: o que você está estudando",
    "Procure a aula do dia, marque “Estudando” ao começar e “Concluído” ao terminar. Vale para qualquer tópico do edital, na ordem que o cursinho seguir.",
    [el("div", { class: "filtros", estilo: { marginBottom: "12px" } }, [seg, busca]), alvo]);
}

function grupo(d, m, doMat, hojeIso, aberto) {
  const info = d.materias[m];
  const todos = d.topicos.filter((t) => t.materia === m);
  const chipN = el("span", { class: "chip" });
  const atualiza = () => { chipN.textContent = `${todos.filter((t) => CONCLUIDOS.includes(topico(t.id).status)).length}/${todos.length} concluídos`; };
  atualiza();
  const det = el("details", { class: "acordeao", open: aberto });
  det.appendChild(el("summary", {}, [
    el("span", { class: "trilho-mat", estilo: { background: info.cor, height: "16px", alignSelf: "center" } }),
    el("span", { texto: info.nome }), chipN,
  ]));
  const corpo = el("div");
  let unidade = null;
  for (const t of doMat) {
    if (t.unidade !== unidade) {
      unidade = t.unidade;
      corpo.appendChild(el("div", { class: "cur-un", texto: unidade }));
    }
    corpo.appendChild(linhaTopico(t, hojeIso, atualiza));
  }
  det.appendChild(corpo);
  return det;
}

function linhaTopico(t, hojeIso, aoMudarStatus) {
  const cur = topico(t.id);
  const classeDe = (st) => `cur-lin cur-lin--${CONCLUIDOS.includes(st) ? "ok" : st === "Estudando" ? "and" : "nao"}`;
  const lin = el("div", { class: classeDe(cur.status) });
  const info = el("small");
  const pintaInfo = () => {
    const c = topico(t.id);
    info.textContent = [
      c.dataEstudo && CONCLUIDOS.includes(c.status) ? `concluído em ${fCurta(c.dataEstudo)}` : "",
      t.sem ? `previsto na semana ${t.sem}` : "",
    ].filter(Boolean).join(" · ");
  };
  pintaInfo();
  const sel = el("select", { "aria-label": "Situação de " + t.topico },
    STATUS.map((s) => el("option", { value: s, texto: ROT[s] || s, selected: cur.status === s })));
  const btn = el("button", { class: "btn btn--peq", type: "button" });
  const pintaBtn = () => {
    const st = topico(t.id).status;
    btn.textContent = CONCLUIDOS.includes(st) ? "✓ Concluído" : "✓ Concluir";
    btn.classList.toggle("btn--primario", !CONCLUIDOS.includes(st));
    lin.className = classeDe(st);
  };
  const gravaStatus = (v) => {
    mudar((s) => {
      const atual = topico(t.id);
      s.topicos[t.id] = { ...atual, status: v, dataEstudo: v ? (atual.dataEstudo || hojeIso) : "" };
    });
    sel.value = v; pintaBtn(); pintaInfo(); aoMudarStatus();
  };
  sel.addEventListener("change", (e) => gravaStatus(e.target.value));
  btn.addEventListener("click", () => gravaStatus(CONCLUIDOS.includes(topico(t.id).status) ? "" : "Concluído"));
  pintaBtn();

  const aula = el("input", { type: "text", value: cur.aula || "", placeholder: "Aula do cursinho / anotação (opcional)", "aria-label": "Aula do cursinho",
    onchange: (e) => mudar((s) => { s.topicos[t.id] = { ...topico(t.id), aula: e.target.value }; }) });

  lin.append(
    el("div", { class: "cur-lin__txt" }, [el("span", { texto: t.topico }), info]),
    el("div", { class: "cur-lin__acoes" }, [sel, btn]),
    el("div", { class: "cur-lin__aula" }, [aula]),
  );
  return lin;
}
