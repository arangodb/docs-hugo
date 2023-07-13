var iframe =  document.getElementById('menu-iframe');
iframe.addEventListener("load", function() {
  var iFrameBody= iframe.contentDocument || iframe.contentWindow.document;
  content= iFrameBody.getElementById('sidebar');

  document.getElementById("page-container").appendChild(content);
  document.getElementById("page-container").removeChild(iframe);
  menuEntryClick();
});

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




function initArticle(url) {
  renderVersion();
  loadMenu(url);
  moveTags();
  initCopyToClipboard();
  initClickHandlers();
  generateToc();
  goToTop();
  styleImages();
  internalLinkListener();
}
