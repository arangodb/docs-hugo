function scrollToActiveMenu() {
    window.setTimeout(function(){
        var e = document.querySelector( 'ul.topics li.active a' );
        if( e && e.scrollIntoView ){
            e.scrollIntoView({
                block: 'center',
            });
        }
    }, 10);
}

function scrollToFragment() {
    if( !window.location.hash || window.location.hash.length <= 1 ){
        return;
    }
    window.setTimeout(function(){
        var e = document.querySelector( window.location.hash );
        if( e && e.scrollIntoView ){
            e.scrollIntoView({
                block: 'start',
            });
        }
    }, 10);
}

function videosAutoplayer() {
    let videos = document.querySelectorAll("video");
    videos.forEach((video) => {
        observeVideo(video);
    });
}

function observeVideo(video) {
    let observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting === true) 
                    video.play();
                else 
                    video.pause();
                });
        },
        { threshold: 0.2 }
    );
    observer.observe(video);
}

function backToTopScrollable() {
    const showOnPx = 100;
    if (window.pageYOffset > showOnPx) {
        document.querySelector(".back-to-top").classList.remove("hidden");
    } else {
        document.querySelector(".back-to-top").classList.add("hidden");
    }
}

function dynamicHeaderToggle() {
    $("#breadcrumbs").css({"top": "0em"});
    $("#sidebar").css({"top": "0em"} );

    if (window.pageYOffset > 20) {
        $(".searchbox.default-animation").css({"top": "0em"} );
    } else {
        $(".searchbox.default-animation").css({"top": "4em"} );
    }
}

function hideEmptyOpenapiDiv() {
    var lists = document.getElementsByClassName("openapi-parameters")
    for (let list of lists) {
        if ($(list).find(".openapi-table").text().trim() == "") {
            $(list).addClass("hidden");
        }
    }
 }

 function openapiToggleProperty(event) {
    if (this === event.target) {
        $(event.target).toggleClass("collapsed");
        console.log($(event.target).find('.openapi-prop-content').first())
        $(event.target).find('.openapi-prop-content').first().toggleClass("hidden");
    }
 }

 function openapiShowStructChildren(event) {
    $(event.target).toggleClass("collapsed");
    $(event.target).next(".openapi-table").toggleClass("hidden");
 }

 function preventSearchboxEnter(event) {
    if (event.which == '13') {
        event.preventDefault();
      }
 }

 function resizeSidebar() {
    if (window.innerWidth < 1000) {
        $("#sidebar").removeClass("active");
    }
 }

 function tocHighlighter() {
    var scrollTop = $(document).scrollTop();

    for (var i = 0; i < anchors.length; i++){
        let highlightedHref = $('#TableOfContents ul ul li a[href="#' + $(anchors[i]).attr('id') + '"]');
        highlightedHref.removeClass('is-active');
    }
    
    for (var i = anchors.length-1; i >= 0; i--){
        if (scrollTop > $(anchors[i]).offset().top - 140) {
            let highlightedHref = $('#TableOfContents ul ul li a[href="#' + $(anchors[i]).attr('id') + '"]')
            highlightedHref.addClass('is-active');
            break;
        }
    }
 }

 var showSidenav = true;

 function sidebarToggle() {
    if (showSidenav) {
        $("#sidebar").removeClass("active");
        showSidenav = false;
        return
    }

    $("#sidebar").addClass("active");
    showSidenav = true;
    e.preventDefault();
 }


function getCurrentVersion() {
    var url = window.location.href;
    var urlRe = url.match("\/[0-9.]+\/")
    var urlVersion = localStorage.getItem('docs-version');

    if (urlVersion == undefined) {
        urlVersion = "3.10"
    }

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

function renderVersionMenu() {
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

function handleImageCustomStyle() {
    images = document.querySelectorAll("[x-style]");
    for (let image of images) {
        styles = image.getAttribute("x-style");
        image.setAttribute("style", styles)
        image.removeAttribute("x-style")
    }
}


function loadMenu() {
    var menuEntry = document.querySelectorAll('li.menu-section-entry');
    for ( let entry of menuEntry ) {
        if (entry.classList.contains("parent") || entry.classList.contains("active")) {
            entry.childNodes[1].classList.add("open");
            entry.childNodes[1].classList.remove("closed");

            var submenu = entry.querySelector('.submenu');
            submenu.style.display = 'block';
        } else {
            entry.childNodes[1].classList.remove("open")
            entry.childNodes[1].classList.add("closed")

            var submenu = entry.querySelector('.submenu');
            submenu.style.display = 'none';
        }
    }
}

function changeVersion() {
    var oldVersion = localStorage.getItem('docs-version');
    var versionSelector = document.getElementById("arangodb-version");
    var newVersion  = versionSelector.options[versionSelector.selectedIndex].value;

    try {
        localStorage.setItem('docs-version', newVersion);
    } catch(exception) {
        changeVersion();
    }

    var newUrl = window.location.href.replace(oldVersion, newVersion)
    loadPage(newUrl);
}

function initCopyToClipboard() {
    $('code').each(function() {
        var code = $(this);
        var parent = code.parent();
        var inPre = parent.prop('tagName') == 'PRE';

        if (inPre) {
            code.addClass('copy-to-clipboard-code');
            if( inPre ){
                parent.addClass( 'copy-to-clipboard' );
            }
            else{
                code.replaceWith($('<span/>', {'class': 'copy-to-clipboard'}).append(code.clone() ));
                code = parent.children('.copy-to-clipboard').last().children('.copy-to-clipboard-code');
            }
            var span = $('<span>').addClass("copy-to-clipboard-button").attr("title", window.T_Copy_to_clipboard).attr("onclick", "copyCode(event);")
            code.before(span);
            span.mouseleave( function() {
                setTimeout(function(){
                    span.removeClass("tooltipped");
                },1000);
        });
    }
    });
}

function copyCode(event) {
    var parent = $(event.target).parent().parent().find('code')[0].childNodes;
    var text = ""
    for (let child of parent) {
        text = text + $(child).text();
    }
    navigator.clipboard.writeText(text).then(() => {
        console.log("Copied")
        $(event.target).attr('aria-label', window.T_Copied_to_clipboard).addClass('tooltipped');
    }, () => {
      console.log("clipboard copy failed")
    });
 }


function initOnLoadListeners() {
    scrollToActiveMenu();
    scrollToFragment();
    hideEmptyOpenapiDiv();
    initCopyToClipboard();
    handleImageCustomStyle();
    videosAutoplayer();
}

function initEventListeners() {
    document.addEventListener("scroll", backToTopScrollable);
    window.addEventListener("scroll", dynamicHeaderToggle);
    window.addEventListener("scroll", tocHighlighter);
    $(".sidebar-toggle-navigation").click(sidebarToggle);
    $(".openapi-prop").click(openapiToggleProperty);
    $(".openapi-table.show-children").click(openapiShowStructChildren);
    $('#search-by').keypress(preventSearchboxEnter);
    window.addEventListener("resize", resizeSidebar);
}

function initPage() {
    renderVersionMenu();
    loadMenu();
    initOnLoadListeners();
    initEventListeners();
}

window.addEventListener("load", initPage());