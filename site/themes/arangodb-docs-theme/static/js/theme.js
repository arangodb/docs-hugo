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
    $('.menu-link').click(function(event) {
        event.preventDefault();
        if (event.target.pathname == window.location.pathname) {
            toggleMenuItem(event)
            return
        }
        console.log(event.target)
        updateHistory("", event.target.getAttribute('href'))
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
};

function closeAllEntries() {
    $(".dd-item.active").removeClass("active");
    $(".dd-item > label.open").removeClass("open");
    $(".submenu").hide();
    $(".dd-item.parent").removeClass("parent");
}

function loadMenu(url) {
    url = url.replace(/#.*$/, "");

    closeAllEntries();
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
  var re = new RegExp(/<title>(.*?)<\/title>/, "m");
  var match = re.exec(newDoc);

  $(".container-main").replaceWith($(".container-main", newDoc));
  if (match) {
    document.title = decodeHtmlEntities(match[1]);
  }

  if (matches = href.match(/.*?(#.*)$/)) {
    location.hash = matches[1];
  }
}


function updateHistory(title, url) {
  if (url == window.location.href) {
    return
  } 
  
  window.history.pushState("navchange", "ArangoDB Documentation", url);

  var _hsq = window._hsq = window._hsq || [];
  _hsq.push(['setPath', url]);
  _hsq.push(['trackPageView']);
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


function loadPage(target) {
  var href = target;
  getCurrentVersion(href);
  renderVersion();
  loadMenu(href);
  $.get({
    url: href,
    success: function(newDoc) {
      replaceArticle(href, newDoc)
      initArticle(href);
      return true;
    }
  });
}

function internalLinkListener() {
  $('.link-internal').click(function(event) {
    event.preventDefault();
    console.log(event.target)
    updateHistory("", event.target.getAttribute('href'))
  })
}

function codeShowMoreListener() {
  $('.code-show-more').click(function(event) {
    var t = $(event.target)
    t.toggleClass("expanded")
    t.prev().toggleClass("expanded")
  })
}



function initArticle(url) {
  initCopyToClipboard();
  initClickHandlers();
  goToTop();
  styleImages();
  internalLinkListener();
  codeShowMoreListener();
}



$(window).on('popstate', function (e) {
  var state = e.originalEvent.state;
  if (state !== null) {
    console.log("Received popstate event " + window.location.pathname)
    loadPage(window.location.href);
  }
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
      highlightedHref.parentElement.scrollIntoView({behavior: "smooth", block: "nearest" });
    }
  });
}

$(window).scroll(function(){
  tocHiglighter();
});




/*
    Version

*/

var stableVersion;

function getCurrentVersion(url) {
    var urlRe = url.match("\/[0-9.]+\/")
    var urlVersion = stableVersion;

    if (urlRe) {
        urlVersion = urlRe[0].replaceAll("\/", "");
    }
    localStorage.setItem('docs-version', urlVersion);
    
    var versionSelector = document.getElementById("arangodb-version");
    for(let option of versionSelector.options) {
      if (option.value == urlVersion) {
        option.selected = true;
      }
    }
}


function changeVersion() {
    var oldVersion = localStorage.getItem('docs-version');
    var versionSelector = document.getElementById("arangodb-version");
    var newVersion  = versionSelector.options[versionSelector.selectedIndex].value;

    if (newVersion === "3.8" || newVersion === "3.9") {
        var legacyUrl = "https://www.arangodb.com/docs/" + newVersion + "/";
        var handle = window.open(legacyUrl, "_blank");
        if (!handle) window.location.href = legacyUrl;
        versionSelector.value = oldVersion;
        return;
    }

    try {
        localStorage.setItem('docs-version', newVersion);
        renderVersion()
        console.log(newVersion)
    } catch(exception) {
        changeVersion();
    }

    var newUrl = window.location.href.replace(oldVersion, newVersion)
    updateHistory("", newUrl);
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




function initClickHandlers() {
    hideEmptyOpenapiDiv();

    $(".openapi-prop").click(function(event) {
        if (this === event.target) {
            $(event.target).toggleClass("collapsed");
            console.log($(event.target).find('.openapi-prop-content').first())
            $(event.target).find('.openapi-prop-content').first().toggleClass("hidden");
        }
    });
    
    $(".openapi-table.show-children").click(function(event) {
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

*/




// Common custom functions


function backToTopButton() {
    if (window.pageYOffset > 100) {
        document.querySelector(".back-to-top").classList.remove("hidden");
    } else {
        document.querySelector(".back-to-top").classList.add("hidden");
    }
}


window.addEventListener("scroll", () => {
    backToTopButton();
});


const goToTop = () => {
    if (window.location.hash.length == 0)
        window.scrollTo({top: 0});
};

function goToHomepage(event){
    event.preventDefault();
    var homepage = window.location.origin + "/" + localStorage.getItem('docs-version') + "/";
    updateHistory("", homepage);
}

function copyURI(evt) {
    navigator.clipboard.writeText(evt.target.closest("a").getAttribute('href')).then(() => {
    }, () => {
      console.log("clipboard copy failed")
    });
}

function toggleExpandShortcode(event) {
    var t = $(event.target)
    if(t.parent('.expand-expanded.expand-marked').length){
        t.next().css('display','none') 
    }else if(t.parent('.expand-marked').length){
        t.next().css('display','block') }
    else{ 
        t.next('.expand-content').slideToggle(100); 
    } 
    t.parent().toggleClass('expand-expanded');
}


window.onload = () => {
    window.history.pushState("navchange", "ArangoDB Documentation", window.location.href);

    var _hsq = window._hsq = window._hsq || [];
    _hsq.push(['setPath', window.location.href]);
    _hsq.push(['trackPageView']);
    new PopStateEvent('popstate', { state: "navchange" });

    var iframe =  document.getElementById('menu-iframe');
    var iFrameBody = iframe.contentDocument || iframe.contentWindow.document;
    content = iFrameBody.getElementById('sidebar');

    $("#menu-iframe").replaceWith(content);

    getCurrentVersion(window.location.pathname);
    menuEntryClickListener();
    renderVersion();
    loadMenu(window.location.href);
    initArticle(window.location.href);
    content.addEventListener("click", menuToggleClick);

    var isMobile = window.innerWidth <= 768;
    if (isMobile) {
        $('#sidebar').addClass("mobile");
        $('#sidebar.mobile').removeClass("active");
    }

    $('#show-page-loading').hide();
    $('#page-wrapper').css("opacity", "1")
}