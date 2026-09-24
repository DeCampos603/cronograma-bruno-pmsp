/* Tela GRADE — a semana inteira, totalmente editável.

   - Toque num bloco para editar (título, dias, horários, tipo, matéria, cor, nota) ou excluir.
   - Toque num espaço vazio para criar um evento naquele dia e horário.
   - "Esta semana" personaliza só a semana exibida; "Padrão" muda o modelo de todas
     as semanas que ainda não foram personalizadas.
   - Sem personalização, vale a grade de partida do plano.json. */

import { el, cartao, chip, iso, HOJE, indiceDia, segundaDe, somarDias, fCurta, deIso,
         hmParaMin, minParaHm, toast } from "../ui.js";
import { estado, gradeDaSemana, editarGrade, restaurarSemana, copiarSemanaParaPadrao,
         copiarSemanaPara, restaurarGradeOriginal, novoId } from "../store.js";
import { corDe, faixa, doDia, empacotar, horasPorMateria, horasPorTipo, fHoras } from "../grade-util.js";
import { render } from "../app.js";

/* estado da tela — sobrevive aos re-renders */
const tela = {
  semIso: null,
  vista: null,       // "semana" | "dia"
  dia: null,
  escopo: "semana",  // "semana" | "padrao"
};

export function viewGrade(d) {
  const hoje = HOJE();
  if (!tela.semIso) tela.semIso = segundaDe(hoje);
  if (!tela.vista) tela.vista = window.innerWidth < 760 ? "dia" : "semana";
  if (tela.dia === null) tela.dia = tela.semIso === segundaDe(hoje) ? indiceDia(hoje) : 0;

  const editandoPadrao = tela.escopo === "padrao";
  const { lista: listaSemana, personalizada } = gradeDaSemana(tela.semIso);
  const lista = editandoPadrao ? (estado.gradePadrao || d.grade) : listaSemana;

  const frag = document.createDocumentFragment();
  const nSem = Math.floor((deIso(tela.semIso) - deIso(estado.datas.inicio)) / (7 * 86400000)) + 1;
  const fimSem = somarDias(tela.semIso, 6);
  const total = d.concurso.semanas;

  /* ------------------------------------------------ barra de controle */
  const titulo = editandoPadrao
    ? "Semana-modelo (padrão)"
    : `${nSem >= 1 && nSem <= total ? `Semana ${nSem} · ` : ""}${fCurta(tela.semIso).slice(0, 5)} a ${fCurta(fimSem).slice(0, 5)}`;

  const seg = (opcoes, atual, ao) => el("div", { class: "seg", role: "group" },
    opcoes.map(([v, r]) => el("button", { type: "button", "aria-pressed": String(atual === v), onclick: () => ao(v), texto: r })));

  const barra = el("div", { class: "gbar" }, [
    editandoPadrao ? null : el("button", { class: "btn btn--peq", type: "button", "aria-label": "Semana anterior",
      onclick: () => { tela.semIso = somarDias(tela.semIso, -7); render(); }, texto: "◀" }),
    el("div", { class: "gbar__titulo", texto: titulo }),
    editandoPadrao ? null : el("button", { class: "btn btn--peq", type: "button", "aria-label": "Próxima semana",
      onclick: () => { tela.semIso = somarDias(tela.semIso, 7); render(); }, texto: "▶" }),
    editandoPadrao ? null : el("button", { class: "btn btn--peq", type: "button",
      onclick: () => { tela.semIso = segundaDe(HOJE()); tela.dia = indiceDia(); render(); }, texto: "Hoje" }),
    el("div", { class: "gbar__esp" }),
    seg([["semana", "Semana"], ["dia", "Dia"]], tela.vista, (v) => { tela.vista = v; render(); }),
    el("button", { class: "btn btn--primario", type: "button", onclick: () => abrirEditor(d, null, tela.dia) },
      [el("span", { class: "btn__ic", texto: "＋" }), "Novo evento"]),
  ]);

  const modoBarra = el("div", { class: "gbar" }, [
    el("span", { style: "font-size:12.5px;color:var(--ink-2)", texto: "Editando:" }),
    seg([["semana", "Só esta semana"], ["padrao", "Padrão de todas as semanas"]], tela.escopo,
      (v) => { tela.escopo = v; render(); }),
    editandoPadrao ? null : (personalizada
      ? chip("Semana personalizada", "warn")
      : chip("Usando o padrão", "ok")),
  ]);

  /* ------------------------------------------------ ações auxiliares */
  const acoes = el("div", { class: "gbar" });
  if (!editandoPadrao) {
    acoes.appendChild(el("button", { class: "btn btn--peq", type: "button",
      onclick: () => { copiarSemanaPara(tela.semIso, somarDias(tela.semIso, 7)); toast("Grade copiada para a próxima semana"); },
      texto: "Copiar para a próxima semana" }));
    if (personalizada) {
      acoes.appendChild(el("button", { class: "btn btn--peq", type: "button",
        onclick: () => { copiarSemanaParaPadrao(tela.semIso); toast("Esta semana virou o padrão"); render(); },
        texto: "Usar esta semana como padrão" }));
      acoes.appendChild(el("button", { class: "btn btn--peq btn--perigo", type: "button",
        onclick: () => { if (confirm("Descartar as mudanças desta semana e voltar ao padrão?")) { restaurarSemana(tela.semIso); toast("Voltou ao padrão"); render(); } },
        texto: "Voltar ao padrão" }));
    }
  } else {
    acoes.appendChild(el("button", { class: "btn btn--peq btn--perigo", type: "button",
      onclick: () => { if (confirm("Restaurar a grade original de fábrica? Isso apaga o padrão e TODAS as semanas personalizadas.")) { restaurarGradeOriginal(); toast("Grade original restaurada"); render(); } },
      texto: "Restaurar grade original de fábrica" }));
  }

  frag.appendChild(el("section", { class: "card" }, [
    el("div", { class: "card__corpo" }, [
      barra, modoBarra,
      editandoPadrao
        ? el("div", { class: "aviso aviso--warn" }, [el("div", {}, [el("b", { texto: "Você está editando o padrão." }),
            "As mudanças valem para todas as semanas que não foram personalizadas."])])
        : null,
      tela.vista === "dia" ? diasChips(d) : null,
      el("div", { class: "tabela-wrap" }, [linhaDoTempo(d, lista, editandoPadrao)]),
      el("p", { style: "font-size:12px;color:var(--ink-3);margin:10px 0 0", texto: "Toque num bloco para editar; toque num espaço vazio para criar um evento ali." }),
      acoes,
    ]),
  ]));

  frag.appendChild(cargaHoraria(d, lista));
  return frag;
}

