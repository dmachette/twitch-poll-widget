// loader-tmi.js — tries local tmi.min.js then falls back to CDN
(function(){
  function inject(src, onload){
    const s = document.createElement('script');
    s.src = src;
    s.onload = onload;
    s.onerror = function(){ console.warn('Failed to load', src); };
    document.head.appendChild(s);
  }

  // Try to fetch local file quickly; if 404 or error -> load CDN
  fetch('tmi.min.js', { method: 'HEAD' })
    .then(resp => {
      if (resp.ok) {
        inject('tmi.min.js', () => console.log('Loaded local tmi.min.js'));
      } else {
        console.warn('Local tmi.min.js not found; loading CDN');
        inject('https://cdn.jsdelivr.net/npm/tmi.js@1.8.5/dist/tmi.min.js', () => console.log('Loaded tmi.js from CDN'));
      }
    })
    .catch(() => {
      inject('https://cdn.jsdelivr.net/npm/tmi.js@1.8.5/dist/tmi.min.js', () => console.log('Loaded tmi.js from CDN'));
    });
})();
