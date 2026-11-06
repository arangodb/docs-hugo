var theme = true;

let _mermaid = null;
async function renderMermaidDiagrams() {
  var nodes = document.querySelectorAll('.mermaid:not([data-processed])');
  if (!nodes.length) return;
  try {
    if (!_mermaid) {
      let mermaidjs = await import('https://cdn.jsdelivr.net/npm/mermaid@11.14.0/dist/mermaid.esm.min.mjs');
      _mermaid = mermaidjs.default;
      _mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        /* Same as the pre.mermaid background in theme.css */
        themeVariables: { edgeLabelBackground: '#f3f4f6' },
      });
    }
    try {
      await _mermaid.run({ nodes });
    } catch (err) {
      /* Mermaid puts an error graphic in place of the offending diagram. Carry
         on so that a single malformed diagram does not cost the other diagrams
         on the page their image viewer. */
      console.warn('Mermaid rendering failed', err);
    }
    // Lets theme.css style the diagrams also when cloned into the image viewer
    nodes.forEach(node => node.querySelector(':scope > svg')?.classList.add('mermaid-diagram'));
    prepareZoomables();
  } catch (err) {
    console.warn('Mermaid rendering failed', err);
  }
}

// Expands or collapses a navigation section (the button announces the state)
function setSectionExpanded(section, expanded) {
    section.classList.toggle("expanded", expanded);
    const button = section.querySelector(":scope > .nav-section-header > .expand-nav, :scope > .nav-section-sticky > .nav-section-header > .expand-nav");
    if (button) button.setAttribute("aria-expanded", expanded);
}

function closeAllEntries() {
    document.querySelectorAll(".main-nav .nav-section.expanded").forEach(section => setSectionExpanded(section, false));
}

// Expands the sections containing the current page (or its closest section)
function expandCurrentPath() {
    document.querySelectorAll(".main-nav .nav-section:is(:has(.link-nav-active), .nav-section-current)").forEach(section => setSectionExpanded(section, true));
}

function showSidebarHandler() {
    document.querySelectorAll(".main-nav").forEach(el => el.classList.toggle("active"));
}

// Page-level search boxes (e.g. on the home page) open the DocSearch modal.
// They are wired here because inline scripts in loaded page content don't run.
const isMacPlatform = /Mac|iPhone|iPad/.test(navigator.platform);

function openSearch() {
    const btn = document.querySelector(".DocSearch-Button");
    if (btn) {
        btn.click();
        return;
    }
    // Fallback: dispatch Ctrl/Cmd+K so DocSearch's global shortcut opens the modal
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", code: "KeyK", keyCode: 75, metaKey: isMacPlatform, ctrlKey: !isMacPlatform, bubbles: true }));
}

function setSearchShortcutLabels() {
    // The HTML default "Ctrl K" covers non-Mac platforms
    if (!isMacPlatform) return;
    document.querySelectorAll("[data-search-kbd]").forEach(el => el.textContent = "⌘ K");
}

function toggleSidebarCollapsed() {
    const collapsed = document.body.classList.toggle("sidebar-collapsed");
    try {
        localStorage.setItem("docs-sidebar-collapsed", collapsed ? "1" : "0");
    } catch (e) {}
    // The two buttons act as one: the focus moves to the other one, so that
    // the sidebar can be collapsed and expanded again without tabbing
    const toggle = document.querySelector(collapsed ? ".sidebar-expand" : ".sidebar-collapse");
    if (toggle && document.activeElement?.matches(".sidebar-collapse, .sidebar-expand")) {
        toggle.focus({ preventScroll: true });
    }
}


/*

 Load page

*/

var isMobile=false;

