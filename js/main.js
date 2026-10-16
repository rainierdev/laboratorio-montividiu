// Laboratório Montividiu — agendamento rápido via WhatsApp
// Troque o número abaixo se o WhatsApp do laboratório for outro (DDI + DDD + número, só dígitos).
const WHATSAPP = '556434049442';
// Destino do botão "Como chegar" (endereço confirmado pela gerente em 16/10/2026)
const DESTINO = 'Laboratório Montividiu, Rua Filogonio Faria Leão, Montividiu - GO, 75915-000';

const state = { name: '', need: '', place: '' };

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const nameInput = $('#nome');
const preview = $('#preview');
const sendBtn = $('#sendBtn');
const sendLabel = $('#sendLabel');
const progress = $('#progress');
const progressFill = $('#progressFill');
const progressLabel = $('#progressLabel');
const progressHint = $('#progressHint');
const stepMarks = $$('.q-num');
const sendNote = $('#sendNote');
const NOTE_DEFAULT = sendNote.textContent;

function buildMessage() {
  const lines = ['Olá! Vim pelo site do Laboratório Montividiu e gostaria de agendar um exame.'];
  lines.push('Nome: ' + (state.name.trim() || '...'));
  lines.push('Preciso de: ' + (state.need || '...'));
  lines.push('Coleta: ' + (state.place ? state.place.toLowerCase() : '...')
    + (state.place === 'Em casa' ? ' (paciente com comorbidade)' : ''));
  if (state.need === 'Tenho pedido médico') lines.push('Vou enviar a foto do pedido médico.');
  return lines.join('\n');
}

function render() {
  const done = [state.name.trim().length > 1, !!state.need, !!state.place];
  const count = done.filter(Boolean).length;
  const ready = count === 3;

  // Progresso
  progressFill.style.width = Math.round((count / 3) * 100) + '%';
  progressFill.classList.toggle('done', ready);
  progress.setAttribute('aria-valuenow', String(count));
  progressLabel.textContent = ready ? 'Tudo pronto!' : 'Pergunta ' + Math.min(count + 1, 3) + ' de 3';
  progressHint.textContent = ready ? 'Agora é só enviar' : 'Leva menos de 1 minuto';

  // Números das perguntas viram ✓
  stepMarks.forEach((el) => {
    const i = Number(el.dataset.step);
    el.classList.toggle('ok', done[i]);
    el.textContent = done[i] ? '✓' : String(i + 1);
  });

  // Seleção dos botões
  $$('[data-group]').forEach((group) => {
    const key = group.dataset.group;
    $$('.chip', group).forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.value === state[key]));
    });
  });

  // Mensagem + link
  const message = buildMessage();
  preview.textContent = message;
  sendBtn.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(message);
  sendLabel.textContent = ready ? 'Enviar pelo WhatsApp' : 'Enviar pelo WhatsApp (' + count + '/3)';
  sendBtn.classList.toggle('btn-green', ready);
  sendBtn.setAttribute('aria-disabled', String(!ready));
  if (ready) { sendNote.textContent = NOTE_DEFAULT; sendNote.classList.remove('is-error'); }
}

nameInput.addEventListener('input', (e) => { state.name = e.target.value; render(); });

$$('[data-group]').forEach((group) => {
  group.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    state[group.dataset.group] = btn.dataset.value;
    render();
  });
});

// Cards de exames: pré-selecionam a opção e levam ao formulário
$$('[data-need]').forEach((card) => {
  card.addEventListener('click', () => { state.need = card.dataset.need; render(); });
});

// Só envia com as 3 perguntas respondidas; senão avisa o que falta e leva até a primeira pendente
sendBtn.addEventListener('click', (e) => {
  const missing = [
    [state.name.trim().length > 1, 'seu nome', nameInput.closest('.field')],
    [!!state.need, 'o que você precisa', $('[data-group="need"]').closest('.field')],
    [!!state.place, 'onde fazer a coleta', $('[data-group="place"]').closest('.field')],
  ].filter(([ok]) => !ok);
  if (!missing.length) return;
  e.preventDefault();
  sendNote.textContent = 'Para enviar, falta responder: ' + missing.map(([, label]) => label).join(', ') + '.';
  sendNote.classList.add('is-error');
  smoothScrollTo(missing[0][2]);
  if (missing[0][1] === 'seu nome') nameInput.focus({ preventScroll: true });
});

// Evita envio do <form> com Enter
$('#booking').addEventListener('submit', (e) => e.preventDefault());

$('#year').textContent = new Date().getFullYear();
render();

// Anos de tradição: fundado em 26/05/2000 (CNPJ). Atualiza sozinho a cada aniversário.
const FUNDACAO = new Date(2000, 4, 26);
const hoje = new Date();
const anos = hoje.getFullYear() - FUNDACAO.getFullYear()
  - (hoje < new Date(hoje.getFullYear(), FUNDACAO.getMonth(), FUNDACAO.getDate()) ? 1 : 0);
