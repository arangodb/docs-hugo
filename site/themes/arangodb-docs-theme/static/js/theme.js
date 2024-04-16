var theme = true;

/*
    Menu
*/

function toggleMenuItem(event) {
    const listItem = event.target.parentNode;
    if (listItem.classList.contains("leaf")) return;

    listItem.querySelector("label").classList.toggle("open");
    $(listItem.querySelector(".submenu")).slideToggle();
}

function menuToggleClick(event) {
    if (event.target.tagName !== "LABEL") return;
    event.preventDefault();
    toggleMenuItem(event);
}

function menuEntryClickListener() {
    $('.menu-link').on("click", function(event) {
        event.preventDefault();
        if (event.target.pathname == window.location.pathname) {
            toggleMenuItem(event)
            return
        }
        updateHistory(event.target.getAttribute('href'))
        $('#sidebar.mobile').removeClass("active")

    });
}

function renderVersion() {
    var version = localStorage.getItem('docs-version');
    var menuEntry = document.getElementsByClassName('version-menu');
    for ( let entry of menuEntry ) {
        if (entry.classList.contains(version)) {
            entry.style.display = 'block';
        } else {
            entry.style.display = 'none';
        }
    }
}

function closeAllEntries() {
    $(".dd-item.active").removeClass("active");
    $(".dd-item > label.open").removeClass("open");
    $(".submenu").hide();
    $(".dd-item.parent").removeClass("parent");
}

function loadMenu(url) {
    closeAllEntries();
    var version = getVersionFromURL()

    $('.version-menu.'+version).find('a').each(function() {
      $(this).attr("href", function(index, old) {
          return old.replace(old.split("/")[1], version)
      });
    });

    var current = $('.dd-item > a[href="' + url + '"]').parent();
    current.addClass("active");
    while (current.length > 0 && current.prop("class") != "topics collapsible-menu") {
        if (current.prop("tagName") == "LI") {
            current.addClass("parent");
            current.children("label:first").addClass("open");
            current.children(".submenu:first").show();
        }
        
        current = current.parent();
    }
}

