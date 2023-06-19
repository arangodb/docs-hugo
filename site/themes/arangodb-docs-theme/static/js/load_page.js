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
  window.history.pushState("navchange", "ArangoDB Documentation", url);

  var _hsq = window._hsq = window._hsq || [];
  _hsq.push(['setPath', url]);
  _hsq.push(['trackPageView']);
  var popStateEvent = new PopStateEvent('popstate', { state: "navchange" });
  dispatchEvent(popStateEvent);
}

function loadPage(target) {
    var href = target;
    if (href == window.location.href) {
        return false;
    }
    var url = href.replace(/#.*$/, "");
    $.get({
      url: url,
      success: function(newDoc) {
        replaceArticle(href, newDoc)
          
        loadMenu(url);
        //initNewPage();

        updateHistory(title, url);
        return true;
      }
    });
  }


  // function initNewPage() {
  //   //getCurrentVersion();
  //   renderVersion();
  //   loadMenu();
  //   initCopyToClipboard();
  //   initClickHandlers();
  //   images = document.querySelectorAll("[x-style]");
  //   for (let image of images) {
  //       styles = image.getAttribute("x-style");
  //       image.setAttribute("style", styles)
  //       image.removeAttribute("x-style")
  //   }

  //   document.querySelector(".sidebar-toggle-navigation").addEventListener("click", e => {
  //       if (showSidenav) {
  //           $("#sidebar").removeClass("active");
  //           showSidenav = false;
  //           return
  //       }

  //       $("#sidebar").addClass("active");
  //       showSidenav = true;
  //       e.preventDefault();
  //   });

  //   anchors = getHeadlines();
  //   generateToc();
  //   goToTop();
  // }