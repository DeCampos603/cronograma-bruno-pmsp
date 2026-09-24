/* Service worker — deixa o site abrir offline depois da primeira visita.

   Estratégia: REDE PRIMEIRO, cache como reserva.
   Com cache-first, qualquer correção publicada ficaria presa no aparelho até
   alguém lembrar de trocar o número da versão aqui. Rede primeiro custa alguns
   milissegundos com internet e garante que o candidato sempre veja a versão atual —
   e continua abrindo normalmente no modo avião, servindo o que está guardado. */

const VERSAO = "bruno-pmsp-v1";
const CASCA = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/css/app.css",
  "./assets/icons/icone.svg",
  "./js/app.js",
  "./js/config.js",
  "./js/store.js",
  "./js/ui.js",
  "./js/grade-util.js",
  "./js/views/hoje.js",
  "./js/views/painel.js",
  "./js/views/grade.js",
  "./js/views/conteudo.js",
  "./js/views/mensal.js",
  "./js/views/semanas.js",
  "./js/views/simulados.js",
  "./js/views/redacao.js",
  "./js/views/taf.js",
  "./js/views/edital.js",
  "./js/views/ajustes.js",
  "./js/vendor/supabase.js",
  "./dados/plano.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSAO)
      .then((c) => Promise.allSettled(CASCA.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;   // Supabase nunca passa pelo cache

  e.respondWith(
    fetch(req)
      .then((r) => {
        if (r.ok) { const c = r.clone(); caches.open(VERSAO).then((k) => k.put(req, c)); }
        return r;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
  );
});