# -*- coding: utf-8 -*-
"""
Gera docs/dados/plano.json — a fonte única do conteúdo do site.

Base: Edital DP-3/321/26 (PM-SP, Aluno-Soldado PM QP, VUNESP), Anexo B (conteúdo
programático), Cap. V (estrutura da prova), Cap. VIII (notas) e Anexo D (TAF).

Regra: o progresso do Bruno é ligado ao `id` numérico do tópico. Para acrescentar
conteúdo, ponha tópicos NO FIM da lista da matéria (ids seguem a ordem de MATERIAS);
reordenar no meio quebra o vínculo com o progresso já salvo.

Uso:  py -3 ferramentas/gerar_plano.py
"""

import datetime as dt
import io
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DEST = RAIZ / "docs" / "dados" / "plano.json"

INICIO = dt.date(2026, 9, 28)       # segunda-feira
PROVA_ESTIMADA = dt.date(2027, 3, 14)  # "meados de março/2027" — editável no site
N_SEMANAS = 24

# --------------------------------------------------------------------------- matérias
# questoes = peso na Prova Objetiva (60 questões, Cap. V item 1.1)
MATERIAS = [
    ("port", "Língua Portuguesa", "Língua Portuguesa e Interpretação de Texto", 20, "#15803D"),
    ("mat", "Matemática", "Matemática", 15, "#1D4ED8"),
    ("hist", "História", "Conhecimentos Gerais", 0, "#92400E"),
    ("geo", "Geografia", "Conhecimentos Gerais", 0, "#0E7490"),
    ("atual", "Atualidades", "Conhecimentos Gerais", 0, "#C2410C"),
    ("info", "Noções de Informática", "Noções Básicas de Informática", 5, "#7C3AED"),
    ("adm", "Noções de Administração Pública", "Noções de Administração Pública", 5, "#9D174D"),
    ("red", "Redação (Prova Dissertativa)", "Prova Dissertativa", 0, "#B91C1C"),
    ("fis", "Preparação física (TAF)", "Exames de Aptidão Física", 0, "#4D7C0F"),
]

GRUPOS = [
    {"nome": "Língua Portuguesa e Interpretação de Texto", "questoes": 20},
    {"nome": "Matemática", "questoes": 15},
    {"nome": "Conhecimentos Gerais", "questoes": 15, "obs": "História, Geografia e Atualidades"},
    {"nome": "Noções Básicas de Informática", "questoes": 5},
    {"nome": "Noções de Administração Pública", "questoes": 5},
]

# --------------------------------------------------------------------------- tópicos
# (matéria, unidade, tópico) — na ordem de estudo. Semana da 1ª passagem: ver PASSO.
T = {}

T["port"] = [
    ("Leitura e interpretação", "Tipos e gêneros textuais: textos literários e não literários"),
    ("Leitura e interpretação", "Ideia central, tema, tese e argumentos do texto"),
    ("Leitura e interpretação", "Inferência, pressupostos e subentendidos"),
    ("Léxico e sentido", "Sinônimos e antônimos"),
    ("Léxico e sentido", "Sentido próprio e figurado das palavras"),
    ("Pontuação", "Vírgula, ponto, dois-pontos, ponto e vírgula, travessão e aspas"),
    ("Classes de palavras", "Substantivo, adjetivo e numeral: emprego e sentido"),
    ("Classes de palavras", "Pronome: emprego e sentido"),
    ("Classes de palavras", "Verbo: tempos, modos e sentido que imprimem"),
    ("Classes de palavras", "Advérbio, preposição e conjunção: relações que estabelecem"),
    ("Sintaxe", "Concordância verbal"),
    ("Sintaxe", "Concordância nominal"),
    ("Sintaxe", "Regência verbal"),
    ("Sintaxe", "Regência nominal"),
    ("Sintaxe", "Colocação pronominal"),
    ("Sintaxe", "Crase"),
]

T["mat"] = [
    ("Números", "Números inteiros: operações e propriedades"),
    ("Números", "Números racionais: representação fracionária e decimal, operações e propriedades"),
    ("Números", "Mínimo múltiplo comum (MMC)"),
    ("Proporcionalidade", "Razão e proporção"),
    ("Proporcionalidade", "Porcentagem"),
    ("Proporcionalidade", "Regra de três simples"),
    ("Estatística", "Média aritmética simples"),
    ("Álgebra", "Equação do 1º grau"),
    ("Álgebra", "Sistema de equações do 1º grau"),
    ("Medidas", "Sistema métrico: medidas de tempo, comprimento, superfície e capacidade"),
    ("Grandezas", "Relação entre grandezas: leitura de tabelas e gráficos"),
    ("Geometria", "Forma, perímetro e área"),
    ("Geometria", "Volume"),
    ("Geometria", "Teorema de Pitágoras"),
    ("Raciocínio", "Raciocínio lógico"),
    ("Raciocínio", "Resolução de situações-problema"),
]

