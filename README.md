# Cronograma Bruno · PM-SP (Aluno-Soldado)

Site de plano de estudos do **Bruno Reis** para o concurso de **Aluno-Soldado PM** da Polícia Militar do Estado de São Paulo
(Edital DP-3/321/26, banca VUNESP). Mesma estrutura do cronograma da GM Maricá, adaptada ao edital,
com **grade semanal totalmente editável**.

PWA offline-first, HTML + CSS + JS vanilla (ES modules), zero build, sem CDN e sem rastreadores.

## Telas

| Tela | O que faz |
|---|---|
| **Hoje** | Contagem regressiva, painel do cursinho (busca por qualquer tópico do edital, Estudando/Concluído, campo "aula do cursinho") e checklist da agenda de hoje |
| **Grade** | Semana (ou dia) em linha do tempo. **Editável**: título, dias, horários, tipo, matéria, cor e observação |
| **Conteúdo** | Os 76 tópicos do Anexo B, com situação, confiança, % de acerto e anotação |
| **Painel** | Progresso por matéria, horas, questões, último simulado/redação/TAF contra os cortes |
| **Plano** | 4 fases e o que estudar mês a mês (calculado das datas) |
| **Semanas** | Registro das 24 semanas: horas, questões, acertos, treinos |
| **Simulados** | Nota por bloco; corte de 30/60 na objetiva e 20/40 na redação |
| **Redação** | Critérios da banca e histórico de redações (30 linhas, 0 a 40) |
| **TAF** | Metas do ISF (Anexo D) para homem/mulher e registro dos testes |
| **Edital** | Resumo do edital: requisitos, prova, etapas |
| **Ajustes** | Datas, backup, sincronização opcional |

## Como editar a grade

- **Tocar num bloco** abre o editor. **Tocar num espaço vazio** cria um evento naquele dia e horário.
- Marcar **mais de um dia** ao salvar cria cópias do evento nos outros dias.
- **Só esta semana** personaliza a semana exibida (cria uma cópia). **Padrão de todas as semanas** muda o modelo
  usado por toda semana que não foi personalizada.
- Por semana: *Copiar para a próxima semana*, *Usar esta semana como padrão*, *Voltar ao padrão*.
- *Restaurar grade original* (na Grade ou em Ajustes) volta ao modelo de fábrica.
- Tudo é salvo automaticamente. A grade de fábrica é apenas um ponto de partida — ajuste aos horários reais do Bruno.

## Datas (confirmar)

- Início do plano: **28/09/2026**.
- Prova: o edital previa 20/09/2026 (já aplicada). A nova data foi informada como "meados de março/2027";
  o site usa **14/03/2027 como estimativa**. Corrija em **Ajustes** quando a VUNESP divulgar a data oficial
  (`vunesp.com.br/PMES2601`). Os contadores e o calendário se reajustam sozinhos.

## Persistência

1. `localStorage`, a cada alteração (padrão; funciona sem configurar).
2. Backup manual em JSON (Ajustes).
3. Supabase opcional para sincronizar celular e PC: rode `modelos/supabase/01-schema.sql` e `02-rls.sql`
   e preencha `docs/js/config.js`. Uma linha por usuário em `progresso`, com RLS por `auth.uid()`.

## Publicar no GitHub Pages

```bash
cd Cronograma-Bruno-PMSP
git init -b main
git add . && git commit -m "feat: cronograma Bruno PM-SP"
gh repo create cronograma-bruno-pmsp --public --source=. --push
gh api -X POST repos/:owner/cronograma-bruno-pmsp/pages -f "source[branch]=main" -f "source[path]=/docs"
```

O repositório é público porque o GitHub Pages gratuito não publica de repositório privado. Nenhum dado pessoal
fica versionado: progresso e grade vivem no aparelho (ou no Supabase).

## Rodar localmente

```bash
python -m http.server 8124 --directory docs
# http://localhost:8124
```

## Mudar o conteúdo

O conteúdo (matérias, tópicos, fases, grade de fábrica, edital, TAF) sai de `ferramentas/gerar_plano.py`:

```bash
py -3 ferramentas/gerar_plano.py   # regera docs/dados/plano.json
```

O progresso é ligado ao `id` numérico do tópico: **só acrescente tópicos ao fim da lista da matéria**; reordenar
no meio quebra o vínculo com o progresso salvo.

## Fonte

Edital de Concurso Público nº DP-3/321/26 (DOESP nº 105, de 03/06/2026): Anexo B (conteúdo), Cap. V e VIII (prova e notas),
Cap. IX e Anexo D (TAF). A distribuição dos tópicos por semana e a grade de fábrica são sugestões de planejamento,
não parte do edital.