$$('[data-anos]').forEach((el) => { el.textContent = anos; });

// Links internos (#agendar, #exames...): rolagem suave até a seção, no celular e no computador.
// Rápida em distâncias curtas, um pouco mais longa nas grandes; para se a pessoa rolar no meio.
const SCROLL_OFFSET = 16;
let scrollAnim = 0;
function cancelScroll() { cancelAnimationFrame(scrollAnim); scrollAnim = 0; }
function smoothScrollTo(el) {
  cancelScroll();
  const start = window.scrollY;
  const end = Math.max(0, el.getBoundingClientRect().top + start - SCROLL_OFFSET);
  const dist = end - start;
  const duration = Math.min(1100, Math.max(450, Math.abs(dist) * 0.35));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const t0 = performance.now();
  function step(now) {
    const t = Math.min(1, (now - t0) / duration);
    window.scrollTo(0, start + dist * ease(t));
    if (t < 1) scrollAnim = requestAnimationFrame(step);
    else scrollAnim = 0;
  }
  scrollAnim = requestAnimationFrame(step);
}
['wheel', 'touchstart', 'keydown'].forEach((type) => window.addEventListener(type, cancelScroll, { passive: true }));

document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (!link || e.defaultPrevented) return;
  const id = link.getAttribute('href').slice(1);
  const target = id && document.getElementById(id);
  if (!target) return;
  e.preventDefault();
  smoothScrollTo(target);
  history.pushState(null, '', '#' + id);
  // Leva o foco do teclado junto, sem dar outro pulo
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
});

// Cabeçalho: vai esmaecendo nos primeiros pixels de rolagem e volta ao topo da página
const header = $('.site-header');
const HEADER_FADE_PX = 220;
function fadeHeader() {
  const fade = Math.max(0, 1 - window.scrollY / HEADER_FADE_PX);
  header.style.setProperty('--header-fade', fade.toFixed(3));
  header.classList.toggle('is-faded', fade < 0.05);
}
window.addEventListener('scroll', fadeHeader, { passive: true });
fadeHeader();

// Equipe: carrossel de pessoas recortadas. A do centro fica na frente, maior, com o nome
// embaixo; setas, toque numa pessoa da lateral, dedo deslizando ou setas do teclado giram a ordem.
const cast = $('#cast');
if (cast) initCast(cast);

function initCast(cast) {
  const people = $$('.cast-person', cast);
  const stage = $('.cast-stage', cast);
  const nameEl = $('.cast-name', cast);

  const n = people.length;
  // posição na tela por distância até o centro: 0 = centro, 1 = direita, -1 = esquerda
  const SPOTS = { 0: { left: 50, scale: 0.92, z: 3 }, 1: { left: 80, scale: 0.76, z: 2 }, '-1': { left: 20, scale: 0.76, z: 2 } };
  const OFF_LEFT = { left: -15, scale: 0.6, z: 1 };
  const OFF_RIGHT = { left: 115, scale: 0.6, z: 1 };
  let active = 0; // começa pela primeira foto (Dra. Cláudia, a principal)

  function layout() {
    people.forEach((img, i) => {
      let d = (i - active + n) % n;
      if (d > n / 2) d -= n;
      const spot = SPOTS[d];
      img.classList.toggle('is-side', d !== 0);
      img.classList.toggle('is-off', !spot);
      // fora de cena: fica além da lateral do lado em que saiu/vai entrar, nunca atrás de quem está no
      // centro (antes ficava no meio e aparecia "fantasma" pelas partes transparentes da foto do centro)
      const s = spot || (d < 0 ? OFF_LEFT : OFF_RIGHT);
      // posição em px a partir do centro (transform puro, sem mexer no left)
      const dx = ((s.left - 50) / 100) * stage.clientWidth;
      img.style.transform = `translateX(calc(-50% + ${dx.toFixed(1)}px)) scale(${s.scale})`;
      img.style.zIndex = s.z;
      img.alt = d === 0 ? img.dataset.name : '';
    });
    nameEl.textContent = people[active].dataset.name;

  }
  const go = (step) => { active = (active + step + n) % n; layout(); };

  $('.cast-prev', cast).addEventListener('click', () => go(-1));
  $('.cast-next', cast).addEventListener('click', () => go(1));
  people.forEach((img, i) => img.addEventListener('click', () => { if (i !== active) { active = i; layout(); } }));
  cast.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  });

  // Deslizar o dedo (ou arrastar o mouse) sobre as fotos
  let startX = null;
  stage.addEventListener('pointerdown', (e) => { if (!e.target.closest('.cast-arrow')) startX = e.clientX; });
  stage.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  });
  stage.addEventListener('pointercancel', () => { startX = null; });

  window.addEventListener('resize', layout);
  layout();
}