T["hist"] = [
    ("História Geral", "Primeira Guerra Mundial"),
    ("História Geral", "O nazifascismo e a Segunda Guerra Mundial"),
    ("História Geral", "A Guerra Fria"),
    ("História Geral", "Globalização e as políticas neoliberais"),
    ("História do Brasil", "A Revolução de 1930 e a Era Vargas"),
    ("História do Brasil", "As Constituições Republicanas"),
    ("História do Brasil", "Estrutura política e movimentos sociais no período militar"),
    ("História do Brasil", "A abertura política e a redemocratização do Brasil"),
]

T["geo"] = [
    ("Geografia Geral", "A nova ordem mundial, o espaço geopolítico e a globalização"),
    ("Geografia Geral", "Os principais problemas ambientais"),
    ("Geografia do Brasil", "A natureza brasileira: relevo, hidrografia, clima e vegetação"),
    ("Geografia do Brasil", "A população: crescimento, distribuição, estrutura e movimentos"),
    ("Geografia do Brasil", "Atividades econômicas: industrialização e urbanização, fontes de energia e agropecuária"),
    ("Geografia do Brasil", "Os impactos ambientais"),
]

T["atual"] = [
    ("Atualidades", "Fatos políticos nacionais (desde ~dez/2025)"),
    ("Atualidades", "Fatos econômicos nacionais (desde ~dez/2025)"),
    ("Atualidades", "Fatos sociais e culturais nacionais (desde ~dez/2025)"),
    ("Atualidades", "Fatos políticos, econômicos e sociais internacionais (desde ~dez/2025)"),
]

T["info"] = [
    ("Windows", "MS-Windows 10: pastas, arquivos, atalhos, área de trabalho, área de transferência e aplicativos"),
    ("Office", "MS-Word 2016: documentos, formatação, tabelas, quebras, índices, legendas e objetos"),
    ("Office", "MS-Excel 2016: planilhas, fórmulas, funções, gráficos, classificação e dados externos"),
    ("Office", "MS-PowerPoint 2016: slides, edição, formatação, botões de ação, animação e transição"),
    ("Internet", "Correio eletrônico: uso, envio de mensagens e anexos"),
    ("Internet", "Internet: navegação, URL, links, sites, busca e impressão de páginas"),
    ("Nuvem", "Google Workspace: Gmail, Agenda, Meet, Chat, Drive, Documentos, Planilhas, Apresentações, Formulários"),
    ("Nuvem", "Microsoft Teams: chats, chamadas, grupos e trabalho colaborativo"),
]

T["adm"] = [
    ("Constituição Federal", "Título II, Cap. I — Direitos e deveres individuais e coletivos (art. 5º)"),
    ("Constituição Federal", "Título II, Cap. IV — Direitos políticos (arts. 14 a 16)"),
    ("Constituição Federal", "Título III, Cap. VII, Seção I — Administração Pública: disposições gerais (arts. 37 e 38)"),
    ("Constituição Federal", "Título III, Cap. VII, Seção III — Militares dos Estados, DF e Territórios (art. 42)"),
    ("Constituição Federal", "Título V, Cap. III — Segurança Pública (art. 144)"),
    ("Constituição do Estado de SP", "Título II, Cap. III — Do Poder Executivo"),
    ("Constituição do Estado de SP", "Título II, Cap. IV, Seção V — Da Justiça Militar do Estado"),
    ("Constituição do Estado de SP", "Título III, Cap. I, Seção I — Administração Pública: disposições gerais"),
    ("Constituição do Estado de SP", "Título III, Cap. II — Servidores Públicos Civis e Servidores Públicos Militares"),
    ("Constituição do Estado de SP", "Título III, Cap. III — Segurança Pública: disposições gerais e Da Polícia Militar"),
    ("Acesso à informação", "Lei Federal nº 12.527/11 — Lei de Acesso à Informação"),
    ("Acesso à informação", "Decreto Estadual nº 68.155/23 — regulamenta a LAI no Estado de SP"),
]