function replaceArticle(href, newDoc) {
  // Inert document: nothing loads or runs until a node is inserted into ours.
  var parsed = new DOMParser().parseFromString(newDoc, "text/html");
  var newContainer = parsed.querySelector(".container-main");
  var currentContainer = document.querySelector(".container-main");

  if (newContainer && currentContainer) {
    currentContainer.replaceWith(newContainer);
  } else {
    console.error("No .container-main to swap in from " + href);
  }
  // Decoded by the parser, unlike a title scraped out of the response text.
  if (parsed.title) {
    document.title = parsed.title;
  }

  // Avoid `location.hash = ...` even when the value matches: Firefox runs the navigation
  // algorithm and clears the current entry's history.state, breaking back/forward. The URL's
  // fragment is already set by the prior pushState/replaceHistory; scrolling is handled by
  // scrollToFragment() in loadPage. If the URL bar is somehow out of sync, replaceState
  // updates it without creating a new (null-state) entry.
  if (matches = href.match(/.*?(#.*)$/)) {
    if (location.hash !== matches[1]) {
      try {
        window.history.replaceState(window.history.state, document.title, matches[0]);
      } catch (e) {
        location.hash = matches[1];
      }
    }
  }
}


function historyUrlMatchesCurrent(urlPath) {
  try {
    var u = new URL(urlPath, window.location.href);
    return u.pathname + u.search + u.hash === window.location.pathname + window.location.search + window.location.hash;
  } catch (e) {
    return false;
  }
}

function isSameDocumentUrl(urlPath) {
  try {
    var u = new URL(urlPath, window.location.href);
    var cur = window.location;
    return u.origin === cur.origin && u.pathname === cur.pathname && u.search === cur.search;
  } catch (e) {
    return false;
  }
}

/**
 * Same-document navigation to a fragment via location.hash so CSS :target updates (pushState does not).
 * If the URL already matches (including hash), only scrolls to the fragment again, like the browser
 * does, without adding a history entry.
 * Returns true if handled; caller should not pushState or scroll.
 */
function navigateSameDocumentFragment(urlPath) {
  try {
    var u = new URL(urlPath, window.location.href);
    if (!isSameDocumentUrl(u.href)) {
      return false;
    }
    var hash = u.hash;
    if (!hash || hash.length <= 1) {
      return false;
    }
    if (historyUrlMatchesCurrent(u.href)) {
      scrollToFragment();
      flashTarget();
      return true;
    }
    window.location.hash = hash;
    return true;
  } catch (e) {
    return false;
  }
}

/*
 * Scroll positions per history entry: going back or forward to another page
 * restores where the reader left it, to another fragment of the same page jumps
 * to its heading. The browser would restore the position before loadPage() has
 * swapped in the content, so this is done manually after the swap.
 */
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

function historyState() {
  return history.state && typeof history.state === "object" ? history.state : {};
}

/*
 * The view of a history entry: the scroll position relative to the heading
 * above it (stays correct if content above changes size), and what was
 * expanded or selected: open details (also OpenAPI properties), selected tabs
 * (not stored as preference, which other pages may have changed), and
 * expanded long code blocks. Restored after loadPage() swapped the page in.
 */
// Content only, not the dropdown of the table of contents (which may come)
const VIEW_DETAILS = "details:not(.toc-details)";

function articleHeadings() {
  return document.querySelectorAll("article :is(h2, h3, h4, h5, h6)[id]");
}

function captureViewState() {
  const article = document.querySelector("article");
  if (!article) return { scrollY: Math.round(window.scrollY) };
  const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  let anchor = null;
  for (const heading of articleHeadings()) {
    const top = heading.getBoundingClientRect().top;
    if (top > padding + 1) break;
    anchor = { id: heading.id, offset: Math.round(padding - top) };
  }
  const tabs = {};
  article.querySelectorAll(".tab-nav-button.selected[data-tab-group]").forEach(tab => {
    tabs[tab.dataset.tabGroup] = tab.dataset.tabItem;
  });
  const indices = (list, test) => [...list].flatMap((el, i) => test(el) ? [i] : []);
  return {
    scrollY: Math.round(window.scrollY),
    anchor,
    open: indices(article.querySelectorAll(VIEW_DETAILS), el => el.open),
    tabs,
    code: indices(article.querySelectorAll("pre > code"), el => el.classList.contains("expanded")),
  };
}

function saveViewState() {
  // While loadPage() fetches the page of a new history entry, the old page is still shown
  if (docKeyWithoutHash(window.location.href) !== docsLastFetchedDocKey) return;
  try {
    history.replaceState({ ...historyState(), ...captureViewState() }, document.title);
  } catch (e) {
    // Browsers limit the rate of history changes
  }
}

// Debounced, replaceState() calls are rate-limited (Safari throws after 100 in 30 seconds).
// Saved continuously because popstate only fires after leaving the entry.
let saveViewStateTimer;
function scheduleSaveViewState() {
  clearTimeout(saveViewStateTimer);
  saveViewStateTimer = setTimeout(saveViewState, 200);
}

window.addEventListener("scroll", scheduleSaveViewState, { passive: true });
// details toggled (doesn't bubble), tabs and Show more clicked
document.addEventListener("toggle", scheduleSaveViewState, true);
document.addEventListener("click", scheduleSaveViewState);

// Also for the back/forward cache and reloads
window.addEventListener("pagehide", saveViewState);

/** Returns true if a saved view was restored (including the scroll position). */
function restoreViewState() {
  const state = historyState();
  if (typeof state.scrollY !== "number") return false;
  const article = document.querySelector("article");
  if (article) {
    const details = article.querySelectorAll(VIEW_DETAILS);
    (state.open || []).forEach(i => {
      const el = details[i];
      if (!el) return;
      el.open = true;
      el.querySelector(":scope > summary")?.classList.remove("collapsed");
    });
    Object.entries(state.tabs || {}).forEach(([group, item]) => switchTab(group, item, undefined, false));
    // After the tabs, which add Show more buttons to code in shown panels
    const code = article.querySelectorAll("pre > code");
    (state.code || []).forEach(i => {
      const el = code[i];
      const button = el && el.nextElementSibling;
      if (!el || !el.classList.contains("code-long") || !button?.classList.contains("code-show-more")) return;
      el.classList.add("expanded");
      button.classList.add("expanded");
    });
  }
  const heading = state.anchor && document.getElementById(state.anchor.id);
  if (heading) {
    const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    window.scrollTo(window.scrollX, heading.getBoundingClientRect().top + window.scrollY - padding + state.anchor.offset);
  } else {
    window.scrollTo(window.scrollX, state.scrollY);
  }
  return true;
}

function updateHistory(urlPath) {
  //console.log("updateHistory: " + urlPath);
  if (!urlPath) {
    return;
  }
  if (historyUrlMatchesCurrent(urlPath)) {
    // Like the browser, a link to the current fragment scrolls to it again
    // (after scrolling elsewhere), without a new history entry
    if (location.hash.length > 1) {
      scrollToFragment();
      flashTarget();
    }
    return;
  }

  clearTimeout(saveViewStateTimer);
  saveViewState();

  // Same page, different fragment only: avoid fetch + synthetic popstate (~1s on slow networks).
  if (isSameDocumentUrl(urlPath)) {
    if (navigateSameDocumentFragment(urlPath)) {
      return;
    }
    window.history.pushState({}, "Arango Documentation", urlPath);
    scrollToFragment();
    return;
  }

  window.history.pushState({}, "Arango Documentation", urlPath);
  //if (!urlPath.startsWith("#")) trackPageView(document.title, urlPath);

  var popStateEvent = new PopStateEvent('popstate', { state: {} });
  window.dispatchEvent(popStateEvent);
}

/**
 * Replaces the current history entry (used after alias/redirect resolution so the intermediate URL is not kept).
 * Does not dispatch a synthetic popstate: doing so after replaceState during initial load can break the
 * forward history (e.g. Firefox). Callers must load content after a successful replace (see loadPage).
 */
function replaceHistory(urlPath) {
  if (!urlPath || historyUrlMatchesCurrent(urlPath)) {
    return false;
  }

  window.history.replaceState(historyState(), "Arango Documentation", urlPath);
  return true;
}

function parseHugoAliasDestination(html) {
  var doc = new DOMParser().parseFromString(html, "text/html");
  var titleEl = doc.querySelector("title");
  if (titleEl) {
    var t = titleEl.textContent.trim();
    if (/^https?:\/\//.test(t) || t.startsWith("/")) {
      return t;
    }
  }
  var metas = doc.getElementsByTagName("meta");
  for (var i = 0; i < metas.length; i++) {
    var equiv = metas[i].getAttribute("http-equiv");
    if (!equiv || equiv.toLowerCase() !== "refresh") {
      continue;
    }
    var content = metas[i].getAttribute("content");
    if (content) {
      content = content.trim();
      var parts = content.split(/;\s*url=/i);
      if (parts.length > 1) {
        return parts.slice(1).join("; url=").trim().replace(/^["']|["']$/g, "");
      }
    }
    var urlAttr = metas[i].getAttribute("url");
    if (urlAttr) {
      return urlAttr.trim();
    }
  }
  return null;
}



function styleImages() {
  images = document.querySelectorAll("[x-style]");
  for (let image of images) {
      styles = image.getAttribute("x-style");
      image.setAttribute("style", styles)
      image.removeAttribute("x-style")
  }
}

/** Origin + pathname + search of the last document we successfully injected (no hash). Used to skip refetch on hash-only history steps. */
var docsLastFetchedDocKey = null;

function docKeyWithoutHash(urlString) {
  try {
    var u = new URL(urlString, window.location.href);
    return u.origin + u.pathname + u.search;
  } catch (e) {
    return null;
  }
}

// CSS :target rule wouldn't wait for scrolling
function flashTarget() {
  const hash = location.hash;
  if (!hash || hash.length < 2) return;
  let el;
  try {
    el = document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch (e) {
    return;
  }
  if (!el) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const trigger = () => {
    el.classList.remove("docs-target-flash");
    void el.offsetWidth; // force reflow so re-adding the class restarts the animation
    el.classList.add("docs-target-flash");
    el.addEventListener("animationend", () => el.classList.remove("docs-target-flash"), { once: true });
  };

  const rect = el.getBoundingClientRect();
  if (rect.top < window.innerHeight && rect.bottom > 0) {
    trigger();
    return;
  }

  const obs = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting)) {
      trigger();
      obs.disconnect();
    }
  });
  obs.observe(el);
  // Fallback if the element never becomes visible (removed, sticky-obscured, etc.).
  setTimeout(() => obs.disconnect(), 2000);
}

function loadPage(target) {
  var href = target;

  var requestedKey = docKeyWithoutHash(href);
  if (docsLastFetchedDocKey !== null && requestedKey !== null && requestedKey === docsLastFetchedDocKey) {
    // Same page: back or forward to a fragment jumps to its heading again
    if (location.hash || !restoreViewState()) {
      scrollToFragment();
    }
    return;
  }

  var menuPathName = new URL(href).pathname;
  //console.log(menuPathName);
  
  // Until the new article is swapped in, errors fall back to a normal navigation
  var swapped = false;
  fetch(href)
    .then(response => {
      // Unknown URLs get 404.html, which is shown like any other page
      if (!response.ok && response.status !== 404) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      if (response.url) {
        var reqBase = new URL(href, window.location.href);
        var resBase = new URL(response.url);
        if (reqBase.origin + reqBase.pathname + reqBase.search !== resBase.origin + resBase.pathname + resBase.search) {
          resBase.hash = reqBase.hash;
          if (!replaceHistory(resBase.pathname + resBase.search + resBase.hash)) {
            return;
          }
          // fetch already followed the redirect; reuse the response body with the resolved URL.
          href = resBase.href;
        }
      }
      return response.text();
    })
    .then(newDoc => {
      if (!newDoc) return;
      if (!newDoc.includes("<body>")) {
        // https://github.com/gohugoio/hugo/blob/master/tpl/tplimpl/embedded/templates/alias.html
        var dest = parseHugoAliasDestination(newDoc);
        if (!dest) {
          console.error("Hugo alias page: could not parse redirect URL");
          return;
        }
        try {
          var destUrl = new URL(dest, window.location.href);
          var fromUrl = new URL(href, window.location.href);
          if (fromUrl.hash) {
            destUrl.hash = fromUrl.hash;
          }
          if (replaceHistory(destUrl.pathname + destUrl.search + destUrl.hash)) {
            loadPage(window.location.href);
          }
        } catch (e) {
          console.error("Hugo alias redirect:", e);
        }
        return;
      }
      replaceArticle(href, newDoc);
      swapped = true;
      docsLastFetchedDocKey = docKeyWithoutHash(href);
      // Collapse code blocks, restore tabs etc. first, they move the target
      initArticle(href);
      if (!restoreViewState()) {
        scrollToFragment();
        flashTarget();
      }
      if (window.setupDocSearch) {
        window.setupDocSearch(getSelectedVersion());
      }
      return true;
    })
    .catch(error => {
      console.error('Error loading page:', error);
      // Network or server errors: let the browser show what it gets. Errors
      // while initializing the new article only need logging.
      if (!swapped) window.location.assign(href);
    });
}

function getSelectedVersion() {
  const version = getVersionFromURL();
  if (version) return version;
  return localStorage.getItem("docs-version") ?? "stable";

  /*
  const storedVersion = localStorage.getItem("docs-version");
  let alias = "stable";
  if (version) {
    alias = getVersionInfo(version).alias;
  } else if (storedVersion) {
    alias = getVersionInfo(storedVersion).alias;
  }
  return alias;
  */
}

function updateActiveNavItem(pathname, scrollIntoView) {
  // Remove all existing active states
  document.querySelectorAll(".link-nav-active").forEach(el => el.classList.remove("link-nav-active"));
  document.querySelectorAll(".nav-section-current").forEach(el => el.classList.remove("nav-section-current"));

  // Collapse all sections first
  closeAllEntries();

  // Find and activate the new item
  const activeItem = document.querySelector(`.main-nav .link-nav[href="${pathname}"]`);
  if (activeItem) {
    activeItem.classList.add("link-nav-active");
    // A section's own page also shows its subpages
    const ownSection = activeItem.parentElement.classList.contains("nav-section-header") && activeItem.closest(".nav-section");
    if (ownSection) setSectionExpanded(ownSection, true);
  } else {
    // Pages without an entry, like the home pages of the ArangoDB versions:
    // the section with the longest matching path contains the current page
    const parts = pathname.split("/").filter(Boolean);
    for (let i = parts.length - 1; i > 0; i--) {
      const link = document.querySelector(`.main-nav .nav-section-header > .link-nav[href="/${parts.slice(0, i).join("/")}/"]`);
      if (link) {
        link.closest(".nav-section").classList.add("nav-section-current");
        break;
      }
    }
  }
  expandCurrentPath();

  // Centered by scrolling the navigation only. scrollIntoView() would also
  // scroll the page and, in Chrome, move the starting point of sequential focus
  // navigation, so that Tab would skip everything before the entry.
  if (activeItem && scrollIntoView) {
    const nav = activeItem.closest(".main-nav");
    const navBox = nav.getBoundingClientRect();
    const itemBox = activeItem.getBoundingClientRect();
    nav.scrollTop += itemBox.top - navBox.top - (nav.clientHeight - itemBox.height) / 2;
  }
}

/*
 * Version selector: a disclosure menu of links to the same page in the other
 * versions (or their home pages on unversioned pages).
 */

// Shows the version in the selector and its navigation, in the document or the fetched navigation
function showVersion(root, version) {
  const versionInfo = getVersionInfo(version);
  const selector = root.querySelector(".version-selector");
  if (!versionInfo || !selector) return;

  const label = versionInfo.name + (versionInfo.label ? " " + versionInfo.label : "")
    + (versionInfo.name != versionInfo.alias ? " (" + versionInfo.alias + ")" : "");
  selector.querySelector(".version-selector-label").textContent = label;

  const pathname = window.location.pathname;
  const corePath = "/arangodb/";
  const rest = pathname.startsWith(corePath) && getVersionFromURL() ? pathname.slice(pathname.indexOf("/", corePath.length)) : "/";
  selector.querySelectorAll(".version-menu-item").forEach(item => {
    item.setAttribute("href", corePath + item.dataset.version + rest);
    if (item.dataset.version == versionInfo.alias) item.setAttribute("aria-current", "true");
    else item.removeAttribute("aria-current");
  });

  selector.closest(".nav-section").querySelectorAll(":scope > .nav-ol").forEach(navList => {
    navList.classList.toggle("selected-version", navList.dataset.version == version);
  });
}

function updateVersionSelector() {
  const currentVersion = getVersionFromURL();
  // Unversioned pages link to the home pages of the versions, for the stored version
  showVersion(document, currentVersion || getSelectedVersion());
  if (!currentVersion || !getVersionInfo(currentVersion)) return;
  localStorage.setItem('docs-version', currentVersion);
}

function setVersionMenuOpen(open) {
  const button = document.querySelector(".version-selector-button");
  const menu = document.querySelector(".version-menu");
  if (!button || !menu) return;
  button.setAttribute("aria-expanded", open);
  menu.hidden = !open;
}

function switchVersion(version) {
  localStorage.setItem('docs-version', version); // TODO: handle multiple
  if (window.setupDocSearch) {
    window.setupDocSearch(version);
  }
  showVersion(document, version);

  const currentPath = window.location.pathname;
  const corePath = "/arangodb/";
  if (currentPath.startsWith(corePath) && currentPath !== corePath) {
    const idx = currentPath.indexOf("/", corePath.length);
    const newPath = window.location.origin + corePath + version + currentPath.slice(idx) + window.location.hash;
    updateHistory(newPath);
    loadPage(newPath);
  } else {
    // Potentially update links to versioned content on unversioned page
    linkToVersionedContent();
  }
}

document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  const button = document.querySelector(".version-selector-button[aria-expanded=true]");
  if (button) {
    setVersionMenuOpen(false);
    button.focus();
  }
});

