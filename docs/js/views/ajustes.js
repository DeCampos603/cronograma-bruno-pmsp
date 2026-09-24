/* Tela AJUSTES — datas-alvo, backup, sincronização e legenda. */

import { el, cartao, toast, deIso, indiceDia } from "../ui.js";
import { estado, mudar, sync, exportarJSON, importarJSON, apagarTudo, entrar, sair, restaurarGradeOriginal } from "../store.js";
import { supabaseLigado, APP } from "../config.js";
import { render } from "../app.js";

export function viewAjustes(d) {
  const frag = document.createDocumentFragment();

  /* ---- onde ficam os dados ---- */
  const nuvem = sync.modo === "nuvem";
  frag.appendChild(cartao("Onde ficam os seus dados", null, [
    el("div", { class: `aviso ${nuvem ? "aviso--ok" : "aviso--info"}`, estilo: { marginBottom: 0 } }, [
      el("div", {}, [
        el("b", { texto: nuvem ? `Sincronizado na nuvem (${sync.email})` : "Salvo neste aparelho" }),
        nuvem
          ? "Tudo que você marcar ou editar aparece também no outro aparelho em que entrar com a mesma conta."
          : "Progresso e grade editada são gravados automaticamente no navegador deste aparelho — funciona offline e sem cadastro. "
            + "Mas ficam só aqui: se limpar os dados do navegador ou trocar de celular, somem. Baixe um backup de vez em quando, ou ligue a sincronização abaixo.",
      ]),
    ]),
    el("div", { estilo: { display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "14px" } }, [
      el("button", { class: "btn btn--primario", type: "button", onclick: () => { exportarJSON(); toast("Backup baixado"); } },
        [el("span", { class: "btn__ic", texto: "⭳" }), "Baixar backup"]),
      el("label", { class: "btn", estilo: { cursor: "pointer" } }, [
        el("span", { class: "btn__ic", texto: "⭱" }), "Restaurar backup",
        el("input", { type: "file", accept: "application/json,.json", estilo: { display: "none" },
          onchange: async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            try { await importarJSON(f); toast("Backup restaurado"); render(); }
            catch (err) { alert("Não deu para restaurar: " + err.message); }
            e.target.value = "";
          } }),
      ]),
      el("button", { class: "btn btn--perigo", type: "button",
        onclick: () => {
          if (confirm("Apagar TODO o progresso e a grade editada deste aparelho? Baixe um backup antes se tiver dúvida.")) {
            apagarTudo(); toast("Tudo apagado"); render();
          }
        } }, ["Apagar tudo"]),
    ]),
    el("p", { estilo: { fontSize: "11.5px", color: "var(--ink-3)", marginTop: "10px", marginBottom: 0 },
      texto: `Última alteração: ${estado.atualizado_em ? new Date(estado.atualizado_em).toLocaleString("pt-BR") : "nenhuma ainda"}` }),
  ]));

  /* ---- datas-alvo ---- */
  const campoData = (rot, chave, dica) => el("label", { class: "campo" }, [
    el("span", { texto: rot }),
    el("input", { type: "date", value: estado.datas[chave] || "",
      onchange: (e) => {
        const v = e.target.value;
        if (chave === "inicio" && v && indiceDia(deIso(v)) !== 0) {
          toast("Dica: o plano conta semanas de segunda a domingo — prefira uma segunda-feira.");
        }
        mudar((s) => { s.datas[chave] = v; }); toast("Data atualizada"); render();
      } }),
    dica ? el("small", { estilo: { color: "var(--ink-3)", fontSize: "11.5px" }, texto: dica }) : null,
  ]);
  frag.appendChild(cartao("Datas-alvo", "Quando a VUNESP divulgar a data oficial da prova, corrija aqui — contadores e calendário se reajustam.", [
    el("div", { class: "grade-cards" }, [
      campoData("Início do plano (uma segunda-feira)", "inicio", "Semana 1 = a semana que começa neste dia."),
      campoData("Data da prova objetiva e redação", "prova", "Estimada: meados de março/2027."),
    ]),
  ]));

  /* ---- perfil ---- */
  frag.appendChild(cartao("Perfil do candidato", "Define a tabela de metas do TAF.", [
    el("label", { class: "campo", estilo: { maxWidth: "260px" } }, [
      el("span", { texto: "Tabela do TAF" }),
      el("select", { onchange: (e) => { mudar((s) => { s.sexo = e.target.value; }); toast("Tabela atualizada"); } }, [
        el("option", { value: "M", texto: "Masculino", selected: (estado.sexo || "M") === "M" }),
        el("option", { value: "F", texto: "Feminino", selected: estado.sexo === "F" }),
      ]),
    ]),
  ]));

  /* ---- grade ---- */
  frag.appendChild(cartao("Grade semanal", "Editada na tela Grade. Aqui você só volta ao modelo de fábrica.", [
    el("div", { estilo: { display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" } }, [
      el("a", { class: "btn", href: "#/grade" }, ["🗓 Abrir a grade"]),
      el("button", { class: "btn btn--perigo", type: "button", onclick: () => {
        if (confirm("Restaurar a grade original? Apaga o padrão editado e todas as semanas personalizadas.")) { restaurarGradeOriginal(); toast("Grade original restaurada"); }
      } }, ["Restaurar grade original"]),
    ]),
    el("p", { estilo: { fontSize: "12px", color: "var(--ink-3)", margin: "10px 0 0" },
      texto: `${Object.keys(estado.gradeSemana).length} semana(s) personalizada(s) · padrão ${estado.gradePadrao ? "editado" : "de fábrica"}.` }),
  ]));

  /* ---- sincronização ---- */
  const bloco = el("div");
  if (!supabaseLigado()) {
    bloco.appendChild(el("p", { estilo: { fontSize: "13px" } }, [
      "A sincronização entre celular e PC está ", el("b", { texto: "desligada" }),
      ". Para ligar, crie um projeto gratuito no Supabase, rode o SQL de ",
      el("code", { texto: "modelos/supabase/" }), " e preencha ", el("code", { texto: "docs/js/config.js" }),
      ". O passo a passo está no README do projeto.",
    ]));
    bloco.appendChild(el("p", { estilo: { fontSize: "12.5px", color: "var(--ink-2)", margin: 0 },
      texto: "Enquanto isso o site funciona normalmente — só não acompanha entre aparelhos." }));
  } else if (nuvem) {
    bloco.appendChild(el("p", { estilo: { fontSize: "13px" } }, ["Conectado como ", el("b", { texto: sync.email }), "."]));
    bloco.appendChild(el("button", { class: "btn", type: "button", onclick: async () => { await sair(); toast("Você saiu"); render(); } }, ["Sair da conta"]));
  } else {
    const email = el("input", { type: "email", autocomplete: "username", placeholder: "seu@email.com" });
    const senha = el("input", { type: "password", autocomplete: "current-password", placeholder: "sua senha" });
    const erro = el("div", { estilo: { color: "var(--bad-fg)", fontSize: "12.5px", marginTop: "6px" } });
    bloco.appendChild(el("form", {
      onsubmit: async (ev) => {
        ev.preventDefault(); erro.textContent = "";
        try { await entrar(email.value.trim(), senha.value); toast("Conectado"); render(); }
        catch (e) { erro.textContent = "Não consegui entrar: " + (e.message || e); }
      },
    }, [
      el("label", { class: "campo" }, [el("span", { texto: "E-mail" }), email]),
      el("label", { class: "campo" }, [el("span", { texto: "Senha" }), senha]),
      el("button", { class: "btn btn--primario", type: "submit" }, ["Entrar e sincronizar"]),
      erro,
    ]));
  }
  frag.appendChild(cartao("Sincronizar entre celular e PC", null, [bloco]));

  /* ---- legenda ---- */
  const cores = el("div", { class: "legenda", estilo: { gap: "8px 18px" } });
  for (const m of d.ordem) {
    const it = el("span", { class: "legenda__it" }, [el("span", { class: "legenda__cor" }), d.materias[m].nome]);
    it.firstChild.style.setProperty("--c", d.materias[m].cor);
    cores.appendChild(it);
  }
  frag.appendChild(cartao("Legenda de cores das matérias", "Nos blocos da grade, a cor vem da matéria; sem matéria, vem do tipo do evento (ou da cor escolhida).", [cores]));

  frag.appendChild(cartao("Sobre", null, [
    el("p", { estilo: { fontSize: "12.5px", color: "var(--ink-2)", margin: 0 },
      texto: `${APP.nome} · versão ${APP.versao} · Conteúdo baseado no Edital DP-3/321/26 (PM-SP). Site estático, sem rastreadores e sem serviços de terceiros. `
           + "Funciona offline depois da primeira visita — dá para instalar na tela inicial do celular." }),
  ]));

  return frag;
}