// Tour em vídeo: o vídeo avança (e volta) conforme a pessoa rola a página.
// O movimento só acontece quando a pessoa rola, então fica ativo mesmo com
// prefers-reduced-motion (só sem a suavização). Sem JS, é um vídeo comum com controles.
const tour = $('#tour');
if (tour && !tour.hidden) initTour(tour); // escondido: não ativa nem baixa o vídeo

function initTour(tour) {
  const END = 33.0; // para antes da tela final do Instagram (escurece a partir de 33,3 s; vídeo tem 37,6 s)
  const EASE = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 0.18;
  const video = $('.tour-video', tour);
  const sticky = $('.tour-sticky', tour);
  const steps = $$('.tour-step', tour);
  const fill = $('.tour-bar-fill', tour);
  const hint = $('.tour-hint', tour);
  let target = 0;
  let current = 0;
  let ticking = false;

  tour.classList.add('is-scrub');
  video.removeAttribute('controls');

  function progress() {
    const total = tour.offsetHeight - sticky.offsetHeight;
    const p = -tour.getBoundingClientRect().top / total;
    return Math.min(1, Math.max(0, p));
  }

  function seek() {
    if (video.readyState >= 1 && !video.seeking && Math.abs(video.currentTime - current) > 0.02) {
      video.currentTime = current;
    }
  }

  // Suaviza: o vídeo "persegue" a posição da rolagem em vez de pular
  function tick() {
    current += (target - current) * EASE;
    if (Math.abs(target - current) < 0.01) current = target;
    seek();
    if (current !== target) requestAnimationFrame(tick);
    else ticking = false;
  }

  function onScroll() {
    maybeLoad();
    const p = progress();
    target = p * END;
    fill.style.transform = 'scaleX(' + p + ')';
    hint.classList.toggle('is-hidden', p > 0.02);
    let active = 0;
    steps.forEach((step, i) => { if (target >= Number(step.dataset.at)) active = i; });
    steps.forEach((step, i) => step.classList.toggle('is-active', i === active));
    if (!ticking) { ticking = true; requestAnimationFrame(tick); }
  }

  // Baixa o vídeo inteiro só quando a seção se aproxima (economiza dados no celular).
  // Como blob local, avançar/voltar no vídeo fica instantâneo.
  function loadVideo(src) {
    video.preload = 'auto'; // sem isso o Safari do iPhone não baixa nada (o HTML vem com preload="none")
    video.src = src;
    video.load();
  }
  let requested = false;
  function maybeLoad() {
    if (requested || tour.getBoundingClientRect().top > window.innerHeight * 2.5) return;
    requested = true;
    const src = video.getAttribute('src');
    fetch(src)
      .then((r) => r.blob())
      .then((blob) => {
        // Se o navegador não abrir o blob (versões antigas do Safari), usa o arquivo direto
        video.addEventListener('error', () => loadVideo(src), { once: true });
        loadVideo(URL.createObjectURL(blob));
      })
      .catch(() => loadVideo(src));
  }

  // O Safari do iPhone só carrega e desenha os quadros depois de um play. Como o vídeo é mudo,
  // o play automático costuma ser permitido; no Modo de Pouca Energia não é, e aí um toque
  // na tela (ou no botão sobre o vídeo) libera.
  const unlockBtn = $('.tour-unlock', tour);
  let unlocked = false;
  function unlock() {
    if (unlocked || video.preload !== 'auto') return;
    video.muted = true;
    const playing = video.play();
    if (!playing) return;
    playing
      .then(() => { video.pause(); unlocked = true; unlockBtn.hidden = true; seek(); })
      .catch(() => { if (video.preload === 'auto') unlockBtn.hidden = false; });
  }
  video.addEventListener('loadedmetadata', unlock);
  video.addEventListener('loadeddata', () => { unlock(); seek(); });
  unlockBtn.addEventListener('click', unlock);
  ['touchend', 'click'].forEach((type) => document.addEventListener(type, unlock, { passive: true }));
  video.addEventListener('seeked', seek);

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
}

// "Como chegar": abre o app de mapas que a pessoa já tem, sem mandar baixar outro.
// iPhone → Apple Maps (vem instalado) já com a rota; Android → lista dos apps de mapa
// instalados (Google Maps, Waze...); computador → Google Maps no navegador (link do HTML).
const mapLink = $('.map-card');
if (mapLink) {
  mapLink.addEventListener('click', (e) => {
    const ua = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const android = /Android/i.test(ua);
    if (!iOS && !android) return;
    e.preventDefault();
    const dest = encodeURIComponent(DESTINO);
    if (iOS) {
      location.href = 'https://maps.apple.com/?daddr=' + dest + '&dirflg=d';
      return;
    }
    // Se nenhum app abrir (ex.: navegador interno do Instagram), cai no Google Maps pelo navegador
    const fallback = setTimeout(() => { if (!document.hidden) location.href = mapLink.href; }, 1500);
    document.addEventListener('visibilitychange', () => clearTimeout(fallback), { once: true });
    location.href = 'geo:0,0?q=' + dest;
  });
}