T["red"] = [
    ("Estrutura", "Texto dissertativo-argumentativo: introdução, desenvolvimento e conclusão"),
    ("Estrutura", "Tese clara e posicionamento do autor (ponto de vista defendido)"),
    ("Adequação", "Atender ao tema e ao gênero/tipo de texto — fuga total = redação anulada"),
    ("Adequação", "Usar os textos de apoio como referencial, sem copiá-los"),
    ("Língua", "Coesão e coerência: conectivos, retomadas e progressão das ideias"),
    ("Língua", "Norma-padrão: ortografia, acentuação, concordância, regência e pontuação"),
]

# semana da 1ª passagem: (início, fim) — a matéria se espalha por essas semanas
PASSO = {
    "port": (1, 10), "mat": (1, 11), "hist": (3, 8), "geo": (6, 10),
    "atual": (9, 12), "info": (5, 12), "adm": (3, 12), "red": (1, 12),
}


def semana_do(i, n, a, b):
    return a + (i * (b - a + 1)) // n


TOPICOS = []
for mid, _n, _g, _q, _c in MATERIAS:
    lista = T.get(mid, [])
    a, b = PASSO.get(mid, (0, 0))
    for i, (unidade, topico) in enumerate(lista):
        TOPICOS.append({
            "id": len(TOPICOS) + 1,
            "materia": mid,
            "unidade": unidade,
            "topico": topico,
            "sem": semana_do(i, len(lista), a, b),
        })

# --------------------------------------------------------------------------- tipos de evento
TIPOS = [
    ("estudo", "Estudo", "#1D4E9E"),
    ("exercicios", "Exercícios / questões", "#0F766E"),
    ("revisao", "Revisão", "#B45309"),
    ("simulado", "Simulado", "#7E22CE"),
    ("redacao", "Redação", "#B91C1C"),
    ("treino", "Treino físico", "#4D7C0F"),
    ("refeicao", "Refeição", "#A16207"),
    ("trabalho", "Trabalho / compromisso", "#475569"),
    ("descanso", "Descanso / lazer", "#64748B"),
    ("sono", "Sono", "#334155"),
    ("outro", "Outro", "#6B7280"),
]

# tipos que aparecem no checklist "Hoje" com caixinha de conclusão
TIPOS_MARCAVEIS = ["estudo", "exercicios", "revisao", "simulado", "redacao", "treino"]

# --------------------------------------------------------------------------- grade padrão
_n = [0]


def ev(dia, ini, fim, titulo, tipo, materia="", obs=""):
    _n[0] += 1
    return {"id": f"g{_n[0]:02d}", "dia": dia, "ini": ini, "fim": fim,
            "titulo": titulo, "tipo": tipo, "materia": materia, "obs": obs}


GRADE = []
# (dia, treino, bloco1, bloco2)
SEMANA = [
    (0, "Corrida contínua (base aeróbica)", ("port", "Língua Portuguesa"), ("mat", "Matemática")),
    (1, "Barra fixa + abdominal remador", ("mat", "Matemática"), ("adm", "Noções de Administração Pública")),
    (2, "Tiros de 50 m + corrida intervalada", ("port", "Língua Portuguesa"), ("hist", "História")),
    (3, "Barra fixa + abdominal remador", ("mat", "Matemática"), ("info", "Noções de Informática")),
    (4, "Mobilidade e treino leve", ("geo", "Geografia"), ("red", "Redação")),
]
for dia, treino, b1, b2 in SEMANA:
    GRADE.append(ev(dia, "06:00", "07:00", treino, "treino", "fis"))
    GRADE.append(ev(dia, "19:00", "20:30", b1[1], "estudo", b1[0]))
    GRADE.append(ev(dia, "20:45", "22:00", b2[1], "estudo", b2[0], obs="Redação: 1 texto por semana, com no máximo 30 linhas" if b2[0] == "red" else ""))
    GRADE.append(ev(dia, "22:00", "22:15", "Caderno de erros do dia", "revisao"))

GRADE += [
    ev(5, "08:00", "10:00", "Questões VUNESP — Português e Matemática", "exercicios"),
    ev(5, "10:15", "12:00", "Atualidades + questões de Informática e Adm. Pública", "exercicios", "atual"),
    ev(5, "14:00", "17:00", "Simulado ou redação cronometrada (alternar as semanas)", "simulado",
       obs="Objetiva: 60 questões. Redação: máximo 30 linhas. Prova real: 5 h para as duas partes."),
    ev(6, "08:00", "09:30", "Treino longo: corrida de 2.400 m", "treino", "fis"),
    ev(6, "16:00", "17:00", "Revisão semanal + planejar a próxima semana", "revisao"),
]

