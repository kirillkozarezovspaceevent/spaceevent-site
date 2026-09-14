/* One controller for decorative video: lazy load, visibility and explicit pause. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const videos = [...document.querySelectorAll('video[data-managed]')];
  const visible = new Set();
  const paused = new Set();
  const buttons = new Map();
  function update(video) {
    if (reduce.matches || document.hidden || !visible.has(video) || paused.has(video)) {
      video.pause(); return;
    }
    if (!video.dataset.loaded) {
      video.querySelectorAll('source[data-src]').forEach(source => { source.src = source.dataset.src; });
      video.load(); video.dataset.loaded = 'true';
    }
    video.muted = true; video.defaultMuted = true; video.playsInline = true;
    video.play().catch(() => {});
  }
  const observer = new IntersectionObserver(entries => entries.forEach(({target,isIntersecting}) => {
    if (isIntersecting) visible.add(target); else visible.delete(target);
    update(target);
  }), {threshold:0.05});
  videos.forEach(video => {
    const host = video.closest('.backstage-frame, .meft-video-wrap, section') || video.parentElement;
    host.classList.add('managed-video-host');
    const button = document.createElement('button');
    button.className = 'video-toggle'; button.type = 'button';
    const sync = () => {
      button.textContent = video.paused ? 'Включить видео' : 'Пауза видео';
      button.setAttribute('aria-label', video.paused ? 'Включить фоновое видео' : 'Приостановить фоновое видео');
    };
    button.addEventListener('click', () => {
      if (!video.paused) { paused.add(video); video.pause(); }
      else { paused.delete(video); update(video); }
      sync();
    });
    video.addEventListener('play', sync); video.addEventListener('pause', sync);
    sync(); host.append(button); buttons.set(video,button); observer.observe(video);
  });
  document.addEventListener('visibilitychange', () => videos.forEach(update));
  reduce.addEventListener('change', () => videos.forEach(update));
})();
