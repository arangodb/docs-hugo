var theme = true;

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

function decodeHtmlEntities(text) {
  var ta = document.createElement("textarea");
  ta.innerHTML = text;
  return ta.value;
}

function replaceArticle(href, newDoc) {
  var re = /<title>(.*?)<\/title>/;
  var match = re.exec(newDoc);

  /* TODO: Replace with DOMParser?
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = newDoc;
  const newContainer = tempDiv.querySelector(".container-main");
  const currentContainer = document.querySelector(".container-main");
  
  if (newContainer && currentContainer) {
    currentContainer.parentNode.replaceChild(newContainer, currentContainer);
  }
  */
  $(".container-main").replaceWith($(".container-main", newDoc));
  if (match) {
    document.title = decodeHtmlEntities(match[1]);
  }

  if (matches = href.match(/.*?(#.*)$/)) {
    location.hash = matches[1];
  }
}


function updateHistory(urlPath) {
  console.log("updateHistory: " + urlPath);
  if (!urlPath || urlPath == window.location.pathname + window.location.hash) {
    return
  } 
  
  window.history.pushState("navchange", "Arango Documentation", urlPath);
  if (!urlPath.startsWith("#")) trackPageView(document.title, urlPath);

  var popStateEvent = new PopStateEvent('popstate', { state: "navchange" });
  dispatchEvent(popStateEvent);
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
      return true;
    })
    .catch(error => console.error('Error loading not found page:', error));
}


