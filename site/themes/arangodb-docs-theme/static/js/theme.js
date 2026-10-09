var theme = true;

let _mermaid = null;
async function renderMermaidDiagrams() {
  var nodes = document.querySelectorAll('.mermaid:not([data-processed])');
  if (!nodes.length) return;
  try {
    if (!_mermaid) {
      let mermaidjs = await import('https://cdn.jsdelivr.net/npm/mermaid@11.14.0/dist/mermaid.esm.min.mjs');
      _mermaid = mermaidjs.default;
      _mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
    }
    try {
      await _mermaid.run({ nodes });
    } catch (err) {
      /* Mermaid puts an error graphic in place of the offending diagram. Carry
         on so that a single malformed diagram does not cost the other diagrams
         on the page their image viewer. */
      console.warn('Mermaid rendering failed', err);
    }
    prepareZoomables();
  } catch (err) {
    console.warn('Mermaid rendering failed', err);
  }
}

function closeAllEntries() {
    document.querySelectorAll(".main-nav-ol .expand-nav > input:checked").forEach(el => el.checked = false);
}

function showSidebarHandler() {
    document.querySelectorAll(".main-nav").forEach(el => el.classList.toggle("active"));
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
 * If the URL already matches (including hash), clears the fragment first so :target can re-apply.
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
      var base = window.location.pathname + window.location.search;
      window.history.replaceState(window.history.state, document.title, base);
    }
    window.location.hash = hash;
    return true;
  } catch (e) {
    return false;
  }
}