/* ------------------------------------------------------------ seletor de dia */
function diasChips(d) {
  const hojeIso = iso(HOJE());
  return el("div", { class: "gdias" }, d.dias.map((nome, i) => el("button", {
    type: "button", "aria-pressed": String(tela.dia === i),
    class: tela.escopo === "semana" && somarDias(tela.semIso, i) === hojeIso ? "hoje" : "",
    onclick: () => { tela.dia = i; render(); },
    texto: nome.slice(0, 3) + (tela.escopo === "semana" ? " " + fCurta(somarDias(tela.semIso, i)).slice(0, 5) : ""),
  })));
}

/* -------------------------------------------------------------- linha do tempo */
function linhaDoTempo(d, lista, editandoPadrao) {
  const diaUnico = tela.vista === "dia";
  const dias = diaUnico ? [tela.dia] : [0, 1, 2, 3, 4, 5, 6];
  const HPX = diaUnico ? 56 : 46;

  let ini = 6 * 60, fim = 23 * 60;
  for (const e of lista) { const f = faixa(e); ini = Math.min(ini, f.ini); fim = Math.max(fim, f.fim); }
  ini = Math.floor(ini / 60) * 60;
  fim = Math.ceil(fim / 60) * 60;
  const altura = ((fim - ini) / 60) * HPX;
  const hojeIso = iso(HOJE());
  const agora = HOJE();
  const agoraMin = agora.getHours() * 60 + agora.getMinutes();

  const raiz = el("div", { class: `tl ${diaUnico ? "tl--dia" : "tl--larga"}` });
  raiz.style.setProperty("--cols", String(dias.length));
  raiz.style.setProperty("--hpx", HPX + "px");

  /* cabeçalho */
  raiz.appendChild(el("div", { class: "tl__cab", texto: "" }));
  for (const i of dias) {
    const dataIso = somarDias(tela.semIso, i);
    const ehHoje = !editandoPadrao && dataIso === hojeIso;
    raiz.appendChild(el("div", { class: `tl__cab ${ehHoje ? "tl__cab--hoje" : ""}` }, [
      d.dias[i], editandoPadrao ? null : el("small", { texto: fCurta(dataIso).slice(0, 5) }),
    ]));
  }

  /* régua de horas */
  const horas = el("div", { class: "tl__horas", estilo: { height: altura + "px" } });
  for (let m = ini; m <= fim; m += 60) {
    if (m === ini) continue;
    horas.appendChild(el("span", { class: "tl__hora", estilo: { top: ((m - ini) / 60) * HPX + "px" }, texto: minParaHm(m === 1440 ? 0 : m) }));
  }
  raiz.appendChild(horas);

  /* colunas dos dias */
  for (const i of dias) {
    const dataIso = somarDias(tela.semIso, i);
    const ehHoje = !editandoPadrao && dataIso === hojeIso;
    const feitos = estado.dia[dataIso] || {};
    const col = el("div", {
      class: `tl__col ${ehHoje ? "tl__col--hoje" : ""}`,
      estilo: { height: altura + "px" },
      onclick: (e) => {
        if (e.target !== col) return;
        const y = e.clientY - col.getBoundingClientRect().top;
        const m = Math.max(ini, Math.min(fim - 30, Math.round((ini + (y / HPX) * 60) / 15) * 15));
        abrirEditor(d, null, i, m);
      },
    });
    col.style.setProperty("--hpx", HPX + "px");

    for (const x of empacotar(doDia(lista, i))) {
      const e = x.e;
      const top = ((x.ini - ini) / 60) * HPX;
      const alt = Math.max(20, ((x.fim - x.ini) / 60) * HPX - 2);
      const b = el("button", {
        type: "button",
        class: `ev ${feitos[e.id] ? "ev--feito" : ""}`,
        title: `${e.titulo}\n${e.ini}–${e.fim}${e.obs ? "\n" + e.obs : ""}`,
        estilo: {
          top: top + "px", height: alt + "px",
          left: `calc(${(x.col / x.cols) * 100}% + 1px)`, width: `calc(${100 / x.cols}% - 2px)`,
        },
        onclick: () => abrirEditor(d, e, i),
      }, [el("b", { texto: e.titulo }), alt >= 34 ? el("span", { texto: `${e.ini}–${e.fim}` }) : null]);
      b.style.setProperty("--c", corDe(e, d));
      col.appendChild(b);
    }

    if (ehHoje && agoraMin >= ini && agoraMin <= fim) {
      col.appendChild(el("div", { class: "tl__agora", estilo: { top: ((agoraMin - ini) / 60) * HPX + "px" } }));
    }
    raiz.appendChild(col);
  }
  return raiz;
}

