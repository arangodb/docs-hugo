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

function showSearchListener() {
  $('.searchbox').click(function(){
    showSearchModal();
  });
}



function initArticle(url) {
  initCopyToClipboard();
  initClickHandlers();
  generateToc();
  goToTop();
  styleImages();
  internalLinkListener();
  codeShowMoreListener();
  showSearchListener();
  moveTags();
}



$(window).on('popstate', function (e) {
  var state = e.originalEvent.state;
  if (state !== null) {
    console.log("Received popstate event")
    loadPage(window.location.href);
  }
});