function updateHistory(urlPath) {
  //console.log("updateHistory: " + urlPath);
  if (!urlPath || historyUrlMatchesCurrent(urlPath)) {
    return;
  }

  // Same page, different fragment only: avoid fetch + synthetic popstate (~1s on slow networks).
  if (isSameDocumentUrl(urlPath)) {
    if (navigateSameDocumentFragment(urlPath)) {
      return;
    }
    window.history.pushState("navchange", "Arango Documentation", urlPath);
    scrollToFragment();
    return;
  }

  window.history.pushState("navchange", "Arango Documentation", urlPath);
  //if (!urlPath.startsWith("#")) trackPageView(document.title, urlPath);

  var popStateEvent = new PopStateEvent('popstate', { state: "navchange" });
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

  window.history.replaceState("navchange", "Arango Documentation", urlPath);
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

function loadNotFoundPage() {
  fetch(window.location.origin + "/notfound.html")
    .then(response => response.text())
    .then(newDoc => {
      replaceArticle("", newDoc)
      initArticle("");
      docsLastFetchedDocKey = docKeyWithoutHash(window.location.href);
      flashTarget();
      return true;
    })
    .catch(error => console.error('Error loading not found page:', error));
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
    scrollToFragment();
    return;
  }

  var menuPathName = new URL(href).pathname;
  //console.log(menuPathName);
  
  fetch(href)
    .then(response => {
      if (!response.ok) {
        // Handle 404 and other HTTP errors
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
      docsLastFetchedDocKey = docKeyWithoutHash(href);
      scrollToFragment();
      initArticle(href);
      flashTarget();
      if (window.setupDocSearch) {
        window.setupDocSearch(getSelectedVersion());
      }
      return true;
    })
    .catch(error => {
      console.error('Error loading page:', error);
      loadNotFoundPage(href);
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
  
  // Collapse all sections first
  document.querySelectorAll(".main-nav-ol .expand-nav > input:checked").forEach(el => el.checked = false);
  
  // Find and activate the new item
  const activeItem = document.querySelector(`.link-nav[href="${pathname}"]`);
  if (activeItem) {
    activeItem.classList.add("link-nav-active");
    // Expand all parent sections
    document.querySelectorAll(".nav-section:has(.link-nav-active) > .nav-section-header > .expand-nav > input").forEach(el => el.checked = true);

    if (scrollIntoView) {
      activeItem.scrollIntoView({ behavior: "auto", block: "center" });
    }
  }
}

function updateVersionSelector() {
  const currentVersion = getVersionFromURL();
  if (!currentVersion) return;
  
  const versionInfo = getVersionInfo(currentVersion);
  if (!versionInfo) return;
  
  const versionSelector = document.querySelector(".version-selector");
  if (!versionSelector) return;
  
  // Update the selector value
  if (versionSelector.querySelector(`option[value="${versionInfo.alias}"]`)) {
    versionSelector.value = versionInfo.alias;
  }
  
  // Update which version's navigation list is visible
  versionSelector.closest(".nav-section").querySelectorAll(":scope > .nav-ol").forEach(navList => {
    if (navList.dataset.version == currentVersion) {
      navList.classList.add("selected-version");
    } else {
      navList.classList.remove("selected-version");
    }
  });
  
  // Update localStorage
  localStorage.setItem('docs-version', currentVersion);
}

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
    const selectedVersion = getSelectedVersion();
    const versionInfo = getVersionInfo(selectedVersion);
    if (versionInfo) {
      const selectedVersionAlias = versionInfo.alias;
      const versionSelector = mainNavContent.querySelector(".version-selector");
      if (versionSelector && versionSelector.querySelector(`option[value="${selectedVersionAlias}"]`)) {
        versionSelector.value = selectedVersionAlias;
        
        versionSelector.parentElement.querySelectorAll(":scope > .nav-ol").forEach(navList => {
          if (navList.dataset.version == selectedVersion) {
            navList.classList.add("selected-version");
          } else {  
            navList.classList.remove("selected-version");
          }
        });
      } else {
        console.log("Selected/stored version not available in version selector");
      }
    } else {
      console.log("Selected version not found in version info");
    }

    mainNavPlaceholder.replaceChildren(mainNavContent);
    
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

function getAllAnchors() {
    let tocIds = [];
    let headlineIds = [];
    // Exclude headline anchors that are not in the ToC
    document.querySelectorAll(".TableOfContents a").forEach(e => { tocIds.push(e.getAttribute("href").slice(1)) });
    document.querySelector("article").querySelectorAll("h2,h3,h4,h5,h6").forEach(a => { if (tocIds.indexOf(a.id) !== -1) { headlineIds.push(a); } });
    return headlineIds;
}
function removeActiveFromAllAnchors() {
  var anchors = getAllAnchors();
  anchors.forEach(anchor => {
      var heading = anchor.getAttribute('id')
      let oldHRef = document.querySelector('.TableOfContents a[href="#' + heading + '"]');
      oldHRef.parentElement.classList.remove('is-active');
  });
}
function tocHiglighter() {
  // only do this is screen width > 768px
  if (window.innerWidth <= 768) return;
  var anchors = getAllAnchors();

  var scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  anchors.forEach(anchor => {
    const rect = anchor.getBoundingClientRect();
    const top = rect.top;
    const id = anchor.id;
    const currentHighlighted = document.querySelector('.TableOfContents .is-active a');
    const currentHighlightedHref = currentHighlighted ? currentHighlighted.getAttribute('href') : null;
    if (top < 240 && currentHighlightedHref !== '#' + id) {
      removeActiveFromAllAnchors();
      const highlightedHref = document.querySelector('.TableOfContents a[href="#' + id + '"]');
      highlightedHref.parentElement.classList.add('is-active');
      //highlightedHref.parentElement.scrollIntoView({behavior: "smooth", block: "nearest" });
    }
  });
}

function throttle(callback, limit) {
  var waiting = false;
  return function () {
    if (!waiting) {
      callback.apply(this, arguments);
      waiting = true;
      setTimeout(function () {
        waiting = false;
      }, limit);
    }
  }
}

window.addEventListener('scroll', throttle(function() {
  tocHiglighter();
  backToTopButton();
}, 250));

/*
    Tabs

*/

function switchTab(tabGroup, tabId, event) {
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
  if(window.localStorage){
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
    if (!element) return;

    if (element.tagName == "DETAILS") {
      method = fragment.split("_").slice(0,2).join("_")
      fields = fragment.split("_").slice(2)
      for (var i = 0; i < fields.length; i++) {
        field = fields.slice(0, i+1).join("_")
        var el = document.getElementById(method+"_"+field);
        el.setAttribute("open", "")
        el.childNodes[0].classList.remove("collapsed")
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
            // n-times line-height * root em, larger than to-be-applied max-height to always reveal some lines
            // False for currently collapsed code ("Show output" with display: none)
            if (!code.classList.contains("code-long") && code.scrollHeight > 20 * 1.8 * 16) {
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

function backToTopButton() {
    if (window.scrollY > 100) {
        document.querySelector(".back-to-top").classList.remove("hidden");
    } else {
        document.querySelector(".back-to-top").classList.add("hidden");
    }
}

const goToTop = (event) => {
    if (event != undefined)       // Comes from the back-to-top button
      window.scrollTo({top: 0});

    if (window.location.hash.length == 0)
        window.scrollTo({top: 0});
};

function copyURI(evt) {
    const link = evt.target.closest("a");
    const href = link.getAttribute("href");
    const url = new URL(href, window.location.href).href;

    navigator.clipboard.writeText(url).then(() => {}, () => {
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
    document.querySelectorAll(".link:not([target]), .card-link:not([target]), .header-link").forEach(el => {
      const originalUrl = getLinkHref(el);
      const matches = originalUrl && originalUrl.match(/^\/arangodb\/(.+?)(\/.*)/);
      if (matches && matches.length > 2) {
        const newUrl = "/arangodb/" + currentVersion + matches[2];
        //console.log("linkToVersionedContent: " + originalUrl + " -> " + newUrl);
        setLinkHref(el, newUrl);
      }
    });
  } else {
    document.querySelectorAll(".link:not([target], .nav-prev, .nav-next), .card-link:not([target])").forEach(el => {
      const originalUrl = getLinkHref(el);
      const matches = originalUrl && originalUrl.match(/^\/arangodb\/(.+?)(\/.*)/);
      const previousVersion = localStorage.getItem('docs-version') ?? "stable";
      if (matches && matches.length > 2 && previousVersion) {
        const newUrl = "/arangodb/" + previousVersion + matches[2];
        //console.log("linkToVersionedContent: " + originalUrl + " -> " + newUrl);
        setLinkHref(el, newUrl);
      }
    });
  }
}

function handleDocumentChange(event) {
  const target = event.target;
  if (target.classList.contains("version-selector")) {
    const selectedVersion = target.value;
    const currentPath = window.location.pathname;
    //const versionedPath = target.dataset.path;

    localStorage.setItem('docs-version', selectedVersion); // TODO: handle multiple
    if (window.setupDocSearch) {
      window.setupDocSearch(selectedVersion);
    }
    target.closest(".nav-section").querySelectorAll(":scope > .nav-ol").forEach(
      el => {
        if (el.dataset.version == selectedVersion) {
          el.classList.add("selected-version");
        } else {
          el.classList.remove("selected-version");
        }
      }
    );

    const corePath = "/arangodb/";
    if (currentPath.startsWith(corePath) && currentPath !== corePath) {
      const idx = currentPath.indexOf("/", corePath.length);
      const newPath = window.location.origin + corePath + selectedVersion + currentPath.slice(idx) + window.location.hash;
      //console.log("handleDocumentChange: " + newPath);
      updateHistory(newPath);
      loadPage(newPath);
    } else {
      // Potentially update links to versioned content on unversioned page
      linkToVersionedContent();
    }
  }
}

// Central click handler using event delegation
function handleDocumentClick(event) {
    const target = event.target;
    const closest = (selector) => target.closest(selector);

    if (target.classList.contains("expand-nav")) return;

    // Allow browser default for non-primary buttons (middle/right) and modifier clicks
    // (Ctrl/Cmd = new tab, Shift = new window, Alt = download/new tab depending on browser)
    const openInNew = event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey;
  
    // Menu link clicks
    const navLink = target.closest(".link-nav");
    if (navLink) {
        if (openInNew) return;
        event.preventDefault();
        navLink.closest(".main-nav").classList.remove("active");
        document.querySelectorAll(".link-nav-active").forEach(el => el.classList.remove("link-nav-active"));
        navLink.classList.add("link-nav-active");
        closeAllEntries();
        document.querySelectorAll(".nav-section:has(.link-nav-active) > .nav-section-header > .expand-nav > input").forEach(el => el.checked = true);
        if (navLink.parentElement.classList.contains("nav-section-header")) {
          navLink.parentElement.querySelector(".expand-nav > input").checked = true;
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
  
    // Homepage clicks
    const homeLink = target.closest(".home-link");
    if (homeLink) {
        if (openInNew) return;
        event.preventDefault();
        updateHistory("/");
        return;
    }
 
    // Mobile menu toggle
    if (closest('.sidebar-toggle-navigation')) {
        showSidebarHandler();
        return;
    }
}

document.addEventListener("DOMContentLoaded", () => {

    loadNav().catch(err => console.error("Failed to initialize navigation:", err));

    // Attach state to the current history entry so popstate can load content on back/forward.
    // Use replaceState (not pushState) to avoid duplicate URL in stack and breaking
    // the forward list when combined with alias resolution
    if (document.body.hasChildNodes()) {
      window.history.replaceState("popstate", "Arango Documentation", window.location.href);
    }

    const currentVersion = getVersionFromURL();
    if (currentVersion) {
      localStorage.setItem('docs-version', currentVersion);
    }

    loadPage(window.location.href)

    // Add central click handler to document
    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("change", handleDocumentChange);
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
const ZOOMABLE_MIN_SIZE = 48;
/* How much of the illustration has to stay inside the overlay while panning, in pixels. */
const VIEWER_PAN_GUTTER = 80;
/* Pointer movement in pixels below which a press counts as a click, not a drag. */
const VIEWER_DRAG_THRESHOLD = 5;
const VIEWER_ZOOM_STEP = 1.5;
/* Devices without hover get a permanent button on every illustration instead of the hover hint. */
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
    let rect = el.getBoundingClientRect();
    if (rect.width && rect.width < ZOOMABLE_MIN_SIZE && rect.height < ZOOMABLE_MIN_SIZE) return;
    el.setAttribute('data-zoomable', '');
    el.setAttribute('tabindex', '0');
    if (!el.querySelector('a')) {
      // An SVG with links in it must not claim to be a single button
      el.setAttribute('role', 'button');
    }
    let label = zoomableCaption(el);
    el.setAttribute('aria-label', label ? 'Enlarge: ' + label : 'Enlarge illustration');
    if (window.matchMedia(ZOOM_BADGE_QUERY).matches) addZoomBadge(el);
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
  _zoomBadges = _zoomBadges.filter(({ el, button }) => {
    // The illustration is gone after navigating to another page
    if (!document.contains(el)) {
      _zoomBadgeObserver.unobserve(el);
      button.remove();
      return false;
    }
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
      focusable[(next + focusable.length) % focusable.length].focus();
      break;
    }
    default: return;
  }
  e.preventDefault();
  e.stopPropagation();
}
