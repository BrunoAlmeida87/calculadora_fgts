/* Service worker do Simulador de Rescisão.
   - Guarda a página, os ícones e a biblioteca de PDF para o app abrir sem internet.
   - Página: rede primeiro (para pegar atualizações), cache se estiver offline.
   - Bibliotecas e fontes de CDN: cache primeiro (as URLs têm versão fixa).
   - Recebe PDFs enviados pelo menu "Compartilhar" do Android (share_target).
   Ao mudar arquivos do app, aumente VERSAO para renovar o cache. */
const VERSAO = 'v4';
const CACHE_APP = 'rescisao-fgts-app-' + VERSAO;
const CACHE_CDN = 'rescisao-fgts-cdn-v1';
const CACHE_COMPARTILHADO = 'rescisao-fgts-compartilhado';

const ARQUIVOS_APP = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];
const ARQUIVOS_CDN = [
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
];
const HOSTS_CDN = ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', ev => {
  ev.waitUntil((async () => {
    const app = await caches.open(CACHE_APP);
    await app.addAll(ARQUIVOS_APP.map(u => new Request(u, { cache: 'reload' })));
    // a biblioteca de PDF é grande e vem de fora: se falhar, o app instala mesmo assim
    const cdn = await caches.open(CACHE_CDN);
    await Promise.all(ARQUIVOS_CDN.map(async url => {
      if (await cdn.match(url)) return;
      try { const r = await fetch(url, { mode: 'cors' }); if (r.ok) await cdn.put(url, r); } catch (e) { /* tenta de novo no uso */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', ev => {
  ev.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(nomes
      .filter(n => n.startsWith('rescisao-fgts-app-') && n !== CACHE_APP)
      .map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

const escopo = () => self.registration.scope;

async function receberCompartilhamento(req) {
  try {
    const form = await req.formData();
    const arq = form.getAll('extrato').find(f => f && typeof f === 'object');
    if (arq) {
      const cache = await caches.open(CACHE_COMPARTILHADO);
      await cache.put(new URL('compartilhado.pdf', escopo()).href, new Response(arq, {
        headers: { 'content-type': 'application/pdf', 'x-nome': encodeURIComponent(arq.name || 'extrato.pdf') }
      }));
    }
  } catch (e) { /* abre o app mesmo assim */ }
  return Response.redirect(new URL('./?compartilhado=1', escopo()).href, 303);
}

async function paginaRedePrimeiro(req) {
  const cache = await caches.open(CACHE_APP);
  // a resposta da rede, quando chega, sempre atualiza a cópia guardada
  const rede = fetch(req).then(r => {
    if (r.ok && r.type === 'basic') cache.put('./index.html', r.clone());
    return r;
  });
  rede.catch(() => {});
  try {
    // rede com limite de tempo: em sinal fraco, abre logo a cópia guardada
    return await Promise.race([rede, new Promise((_, falha) => setTimeout(() => falha(new Error('lento')), 4000))]);
  } catch (e) {
    const guardado = (await cache.match('./index.html')) || (await cache.match('./'));
    return guardado || rede;
  }
}

async function cacheDepoisRede(req, nomeCache) {
  const cache = await caches.open(nomeCache);
  const guardado = await cache.match(req);
  const buscar = fetch(req).then(r => { if (r.ok || r.type === 'opaque') cache.put(req, r.clone()); return r; });
  if (guardado) { buscar.catch(() => {}); return guardado; }
  return buscar;
}

self.addEventListener('fetch', ev => {
  const req = ev.request;
  const url = new URL(req.url);

  if (req.method === 'POST' && url.origin === location.origin && url.pathname.endsWith('/compartilhar')) {
    ev.respondWith(receberCompartilhamento(req));
    return;
  }
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate' && url.origin === location.origin) {
    ev.respondWith(paginaRedePrimeiro(req));
    return;
  }
  if (url.origin === location.origin) {
    ev.respondWith(cacheDepoisRede(req, CACHE_APP));
    return;
  }
  if (HOSTS_CDN.includes(url.hostname)) {
    ev.respondWith(caches.open(CACHE_CDN).then(async cache => {
      const guardado = await cache.match(req, { ignoreVary: true });
      if (guardado) return guardado;
      try {
        const r = await fetch(req);
        if (r.ok || r.type === 'opaque') cache.put(req, r.clone());
        return r;
      } catch (e) {
        // sem internet e sem cópia da fonte: segue com a fonte do sistema, sem erro na página
        if (url.hostname === 'fonts.googleapis.com') return new Response('', { headers: { 'content-type': 'text/css' } });
        throw e;
      }
    }));
  }
});
