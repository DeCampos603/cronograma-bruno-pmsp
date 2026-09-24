/* ==========================================================================
   Cliente Supabase mínimo — só o que este site usa.

   Por que não a biblioteca oficial: a convenção do projeto proíbe CDN, e
   vendorizar ~100 KB para usar login por senha e UMA tabela seria peso morto.
   Aqui vai o necessário, sobre fetch, com a mesma forma de chamada do SDK
   oficial — se um dia trocar pelo pacote real, o store.js não muda.

   Cobre:  auth.signInWithPassword · auth.signOut · auth.getUser
           from(tabela).select().eq().maybeSingle()
           from(tabela).upsert()
   Faz também: sessão persistida e renovação automática do token.
   ========================================================================== */

const CHAVE_SESSAO = "brenin.sb.sessao";

export function createClient(url, chave, opcoes = {}) {
  const base = url.replace(/\/+$/, "");
  const persistir = opcoes.auth?.persistSession !== false;
  const autoRenovar = opcoes.auth?.autoRefreshToken !== false;

  let sessao = null;
  if (persistir) {
    try { sessao = JSON.parse(localStorage.getItem(CHAVE_SESSAO) || "null"); }
    catch { sessao = null; }
  }

  const gravarSessao = (s) => {
    sessao = s;
    if (!persistir) return;
    if (s) localStorage.setItem(CHAVE_SESSAO, JSON.stringify(s));
    else localStorage.removeItem(CHAVE_SESSAO);
  };

  const cabecalhos = (comToken = true) => {
    const h = { apikey: chave, "Content-Type": "application/json" };
    if (comToken && sessao?.access_token) h.Authorization = `Bearer ${sessao.access_token}`;
    return h;
  };

  /** Renova o token quando falta menos de 1 minuto — ou já expirou. */
  async function garantirToken() {
    if (!sessao) return null;
    const agora = Math.floor(Date.now() / 1000);
    if (sessao.expires_at && sessao.expires_at - agora > 60) return sessao;
    if (!autoRenovar || !sessao.refresh_token) return sessao;
    try {
      const r = await fetch(`${base}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST", headers: cabecalhos(false),
        body: JSON.stringify({ refresh_token: sessao.refresh_token }),
      });
      if (!r.ok) return sessao;          // sem rede: mantém a sessão, não desloga
      const j = await r.json();
      gravarSessao(normalizar(j));
      return sessao;
    } catch {
      return sessao;                      // offline não pode deslogar o usuário
    }
  }

  const normalizar = (j) => ({
    access_token: j.access_token,
    refresh_token: j.refresh_token,
    expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600),
    user: j.user || null,
  });

  const auth = {
    async signInWithPassword({ email, password }) {
      try {
        const r = await fetch(`${base}/auth/v1/token?grant_type=password`, {
          method: "POST", headers: cabecalhos(false),
          body: JSON.stringify({ email, password }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) {
          return { data: null, error: new Error(j.error_description || j.msg || j.message || `HTTP ${r.status}`) };
        }
        gravarSessao(normalizar(j));
        return { data: { user: sessao.user, session: sessao }, error: null };
      } catch (e) {
        return { data: null, error: e };
      }
    },

    async signOut() {
      try {
        if (sessao?.access_token) {
          await fetch(`${base}/auth/v1/logout`, { method: "POST", headers: cabecalhos() });
        }
      } catch { /* ignora: o que importa é limpar local */ }
      gravarSessao(null);
      return { error: null };
    },

    async getUser() {
      await garantirToken();
      if (!sessao) return { data: { user: null }, error: null };
      if (sessao.user) return { data: { user: sessao.user }, error: null };
      try {
        const r = await fetch(`${base}/auth/v1/user`, { headers: cabecalhos() });
        if (!r.ok) return { data: { user: null }, error: new Error(`HTTP ${r.status}`) };
        const user = await r.json();
        gravarSessao({ ...sessao, user });
        return { data: { user }, error: null };
      } catch (e) {
        return { data: { user: sessao.user || null }, error: e };
      }
    },

    async getSession() { await garantirToken(); return { data: { session: sessao }, error: null }; },
  };

  /* ------------------------------------------------------------- PostgREST */
  function from(tabela) {
    const alvo = `${base}/rest/v1/${encodeURIComponent(tabela)}`;

    function consulta() {
      const filtros = [];
      let colunas = "*";
      let unico = false;

      const exec = async () => {
        await garantirToken();
        const qs = new URLSearchParams();
        qs.set("select", colunas);
        for (const [c, v] of filtros) qs.append(c, v);
        try {
          const h = cabecalhos();
          if (unico) h.Accept = "application/vnd.pgrst.object+json";
          const r = await fetch(`${alvo}?${qs}`, { headers: h });
          if (r.status === 406 && unico) return { data: null, error: null }; // nenhuma linha
          const txt = await r.text();
          const j = txt ? JSON.parse(txt) : null;
          if (!r.ok) return { data: null, error: new Error(j?.message || `HTTP ${r.status}`) };
          if (unico && Array.isArray(j)) return { data: j[0] ?? null, error: null };
          return { data: j, error: null };
        } catch (e) {
          return { data: null, error: e };
        }
      };

      const api = {
        select(c) { colunas = (c || "*").replace(/\s+/g, ""); return api; },
        eq(coluna, valor) { filtros.push([coluna, `eq.${valor}`]); return api; },
        limit(n) { filtros.push(["limit", String(n)]); return api; },
        async maybeSingle() { unico = true; return exec(); },
        async single() { unico = true; return exec(); },
        then(res, rej) { return exec().then(res, rej); },   // permite await direto
      };
      return api;
    }

    return {
      select(c) { return consulta().select(c); },

      async upsert(linha, opcoes = {}) {
        await garantirToken();
        try {
          const h = cabecalhos();
          h.Prefer = "resolution=merge-duplicates,return=minimal";
          const qs = opcoes.onConflict ? `?on_conflict=${encodeURIComponent(opcoes.onConflict)}` : "";
          const r = await fetch(`${alvo}${qs}`, {
            method: "POST", headers: h, body: JSON.stringify(linha),
          });
          if (!r.ok) {
            const t = await r.text();
            let msg = `HTTP ${r.status}`;
            try { msg = JSON.parse(t).message || msg; } catch { /* texto puro */ }
            return { data: null, error: new Error(msg) };
          }
          return { data: null, error: null };
        } catch (e) {
          return { data: null, error: e };
        }
      },
    };
  }

  return { auth, from };
}
