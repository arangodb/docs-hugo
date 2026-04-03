var ZOOM_STEP = 0.2;
var MIN_ZOOM = 0.5;
var MAX_ZOOM = 5;

function wrapMermaidDiagrams() {
  document.querySelectorAll('.mermaid[data-processed="true"] > svg').forEach(function(svg) {
    var mermaidEl = svg.parentElement;
    if (mermaidEl.dataset.zoomInit) return;
    mermaidEl.dataset.zoomInit = '1';

    var container = document.createElement('div');
    container.className = 'mermaid-container';

    var toolbar = document.createElement('div');
    toolbar.className = 'mermaid-toolbar';
    toolbar.innerHTML =
      '<button class="mermaid-btn mermaid-zoom-in" title="Zoom in">+</button>' +
      '<button class="mermaid-btn mermaid-zoom-out" title="Zoom out">&minus;</button>' +
      '<button class="mermaid-btn mermaid-zoom-reset" title="Reset zoom">&#x27F3;</button>';

    var viewport = document.createElement('div');
    viewport.className = 'mermaid-viewport';

    mermaidEl.parentNode.insertBefore(container, mermaidEl);
    viewport.appendChild(mermaidEl);
    container.appendChild(toolbar);
    container.appendChild(viewport);

    var scale = 1;
    function applyZoom() {
      svg.style.transform = 'scale(' + scale + ')';
    }

    toolbar.querySelector('.mermaid-zoom-in').addEventListener('click', function() {
      scale = Math.min(MAX_ZOOM, scale + ZOOM_STEP);
      applyZoom();
    });
    toolbar.querySelector('.mermaid-zoom-out').addEventListener('click', function() {
      scale = Math.max(MIN_ZOOM, scale - ZOOM_STEP);
      applyZoom();
    });
    toolbar.querySelector('.mermaid-zoom-reset').addEventListener('click', function() {
      scale = 1;
      applyZoom();
      viewport.scrollTo(0, 0);
    });

    viewport.addEventListener('wheel', function(e) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale - e.deltaY * 0.005));
      applyZoom();
    }, { passive: false });

    var dragging = false, startX, startY, sLeft, sTop;
    viewport.addEventListener('mousedown', function(e) {
      dragging = true;
      viewport.classList.add('dragging');
      startX = e.pageX;
      startY = e.pageY;
      sLeft = viewport.scrollLeft;
      sTop = viewport.scrollTop;
    });
    window.addEventListener('mousemove', function(e) {
      if (!dragging) return;
      viewport.scrollLeft = sLeft - (e.pageX - startX);
      viewport.scrollTop = sTop - (e.pageY - startY);
    });
    window.addEventListener('mouseup', function() {
      dragging = false;
      viewport.classList.remove('dragging');
    });
  });
}

window.initMermaidZoom = function() {
  var attempts = 0;
  var checkInterval = setInterval(function() {
    wrapMermaidDiagrams();
    attempts++;
    if (attempts > 20 || !document.querySelector('.mermaid:not([data-zoom-init])')) {
      clearInterval(checkInterval);
    }
  }, 200);
};

// Run on initial page load
window.initMermaidZoom();