async function loadNav() {
  const mainNavPlaceholder = document.querySelector(".main-nav");
  if (!mainNavPlaceholder) {
    console.error("Main navigation placeholder not found");
    return;
  }

  try {
    const res = await fetch(window.location.origin + "/nav.html");
    if (!res.ok) {
      mainNavPlaceholder.textContent = "Failed to fetch navigation";
      return;
    }
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, "text/html");

    const mainNavContent = doc.querySelector(".main-nav-ol");
    if (!mainNavContent) {
      mainNavPlaceholder.textContent = "Failed to find navigation content";
      return;
    }

    // TODO: Support multiple versions
    showVersion(mainNavContent, getSelectedVersion());

    mainNavPlaceholder.replaceChildren(mainNavContent);
    observeScrollFade(mainNavPlaceholder);
    observeStickyNavBackground(mainNavPlaceholder);
    
    // Set initial active state
    updateActiveNavItem(window.location.pathname, true);
  } catch (error) {
    console.error("Error loading navigation:", error);
    mainNavPlaceholder.textContent = "Failed to load navigation";
  }
  return true;
}

function trackPageView(title, urlPath) {
  if (window.gtag) {
    gtag('config', 'GTM-5QZJWM4J', {
      'page_title': title,
      'page_path': urlPath
    });
  }
}

// Hugo marks every code block <pre> with tabindex="0" for scrollable code. Code wraps here
// and never scrolls, so the stop leads nowhere.
function dropCodeBlockTabStops() {
  document.querySelectorAll('article pre[tabindex]').forEach(el => el.removeAttribute('tabindex'));
}

function initArticle(url) {
  restoreTabSelections();
  initCopyToClipboard();
  addShowMoreButton('article');
  dropCodeBlockTabStops();
  hideEmptyOpenapiDiv();
  goToTop();
  styleImages();
  closeImageViewer();
  prepareZoomables();
  linkToVersionedContent();
  updateActiveNavItem(window.location.pathname, false);
  updateVersionSelector();
  setSearchShortcutLabels();
  initToc();
  observeBackToTop();
  renderMermaidDiagrams();
}



window.addEventListener('popstate', function (e) {
  // Don't gate on e.state: the browser may clear state from inactive entries.
  // Still need to load the destination page on back/forward.
  // loadPage's docsLastFetchedDocKey guard short-circuits when the URL hasn't really changed.
  loadPage(window.location.href);
});

window.addEventListener("hashchange", function () {
  // No pushState here, updateHistory() / the browser already recorded the URL.
  scrollToFragment();
  flashTarget();
});


/*

 Table of contents

*/

// The table of contents is a column from this width, and collapsible below the page title otherwise
const TOC_COLUMN_QUERY = "(min-width: 1280px)";

function initToc() {
  const details = document.querySelector(".toc-details");
  if (!details) return;
  // Always open in the column, a closed bar with the current section otherwise
  details.open = window.matchMedia(TOC_COLUMN_QUERY).matches;
  // The column or the dropdown entries, whichever scrolls in the current layout
  document.querySelectorAll(".toc, .toc-entries").forEach(observeScrollFade);
  tocTarget = location.hash.slice(1) || null;
  tocHiglighter();
}

/*
 * Fades out the end of a scroll container while there is more to scroll to,
 * by toggling the scroll-fade class (on the navigation and table of contents).
 */
// Observed element (the container or one of its children) → scroll container
const scrollFadeContainers = new WeakMap();
const scrollFadeObserver = new ResizeObserver(entries => {
  const containers = new Set(entries.map(e => scrollFadeContainers.get(e.target)));
  containers.forEach(el => el && updateScrollFade(el));
});

function observeScrollFade(el) {
  if (el.dataset.scrollFade) return;
  el.dataset.scrollFade = "observed";
  el.addEventListener("scroll", () => updateScrollFade(el), { passive: true });
  scrollFadeContainers.set(el, el);
  scrollFadeObserver.observe(el);
  // Also when the content changes size, like expanded navigation sections.
  // The child resizes, but the fade belongs on the container.
  for (const child of el.children) {
    scrollFadeContainers.set(child, el);
    scrollFadeObserver.observe(child);
  }
  updateScrollFade(el);
}

/*
 * Keeps the background of the sticky navigation sections in line with the
 * sidebar's gradient behind them, wherever the sections are in the sidebar.
 */
function observeStickyNavBackground(nav) {
  const stickies = nav.querySelectorAll(".nav-section-sticky");
  const sidebar = nav.closest(".sidebar");
  if (!stickies.length || !sidebar) return;
  let frame = 0;
  const update = () => {
    frame = 0;
    const box = sidebar.getBoundingClientRect();
    // Hidden, like the closed sidebar on mobile
    if (!box.height) return;
    for (const sticky of stickies) {
      sticky.style.setProperty("--sidebar-height", `${box.height}px`);
      sticky.style.setProperty("--sticky-offset", `${sticky.getBoundingClientRect().top - box.top}px`);
    }
  };
  const schedule = () => frame ||= requestAnimationFrame(update);
  nav.addEventListener("scroll", schedule, { passive: true });
  // Also when the sidebar changes size (rotation, browser UI) or the entries
  // above the section expand or collapse
  const observer = new ResizeObserver(schedule);
  observer.observe(sidebar);
  observer.observe(nav);
  for (const child of nav.children) observer.observe(child);
}

function updateScrollFade(el) {
  const scrolls = /auto|scroll/.test(getComputedStyle(el).overflowY);
  el.classList.toggle("scroll-fade", scrolls && el.scrollHeight - el.scrollTop - el.clientHeight > 1);
}

function closeTocDropdown() {
  const details = document.querySelector(".toc-details");
  if (details && details.open && !window.matchMedia(TOC_COLUMN_QUERY).matches) {
    details.open = false;
  }
}

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeTocDropdown();
});

window.matchMedia(TOC_COLUMN_QUERY).addEventListener("change", initToc);

// The heading jumped to (link or deep link). It stays the current one until it
// is scrolled out of view, even if the page can't scroll far enough for it to
// reach the top, like short sections at the end.
let tocTarget = null;

window.addEventListener("hashchange", () => {
  tocTarget = location.hash.slice(1) || null;
  tocHiglighter();
});

function getAllAnchors() {
    let tocIds = [];
    let headlineIds = [];
    // Exclude headline anchors that are not in the ToC
    document.querySelectorAll(".toc-body a").forEach(e => { tocIds.push(e.getAttribute("href").slice(1)) });
    document.querySelector("article").querySelectorAll("h2,h3,h4,h5,h6").forEach(a => { if (tocIds.indexOf(a.id) !== -1) { headlineIds.push(a); } });
    return headlineIds;
}