/* -------------------------------------------------------------- carga horária */
function cargaHoraria(d, lista) {
  const porMat = horasPorMateria(lista);
  const porTipo = horasPorTipo(lista);
  const linhasMat = d.ordem.filter((m) => porMat[m]).map((m) => el("tr", {}, [
    el("td", { estilo: { width: "6px", padding: "0", background: d.materias[m].cor } }),
    el("td", {}, [el("b", { texto: d.materias[m].nome })]),
    el("td", { class: "num", texto: fHoras(porMat[m]) }),
  ]));
  const linhasTipo = Object.keys(d.tipos).filter((t) => porTipo[t]).map((t) => el("tr", {}, [
    el("td", { estilo: { width: "6px", padding: "0", background: d.tipos[t].cor } }),
    el("td", { texto: d.tipos[t].rotulo }),
    el("td", { class: "num", texto: fHoras(porTipo[t]) }),
  ]));
  const tabela = (cab, linhas) => el("div", { class: "tabela-wrap" }, [el("table", { class: "tb" }, [
    el("thead", {}, [el("tr", {}, [el("th"), el("th", { texto: cab }), el("th", { class: "num", texto: "Horas/semana" })])]),
    el("tbody", {}, linhas.length ? linhas : [el("tr", {}, [el("td"), el("td", { texto: "Nenhum evento." }), el("td")])]),
  ])]);
  return cartao("Carga horária desta grade", "Recalculada a cada edição, a partir dos eventos da semana exibida.", [
    el("div", { class: "grade-cards" }, [tabela("Por matéria", linhasMat), tabela("Por tipo de evento", linhasTipo)]),
  ]);
}

