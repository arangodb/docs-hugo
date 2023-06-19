function loadPage(target) {
    var href = target;
    if (href == window.location.href) {
        console.log("same page");
        renderVersion();
        return;
    }
    var url = href.replace(/#.*$/, "");
    $.get({
      url: url,
      success: function(newDoc) {
        var re = new RegExp(/<title>(.*)<\/title>/, 'mg');
        var match = re.exec(newDoc);
        var title = "ArangoDB Documentation";
        if (match) {
          title = match[1];
        }
  
        $(".container-main").replaceWith($(".container-main", newDoc));
  
        currentPage = url;
        if (matches = href.match(/.*?(#.*)$/)) {
          location.hash = matches[1];
        }
          
        $(".dd-item.active").removeClass("active");
        $(".dd-item.parent").removeClass("parent");
        var current = $('.dd-item > a[href="' + url + '"]').parent();
        
        current.addClass("active");
        while (current.length > 0 && current.prop("class") != "topics collapsible-menu") {
            if (current.prop("tagName") == "LI") {
                current.addClass("parent");
            }
            current = current.parent();
        }
        initNewPage();

        window.history.pushState("navchange", title, url);

        var _hsq = window._hsq = window._hsq || [];
        _hsq.push(['setPath', url]);
        _hsq.push(['trackPageView']);
        var popStateEvent = new PopStateEvent('popstate', { state: "navchange" });
        dispatchEvent(popStateEvent);
      }
    });
  }


  function initNewPage() {
    //getCurrentVersion();
    renderVersion();
    loadMenu();
    initCopyToClipboard();
    initClickHandlers();
    images = document.querySelectorAll("[x-style]");
    for (let image of images) {
        styles = image.getAttribute("x-style");
        image.setAttribute("style", styles)
        image.removeAttribute("x-style")
    }

    document.querySelector(".sidebar-toggle-navigation").addEventListener("click", e => {
        if (showSidenav) {
            $("#sidebar").removeClass("active");
            showSidenav = false;
            return
        }

        $("#sidebar").addClass("active");
        showSidenav = true;
        e.preventDefault();
    });

    anchors = getHeadlines();
    generateToc();
    goToTop();
  }