/*
 * Marks the current section in the table of contents: the heading jumped to
 * while it is in view, otherwise the last heading scrolled past, or Overview
 * above the first one. At the end of the page, the last heading in view.
 */
function tocHiglighter() {
  const toc = document.querySelector(".toc-body");
  if (!toc) return;
  const headings = getAllAnchors();
  const threshold = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) + 16;
  let current = null;

  const target = tocTarget && document.getElementById(tocTarget);
  if (target && headings.includes(target)) {
    const top = target.getBoundingClientRect().top;
    if (top >= 0 && top < window.innerHeight) current = target;
    else tocTarget = null;
  }
  if (!current) {
    const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    for (const heading of headings) {
      const top = heading.getBoundingClientRect().top;
      if (top <= threshold || (atEnd && top < window.innerHeight)) current = heading;
      else break;
    }
  }

  const entry = current
    ? toc.querySelector('a[href="#' + CSS.escape(current.id) + '"]').parentElement
    : toc.querySelector('a[href="#Top"]').parentElement;
  if (entry.classList.contains("is-active")) return;
  toc.querySelectorAll(".is-active").forEach(el => el.classList.remove("is-active"));
  entry.classList.add("is-active");
  // The bar on narrow screens shows the current section
  const label = document.querySelector(".toc-current");
  if (label) label.textContent = entry.textContent.trim();
  if (!window.matchMedia(TOC_COLUMN_QUERY).matches) return;
  // Keep it in view if the table of contents scrolls
  const container = toc.closest(".toc");
  const box = entry.getBoundingClientRect();
  const view = container.getBoundingClientRect();
  if (box.top < view.top || box.bottom > view.bottom) {
    container.scrollTop += box.top - view.top - view.height / 2;
  }
}

function throttle(callback, limit) {
  var waiting = false;
  var pending = null;
  return function () {
    if (waiting) {
      pending = [this, arguments];
      return;
    }
    callback.apply(this, arguments);
    waiting = true;
    setTimeout(function () {
      waiting = false;
      if (pending) {
        callback.apply(pending[0], pending[1]);
        pending = null;
      }
    }, limit);
  }
}

window.addEventListener('scroll', throttle(tocHiglighter, 150));

/*
    Tabs

*/

function switchTab(tabGroup, tabId, event, persist = true) {
  var tabs = document.querySelectorAll(".tab-panel");
  var allTabItems = [];
  var targetTabItems = [];
  
  tabs.forEach(tab => {
    const groupItems = tab.querySelectorAll("[data-tab-group='" + tabGroup + "']");
    const targetItems = tab.querySelectorAll("[data-tab-group='" + tabGroup + "'][data-tab-item='" + tabId + "']");
    if (targetItems.length > 0) {
      allTabItems.push(...groupItems);
      targetTabItems.push(...targetItems);
    }
  });
  
  if (event) {
      var clickedTab = event.target;
      var topBefore = clickedTab.getBoundingClientRect().top;
  }

  allTabItems.forEach(item => {
    item.classList.remove("selected");
    if (item.getAttribute("role") === "tab") {
      item.setAttribute("aria-selected", "false");
      item.tabIndex = -1;
    }
  });
  targetTabItems.forEach(item => {
    item.classList.add("selected");
    if (item.getAttribute("role") === "tab") {
      item.setAttribute("aria-selected", "true");
      item.tabIndex = 0;
    }
  });
  targetTabItems.forEach(item => addShowMoreButton(item));
  
  if (event) {
      // Keep relative offset of tab in viewport to avoid jumping content
      var topAfter = clickedTab.getBoundingClientRect().top;
      window.scrollTo(window.scrollX, window.scrollY + topAfter - topBefore);
  }

  // Store the selection to make it persistent
  if(persist && window.localStorage){
      var selectionsJSON = window.localStorage.getItem("tab-selections");
      if(selectionsJSON){
        var tabSelections = JSON.parse(selectionsJSON);
      }else{
        var tabSelections = {};
      }
      tabSelections[tabGroup] = tabId;
      window.localStorage.setItem("tab-selections", JSON.stringify(tabSelections));
  }
}

// Arrow key navigation within a tablist; activation follows focus.
function handleTabKeydown(event) {
  const tab = event.target;
  if (!tab || tab.getAttribute("role") !== "tab") return;
  const tablist = tab.closest("[role='tablist']");
  if (!tablist) return;

  const tabsInList = Array.from(tablist.querySelectorAll("[role='tab']"));
  const current = tabsInList.indexOf(tab);
  if (current === -1) return;

  var next;
  switch (event.key) {
    case "ArrowRight": next = (current + 1) % tabsInList.length; break;
    case "ArrowLeft":  next = (current - 1 + tabsInList.length) % tabsInList.length; break;
    case "Home":       next = 0; break;
    case "End":        next = tabsInList.length - 1; break;
    default: return;
  }

  event.preventDefault();
  const target = tabsInList[next];
  switchTab(target.getAttribute("data-tab-group"), target.getAttribute("data-tab-item"), event);
  target.focus();
}

function restoreTabSelections() {
  if(window.localStorage){
      var selectionsJSON = window.localStorage.getItem("tab-selections");
      if(selectionsJSON){
        var tabSelections = JSON.parse(selectionsJSON);
      }else{
        var tabSelections = {};
      }
      Object.keys(tabSelections).forEach(function(tabGroup) {
        var tabItem = tabSelections[tabGroup];
        switchTab(tabGroup, tabItem);
      });
  }
}

/*
    Version

*/

var versions
var stableVersion

function getVersionInfo(version) {
  for (let v of versions) {
    if (v.name == version || v.alias == version) return v;
  }

  return undefined;
}

function getVersionFromURL() {
  // TODO: Make this data-driven
  var splitUrl = window.location.pathname.split("/");
  if (splitUrl[1] == "arangodb") return splitUrl[2];
}

/*
    Openapi

*/

function hideEmptyOpenapiDiv() {
    var lists = document.getElementsByClassName("openapi-parameters")
    for (let list of lists) {
        const table = list.querySelector(".openapi-table");
        if (table && table.textContent.trim() == "") {
            list.classList.add("hidden");
        }
    }
 }

 function scrollToFragment() {
  fragment = location.hash.replace("#", "")
  if (fragment) {
    var element = document.getElementById(fragment);
    if (!element) {
      // Like browsers, #top in any case is the top of the page (the Overview entry)
      if (fragment.toLowerCase() === "top") window.scrollTo(window.scrollX, 0);
      return;
    }

    if (element.tagName == "DETAILS") {
      method = fragment.split("_").slice(0,2).join("_")
      fields = fragment.split("_").slice(2)
      for (var i = 0; i < fields.length; i++) {
        field = fields.slice(0, i+1).join("_")
        var el = document.getElementById(method+"_"+field);
        if (!el) continue;
        el.setAttribute("open", "")
        // The first child node is whitespace, not the <summary>
        el.querySelector(":scope > summary")?.classList.remove("collapsed")
      }
    }
    element.scrollIntoView();
  }
 }


/*
    Code blocks

*/

// Chroma renders the code blocks, so the copy button cannot come from a template.
// Clicks go through handleDocumentClick via .copy-trigger/.copy-ancestor/.copy-this.
function initCopyToClipboard() {
    document.querySelectorAll("article pre > code").forEach(code => {
        const pre = code.parentElement;
        if (pre.querySelector(":scope > .copy-trigger")) return; // Already initialized

        pre.classList.add("copy-ancestor");
        code.classList.add("copy-this");

        const button = document.createElement("button");
        button.className = "copy-to-clipboard-button copy-trigger";
        button.setAttribute("type", "button");
        button.setAttribute("title", "Copy to clipboard");
        button.setAttribute("aria-label", "Copy to clipboard");
        code.before(button);
    });
}

function addShowMoreButton(parentElem) {
    const roots = typeof parentElem === "string" ? document.querySelectorAll(parentElem) : [parentElem];
    roots.forEach(root => {
        root.querySelectorAll("pre > code").forEach(code => {
            let noCollapse = false;
            let wrapper = code.closest(".highlight");
            if (wrapper) {
                noCollapse = wrapper.classList.contains("no-collapse");
            }
            // n-times line-height * root em, larger than to-be-applied max-height to always reveal some lines
            // False for currently collapsed code ("Show output" with display: none)
            if (!noCollapse && !code.classList.contains("code-long") && code.scrollHeight > 20 * 1.8 * 16) {
                code.classList.add("code-long");
                const showMore = document.createElement("button");
                showMore.className = "code-show-more";
                code.after(showMore);
            }
        });
    });
}


/*
    Common custom functions

*/

// Back to top is shown once the page title is scrolled out of view
let backToTopObserver;
function observeBackToTop() {
  if (backToTopObserver) backToTopObserver.disconnect();
  const button = document.querySelector(".back-to-top");
  const title = document.querySelector("article hgroup");
  if (!button || !title) return;
  backToTopObserver = new IntersectionObserver(([entry]) => {
    button.classList.toggle("hidden", entry.isIntersecting || entry.boundingClientRect.top > 0);
  });
  backToTopObserver.observe(title);
}

// Moves the keyboard focus to the start of the main content, so that tabbing
// continues from there (the button hides itself at the top of the page)
function focusMainContent(options) {
  document.getElementById("main-content")?.focus(options);
}

const goToTop = (event) => {
    if (event != undefined) {     // Comes from the back-to-top button
      window.scrollTo({top: 0});
      focusMainContent({ preventScroll: true });
    }

    if (window.location.hash.length == 0)
        window.scrollTo({top: 0});
};

