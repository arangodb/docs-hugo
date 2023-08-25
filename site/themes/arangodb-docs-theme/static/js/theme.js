var theme = true;

/*
    Menu
*/




function toggleMenuItem(event) {
    const listItem = event.target.parentNode;
    if (listItem.classList.contains("menu-leaf-entry")) 
        return

    listItem.childNodes[0].classList.toggle("open");
    jQuery(listItem.childNodes[2]).slideToggle();
    console.log(listItem)
}

function menuToggleClick(event) {
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
            jQuery(current.children()[0]).addClass("open") //Open label arrow
            jQuery(current.children()[2]).show()
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

function replaceArticle(href, newDoc) {
  var re = new RegExp(/<title>(.*)<\/title>/, 'mg');
  var match = re.exec(newDoc);
  if (match) {
    title = match[1];
  }

  $(".container-main").replaceWith($(".container-main", newDoc));

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
  moveTags();
}



$(window).on('popstate', function (e) {
  var state = e.originalEvent.state;
  if (state !== null) {
    console.log("Received popstate event")
    loadPage(window.location.href);
  }
});






/*

 Table of contents

*/


function tocHiglighter() {
  // only do this is screen width > 768px
  if (window.innerWidth <= 768) return;
  var anchors = document.querySelector("article").querySelectorAll("h2,h3,h4,h5,h6")

  var scrollTop = $(document).scrollTop();
  for (var i = 0; i < anchors.length; i++){
    var heading = anchors[i].getAttribute('id')
    let oldHRef = $('#TableOfContents a[href="#' + heading + '"]');
    oldHRef.parent().removeClass('is-active');
  }

  for (var i = anchors.length-1; i >= 0; i--){
    if (scrollTop > $(anchors[i]).offset().top - 180) {

      var heading = anchors[i].getAttribute('id')
        highlightedHref = $('#TableOfContents a[href="#' + heading + '"]')
        highlightedHref.parent()[0].scrollIntoView({behavior: "smooth"});
        highlightedHref.parent().addClass('is-active');
        break;
    }
  }

  activeHrefs = $('#TableOfContents > .is-active')
  if (activeHrefs.length == 0) document.querySelectorAll('.toc-content')[0].scrollIntoView();
}

$(window).scroll(function(){
  tocHiglighter();
});




/*
    Version

*/

var stableVersion;

function getCurrentVersion() {
    var url = window.location.href;
    var urlRe = url.match("\/[0-9.]+\/")
    var urlVersion = stableVersion;

    if (urlRe) {
        urlVersion = urlRe[0].replaceAll("\/", "");
    }
    localStorage.setItem('docs-version', urlVersion);
    
    searchIndexFile = window.location.origin + "/index_" + urlVersion.replace(".", "") + ".json"
    initLunr(searchIndexFile)

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

    try {
        localStorage.setItem('docs-version', newVersion);
        renderVersion()
        console.log(newVersion)
    } catch(exception) {
        changeVersion();
    }

    searchIndexFile = window.location.origin + "/index_" + newVersion.replace(".", "") + ".json"
    initLunr(searchIndexFile)

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
    var origin = window.location.origin;
    updateHistory("", origin);
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

function moveTags() {
    var tags = document.querySelectorAll(".labels")
    for (let tag of tags) {
        console.log(tag)
        if ($(tag).parent().is("li")) {
            var x = $(tag).parent();
            console.log(x)
            $(tag).parent().children()[0].after(tag);
            //tag.remove();
            continue
        }
        if(!tag) continue;
        var prev = tag.previousSibling;
        var isHeader = $(prev).is(':header')
        while (!isHeader) {
          if(!prev) break;
            prev = prev.previousSibling;
            isHeader = $(prev).is(':header')
        }
        
        newTag = tag.outerHTML
        prev && prev.insertAdjacentHTML('afterEnd', newTag);
        tag.remove();
    }
}

window.onload = () => {
    var iframe =  document.getElementById('menu-iframe');
    var iFrameBody= iframe.contentDocument || iframe.contentWindow.document;
    content= iFrameBody.getElementById('sidebar');

    $("#menu-iframe").replaceWith(content);

    getCurrentVersion();
    menuEntryClickListener();
    renderVersion();
    loadMenu(window.location.href);
    initArticle(window.location.href);


    var isMobile = window.innerWidth <= 768;
    if (isMobile) {
        $('#sidebar').addClass("mobile");
        $('#sidebar.mobile').removeClass("active");
    }

    $('#show-page-loading').hide();
    $('#page-wrapper').css("opacity", "1")
}