function loadPage(target) {
  var href = target;

  var menuPathName = new URL(href).pathname;
  console.log(menuPathName);
  
  fetch(href)
    .then(response => {
      if (!response.ok) {
        // Handle 404 and other HTTP errors
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      if (response.url && href.replace(/#.*/, "") !== response.url) {
        updateHistory(response.url.replace(version, getVersionFromURL()));
        return;
      }
      return response.text();
    })
    .then(newDoc => {
      if (!newDoc) return;
      if (!newDoc.includes("<body>")) {
        // https://github.com/gohugoio/hugo/blob/master/tpl/tplimpl/embedded/templates/alias.html
        var match = /<title>(.*?)<\/title>/.exec(newDoc)[1];
        updateHistory(match.replace(version, getVersionFromURL()))
        return;
      }
      replaceArticle(href, newDoc)
      scrollToFragment();
      initArticle(href);
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

function updateActiveNavItem(pathname) {
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
  }
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
    if (!versionInfo) {
      console.log("Selected version not found in version info");
    }
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

    mainNavPlaceholder.appendChild(mainNavContent);
    
    // Set initial active state
    updateActiveNavItem(window.location.pathname);
  } catch (error) {
    console.error("Error loading navigation:", error);
    mainNavPlaceholder.textContent = "Failed to load navigation";
  }
  return true;
}

function trackPageView(title, urlPath) {
  if (window.gtag) {
    gtag('config', 'G-6PSX8LKTTJ', {
      'page_title': title,
      'page_path': urlPath
    });
  }

  var _hsq = window._hsq = window._hsq || [];
  _hsq.push(['setPath', urlPath]);
  _hsq.push(['trackPageView']);
}

function initArticle(url) {
  restoreTabSelections();
  initCopyToClipboard();
  addShowMoreButton('article');
  hideEmptyOpenapiDiv();
  goToTop();
  styleImages();
  linkToVersionedContent();
  updateActiveNavItem(window.location.pathname);
}



window.addEventListener('popstate', function (e) {
  var state = e.state;
  if (state !== null) {
    loadPage(window.location.href);
  }
});

window.addEventListener('hashchange', function (e) {
  window.history.pushState("popstate", "Arango Documentation", window.location.href);
  scrollToFragment()
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

  allTabItems.forEach(item => item.classList.remove("selected"));
  targetTabItems.forEach(item => item.classList.add("selected"));
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



function goToHomepage(event){
    event.preventDefault();
    updateHistory("/");
}

function copyURI(evt) {
    navigator.clipboard.writeText(
      window.location.origin + evt.target.closest("a").getAttribute('href')
    ).then(() => {}, () => {
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

function linkToVersionedContent() {
  const currentVersion = getVersionFromURL();
  if (currentVersion) {
    if (currentVersion !== "stable" && currentVersion !== "devel") return;
    document.querySelectorAll(".link:not([target]), .card-link:not([target])").forEach(el => {
      const originalUrl = el.getAttribute("href");
      const matches = originalUrl.match(/^\/arangodb\/(.+?)(\/.*)/);
      if (matches && matches.length > 2) {
        const newUrl = "/arangodb/" + currentVersion + matches[2];
        console.log("linkToVersionedContent: " + originalUrl + " -> " + newUrl);
        el.setAttribute("href", newUrl);
      }
    });
  } else {
    document.querySelectorAll(".link:not([target], .nav-prev, .nav-next), .card-link:not([target])").forEach(el => {
      const originalUrl = el.getAttribute("href");
      const matches = originalUrl.match(/^\/arangodb\/(.+?)(\/.*)/);
      const previousVersion = localStorage.getItem('docs-version') ?? "stable";
      if (matches && matches.length > 2 && previousVersion) {
        const newUrl = "/arangodb/" + previousVersion + matches[2];
        console.log("linkToVersionedContent: " + originalUrl + " -> " + newUrl);
        el.setAttribute("href", newUrl);
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
    
    window.setupDocSearch(selectedVersion);

    localStorage.setItem('docs-version', selectedVersion); // TODO: handle multiple
    target.closest(".nav-section").querySelectorAll(":scope > .nav-ol").forEach(
      el => {
        if (el.dataset.version == selectedVersion) {
          el.classList.add("selected-version");
        } else {
          el.classList.remove("selected-version");
        }
      }
    );
    
    //if (currentPath.startsWith(versionedPath)) {
    //  currentPath.indexOf("/", versionedPath.length)
    //}

    const corePath = "/arangodb/";
    if (currentPath.startsWith(corePath)) {
      const idx = currentPath.indexOf("/", corePath.length);
      const newPath = window.location.origin + corePath + selectedVersion + currentPath.slice(idx) + window.location.hash;
      console.log("handleDocumentChange: " + newPath);
      updateHistory(newPath);
      loadPage(newPath);
    } else {
      alert("Not viewing versioned content, what to do?");
      // Should update localStorage!
    }
  }
}

// Central click handler using event delegation
function handleDocumentClick(event) {
    const target = event.target;
    const closest = (selector) => target.closest(selector);

    if (target.classList.contains("expand-nav")) return;
  
    // Menu link clicks
    if (target.classList.contains("link-nav")) {
        event.preventDefault();
        target.closest(".main-nav").classList.remove("active");
        document.querySelectorAll(".link-nav-active").forEach(el => el.classList.remove("link-nav-active"));
        target.classList.add("link-nav-active");
        closeAllEntries();
        document.querySelectorAll(".nav-section:has(.link-nav-active) > .nav-section-header > .expand-nav > input").forEach(el => el.checked = true);
        if (target.parentElement.classList.contains("nav-section-header")) {
          target.parentElement.querySelector(".expand-nav > input").checked = true;
        }
        const href = target.getAttribute('href');
        if (href) {
            updateHistory(href);
        } else {
          throw new Error("Nav link has no href");
        }
        return;
    }
    
    // Internal link clicks (.link)
    const linkElement = closest('.link');
    if (linkElement && !linkElement.getAttribute("target")) {
        event.preventDefault();
        let href = linkElement.getAttribute('href');
        if (href) {
            updateHistory(href);
        }
        return;
    }
    
    // Card link clicks
    if (closest('.card-link')) {
        event.preventDefault();
        const cardLink = closest('.card-link');
        const href = cardLink.getAttribute('href');
        if (href) {
            updateHistory(href);
        }
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
    if (closest('.header-link')) {
        copyURI(event);
        return;
    }
    
    // Expand shortcode clicks
    if (closest('.expand-label')) {
        event.preventDefault();
        toggleExpandShortcode(event);
        return;
    }
    
    // Homepage clicks
    if (closest('.home-link')) {
        goToHomepage(event);
        return;
    }
 
    // Mobile menu toggle
    if (closest('.sidebar-toggle-navigation')) {
        showSidebarHandler();
        return;
    }
}

window.onload = () => {

    loadNav().catch(err => console.error("Failed to initialize navigation:", err));

    window.history.pushState("popstate", "Arango Documentation", window.location.href);
    trackPageView(document.title, window.location.pathname);

    const currentVersion = getVersionFromURL();
    if (currentVersion) {
      localStorage.setItem('docs-version', currentVersion);
    }

    loadPage(window.location.href)

    if (getVersionInfo(getVersionFromURL()) != undefined) {
      window.setupDocSearch(getVersionInfo(getVersionFromURL()).name);
    } else {
      window.setupDocSearch(stableVersion);
    }

    // Add central click handler to document
    document.addEventListener("click", handleDocumentClick);

    document.addEventListener("change", handleDocumentChange);

    var isMobile = window.innerWidth <= 768;
    if (isMobile) {
        document.querySelectorAll('.main-nav').forEach(el => el.classList.add("mobile", "active"));
    }

    //const pageWrapper = document.querySelector('.page-wrapper');
    //if (pageWrapper) pageWrapper.style.opacity = "1";
}