function copyURI(evt) {
    const link = evt.target.closest("a");
    const href = link.getAttribute("href");
    const url = new URL(href, window.location.href).href;

    navigator.clipboard.writeText(url).then(() => {
      // CSS shows a checkmark
      link.classList.add("tooltipped");
      setTimeout(() => link.classList.remove("tooltipped"), 1500);
    }, () => {
      console.log("clipboard copy failed");
    });

    if (navigateSameDocumentFragment(url)) {
      return;
    }
    updateHistory(url);
}

// Copies the .copy-this text within the trigger's .copy-ancestor. CSS shows the checkmark.
function copyFromScope(trigger) {
  const scope = trigger.closest(".copy-ancestor");
  const source = scope && scope.querySelector(".copy-this");
  if (!source) {
    console.log("Copy button without a .copy-this element in its .copy-ancestor");
    return;
  }

  navigator.clipboard.writeText(source.textContent).then(() => {
    trigger.classList.add("tooltipped");
    setTimeout(() => trigger.classList.remove("tooltipped"), 1000);
  }, () => {
    console.log("clipboard copy failed");
  });
}

function toggleExpandShortcode(event) {
    var t = event.target.closest("a");
    var parent = t.parentNode;
    if (parent.classList.contains('expand-expanded') && parent.classList.contains('expand-marked')) {
        t.nextElementSibling.style.display = 'none';
    } else if (parent.classList.contains('expand-marked')) {
        t.nextElementSibling.style.display = 'block';
    } else {
        const nextElement = t.querySelector('.expand-content') || t.nextElementSibling;
        if (nextElement) {
            slideToggle(nextElement);
        }
    }
    parent.classList.toggle('expand-expanded');
}

function getLinkHref(el) {
  return el.getAttribute("href") || el.getAttributeNS("http://www.w3.org/1999/xlink", "href");
}

function setLinkHref(el, url) {
  el.setAttribute("href", url);
  if (el.namespaceURI === "http://www.w3.org/2000/svg") {
    el.setAttributeNS("http://www.w3.org/1999/xlink", "href", url);
  }
}

function linkToVersionedContent() {
  const currentVersion = getVersionFromURL();
  if (currentVersion) {
    if (currentVersion !== "stable" && currentVersion !== "devel") return;
    document.querySelectorAll(".link:not([target], [data-unversioned]), .card-link:not([target], [data-unversioned]), .header-link").forEach(el => {
      const originalUrl = getLinkHref(el);
      const matches = originalUrl && originalUrl.match(/^\/arangodb\/(.+?)(\/.*)/);
      if (matches && matches.length > 2) {
        const newUrl = "/arangodb/" + currentVersion + matches[2];
        //console.log("linkToVersionedContent: " + originalUrl + " -> " + newUrl);
        setLinkHref(el, newUrl);
      }
    });
  } else {
    document.querySelectorAll(".link:not([target], .nav-prev, .nav-next, [data-unversioned]), .card-link:not([target], [data-unversioned])").forEach(el => {
      const originalUrl = getLinkHref(el);
      const matches = originalUrl && originalUrl.match(/^\/arangodb\/(.+?)(\/.*)/);
      const previousVersion = localStorage.getItem('docs-version') ?? "stable";
      if (matches && matches.length > 2 && previousVersion) {
        const newUrl = "/arangodb/" + previousVersion + matches[2];
        //console.log("linkToVersionedContent: " + originalUrl + " -> " + newUrl);
        setLinkHref(el, newUrl);
      }
    });
    // Previous/next page links to the first or last page of the selected version
    document.querySelectorAll(".nav-prev[data-versions], .nav-next[data-versions]").forEach(el => {
      const link = JSON.parse(el.dataset.versions)[getSelectedVersion()];
      if (!link) return;
      setLinkHref(el, link.href);
      el.querySelector("p").innerHTML = link.title;
    });
  }
}

// Central click handler using event delegation
function handleDocumentClick(event) {
    const target = event.target;
    const closest = (selector) => target.closest(selector);

    // Skip link: past the navigation and breadcrumbs to the page title, without
    // a fragment in the URL. Tabbing continues with the table of contents.
    if (closest(".skip-link")) {
        event.preventDefault();
        const title = document.querySelector("#main-content h1");
        if (title) {
            title.tabIndex = -1;
            title.focus();
        } else {
            focusMainContent();
        }
        return;
    }

    // Navigation sections
    const expandButton = closest(".expand-nav");
    if (expandButton) {
        const section = expandButton.closest(".nav-section");
        setSectionExpanded(section, !section.classList.contains("expanded"));
        return;
    }

    // Version selector
    if (closest(".version-selector-button")) {
        setVersionMenuOpen(closest(".version-selector-button").getAttribute("aria-expanded") != "true");
        return;
    }
    const versionItem = closest(".version-menu-item");
    if (!versionItem) setVersionMenuOpen(false);

    // Choosing an entry or clicking elsewhere closes the dropdown on narrow screens
    if (!closest(".toc-details") || closest(".toc-body a")) {
        closeTocDropdown();
    }

    // Also for the fragment that is already in the URL (no hashchange)
    const tocLink = closest(".toc-body a");
    if (tocLink) {
        tocTarget = tocLink.getAttribute("href").slice(1);
        setTimeout(tocHiglighter);
    }

    // Allow browser default for non-primary buttons (middle/right) and modifier clicks
    // (Ctrl/Cmd = new tab, Shift = new window, Alt = download/new tab depending on browser)
    const openInNew = event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey;
  
    // Versions open in a new tab or window like other links
    if (versionItem) {
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        setVersionMenuOpen(false);
        switchVersion(versionItem.dataset.version);
        return;
    }

    // Menu link clicks
    const navLink = target.closest(".link-nav");
    if (navLink) {
        if (openInNew) return;
        event.preventDefault();
        navLink.closest(".main-nav").classList.remove("active");
        document.querySelectorAll(".link-nav-active").forEach(el => el.classList.remove("link-nav-active"));
        navLink.classList.add("link-nav-active");
        document.querySelectorAll(".nav-section-current").forEach(el => el.classList.remove("nav-section-current"));
        closeAllEntries();
        expandCurrentPath();
        if (navLink.parentElement.classList.contains("nav-section-header")) {
          setSectionExpanded(navLink.closest(".nav-section"), true);
        }
        const href = navLink.getAttribute("href");
        if (href) {
            updateHistory(href);
        } else {
          console.log("Nav link has no href");
        }
        return;
    }
  
    // Internal link clicks (.link)
    const internalLink = target.closest(".link");
    if (internalLink && !internalLink.getAttribute("target")) {
        if (openInNew) return;
        event.preventDefault();
        const href = internalLink.getAttribute("href");
        if (href) {
            updateHistory(href);
        }
        return;
    }
  
    // Card link clicks (including SVG links, getLinkHref supports xlink:href)
    const cardLinkEl = closest('.card-link');
    if (cardLinkEl) {
        if (openInNew) return;
        event.preventDefault();
        const href = getLinkHref(cardLinkEl);
        if (href) {
            updateHistory(href);
        }
        return;
    }

    // Copy button clicks (endpoint URLs, code blocks)
    const copyTrigger = closest('.copy-trigger');
    if (copyTrigger) {
        event.preventDefault();
        copyFromScope(copyTrigger);
        return;
    }
  
    // Code show more button clicks
    if (closest('.code-show-more')) {
        target.classList.toggle("expanded");
        const prevElement = target.previousElementSibling;
        if (prevElement) prevElement.classList.toggle("expanded");
        return;
    }
  
    // OpenAPI property clicks
    if (closest('.openapi-prop') && target === closest('.openapi-prop')) {
        target.classList.toggle("collapsed");
        const content = target.querySelector('.openapi-prop-content');
        if (content) content.classList.toggle("hidden");
        return;
    }
  
    // OpenAPI table show children clicks
    if (closest('.openapi-table.show-children')) {
        target.classList.toggle("collapsed");
        const nextTable = target.nextElementSibling;
        if (nextTable && nextTable.classList.contains('openapi-table')) {
            nextTable.classList.toggle("hidden");
        }
        return;
    }
  
    // Tab clicks
    if (target.hasAttribute('data-tab-group') && target.hasAttribute('data-tab-item')) {
        event.preventDefault();
        switchTab(target.getAttribute('data-tab-group'), target.getAttribute('data-tab-item'), event);
        return;
    }
  
    // Back to top button
    if (closest('.back-to-top')) {
        event.preventDefault();
        goToTop(event);
        return;
    }
  
    // Copy URI clicks
    if (closest('.header-link, .openapi-property-link')) {
        if (openInNew) return;
        event.preventDefault();
        copyURI(event);
        return;
    }
  
    // Mobile menu toggle
    if (closest('.sidebar-toggle-navigation')) {
        showSidebarHandler();
        return;
    }

    // Page-level search boxes
    if (closest('[data-open-search]')) {
        openSearch();
        return;
    }

    // Desktop sidebar collapse/expand
    if (closest('.sidebar-collapse, .sidebar-expand')) {
        toggleSidebarCollapsed();
        return;
    }
}

