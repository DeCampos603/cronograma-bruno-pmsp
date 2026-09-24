/* Tela SEMANAS — registro semana a semana: horas, questões, acertos, treinos. */

import { el, cartao, chip, campoEditavel, somarDias, fCurta, numeroSemana, num, soma, n1 } from "../ui.js";
import { estado, mudar, semana } from "../store.js";

export function viewSemanas(d) {
  const frag = document.createDocumentFragment();
  const total = d.concurso.semanas;
  const atual = numeroSemana(estado.datas.inicio, new Date(), total);

  const tbody = el("tbody");
  for (let n = 1; n <= total; n++) {
    const s = semana(n);
    const ini = somarDias(estado.datas.inicio, (n - 1) * 7);
    const fase = d.fases.find((f) => n >= f.semanas[0] && n <= f.semanas[1]);
    const pctCel = el("td", { class: "cen" });
    const calc = () => {
      const q = num(semana(n).questoes), c = num(semana(n).certas);
      pctCel.textContent = q && c !== null ? `${Math.round((100 * c) / q)}%` : "—";
    };
    calc();
    const grava = (campo) => (v) => { mudar((e) => { e.semanas[n] = { ...semana(n), [campo]: v }; }); calc(); };
    const cel = (campo, ph, largura = "mini") => el("td", { class: "cen" }, [campoEditavel({ valor: s[campo], tipo: "number", largura, ao: grava(campo), placeholder: ph, passo: "0.5" })]);
    tbody.appendChild(el("tr", { estilo: n === atual ? { outline: "2px solid var(--gold)", outlineOffset: "-2px" } : {} }, [
      el("td", { class: "cen" }, [el("b", { texto: String(n) })]),
      el("td", { estilo: { whiteSpace: "nowrap" }, texto: `${fCurta(ini).slice(0, 5)} – ${fCurta(somarDias(ini, 6)).slice(0, 5)}` }),
      el("td", {}, [fase ? chip(fase.nome.split(" — ")[1] || fase.nome) : ""]),
      cel("meta", "h"), cel("horas", "h"), cel("questoes", "nº"), cel("certas", "nº"), pctCel, cel("treinos", "nº"),
      el("td", { estilo: { minWidth: "220px" } }, [campoEditavel({ valor: s.obs, ao: grava("obs"), placeholder: "O que funcionou / o que travou" })]),
    ]));
  }

  const horas = soma(Object.values(estado.semanas).map((s) => s.horas));
  const meta = soma(Object.values(estado.semanas).map((s) => s.meta));
  frag.appendChild(cartao("As semanas do plano",
    `${total} semanas · ${n1.format(horas)} h registradas${meta ? ` de ${n1.format(meta)} h de meta` : ""}. A semana atual está contornada em dourado.`,
    [el("div", { class: "tabela-wrap" }, [el("table", { class: "tb" }, [
      el("thead", {}, [el("tr", {}, ["Sem.", "Período", "Fase", "Meta (h)", "Feitas (h)", "Questões", "Acertos", "% acerto", "Treinos", "Observação"].map((t, i) => el("th", { class: i >= 3 && i <= 8 ? "cen" : "", texto: t })))]),
      tbody,
    ])])], null, true));
  return frag;
}
