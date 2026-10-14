// Laboratório Montividiu — agendamento rápido via WhatsApp
// Troque o número abaixo se o WhatsApp do laboratório for outro (DDI + DDD + número, só dígitos).
const WHATSAPP = '556434049442';

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

// Tour em vídeo: o vídeo avança (e volta) conforme a pessoa rola a página.
// O movimento só acontece quando a pessoa rola, então fica ativo mesmo com
// prefers-reduced-motion (só sem a suavização). Sem JS, é um vídeo comum com controles.
const tour = $('#tour');
if (tour) initTour(tour);

function initTour(tour) {
  const END = 35.4; // para antes da tela final do Instagram (vídeo tem 37,6 s)
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
  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    const src = video.getAttribute('src');
    fetch(src)
      .then((r) => r.blob())
      .then((blob) => { video.src = URL.createObjectURL(blob); })
      .catch(() => { video.preload = 'auto'; video.load(); });
  }, { rootMargin: '150% 0px' });
  io.observe(tour);

  video.addEventListener('loadeddata', () => {
    // iOS só desenha quadros depois de um play; o vídeo é mudo, então é permitido
    video.play().then(() => { video.pause(); seek(); }).catch(seek);
  });
  video.addEventListener('seeked', seek);

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
}