document.addEventListener("DOMContentLoaded", () => {

    loadNav().catch(err => console.error("Failed to initialize navigation:", err));

    // Attach state to the current history entry so popstate can load content on back/forward.
    // Use replaceState (not pushState) to avoid duplicate URL in stack and breaking
    // the forward list when combined with alias resolution
    if (document.body.hasChildNodes()) {
      window.history.replaceState(historyState(), "Arango Documentation", window.location.href);
    }

    const currentVersion = getVersionFromURL();
    if (currentVersion) {
      localStorage.setItem('docs-version', currentVersion);
    }

    // Initialize the server-rendered article in place (also the not found page).
    // Fetching and swapping it again would reset the images to zero height (until
    // decoded) and undo the browser's scroll to the fragment, which can then land
    // in the wrong spot.
    docsLastFetchedDocKey = docKeyWithoutHash(window.location.href);
    initArticle(window.location.href);
    // A saved position means a reload, or a return after the page was evicted
    // from the back/forward cache
    if (!restoreViewState()) {
      scrollToFragment();
      flashTarget();
    }
    if (window.setupDocSearch) {
      window.setupDocSearch(getSelectedVersion());
    }

    // Add central click handler to document
    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleTabKeydown);

    var isMobile = window.innerWidth <= 768;
    if (isMobile) {
        document.querySelectorAll('.main-nav').forEach(el => el.classList.add("mobile"));
    }

    initImageViewer();

});

/*
 * Image viewer
 *
 * Every illustration in an article opens in the same overlay when clicked,
 * whatever it is made of: Markdown images (PNG, JPG, WebP, SVG), the diagram
 * shortcode, SVGs embedded with the embed-svg shortcode, and mermaid diagrams.
 * In the overlay, the illustration can be zoomed with a trackpad or touch
 * pinch, Ctrl/Cmd + mouse wheel, double-click, the toolbar, or the keyboard
 * (+, -, 0), and panned by scrolling, dragging, or with the arrow keys.
 */

const ZOOMABLE_SELECTOR = 'article img, article .svg-figure > svg, article pre.mermaid > svg';
/* Images rendered smaller than this are treated as inline icons. */
// Smaller illustrations, like icons, are shown as they are. The Enlarge hint alone is about this wide.
const ZOOMABLE_MIN_SIZE = 100;
/* How much of the illustration has to stay inside the overlay while panning, in pixels. */
const VIEWER_PAN_GUTTER = 80;
/* Pointer movement in pixels below which a press counts as a click, not a drag. */
const VIEWER_DRAG_THRESHOLD = 5;
const VIEWER_ZOOM_STEP = 1.5;
/* Devices without hover get a permanent button on every illustration instead of
   the hover hint. CSS shows one or the other, so that it changes along with the
   primary input device (a tablet with a mouse, touch emulation, etc.). */
const ZOOM_BADGE_QUERY = '(hover: none)';
/* Illustrations rendered smaller than this get no permanent button, as it would cover them. */
const ZOOM_BADGE_MIN_WIDTH = 96;
const ZOOM_BADGE_MIN_HEIGHT = 64;

const VIEWER_ICONS = {
  'zoom-out': '<path d="M5 12h14"/>',
  'zoom-in': '<path d="M12 5v14M5 12h14"/>',
  'fit': '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  'close': '<path d="M6 6l12 12M18 6L6 18"/>',
  'expand': '<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>',
};

function viewerIcon(name) {
  return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + VIEWER_ICONS[name] + '</svg>';
}

let _viewer = null;
let _zoomHint = null;
let _zoomBadges = [];
let _zoomBadgeObserver = null;
let _zoomBadgeFrame = 0;

/** Marks the illustrations of the current article as zoomable. */
function prepareZoomables() {
  document.querySelectorAll(ZOOMABLE_SELECTOR).forEach(el => {
    if (el.hasAttribute('data-zoomable')) return;
    // Linked images navigate, and opted-out images stay as they are
    if (el.closest('a, button, .no-zoom')) return;
    if (el.tagName === 'IMG' && !el.complete) {
      el.addEventListener('load', prepareZoomables, { once: true });
      return;
    }
    // Content box, the padding of floated icons doesn't make them bigger
    let rect = el.getBoundingClientRect();
    let style = getComputedStyle(el);
    let width = rect.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    let height = rect.height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    if (rect.width && width < ZOOMABLE_MIN_SIZE && height < ZOOMABLE_MIN_SIZE) return;
    el.setAttribute('data-zoomable', '');
    el.setAttribute('tabindex', '0');
    if (!el.querySelector('a')) {
      // An SVG with links in it must not claim to be a single button
      el.setAttribute('role', 'button');
    }
    let label = zoomableCaption(el);
    el.setAttribute('aria-label', label ? 'Enlarge: ' + label : 'Enlarge illustration');
    addZoomBadge(el);
  });
  scheduleZoomBadgeLayout();
}

/* On touch screens, tapping an illustration opens it too, but nothing would
   tell that it can be enlarged, and in diagrams full of links it is easy to
   follow a link instead. A button in the corner of every illustration always
   opens it. The buttons sit on top of the page rather than being wrapped
   around the illustrations, which would change how they are sized. */
function addZoomBadge(el) {
  let button = document.createElement('button');
  button.className = 'image-zoom-badge';
  button.type = 'button';
  // The illustration itself is the keyboard and screen reader target
  button.tabIndex = -1;
  button.setAttribute('aria-hidden', 'true');
  button.innerHTML = viewerIcon('expand');
  button.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    openImageViewer(el);
  });
  document.body.appendChild(button);
  _zoomBadges.push({ el, button });

  if (!_zoomBadgeObserver) {
    // The page growing or shrinking moves the illustrations below the change
    _zoomBadgeObserver = new ResizeObserver(scheduleZoomBadgeLayout);
    _zoomBadgeObserver.observe(document.body);
    window.addEventListener('resize', scheduleZoomBadgeLayout);
    window.matchMedia(ZOOM_BADGE_QUERY).addEventListener('change', scheduleZoomBadgeLayout);
  }
  // Also catches illustrations in tabs and collapsed sections being shown
  _zoomBadgeObserver.observe(el);
}

function scheduleZoomBadgeLayout() {
  if (_zoomBadgeFrame) return;
  _zoomBadgeFrame = requestAnimationFrame(function () {
    _zoomBadgeFrame = 0;
    layoutZoomBadges();
  });
}

function layoutZoomBadges() {
  // Hidden by CSS with hover, no need to position them
  let shown = window.matchMedia(ZOOM_BADGE_QUERY).matches;
  _zoomBadges = _zoomBadges.filter(({ el, button }) => {
    // The illustration is gone after navigating to another page
    if (!document.contains(el)) {
      _zoomBadgeObserver.unobserve(el);
      button.remove();
      return false;
    }
    if (!shown) return true;
    let rect = el.getBoundingClientRect();
    let fits = rect.width >= ZOOM_BADGE_MIN_WIDTH && rect.height >= ZOOM_BADGE_MIN_HEIGHT;
    button.hidden = !fits;
    if (fits) {
      button.style.top = (rect.top + window.scrollY + 6) + 'px';
      button.style.left = (rect.right + window.scrollX - 6) + 'px';
    }
    return true;
  });
}

/* Firefox doesn't scroll links in inline SVGs (diagrams) into view when they
   get the keyboard focus, but (seemingly) to the top of the diagram, so the
   focus can move out of sight. This scrolls them into view instead, or back
   to where the page was if they were in view already. Not in the image viewer,
   which doesn't scroll the page. */
let _svgFocus = null;
// The scroll position when Tab was pressed, as the browser may scroll before
// the focusin event already
let _tabScrollY = null;

document.addEventListener('keydown', function (e) {
  if (e.key !== 'Tab') return;
  _tabScrollY = window.scrollY;
  // The focus moves in the same task
  setTimeout(function () { _tabScrollY = null; });
}, true);

document.addEventListener('focusin', function (e) {
  let link = e.target;
  if (!(link instanceof SVGAElement) || link.closest('.image-viewer')) return;
  // Before the browser's own scrolling
  _svgFocus = { link, scrollY: _tabScrollY ?? window.scrollY };
  // If the browser doesn't scroll (at all, or not in this frame)
  requestAnimationFrame(function () {
    revealFocusedSvgLink();
    _svgFocus = null;
  });
});

// The browser's own scrolling is corrected in the same scroll event, before
// the listener of the table of contents on the window sees the wrong position
// (it would briefly mark the section of the diagram's top as the current one)
document.addEventListener('scroll', revealFocusedSvgLink, { passive: true });

function revealFocusedSvgLink() {
  if (!_svgFocus) return;
  // Undo the browser's scrolling, then scroll only as far as needed (if at all)
  if (window.scrollY !== _svgFocus.scrollY) window.scrollTo(0, _svgFocus.scrollY);
  let delta = svgLinkScrollDelta(_svgFocus.link);
  if (delta) window.scrollBy(0, delta);
  // Where it should stay, if this runs again for the same focus change
  _svgFocus.scrollY = window.scrollY;
}

// How far to scroll for the link to be in view with some room around it, so
// that it isn't at the very edge (or under the URL preview of the browser at
// the bottom), and below the sticky table of contents on narrow screens (the
// scroll padding, which is only for headings jumped to otherwise)
function svgLinkScrollDelta(link) {
  let box = link.getBoundingClientRect();
  let margin = Math.max(48, window.innerHeight * 0.1);
  let sticky = window.matchMedia(TOC_COLUMN_QUERY).matches ? 0
    : parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  let top = sticky + margin;
  let bottom = window.innerHeight - margin;
  if (box.top < top) return box.top - top;
  if (box.bottom > bottom) return box.bottom - bottom;
  return 0;
}