/* ---------------------------------------------------------------------- editor */
function abrirEditor(d, evento, diaInicial, minInicial) {
  const novo = !evento;
  const base = evento || {
    id: novoId(), dia: diaInicial ?? 0,
    ini: minParaHm(minInicial ?? 19 * 60), fim: minParaHm((minInicial ?? 19 * 60) + 60),
    titulo: "", tipo: "estudo", materia: "", obs: "",
  };
  const escopo = tela.escopo;

  const dlg = el("dialog", { class: "modal", "aria-labelledby": "edTitulo" });
  const f = {
    titulo: el("input", { type: "text", value: base.titulo, placeholder: "Ex.: Matemática — porcentagem", maxlength: "80" }),
    tipo: el("select", {}, Object.entries(d.tipos).map(([k, t]) => el("option", { value: k, texto: t.rotulo, selected: base.tipo === k }))),
    materia: el("select", {}, [
      el("option", { value: "", texto: "— nenhuma —", selected: !base.materia }),
      ...d.ordem.map((m) => el("option", { value: m, texto: d.materias[m].nome, selected: base.materia === m })),
    ]),
    ini: el("input", { type: "time", value: base.ini, step: "300" }),
    fim: el("input", { type: "time", value: base.fim, step: "300" }),
    cor: el("input", { type: "color", value: /^#[0-9a-f]{6}$/i.test(base.cor || "") ? base.cor : "#1d4e9e" }),
    obs: el("textarea", { placeholder: "Opcional: o que fazer neste bloco, material, meta…" }),
  };
  f.obs.value = base.obs || "";
  let usaCor = Boolean(base.cor);
  const corInfo = el("span", { style: "font-size:12px;color:var(--ink-2)" });
  const pintaCor = () => { corInfo.textContent = usaCor ? "cor escolhida" : "automática (pela matéria/tipo)"; f.cor.style.opacity = usaCor ? "1" : ".4"; };
  f.cor.addEventListener("input", () => { usaCor = true; pintaCor(); });
  pintaCor();

  const diasSel = new Set([base.dia]);
  const chkDias = el("div", { class: "dias-chk" }, d.dias.map((nome, i) => {
    const inp = el("input", { type: "checkbox", checked: diasSel.has(i),
      onchange: (e) => { if (e.target.checked) diasSel.add(i); else diasSel.delete(i); } });
    return el("label", {}, [inp, nome.slice(0, 3)]);
  }));

  const erro = el("div", { style: "color:var(--bad-fg);font-size:12.5px;min-height:18px" });

  function salvar() {
    const titulo = f.titulo.value.trim();
    const ini = hmParaMin(f.ini.value), fim = hmParaMin(f.fim.value);
    if (!titulo) { erro.textContent = "Dê um nome ao evento."; f.titulo.focus(); return; }
    if (ini === null || fim === null) { erro.textContent = "Preencha início e fim."; return; }
    if (ini === fim) { erro.textContent = "Início e fim não podem ser iguais."; return; }
    if (!diasSel.size) { erro.textContent = "Marque ao menos um dia."; return; }

    const dias = [...diasSel].sort((a, b) => a - b);
    const campos = { ini: f.ini.value, fim: f.fim.value, titulo, tipo: f.tipo.value,
                     materia: f.materia.value, obs: f.obs.value.trim() };
    if (usaCor) campos.cor = f.cor.value;

    editarGrade(escopo, tela.semIso, (arr) => {
      if (!novo) {
        const idx = arr.findIndex((x) => x.id === base.id);
        if (idx >= 0) arr.splice(idx, 1);
      }
      dias.forEach((dia, k) => {
        // o primeiro dia mantém o id (preserva "feito" marcado); os demais são cópias
        arr.push({ id: k === 0 ? base.id : novoId(), dia, ...campos });
      });
    });
    if (escopo === "semana") toast(novo ? "Evento criado nesta semana" : "Semana atualizada");
    else toast(novo ? "Evento criado no padrão" : "Padrão atualizado");
    dlg.close();
  }

  dlg.appendChild(el("form", { method: "dialog", onsubmit: (e) => { e.preventDefault(); salvar(); } }, [
    el("div", { class: "modal__cab" }, [
      el("h2", { id: "edTitulo", texto: novo ? "Novo evento" : "Editar evento" }),
      el("button", { class: "btn btn--fantasma btn--peq", type: "button", "aria-label": "Fechar", onclick: () => dlg.close(), texto: "✕" }),
    ]),
    el("div", { class: "modal__corpo" }, [
      el("div", { class: "aviso aviso--info", style: "margin-bottom:12px" },
        [el("div", {}, [escopo === "semana" ? "Vale só para a semana de " + fCurta(tela.semIso).slice(0, 5) + "." : "Vale para o padrão de todas as semanas."])]),
      el("label", { class: "campo" }, [el("span", { texto: "Título" }), f.titulo]),
      el("div", { class: "linha2" }, [
        el("label", { class: "campo" }, [el("span", { texto: "Início" }), f.ini]),
        el("label", { class: "campo" }, [el("span", { texto: "Fim" }), f.fim]),
      ]),
      el("div", { class: "campo" }, [el("span", { texto: novo ? "Dias" : "Dias (marcar outros dias cria cópias)" }), chkDias]),
      el("div", { class: "linha2" }, [
        el("label", { class: "campo" }, [el("span", { texto: "Tipo" }), f.tipo]),
        el("label", { class: "campo" }, [el("span", { texto: "Matéria (colore e conta horas)" }), f.materia]),
      ]),
      el("div", { class: "campo" }, [el("span", { texto: "Cor" }), el("div", { class: "cores-rapidas" }, [
        f.cor, corInfo,
        el("button", { class: "btn btn--peq", type: "button", onclick: () => { usaCor = false; pintaCor(); }, texto: "Automática" }),
      ])]),
      el("label", { class: "campo" }, [el("span", { texto: "Observação" }), f.obs]),
      el("p", { style: "font-size:11.5px;color:var(--ink-3);margin:0", texto: "Fim antes do início (ex.: 23:00 a 05:30) vale como \"até a meia-noite\" naquele dia; crie outro evento para a madrugada." }),
      erro,
    ]),
    el("div", { class: "modal__rod" }, [
      novo ? null : el("button", { class: "btn btn--perigo", type: "button", onclick: () => {
        if (!confirm(`Excluir "${base.titulo}"?`)) return;
        editarGrade(escopo, tela.semIso, (arr) => { const i = arr.findIndex((x) => x.id === base.id); if (i >= 0) arr.splice(i, 1); });
        toast("Evento excluído"); dlg.close();
      }, texto: "Excluir" }),
      el("div", { class: "esp" }),
      el("button", { class: "btn", type: "button", onclick: () => dlg.close(), texto: "Cancelar" }),
      el("button", { class: "btn btn--primario", type: "submit", texto: "Salvar" }),
    ]),
  ]));

  dlg.addEventListener("close", () => { dlg.remove(); render(); });
  document.body.appendChild(dlg);
  dlg.showModal();
  f.titulo.focus();
}