function showSidebarHandler() {
    $("#sidebar").toggleClass("active");
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

  $(".container-main").replaceWith($(".container-main", newDoc));
  if (match) {
    document.title = decodeHtmlEntities(match[1]);
  }

  if (matches = href.match(/.*?(#.*)$/)) {
    location.hash = matches[1];
  }
}


function updateHistory(urlPath) {
  if (urlPath == window.location.pathname + window.location.hash) {
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
  $.get({
    url: window.location.origin + "/notfound.html",
    success: function(newDoc) {
      replaceArticle("", newDoc)
      initArticle("");
      return true;
    },
  });
}


function loadPage(target) {
  var href = target;

  if (getVersionInfo(getVersionFromURL()) == undefined) {
    loadNotFoundPage();
    return;
  }

  getCurrentVersion(href);
  renderVersion();
  loadMenu(new URL(href).pathname);
  var version = getVersionInfo(getVersionFromURL()).name;
  href = href.replace(getVersionFromURL(), version);
  var xhr = new XMLHttpRequest();
  $.get({
    xhr: function() { return xhr; },
    url: href,
    success: function(newDoc) {
      if (xhr.responseURL && href.replace(/#.*/, "") !== xhr.responseURL) {
        updateHistory(xhr.responseURL.replace(version, getVersionFromURL()));
        return;
      }
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
    },
    error: function(newDoc) {
      loadNotFoundPage(href)
    },
  });
}

function internalLinkListener() {
  $('.link').on("click", function(event) {
    if (event.target.getAttribute("target")) {
      // external link
      return;
    }
    event.preventDefault();
    updateHistory(event.target.getAttribute('href'))
  });

  $('.card-link').on('click', function(event) {
    event.preventDefault();
    updateHistory(this.getAttribute('href'))
  });
}

function codeShowMoreListener() {
  $('article').on('click', '.code-show-more', function(event) {
    var t = $(event.target)
    t.toggleClass("expanded")
    t.prev().toggleClass("expanded")
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
  initClickHandlers();
  goToTop();
  styleImages();
  internalLinkListener();
  codeShowMoreListener();
  aliazeLinks('article', 'a.link:not([target]), a.card-link, a.header-link');
  aliazeLinks('#breadcrumbs', 'a')
}



$(window).on('popstate', function (e) {
  var state = e.originalEvent.state;
  if (state !== null) {
    loadPage(window.location.href);
  }
});

$(window).on('hashchange', function (e) {
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
    document.querySelectorAll("#TableOfContents a").forEach(e => { tocIds.push(e.getAttribute("href").slice(1)) });
    document.querySelector("article").querySelectorAll("h2,h3,h4,h5,h6").forEach(a => { if (tocIds.indexOf(a.id) !== -1) { headlineIds.push(a); } });
    return headlineIds;
}
function removeActiveFromAllAnchors() {
  var anchors = getAllAnchors();
  anchors.forEach(anchor => {
      var heading = anchor.getAttribute('id')
      let oldHRef = document.querySelector('#TableOfContents a[href="#' + heading + '"]');
      oldHRef.parentElement.classList.remove('is-active');
  });
}
function tocHiglighter() {
  // only do this is screen width > 768px
  if (window.innerWidth <= 768) return;
  var anchors = getAllAnchors();

  var scrollTop = $(document).scrollTop();

  anchors.forEach(anchor => {
    const rect = anchor.getBoundingClientRect();
    const top = rect.top;
    const id = anchor.id;
    const currentHighlighted = document.querySelector('#TableOfContents .is-active a');
    const currentHighlightedHref = currentHighlighted ? currentHighlighted.getAttribute('href') : null;
    if (top < 240 && currentHighlightedHref !== '#' + id) {
      removeActiveFromAllAnchors();
      const highlightedHref = document.querySelector('#TableOfContents a[href="#' + id + '"]');
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

$(window).scroll(throttle(function() {
  tocHiglighter();
  backToTopButton();
}, 250));

/*
    Tabs

*/

function switchTab(tabGroup, tabId, event) {
  var tabs = jQuery(".tab-panel").has("[data-tab-group='"+tabGroup+"'][data-tab-item='"+tabId+"']");
  var allTabItems = tabs.find("[data-tab-group='"+tabGroup+"']");
  var targetTabItems = tabs.find("[data-tab-group='"+tabGroup+"'][data-tab-item='"+tabId+"']");
  if (event) {
      var clickedTab = event.target;
      var topBefore = clickedTab.getBoundingClientRect().top;
  }

  allTabItems.removeClass("selected");
  targetTabItems.addClass("selected");
  addShowMoreButton(targetTabItems);
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
  return window.location.pathname.split("/")[1]
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

  $(parentSelector).find(linkSelector).each(function() {
    $(this).attr("href", function(index, old) {
          if (old == undefined || old.startsWith("#")) return old;
          let splitLink = old.split("/");
          let linkVersion = splitLink[1];
          let alias = nameAliasMapping[linkVersion] || linkVersion;
          splitLink.splice(1, 1, alias);
          return splitLink.join("/");
    });
  });
}

function setVersionSelector(version) {
  for(let option of document.getElementById("arangodb-version").options) {
    if (option.value == version) {
      option.selected = true;
    }
  }
}

function handleOldDocsVersion(version) {
    var legacyUrl = "https://www.arangodb.com/docs/" + version + "/";
    var handle = window.open(legacyUrl, "_blank");
    if (!handle) window.location.href = legacyUrl;
    return;
}

function getCurrentVersion() {
  var urlVersion = stableVersion.name

  if (window.location.pathname.split("/").length > 0) {
    newVersion = getVersionFromURL()

    if (newVersion === "3.8" || newVersion === "3.9") {
      handleOldDocsVersion(newVersion)
      versionSelector.value = urlVersion;
      return;
    }

    if (getVersionInfo(newVersion) == undefined) {
      loadNotFoundPage();
      return;
    }

    urlVersion = getVersionInfo(newVersion).name
  }

  localStorage.setItem('docs-version', urlVersion);
  setVersionSelector(urlVersion);
}


function changeVersion() {
    var oldVersion = localStorage.getItem('docs-version');
    var versionSelector = document.getElementById("arangodb-version");
    var newVersion  = versionSelector.options[versionSelector.selectedIndex].value;

    if (newVersion === "3.8" || newVersion === "3.9") {
        handleOldDocsVersion(newVersion)
        versionSelector.value = oldVersion;
        return;
    }

    try {
        localStorage.setItem('docs-version', newVersion);
        renderVersion();
        window.setupDocSearch(newVersion);
    } catch(exception) {
      console.log({exception})
        changeVersion();
    }

    
    var newUrl = window.location.pathname.replace(getVersionFromURL(), getVersionInfo(newVersion).alias) + window.location.hash;
    updateHistory(newUrl);
}


/*
    Openapi

*/

function hideEmptyOpenapiDiv() {
    var lists = document.getElementsByClassName("openapi-parameters")
    for (let list of lists) {
        if ($(list).find(".openapi-table").text().trim() == "") {
            $(list).addClass("hidden");
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

function initClickHandlers() {
    hideEmptyOpenapiDiv();

    $(".openapi-prop").on("click", function(event) {
        if (this === event.target) {
            $(event.target).toggleClass("collapsed");
            $(event.target).find('.openapi-prop-content').first().toggleClass("hidden");
        }
    });
    
    $(".openapi-table.show-children").on("click", function(event) {
        $(event.target).toggleClass("collapsed");
        $(event.target).next(".openapi-table").toggleClass("hidden");
    });

    $('#search-by').keypress(
        function(event){
          if (event.which == '13') {
            event.preventDefault();
          }
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



function goToHomepage(event){
    event.preventDefault();
    var homepage = "/" + getVersionFromURL() + "/";
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
    var t = $(event.target.closest("a"));
    if (t.parent('.expand-expanded.expand-marked').length) {
        t.next().css('display','none');
    } else if (t.parent('.expand-marked').length) {
        t.next().css('display','block')
    } else {
        t.next('.expand-content').slideToggle(100);
    }
    t.parent().toggleClass('expand-expanded');
}


window.onload = () => {
    window.history.pushState("popstate", "ArangoDB Documentation", window.location.href);
    trackPageView(document.title, window.location.pathname);

    var iframe =  document.getElementById('menu-iframe');
    var iFrameBody = iframe.contentDocument || iframe.contentWindow.document;
    content = iFrameBody.getElementById('sidebar');

    $("#menu-iframe").replaceWith(content);


    getCurrentVersion(window.location.href);
    menuEntryClickListener();
    renderVersion();
    loadPage(window.location.href)

    if (getVersionInfo(getVersionFromURL()) != undefined) {
      window.setupDocSearch(getVersionInfo(getVersionFromURL()).name);
    } else {
      window.setupDocSearch(stableVersion);

    }

    content.addEventListener("click", menuToggleClick);


    var isMobile = window.innerWidth <= 768;
    if (isMobile) {
        $('#sidebar').addClass("mobile");
        $('#sidebar.mobile').removeClass("active");
    }

    $('#page-wrapper').css("opacity", "1")
}