function zoomableCaption(el) {
  let caption = el.closest('figure')?.querySelector('figcaption');
  let text = caption ? caption.textContent.trim() : '';
  return text || el.getAttribute('alt') || '';
}

function initImageViewer() {
  document.addEventListener('click', function (e) {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    // Links inside of an SVG keep working
    if (e.target.closest('a')) return;
    let el = e.target.closest('[data-zoomable]');
    if (!el || el.closest('.image-viewer')) return;
    e.preventDefault();
    openImageViewer(el);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    let el = e.target;
    if (!el.hasAttribute || !el.hasAttribute('data-zoomable')) return;
    e.preventDefault();
    openImageViewer(el);
  });

  /* A button in the corner of the illustration under the pointer, so that it
     is evident that it can be enlarged. Touch devices without hover open the
     viewer with a tap on the illustration itself. */
  _zoomHint = document.createElement('button');
  _zoomHint.className = 'image-zoom-hint';
  _zoomHint.type = 'button';
  _zoomHint.tabIndex = -1;
  _zoomHint.setAttribute('aria-hidden', 'true');
  _zoomHint.innerHTML = viewerIcon('expand') + '<span>Enlarge</span>';
  _zoomHint.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (_zoomHint.target) openImageViewer(_zoomHint.target);
  });
  document.body.appendChild(_zoomHint);

  document.addEventListener('mouseover', function (e) {
    if (e.target === _zoomHint || _zoomHint.contains(e.target)) return;
    let el = e.target.closest('[data-zoomable]');
    if (el && !el.closest('.image-viewer')) showZoomHint(el);
    else hideZoomHint();
  });
  window.addEventListener('resize', hideZoomHint);
}

function showZoomHint(el) {
  if (_zoomHint.target === el && _zoomHint.classList.contains('visible')) return;
  let rect = el.getBoundingClientRect();
  _zoomHint.target = el;
  _zoomHint.style.top = (rect.top + window.scrollY + 8) + 'px';
  _zoomHint.style.left = (rect.right + window.scrollX - 8) + 'px';
  _zoomHint.classList.add('visible');
}

function hideZoomHint() {
  if (!_zoomHint) return;
  _zoomHint.classList.remove('visible');
  _zoomHint.target = null;
}

function getImageViewer() {
  if (_viewer) return _viewer;

  let root = document.createElement('div');
  root.className = 'image-viewer';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Image viewer');
  root.hidden = true;
  // Clicks on the illustration then leave the focus in the dialog for the keyboard shortcuts
  root.tabIndex = -1;
  root.innerHTML = `
    <div class="image-viewer-stage"></div>
    <div class="image-viewer-toolbar">
      <button type="button" data-action="zoom-out" aria-label="Zoom out" title="Zoom out (-)">${viewerIcon('zoom-out')}</button>
      <span class="image-viewer-zoom" aria-live="polite"></span>
      <button type="button" data-action="zoom-in" aria-label="Zoom in" title="Zoom in (+)">${viewerIcon('zoom-in')}</button>
      <button type="button" data-action="fit" aria-label="Reset zoom" title="Reset zoom (0)">${viewerIcon('fit')}</button>
      <button type="button" data-action="close" aria-label="Close" title="Close (Esc)">${viewerIcon('close')}</button>
    </div>
    <p class="image-viewer-caption"></p>`;
  document.body.appendChild(root);

  _viewer = {
    root,
    stage: root.querySelector('.image-viewer-stage'),
    zoomLabel: root.querySelector('.image-viewer-zoom'),
    caption: root.querySelector('.image-viewer-caption'),
    content: null,
    width: 0, height: 0,
    scale: 1, fitScale: 1, minScale: 1, maxScale: 1,
    x: 0, y: 0,
    pointers: new Map(),
    gesture: null,
    dragged: false,
    returnFocus: null,
  };

  root.querySelector('.image-viewer-toolbar').addEventListener('click', function (e) {
    let button = e.target.closest('button');
    if (!button) return;
    let action = button.dataset.action;
    if (action === 'close') closeImageViewer();
    else if (action === 'fit') fitImageViewer();
    else zoomImageViewer(action === 'zoom-in' ? VIEWER_ZOOM_STEP : 1 / VIEWER_ZOOM_STEP);
  });

  /* Runs before the document-wide handlers so that the end of a drag is not
     taken for a click on a link, and so that following a link closes the viewer. */
  root.addEventListener('click', function (e) {
    if (_viewer.dragged) {
      e.preventDefault();
      e.stopPropagation();
      _viewer.dragged = false;
      return;
    }
    if (e.target.closest('a')) {
      closeImageViewer();
      return;
    }
    if (e.target === _viewer.stage || e.target === root) closeImageViewer();
  }, true);

  /* A new press anywhere in the viewer, toolbar included, starts afresh. Touch
     drags are not followed by a click that would reset this otherwise, and the
     next tap, say on the close button, would be swallowed. */
  root.addEventListener('pointerdown', function () {
    if (!_viewer.pointers.size) _viewer.dragged = false;
  }, true);

  root.addEventListener('dblclick', function (e) {
    if (e.target.closest('.image-viewer-toolbar')) return;
    let point = stagePoint(e);
    if (_viewer.scale > _viewer.fitScale * 1.05) fitImageViewer();
    else zoomImageViewer(2.5, point.x, point.y);
  });

  root.addEventListener('keydown', handleImageViewerKeydown);
  _viewer.stage.addEventListener('wheel', handleImageViewerWheel, { passive: false });
  _viewer.stage.addEventListener('pointerdown', handleImageViewerPointerDown);
  _viewer.stage.addEventListener('pointermove', handleImageViewerPointerMove);
  _viewer.stage.addEventListener('pointerup', handleImageViewerPointerUp);
  _viewer.stage.addEventListener('pointercancel', handleImageViewerPointerUp);
  // Browsers start dragging images as files otherwise
  _viewer.stage.addEventListener('dragstart', e => e.preventDefault());
  window.addEventListener('resize', function () {
    if (_viewer.root.hidden) return;
    let atFit = Math.abs(_viewer.scale - _viewer.fitScale) < 1e-6;
    measureImageViewer();
    if (atFit) fitImageViewer();
    else applyImageViewerTransform();
  });

  return _viewer;
}

