var theme = true;

/*
    Menu
*/

function toggleMenuItem(event) {
    const listItem = event.target.parentNode;
    if (listItem.classList.contains("leaf")) return;

    listItem.querySelector("label").classList.toggle("open");
    slideToggle(listItem.querySelector(".submenu"));

    const versionSelector = listItem.querySelector(".version-selector")
    if (versionSelector) {
      versionSelector.style.display = listItem.classList.contains("open") ? "block" : "none";
    }
}

// Vanilla JS slideToggle implementation
function slideToggle(element) {
    if (element.style.display === "none" || element.style.display === "") {
        element.style.display = "block";
    } else {
        element.style.display = "none";
    }
}

function menuToggleClick(event) {
    if (event.target.tagName !== "LABEL") return;
    event.preventDefault();
    toggleMenuItem(event);
}

function renderVersion() {
    var urlVersion = getVersionFromURL();

    /*
    var versionSelector = document.querySelector(".arangodb-version");
    if (!version || version === "platform") {
      versionSelector.style.display = "none";
    } else {
      versionSelector.style.display = "block";
    }
    */

    if (urlVersion) {
      var versionSelector = document.querySelector(".version-selector");
      if (versionSelector) {
        versionSelector.style.display = "block";
      }
      var version = "version-" + urlVersion.replace('.', '_');
      var menuEntry = document.querySelectorAll('.version-menu .submenu');
      for ( let entry of menuEntry ) {
          if (entry.classList.contains(version)) {
              entry.style.display = 'block';
          } else {
              entry.style.display = 'none';
          }
      }
    }
}

function closeAllEntries() {
    document.querySelectorAll(".dd-item.active").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".dd-item > label.open").forEach(el => el.classList.remove("open"));
    document.querySelectorAll(".submenu").forEach(el => el.style.display = "none");
    document.querySelectorAll(".version-selector").forEach(el => el.style.display = "none");
    document.querySelectorAll(".dd-item.parent").forEach(el => el.classList.remove("parent"));
}

function loadMenu(url) {
    closeAllEntries();
    var version = getVersionFromURL()
    if (version) {

      document.querySelector(".version-selector").style.display = "block";

      /*
      document.querySelectorAll('.version-menu.version-' + version.replace('.', '_') + ' a').forEach(function(link) {
          const oldHref = link.getAttribute('href');
          const newHref = oldHref.replace(oldHref.split("/")[1], version);
          link.setAttribute('href', newHref);
      });
      */
    }

    // Try to find the menu item - first try exact match, then try without hash
    console.log('loadMenu: Looking for URL:', url);
    var current = document.querySelector('.dd-item > a[href="' + url + '"]');
    console.log('loadMenu: Exact match found:', current);
    
    if (!current && url.includes('#')) {
        // Try without the hash fragment
        const urlWithoutHash = url.split('#')[0];
        console.log('loadMenu: Trying without hash:', urlWithoutHash);
        current = document.querySelector('.dd-item > a[href="' + urlWithoutHash + '"]');
        console.log('loadMenu: Without hash found:', current);
    }
    if (!current) {
        // Try to find by pathname only (in case of different origins or protocols)
        const pathname = new URL(url, window.location.origin).pathname;
        console.log('loadMenu: Trying pathname only:', pathname);
        current = document.querySelector('.dd-item > a[href="' + pathname + '"]');
        console.log('loadMenu: Pathname match found:', current);
    }
    
    if (current) {
        console.log('loadMenu: Found menu item, expanding parents');
        current = current.parentNode;
        current.classList.add("active");
        let expandedCount = 0;
        while (current && !current.classList.contains("topics") && !current.classList.contains("collapsible-menu")) {
            if (current.tagName === "LI") {
                console.log('loadMenu: Expanding parent LI:', current);
                current.classList.add("parent");
                const label = current.querySelector("label");
                if (label) {
                    label.classList.add("open");
                    console.log('loadMenu: Added open class to label');
                }
                const versionSelector = current.querySelector(".version-selector");
                if (versionSelector) {
                  versionSelector.style.display = "block";
                }
                const submenu = current.querySelector(".submenu");
                if (submenu) {
                    submenu.style.display = "block";
                    expandedCount++;
                    console.log('loadMenu: Set submenu display to block, count:', expandedCount);
                }
            }
            current = current.parentNode;
        }
        console.log('loadMenu: Total submenus expanded:', expandedCount);
    } else {
        console.log('loadMenu: No menu item found for URL:', url);
    }
}

function showSidebarHandler() {
    document.querySelectorAll(".sidebar").forEach(el => el.classList.toggle("active"));
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
  if (!urlPath || urlPath == window.location.pathname + window.location.hash) {
    return
  } 
  
  window.history.pushState("navchange", "ArangoDB Documentation", urlPath);
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

  /*
  var versionUrl = getVersionFromURL();
  if (versionUrl !== "platform" && getVersionInfo(versionUrl) == undefined) {
    loadNotFoundPage();
    return;
  }
  */
  /*
  getCurrentVersion(href);
  renderVersion();
  loadMenu(new URL(href).pathname);
  var version = getVersionInfo(getVersionFromURL()).name;
  href = href.replace(getVersionFromURL(), version);*/
  var menuPathName = new URL(href).pathname;
  console.log(menuPathName);
  loadMenu(menuPathName);
  fetch(href)
    .then(response => {
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
      loadNotFoundPage(href)
    });
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
  //aliazeLinks('article', 'a.link:not([target]), a.card-link, a.header-link');
  //aliazeLinks('.breadcrumbs', 'a')
  linkToVersionedContent();
}