# --------------------------------------------------------------------------- fases
FASES = [
    {
        "nome": "Fase 1 — BASE", "semanas": [1, 12], "periodo": "28/09/2026 a 20/12/2026",
        "muda": "1ª passagem por todos os tópicos do Anexo B, uma matéria por bloco. Teoria curta + 10 a 20 questões por tópico.",
        "porque": "Sem a base completa, exercício vira chute. O objetivo é ver o edital inteiro uma vez.",
        "meta": "Concluir todos os tópicos e fechar a semana no site.",
    },
    {
        "nome": "Fase 2 — APROFUNDAR", "semanas": [13, 18], "periodo": "21/12/2026 a 31/01/2027",
        "muda": "Segunda passagem guiada pelos erros: refazer os tópicos com menor confiança e acerto. Questões por assunto, no estilo VUNESP.",
        "porque": "A nota sobe onde o erro se repete. Português (20 questões) e Matemática (15) valem 58% da prova.",
        "meta": "Acerto médio acima de 70% nos tópicos de Português e Matemática.",
    },
    {
        "nome": "Fase 3 — SIMULADOS", "semanas": [19, 22], "periodo": "01/02/2027 a 28/02/2027",
        "muda": "Simulado completo (60 questões + redação de 30 linhas) todo sábado, com tempo de prova. Revisão dirigida pelo caderno de erros.",
        "porque": "A habilitação exige 30 pontos na objetiva e 20 na redação — treinar o tempo é parte da nota.",
        "meta": "Objetiva estável acima de 40/60 e redação acima de 26/40.",
    },
    {
        "nome": "Fase 4 — RETA FINAL", "semanas": [23, 24], "periodo": "01/03/2027 a 14/03/2027",
        "muda": "Nada de assunto novo. Revisão do caderno de erros, resumos, Atualidades e 1 simulado leve. Sono e treino físico em manutenção.",
        "porque": "Descanso e revisão rendem mais que estudar cansado na última semana.",
        "meta": "Chegar descansado, com documento e local da prova conferidos.",
    },
]

# --------------------------------------------------------------------------- edital
EDITAL = {
    "numero": "Edital DP-3/321/26 — Concurso Público PM-SP, Aluno-Soldado PM (QP)",
    "banca": "Fundação VUNESP (Exames de Conhecimentos)",
    "publicacao": "DOESP nº 105, de 03/06/2026",
    "pagina": "vunesp.com.br/PMES2601",
    "vagas": "2.000 (dois mil), sem reserva para pessoas com deficiência",
    "remuneracao": "R$ 5.482,51 (padrão R$ 2.348,42 + RETP R$ 2.348,42 + insalubridade R$ 785,67)",
    "requisitos": [
        "Brasileiro(a), de 17 a 30 anos de idade",
        "Estatura mínima: 160 cm (homem) ou 155 cm (mulher), descalço e descoberto",
        "Ensino Médio (o nível das provas de conhecimentos)",
        "Taxa de inscrição paga",
    ],
    "inscricoes": "15/06/2026 a 21/08/2026 (encerradas)",
    "prova_original": "20/09/2026 (tarde) — já aplicada",
    "prova_nova": "Meados de março/2027 (informada pelo usuário; data exata a confirmar no DOESP e na VUNESP)",
    "prova_estrutura": [
        "Parte I — Objetiva: 60 questões de múltipla escolha, 5 alternativas, 1 ponto cada",
        "Parte II — Dissertativa: 1 redação, máximo de 30 linhas, 0 a 40 pontos",
        "Duração: 5 horas para as duas partes",
        "Habilitação: mínimo de 30/60 na objetiva; a redação só é corrigida de quem fez ao menos 30",
        "Redação: habilitado com 20/40 ou mais",
    ],
    "etapas": [
        {"n": 1, "nome": "Exames de Conhecimentos (Objetiva + Dissertativa)", "carater": "Eliminatório e classificatório", "cap": "V a VIII"},
        {"n": 2, "nome": "Exames de Aptidão Física", "carater": "Eliminatório", "cap": "IX"},
        {"n": 3, "nome": "Exames de Saúde (médico, odontológico e toxicológico)", "carater": "Eliminatório", "cap": "X"},
        {"n": 4, "nome": "Exames Psicológicos", "carater": "Eliminatório", "cap": "XI"},
        {"n": 5, "nome": "Avaliação da Conduta Social, Reputação e Idoneidade", "carater": "Eliminatório", "cap": "XII"},
        {"n": 6, "nome": "Análise de Documentos", "carater": "Eliminatório", "cap": "XIII"},
    ],
}