function openImageViewer(el) {
  let viewer = getImageViewer();
  hideZoomHint();
  let rect = el.getBoundingClientRect();
  let content, width, height, vector;

  if (el.tagName === 'IMG') {
    content = document.createElement('img');
    content.src = el.currentSrc || el.src;
    content.alt = el.alt || '';
    vector = /\.svg(\?|#|$)/i.test(content.src);
    // SVG files without a width and height report a made-up intrinsic size,
    // recognizable by an aspect ratio that differs from the rendered one
    let natural = el.naturalWidth && el.naturalHeight &&
      Math.abs(el.naturalWidth / el.naturalHeight - rect.width / rect.height) < 0.02 * rect.width / rect.height;
    if (!natural) {
      width = rect.width;
      height = rect.height;
    } else {
      width = el.naturalWidth;
      height = el.naturalHeight;
    }
  } else {
    content = el.cloneNode(true);
    vector = true;
    let viewBox = el.viewBox && el.viewBox.baseVal;
    if (viewBox && viewBox.width && viewBox.height) {
      width = viewBox.width;
      height = viewBox.height;
    } else {
      width = rect.width;
      height = rect.height;
    }
    // The ID stays, as mermaid scopes the styles of a diagram to it
    for (let attr of ['style', 'width', 'height', 'tabindex', 'role', 'aria-label', 'data-zoomable']) {
      content.removeAttribute(attr);
    }
  }
  if (!width || !height) return;

  content.classList.add('image-viewer-content');
  content.setAttribute('draggable', 'false');
  if (viewer.content) viewer.content.remove();
  viewer.stage.appendChild(content);
  Object.assign(viewer, { content, width, height, vector, pageScale: rect.width / width });

  let caption = el.closest('figure')?.querySelector('figcaption')?.textContent.trim() || '';
  viewer.caption.textContent = caption;
  viewer.caption.hidden = !caption;

  viewer.returnFocus = document.activeElement;
  viewer.root.hidden = false;
  document.body.classList.add('image-viewer-open');
  measureImageViewer();
  openImageViewerAtPageSize();
  viewer.root.querySelector('[data-action="close"]').focus();
}

function closeImageViewer() {
  if (!_viewer || _viewer.root.hidden) return;
  _viewer.root.hidden = true;
  document.body.classList.remove('image-viewer-open');
  _viewer.pointers.clear();
  _viewer.gesture = null;
  if (_viewer.content) {
    _viewer.content.remove();
    _viewer.content = null;
  }
  let focus = _viewer.returnFocus;
  _viewer.returnFocus = null;
  if (focus && document.contains(focus)) focus.focus({ preventScroll: true });
}

/** The part of the overlay that the toolbar and caption leave free, in stage coordinates. */
function imageViewerArea() {
  let viewer = _viewer;
  let bounds = viewer.stage.getBoundingClientRect();
  let margin = Math.min(32, bounds.width * 0.04);
  let toolbar = viewer.root.querySelector('.image-viewer-toolbar').getBoundingClientRect();
  let top = toolbar.bottom - bounds.top + 12;
  let bottom = viewer.caption.hidden ? margin : bounds.bottom - viewer.caption.getBoundingClientRect().top + 12;
  return {
    left: margin,
    top,
    width: bounds.width - 2 * margin,
    height: bounds.height - top - bottom,
  };
}

/** Works out the scale that fits the illustration into the overlay and the zoom range around it. */
function measureImageViewer() {
  let viewer = _viewer;
  let area = imageViewerArea();
  let fit = Math.min(area.width / viewer.width, area.height / viewer.height);
  // Vector graphics may grow to fill the screen, but pixel images not beyond their actual size
  viewer.fitScale = viewer.vector ? fit : Math.min(fit, 1);
  viewer.minScale = viewer.fitScale / 2;
  viewer.maxScale = Math.max(viewer.fitScale * 10, 4);
}

function fitImageViewer() {
  let viewer = _viewer;
  let area = imageViewerArea();
  viewer.scale = viewer.fitScale;
  viewer.x = area.left + (area.width - viewer.width * viewer.scale) / 2;
  viewer.y = area.top + (area.height - viewer.height * viewer.scale) / 2;
  applyImageViewerTransform();
}

/* Fitting a tall illustration into the screen can make it smaller than it is
   on the page, which defeats enlarging it. Start at its own size instead, as
   far as it fits the width, and never smaller than on the page, aligned to the
   top so that reading starts at the beginning. */
function openImageViewerAtPageSize() {
  let viewer = _viewer;
  let area = imageViewerArea();
  let scale = Math.max(viewer.pageScale, Math.min(area.width / viewer.width, 1));
  if (scale <= viewer.fitScale) {
    fitImageViewer();
    return;
  }
  viewer.scale = Math.min(scale, viewer.maxScale);
  viewer.x = area.left + (area.width - viewer.width * viewer.scale) / 2;
  viewer.y = area.top;
  applyImageViewerTransform();
}

/** Zooms by the given factor while keeping the point (stage coordinates) under the pointer in place. */
function zoomImageViewer(factor, originX, originY) {
  let viewer = _viewer;
  if (originX === undefined) {
    let bounds = viewer.stage.getBoundingClientRect();
    originX = bounds.width / 2;
    originY = bounds.height / 2;
  }
  let scale = Math.min(viewer.maxScale, Math.max(viewer.minScale, viewer.scale * factor));
  let ratio = scale / viewer.scale;
  viewer.x = originX - (originX - viewer.x) * ratio;
  viewer.y = originY - (originY - viewer.y) * ratio;
  viewer.scale = scale;
  applyImageViewerTransform();
}

function panImageViewer(dx, dy) {
  _viewer.x += dx;
  _viewer.y += dy;
  applyImageViewerTransform();
}

/** Pans as little as needed for the element to be in the free area, with some room around it. */
function panImageViewerTo(el) {
  let bounds = _viewer.stage.getBoundingClientRect();
  let area = imageViewerArea();
  let box = el.getBoundingClientRect();
  let margin = 24;
  let left = box.left - bounds.left;
  let top = box.top - bounds.top;
  let dx = 0, dy = 0;
  // The start of the element wins if it is larger than the area
  if (left + box.width > area.left + area.width - margin) dx = area.left + area.width - margin - (left + box.width);
  if (left + dx < area.left + margin) dx = area.left + margin - left;
  if (top + box.height > area.top + area.height - margin) dy = area.top + area.height - margin - (top + box.height);
  if (top + dy < area.top + margin) dy = area.top + margin - top;
  if (dx || dy) panImageViewer(dx, dy);
}

/* The illustration is resized rather than scaled with a CSS transform, so
   that browsers redraw vector graphics sharply at every zoom level. */
function applyImageViewerTransform() {
  let viewer = _viewer;
  let bounds = viewer.stage.getBoundingClientRect();
  let width = viewer.width * viewer.scale;
  let height = viewer.height * viewer.scale;
  viewer.x = Math.min(bounds.width - VIEWER_PAN_GUTTER, Math.max(VIEWER_PAN_GUTTER - width, viewer.x));
  viewer.y = Math.min(bounds.height - VIEWER_PAN_GUTTER, Math.max(VIEWER_PAN_GUTTER - height, viewer.y));
  let content = viewer.content;
  content.style.width = width + 'px';
  content.style.height = height + 'px';
  content.style.transform = `translate(${viewer.x}px, ${viewer.y}px)`;
  viewer.zoomLabel.textContent = Math.round(viewer.scale / viewer.fitScale * 100) + '%';
  viewer.root.querySelector('[data-action="zoom-in"]').disabled = viewer.scale >= viewer.maxScale;
  viewer.root.querySelector('[data-action="zoom-out"]').disabled = viewer.scale <= viewer.minScale;
  // Fitting is only offered when it changes something, so that it does not look broken
  let area = imageViewerArea();
  viewer.root.querySelector('[data-action="fit"]').disabled =
    Math.abs(viewer.scale - viewer.fitScale) < 1e-6 &&
    Math.abs(viewer.x - (area.left + (area.width - width) / 2)) < 1 &&
    Math.abs(viewer.y - (area.top + (area.height - height) / 2)) < 1;
  // A button that was just disabled drops the focus, and the keyboard shortcuts with it
  if (document.activeElement?.disabled) viewer.root.focus({ preventScroll: true });
}

function stagePoint(e) {
  let bounds = _viewer.stage.getBoundingClientRect();
  return { x: e.clientX - bounds.left, y: e.clientY - bounds.top };
}

/* Scrolling pans, like on a page, so that tall illustrations can be read from
   top to bottom. Pinching a trackpad (which browsers report as a wheel event
   with ctrlKey) or holding Ctrl or Cmd while scrolling zooms. */
function handleImageViewerWheel(e) {
  e.preventDefault();
  let unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
  if (e.ctrlKey || e.metaKey) {
    // Pinches send many small deltas, mouse wheels few large ones: cap each
    // step at about 30% so that both feel alike
    let delta = Math.max(-25, Math.min(25, e.deltaY * unit));
    let factor = Math.exp(-delta * 0.01);
    let point = stagePoint(e);
    zoomImageViewer(factor, point.x, point.y);
    return;
  }
  let dx = e.deltaX * unit;
  let dy = e.deltaY * unit;
  // Shift turns a mouse wheel into horizontal scrolling
  if (e.shiftKey && !dx) [dx, dy] = [dy, 0];
  panImageViewer(-dx, -dy);
}

function handleImageViewerPointerDown(e) {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  let viewer = _viewer;
  viewer.pointers.set(e.pointerId, stagePoint(e));
  viewer.gesture = imageViewerGesture();
}

function handleImageViewerPointerMove(e) {
  let viewer = _viewer;
  if (!viewer.pointers.has(e.pointerId) || !viewer.gesture) return;
  viewer.pointers.set(e.pointerId, stagePoint(e));
  let gesture = imageViewerGesture();
  let start = viewer.gesture;

  if (!viewer.dragged) {
    if (Math.hypot(gesture.x - start.originX, gesture.y - start.originY) < VIEWER_DRAG_THRESHOLD &&
        Math.abs(gesture.distance - start.originDistance) < VIEWER_DRAG_THRESHOLD) return;
    viewer.dragged = true;
    // Only capture once it is a drag, so that clicks still reach links and the backdrop
    viewer.stage.setPointerCapture(e.pointerId);
    viewer.root.classList.add('dragging');
  }

  if (gesture.distance && start.distance) {
    zoomImageViewer(gesture.distance / start.distance, gesture.x, gesture.y);
  }
  panImageViewer(gesture.x - start.x, gesture.y - start.y);
  gesture.originX = start.originX;
  gesture.originY = start.originY;
  gesture.originDistance = start.originDistance;
  viewer.gesture = gesture;
}

function handleImageViewerPointerUp(e) {
  let viewer = _viewer;
  viewer.pointers.delete(e.pointerId);
  viewer.gesture = viewer.pointers.size ? imageViewerGesture() : null;
  if (!viewer.pointers.size) viewer.root.classList.remove('dragging');
}

/** The midpoint of the active pointers and, for a pinch, the distance between the first two. */
function imageViewerGesture() {
  let points = Array.from(_viewer.pointers.values());
  let x = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  let y = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  let distance = points.length > 1 ? Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) : 0;
  return { x, y, distance, originX: x, originY: y, originDistance: distance };
}

function handleImageViewerKeydown(e) {
  let pan = 60;
  switch (e.key) {
    case 'Escape': closeImageViewer(); break;
    case '+': case '=': zoomImageViewer(VIEWER_ZOOM_STEP); break;
    case '-': case '_': zoomImageViewer(1 / VIEWER_ZOOM_STEP); break;
    case '0': fitImageViewer(); break;
    case 'ArrowLeft': panImageViewer(pan, 0); break;
    case 'ArrowRight': panImageViewer(-pan, 0); break;
    case 'ArrowUp': panImageViewer(0, pan); break;
    case 'ArrowDown': panImageViewer(0, -pan); break;
    case 'Tab': {
      // Keep the focus inside of the dialog
      let focusable = Array.from(_viewer.root.querySelectorAll('button:not(:disabled), a'));
      if (!focusable.length) break;
      let index = focusable.indexOf(document.activeElement);
      let next = e.shiftKey ? index - 1 : index + 1;
      let target = focusable[(next + focusable.length) % focusable.length];
      // The illustration is moved with a transform, not scrolled, so the
      // browser can't bring a link in it into view. It is panned instead.
      target.focus({ preventScroll: true });
      if (_viewer.content && _viewer.content.contains(target)) panImageViewerTo(target);
      break;
    }
    default: return;
  }
  e.preventDefault();
  e.stopPropagation();
}