window.addEventListener('popstate', function (e) {
  var state = e.state;
  if (state !== null) {
    loadPage(window.location.href);
  }
});

window.addEventListener('hashchange', function (e) {
  window.history.pushState("popstate", "ArangoDB Documentation", window.location.href);
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

function isUsingAlias() {
  let urlVersion = getVersionFromURL();
  for (let v of versions) {
    if (urlVersion == v.alias) return true;
  }
  return false;
}

function aliazeLinks(parentSelector, linkSelector) {
  if (!isUsingAlias()) return;
  let nameAliasMapping = {};
  for (let v of versions) {
    nameAliasMapping[v.name] = v.alias;
  }

  document.querySelectorAll(parentSelector + ' ' + linkSelector).forEach(function(link) {
    const old = link.getAttribute("href");
    if (old == undefined || old.startsWith("#")) return;
    let splitLink = old.split("/");
    let linkVersion = splitLink[1];
    let alias = nameAliasMapping[linkVersion] || linkVersion;
    splitLink.splice(1, 1, alias);
    link.setAttribute("href", splitLink.join("/"));
  });
}

function setVersionSelector(version) {
  for(let option of document.querySelector(".arangodb-version").options) {
    if (option.value == version) {
      option.selected = true;
    }
  }
}

function getCurrentVersion(href) {
  if (!stableVersion) return; // Only defined for /arangodb
  var newVersion = stableVersion.name

  if (window.location.pathname.split("/").length > 0) {
    newVersion = getVersionFromURL();
    if (newVersion !== "arangodb") {
      return;
    }
    if ((href === "" || href === "/") && getVersionInfo(newVersion) == undefined) {
      loadNotFoundPage();
      return;
    }
  }

  localStorage.setItem('docs-version', newVersion);
  setVersionSelector(newVersion);
}


function changeVersion() {
    var versionSelector = document.querySelector(".arangodb-version");
    var newVersion = versionSelector.options[versionSelector.selectedIndex].value;

    try {
      localStorage.setItem('docs-version', newVersion);
      renderVersion();
      window.setupDocSearch(newVersion);
    } catch(exception) {
      console.log({exception})
      changeVersion();
    }

    var currentVersion = getVersionFromURL();
    //var newVersionAlias = getVersionInfo(newVersion).alias;
    if (!currentVersion) {
      var newUrl = window.location.pathname = "/" + newVersion + "/";
    } else {
      var newUrl = window.location.pathname.replace(currentVersion, newVersion) + window.location.hash;
    }
    updateHistory(newUrl);
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
    var homepage = "/"; // + getVersionFromURL() + "/";
    updateHistory(homepage);
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
  if (!currentVersion) return;
  document.querySelectorAll("a.link:not([target])").forEach(el => {
    const matches = el.getAttribute("href").match(/^\/(\d\.\d{1,2})(\/.*)/);
    const previousVersion = localStorage.getItem('docs-version') || "stable";
    if (matches && matches.length > 2 && previousVersion) {
      el.setAttribute("href", "/" + previousVersion + matches[2]);
    }
  });
}

// Central click handler using event delegation
function handleDocumentClick(event) {
    const target = event.target;
    const closest = (selector) => target.closest(selector);
    
    // Menu link clicks
    if (closest('.menu-link')) {
        event.preventDefault();
        const menuLink = closest('.menu-link');
        const href = menuLink.getAttribute('href');
        if (href) {
            updateHistory(href);
        }
        document.querySelectorAll('.sidebar.mobile').forEach(el => el.classList.remove("active"));
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
    
    // Menu toggle clicks (labels)
    if (target.tagName === "LABEL" && closest('.sidebar')) {
        event.preventDefault();
        toggleMenuItem(event);
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
 
    // Sidebar toggle
    if (closest('.sidebar-toggle')) {
        showSidebarHandler();
        return;
    }
}

window.onload = () => {
    window.history.pushState("popstate", "ArangoDB Documentation", window.location.href);
    trackPageView(document.title, window.location.pathname);

    var iframe =  document.querySelector('.menu-iframe');
    var iFrameBody = iframe.contentDocument || iframe.contentWindow.document;
    content = iFrameBody.querySelector('.sidebar');

    iframe.replaceWith(content);

    getCurrentVersion(window.location.href);
    renderVersion();
    loadPage(window.location.href)

    if (getVersionInfo(getVersionFromURL()) != undefined) {
      window.setupDocSearch(getVersionInfo(getVersionFromURL()).name);
    } else {
      window.setupDocSearch(stableVersion);
    }

    // Add central click handler to document
    document.addEventListener("click", handleDocumentClick);

    var isMobile = window.innerWidth <= 768;
    if (isMobile) {
        document.querySelectorAll('.sidebar').forEach(el => el.classList.add("mobile"));
        document.querySelectorAll('.sidebar.mobile').forEach(el => el.classList.remove("active"));
    }

    //const pageWrapper = document.querySelector('.page-wrapper');
    //if (pageWrapper) pageWrapper.style.opacity = "1";
}