# Anexo D — Índice de Suficiência Física (ISF). Todos eliminatórios.
TAF = {
    "testes": [
        {"id": "barra", "nome_m": "Flexão na barra fixa (dinâmica)", "nome_f": "Isometria na barra fixa",
         "un_m": "repetições", "un_f": "segundos", "isf_m": 3, "isf_f": 7, "sentido": "maior"},
        {"id": "abd", "nome_m": "Abdominal remador (60 s)", "nome_f": "Abdominal remador (60 s)",
         "un_m": "repetições", "un_f": "repetições", "isf_m": 36, "isf_f": 32, "sentido": "maior"},
        {"id": "c50", "nome_m": "Corrida de 50 m", "nome_f": "Corrida de 50 m",
         "un_m": "segundos", "un_f": "segundos", "isf_m": 8.25, "isf_f": 9.5, "sentido": "menor"},
        {"id": "c2400", "nome_m": "Corrida de 2.400 m", "nome_f": "Corrida de 2.400 m",
         "un_m": "minutos", "un_f": "minutos", "isf_m": 13.0, "isf_f": 15.0, "sentido": "menor"},
    ],
    "regras": [
        "Todos os testes são eliminatórios; reprovar em um impede de seguir para os demais.",
        "Reteste (uma única vez, no mesmo dia, após no mínimo 5 min) vale para todos, exceto a corrida de 2.400 m.",
        "Barra (homens): queixo acima da barra sem apoiar, cotovelos totalmente estendidos a cada repetição, sem balanço; \"Não contei!\" para execução incorreta.",
        "Barra (mulheres): isometria com queixo acima da barra por no mínimo 7 segundos.",
        "Abdominal remador: 60 segundos; cotovelos alinhados aos joelhos ao subir e mãos tocando o solo acima da cabeça ao voltar.",
        "Atestado médico de aptidão emitido nos 45 dias anteriores ao teste (ou termo de responsabilidade — Anexo C).",
        "A altura é aferida no início; abaixo do mínimo elimina antes dos testes.",
    ],
}

REDACAO_CRITERIOS = [
    "Texto dissertativo-argumentativo em prosa, na norma-padrão, com no máximo 30 linhas.",
    "Atender ao tema proposto e ao gênero/tipo de texto — fuga completa de qualquer um leva a redação a não ser considerada.",
    "Ter introdução, desenvolvimento e conclusão, com posicionamento claro do autor.",
    "Usar os textos de apoio como referencial — cópia contínua dos textos de apoio ou de modelos prontos leva a nota zero.",
    "O título não é avaliado. Letra incompreensível, texto fora do espaço ou cópia de outra redação podem zerar a nota.",
    "Cada redação é avaliada por 2 examinadores independentes.",
]

# --------------------------------------------------------------------------- saída
dados = {
    "gerado_em": dt.date.today().isoformat(),
    "aluno": "Bruno Reis",
    "concurso": {
        "sigla": "PM-SP",
        "cargo": "Aluno-Soldado PM (QP)",
        "inicio": INICIO.isoformat(),
        "prova": PROVA_ESTIMADA.isoformat(),
        "semanas": N_SEMANAS,
    },
    "materias": {m[0]: {"nome": m[1], "grupo": m[2], "questoes": m[3], "cor": m[4]} for m in MATERIAS},
    "ordem": [m[0] for m in MATERIAS],
    "grupos": GRUPOS,
    "tipos": {t[0]: {"rotulo": t[1], "cor": t[2]} for t in TIPOS},
    "tiposMarcaveis": TIPOS_MARCAVEIS,
    "dias": ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"],
    "fases": FASES,
    "topicos": TOPICOS,
    "grade": GRADE,
    "edital": EDITAL,
    "taf": TAF,
    "redacaoCriterios": REDACAO_CRITERIOS,
}

io.open(DEST, "w", encoding="utf-8").write(json.dumps(dados, ensure_ascii=False, indent=1))
por_mat = {}
for t in TOPICOS:
    por_mat[t["materia"]] = por_mat.get(t["materia"], 0) + 1
print("JSON ->", DEST)
print("  tópicos:", len(TOPICOS), por_mat, "| blocos de grade:", len(GRADE))
