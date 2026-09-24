/* Tela HOJE — o bloco de agora em destaque, o foco por matéria e o checklist do dia. */

import { el, iso, HOJE, fExtenso, fData, dias, cartao, chip, segundaDe, indiceDia, agoraMin,
         numeroSemana, toast, deIso } from "../ui.js";
import { estado, mudar, gradeDaSemana, topico, CONCLUIDOS } from "../store.js";
import { corDe, faixa, doDia } from "../grade-util.js";
import { render } from "../app.js";

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

  /* ---- foco: próximos tópicos das matérias de hoje ---- */
  const materiasHoje = [...new Set(doDiaLista.map((e) => e.materia).filter((m) => m && d.topicos.some((t) => t.materia === m)))];
  if (materiasHoje.length) {
    frag.appendChild(cartao("O que estudar hoje, em cada matéria",
      "Os próximos tópicos ainda não concluídos, na ordem do plano.", materiasHoje.map((m) => {
        const pend = d.topicos.filter((t) => t.materia === m && !CONCLUIDOS.includes(topico(t.id).status)).slice(0, 3);
        const cor = d.materias[m].cor;
        return el("div", { estilo: { display: "flex", gap: "10px", padding: "9px 0", borderBottom: "1px solid var(--line)" } }, [
          el("span", { class: "trilho-mat", estilo: { background: cor } }),
          el("div", { estilo: { flex: "1", minWidth: "0" } }, [
            el("b", { estilo: { fontSize: "13px", color: cor }, texto: d.materias[m].nome }),
            ...(pend.length ? pend.map((t) => el("div", { estilo: { display: "flex", gap: "8px", alignItems: "center", marginTop: "5px", fontSize: "12.5px" } }, [
              el("span", { estilo: { flex: "1" }, texto: t.topico }),
              el("button", { class: "btn btn--peq", type: "button", title: "Marcar como concluído",
                onclick: () => {
                  mudar((s) => { s.topicos[t.id] = { ...topico(t.id), status: "Concluído", dataEstudo: hojeIso }; });
                  toast("Tópico concluído"); render();
                }, texto: "✓ Concluí" }),
            ])) : [el("div", { estilo: { fontSize: "12.5px", color: "var(--ok-fg)", marginTop: "4px" }, texto: "Todos os tópicos desta matéria estão concluídos. 👏" })]),
          ]),
        ]);
      })));
  }

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
