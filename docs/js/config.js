/* ==========================================================================
   Configuração do site — Cronograma Bruno · PM-SP
   Enquanto SUPABASE.url estiver vazio, o site funciona 100% no aparelho
   (localStorage). Preencher url + chave liga a sincronização entre dispositivos.
   ========================================================================== */

export const SUPABASE = {
  url: "",              // ex.: "https://xxxxxxxx.supabase.co"
  chavePublishable: "", // anon / publishable — NUNCA a service_role
};

export const APP = {
  nome: "Cronograma Bruno · PM-SP",
  versao: "1.0.0",
  chaveLocal: "bruno-pmsp.plano.v1",
  arquivoDados: "./dados/plano.json",
};

export const supabaseLigado = () =>
  Boolean(SUPABASE.url && SUPABASE.chavePublishable);
