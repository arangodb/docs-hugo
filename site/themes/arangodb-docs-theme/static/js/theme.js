var theme = true;
var isIE = /*@cc_on!@*/false || !!document.documentMode;
if( isIE ){
    // we don't support sidebar flyout in IE
    document.querySelector( 'body' ).classList.remove( 'mobile-support' );
}
else{
    document.querySelector( 'body' ).classList.add( 'mobile-support' );
}
var isPrint = document.querySelector( 'body' ).classList.contains( 'print' );

var touchsupport = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0)

var formelements = 'button, datalist, fieldset, input, label, legend, meter, optgroup, option, output, progress, select, textarea';

// rapidoc: #280 disable broad document syntax highlightning
window.Prism = window.Prism || {};
Prism.manual = true;

// PerfectScrollbar
var psc;
var psm;
var pst;

function scrollbarWidth(){
    // https://davidwalsh.name/detect-scrollbar-width
    // Create the measurement node
    var scrollDiv = document.createElement("div");
    scrollDiv.className = "scrollbar-measure";
    document.body.appendChild(scrollDiv);
    // Get the scrollbar width
    var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    // Delete the DIV
    document.body.removeChild(scrollDiv);
    return scrollbarWidth;
}



function switchTab(tabGroup, event) {
    var tabId = event.target.value;
    var tabs = jQuery(".tab-panel").has("[data-tab-group='"+tabGroup+"'][data-tab-item='"+tabId+"']");
    var allTabItems = tabs.find("[data-tab-group='"+tabGroup+"']");
    var targetTabItems = tabs.find("[data-tab-group='"+tabGroup+"'][data-tab-item='"+tabId+"']");
    // if event is undefined then switchTab was called from restoreTabSelection
    // so it's not a button event and we don't need to safe the selction or
    // prevent page jump
    var isButtonEvent = event != undefined;

    if(isButtonEvent){
      // save button position relative to viewport
      var yposButton = event.target.getBoundingClientRect().top;
    }

    allTabItems.removeClass("active");
    targetTabItems.addClass("active");

    if(isButtonEvent){
      // reset screen to the same position relative to clicked button to prevent page jump
      var yposButtonDiff = event.target.getBoundingClientRect().top - yposButton;
      window.scrollTo(window.scrollX, window.scrollY+yposButtonDiff);

      // Store the selection to make it persistent
      if(window.localStorage){
          var selectionsJSON = window.localStorage.getItem(baseUriFull+"tab-selections");
          if(selectionsJSON){
            var tabSelections = JSON.parse(selectionsJSON);
          }else{
            var tabSelections = {};
          }
          tabSelections[tabGroup] = tabId;
          window.localStorage.setItem(baseUriFull+"tab-selections", JSON.stringify(tabSelections));
      }
    }
}

function restoreTabSelections() {
    if(window.localStorage){
        var selectionsJSON = window.localStorage.getItem(baseUriFull+"tab-selections");
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


function initAnchorClipboard(){

    $(".anchor").on('mouseleave', function(e) {
        $(this).attr('aria-label', null).removeClass('tooltipped tooltipped-s tooltipped-w');
    });

    var clip = new ClipboardJS('.anchor');
    clip.on('success', function(e) {
        e.clearSelection();
        $(e.trigger).attr('aria-label', window.T_Link_copied_to_clipboard).addClass('tooltipped tooltipped-s');
    });
}


function initArrowNav(){
    if( isPrint ){
        return;
    }

    // button navigation
    jQuery(function() {
        jQuery('a.nav-prev').click(function(){
            location.href = jQuery(this).attr('href');
        });
        jQuery('a.nav-next').click(function() {
            location.href = jQuery(this).attr('href');
        });
    });

    // keyboard navigation
    jQuery(document).keydown(function(e) {
      if(e.which == '37') {
        jQuery('a.nav-prev').click();
      }
      if(e.which == '39') {
        jQuery('a.nav-next').click();
      }
    });

    // avoid keyboard navigation for input fields
    jQuery(formelements).keydown(function (e) {
        if (e.which == '37' || e.which == '39') {
            e.stopPropagation();
        }
    });
}

function initMenuScrollbar(){
    if( isPrint ){
        return;
    }

    var elc = document.querySelector('#page-main');
    var elm = document.querySelector('#sidebar');
    var elt = document.querySelector('#TableOfContents');

    var autofocus = false;
    document.addEventListener('keydown', function(event){
        // for initial keyboard scrolling support, no element
        // may be hovered, but we still want to react on
        // cursor/page up/down. because we can't hack
        // the scrollbars implementation, we try to trick
        // it and give focus to the scrollbar - only
        // to just remove the focus right after scrolling
        // happend
        var c = elc && elc.matches(':hover');
        var m = elm && elm.matches(':hover');
        var t = elt && elt.matches(':hover');
        var f = event.target.matches( formelements );
        if( !c && !m && !t && !f ){
            // only do this hack if none of our scrollbars
            // is hovered
            autofocus = true;
            // if we are showing the sidebar as a flyout we
            // want to scroll the content-wrapper, otherwise we want
            // to scroll the body
            var nt = document.querySelector('body').matches('.toc-flyout');
            var nm = document.querySelector('body').matches('.sidebar-flyout');
            if( nt ){
                pst && pst.scrollbarY.focus();
            }
            else if( nm ){
                psm && psm.scrollbarY.focus();
            }
            else{
                document.querySelector('.container-main').focus();
                psc && psc.scrollbarY.focus();
            }
        }
    });
    // scrollbars will install their own keyboard handlers
    // that need to be executed inbetween our own handlers
    // PSC removed for #242 #243 #244
    // psc = elc && new PerfectScrollbar('.container-main');
    psm = elm && new PerfectScrollbar('#sidebar');
    pst = elt && new PerfectScrollbar('#TableOfContents');
    document.addEventListener('keydown', function(){
        // if we facked initial scrolling, we want to
        // remove the focus to not leave visual markers on
        // the scrollbar
        if( autofocus ){
            psc && psc.scrollbarY.blur();
            psm && psm.scrollbarY.blur();
            pst && pst.scrollbarY.blur();
            autofocus = false;
        }
    });
    // on resize, we have to redraw the scrollbars to let new height
    // affect their size
    window.addEventListener('resize', function(){
        pst && pst.update();
        psm && psm.update();
        psc && psc.update();
    });
    // now that we may have collapsible menus, we need to call a resize
    // for the menu scrollbar if sections are expanded/collapsed
    document.querySelectorAll('#sidebar .collapsible-menu input.toggle').forEach( function(e){
        e.addEventListener('change', function(){
            psm && psm.update();
        });
    });

    // finally, we want to adjust the contents right padding if there is a scrollbar visible
    var scrollbarSize = scrollbarWidth();
    function adjustContentWidth(){
        var left = parseFloat( getComputedStyle( elc ).getPropertyValue( 'padding-left' ) );
        var right = left;
        if( elc.scrollHeight > elc.clientHeight ){
            // if we have a scrollbar reduce the right margin by the scrollbar width
            right = Math.max( 0, left - scrollbarSize );
        }
        elc.style[ 'padding-right' ] = '' + right + 'px';
    }
    window.addEventListener('resize', adjustContentWidth );
    adjustContentWidth();
}

function initLightbox(){
    // wrap image inside a lightbox (to get a full size view in a popup)
    var images = $(".container-main img").not(".inline");
    images.wrap(function(){
        var image =$(this);
        var o = getUrlParameter(image[0].src);
        var f = o['featherlight'];
        // IF featherlight is false, do not use feather light
        if (f != 'false') {
            if (!image.parent("a").length) {
                var html = $( "<a>" ).attr("href", image[0].src).attr("data-featherlight", "image").get(0).outerHTML;
                return html;
            }
        }
    });

    $('a[rel="lightbox"]').featherlight({
        root: 'div#body'
    });
}

function initImageStyles(){
    // change image styles, depending on parameters set to the image
    var images = $("main.container-main img").not(".inline");
    images.each(function(index){
        var image = $(this)
        var o = getUrlParameter(image[0].src);
        if (typeof o !== "undefined") {
            var h = o["height"];
            var w = o["width"];
            var c = o["classes"];
            image.css("width", function() {
                if (typeof w !== "undefined") {
                    return w;
                } else {
                    return "auto";
                }
            });
            image.css("height", function() {
                if (typeof h !== "undefined") {
                    return h;
                } else {
                    return "auto";
                }
            });
            if (typeof c !== "undefined") {
                var classes = c.split(',');
                for (i = 0; i < classes.length; i++) {
                    image.addClass(classes[i]);
                }
            }
        }
    });
}

function sidebarEscapeHandler( event ){
    if( event.key == "Escape" ){
        var b = document.querySelector( 'body' );
        b.classList.remove( 'sidebar-flyout' );
        document.removeEventListener( 'keydown', sidebarEscapeHandler );
        document.querySelector( '.container-main' ).focus();
        psc && psc.scrollbarY.focus();
    }
}

function tocEscapeHandler( event ){
    if( event.key == "Escape" ){
        var b = document.querySelector( 'body' );
        b.classList.remove( 'toc-flyout' );
        document.removeEventListener( 'keydown', tocEscapeHandler );
        document.querySelector( '.container-main' ).focus();
        psc && psc.scrollbarY.focus();
    }
}

function sidebarShortcutHandler( event ){
    if( event.altKey && event.ctrlKey && event.which == 77 /* m */ ){
        showNav();
    }
}

function editShortcutHandler( event ){
    if( event.altKey && event.ctrlKey && event.which == 69 /* e */ ){
        showEdit();
    }
}

function printShortcutHandler( event ){
    if( event.altKey && event.ctrlKey && event.which == 80 /* p */ ){
        showPrint();
    }
}

function showNav(){
    var sidebar = document.querySelector('#sidebar');
    sidebar.style.width = "0px";
    var b = document.querySelector( 'body' );
    b.classList.toggle( 'sidebar-flyout' );
    if( b.classList.contains( 'sidebar-flyout' ) ){
        b.classList.remove( 'toc-flyout' );
        document.removeEventListener( 'keydown', tocEscapeHandler );
        document.addEventListener( 'keydown', sidebarEscapeHandler );
    }
    else{
        document.removeEventListener( 'keydown', sidebarEscapeHandler );
        document.querySelector( '.container-main' ).focus();
        psc && psc.scrollbarY.focus();
    }
}

function showEdit(){
    var l = document.querySelector( '#top-github-link a' );
    if( l ){
        l.click();
    }
}

function showPrint(){
    var l = document.querySelector( '#top-print-link a' );
    if( l ){
        l.click();
    }
}

function initSwipeHandler(){
    if( !touchsupport ){
        return;
    }

    var startx = null;
    var starty = null;
    var handleStartX = function(evt) {
        startx = evt.touches[0].clientX;
        starty = evt.touches[0].clientY;
        return false;
    };
    var handleMoveX = function(evt) {
        if( startx !== null ){
            var diffx = startx - evt.touches[0].clientX;
            var diffy = starty - evt.touches[0].clientY || .1 ;
            if( diffx / Math.abs( diffy ) < 2 ){
                // detect mostly vertical swipes and reset our starting pos
                // to not detect a horizontal move if vertical swipe is unprecise
                startx = evt.touches[0].clientX;
            }
            else if( diffx > 30 ){
                startx = null;
                starty = null;
                var b = document.querySelector( 'body' );
                b.classList.remove( 'sidebar-flyout' );
                document.removeEventListener( 'keydown', sidebarEscapeHandler );
                document.querySelector( '.container-main' ).focus();
                psc && psc.scrollbarY.focus();
            }
        }
        return false;
    };
    var handleEndX = function(evt) {
        startx = null;
        starty = null;
        return false;
    };

    document.querySelector( '#sidebar-toggle' ).addEventListener("touchstart", handleStartX, false);
    document.querySelector( '#sidebar' ).addEventListener("touchstart", handleStartX, false);
    document.querySelectorAll( '#sidebar *' ).forEach( function(e){ e.addEventListener("touchstart", handleStartX); }, false);
    document.querySelector( '#sidebar-toggle' ).addEventListener("touchmove", handleMoveX, false);
    document.querySelector( '#sidebar' ).addEventListener("touchmove", handleMoveX, false);
    document.querySelectorAll( '#sidebar *' ).forEach( function(e){ e.addEventListener("touchmove", handleMoveX); }, false);
    document.querySelector( '#sidebar-toggle' ).addEventListener("touchend", handleEndX, false);
    document.querySelector( '#sidebar' ).addEventListener("touchend", handleEndX, false);
    document.querySelectorAll( '#sidebar *' ).forEach( function(e){ e.addEventListener("touchend", handleEndX); }, false);
}

function clearHistory() {
    var visitedItem = baseUriFull + 'visited-url/'
    for( var item in sessionStorage ){
        if( item.substring( 0, visitedItem.length ) === visitedItem ){
            sessionStorage.removeItem( item );
            var url = item.substring( visitedItem.length );
            // in case we have `relativeURLs=true` we have to strip the
            // relative path to root
            url = url.replace( /\.\.\//g, '/' ).replace( /^\/+\//, '/' );
            jQuery('[data-nav-id="' + url + '"]').removeClass('visited');
        }
    }
}

function initHistory() {
    var visitedItem = baseUriFull + 'visited-url/'
    sessionStorage.setItem(visitedItem+jQuery('body').data('url'), 1);

    // loop through the sessionStorage and see if something should be marked as visited
    for( var item in sessionStorage ){
        if( item.substring( 0, visitedItem.length ) === visitedItem && sessionStorage.getItem( item ) == 1 ){
            var url = item.substring( visitedItem.length );
            // in case we have `relativeURLs=true` we have to strip the
            // relative path to root
            url = url.replace( /\.\.\//g, '/' ).replace( /^\/+\//, '/' );
            jQuery('[data-nav-id="' + url + '"]').addClass('visited');
        }
    }
}

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


function initSearch() {
    jQuery('[data-search-input]').on('input', function() {
        var input = jQuery(this);
        var value = input.val();
        if (value.length) {
            sessionStorage.setItem(baseUriFull+'search-value', value);
        }
    });
    jQuery('[data-search-clear]').on('click', function() {
        jQuery('[data-search-input]').val('').trigger('input');
    });

    // custom sizzle case insensitive "contains" pseudo selector
    $.expr[":"].contains = $.expr.createPseudo(function(arg) {
        return function( elem ) {
            return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
        };
    });

    
}

// Get Parameters from some url
function getUrlParameter(sPageURL) {
    var url = sPageURL.split('?');
    var obj = {};
    if (url.length == 2) {
      var sURLVariables = url[1].split('&'),
          sParameterName,
          i;
      for (i = 0; i < sURLVariables.length; i++) {
          sParameterName = sURLVariables[i].split('=');
          obj[sParameterName[0]] = sParameterName[1];
      }
    }
    return obj;
};

// debouncing function from John Hann
// http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
(function($, sr) {

    var debounce = function(func, threshold, execAsap) {
        var timeout;

        return function debounced() {
            var obj = this, args = arguments;

            function delayed() {
                if (!execAsap)
                    func.apply(obj, args);
                timeout = null;
            };

            if (timeout)
                clearTimeout(timeout);
            else if (execAsap)
                func.apply(obj, args);

            timeout = setTimeout(delayed, threshold || 100);
        };
    }
    // smartresize
    jQuery.fn[sr] = function(fn) { return fn ? this.bind('resize', debounce(fn)) : this.trigger(sr); };

})(jQuery, 'smartresize');

jQuery(function() {
    initArrowNav();
    initMenuScrollbar();
    scrollToActiveMenu();
    scrollToFragment();
    initLightbox();
    initImageStyles();
    initAnchorClipboard();
    restoreTabSelections();
    initSwipeHandler();
    initHistory();
    initSearch();
    showPrint
    videosAutoplayer();
});

jQuery.extend({
    highlight: function(node, re, nodeName, className) {
        if (node.nodeType === 3 && node.parentElement && node.parentElement.namespaceURI == 'http://www.w3.org/1999/xhtml') { // text nodes
            var match = node.data.match(re);
            if (match) {
                var highlight = document.createElement(nodeName || 'span');
                highlight.className = className || 'highlight';
                var wordNode = node.splitText(match.index);
                wordNode.splitText(match[0].length);
                var wordClone = wordNode.cloneNode(true);
                highlight.appendChild(wordClone);
                wordNode.parentNode.replaceChild(highlight, wordNode);
                return 1; //skip added node in parent
            }
        } else if ((node.nodeType === 1 && node.childNodes) && // only element nodes that have children
            !/(script|style)/i.test(node.tagName) && // ignore script and style nodes
            !(node.tagName === nodeName.toUpperCase() && node.className === className)) { // skip if already highlighted
            for (var i = 0; i < node.childNodes.length; i++) {
                i += jQuery.highlight(node.childNodes[i], re, nodeName, className);
            }
        }
        return 0;
    }
});

jQuery.fn.unhighlight = function(options) {
    var settings = {
        className: 'highlight',
        element: 'span'
    };
    jQuery.extend(settings, options);

    return this.find(settings.element + "." + settings.className).each(function() {
        var parent = this.parentNode;
        parent.replaceChild(this.firstChild, this);
        parent.normalize();
    }).end();
};

jQuery.fn.highlight = function(words, options) {
    var settings = {
        className: 'highlight',
        element: 'span',
        caseSensitive: false,
        wordsOnly: false
    };
    jQuery.extend(settings, options);

    if (!words) { return; }

    if (words.constructor === String) {
        words = [words];
    }
    words = jQuery.grep(words, function(word, i) {
        return word != '';
    });
    words = jQuery.map(words, function(word, i) {
        return word.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    });
    if (words.length == 0) { return this; }
    ;

    var flag = settings.caseSensitive ? "" : "i";
    var pattern = "(" + words.join("|") + ")";
    if (settings.wordsOnly) {
        pattern = "\\b" + pattern + "\\b";
    }
    var re = new RegExp(pattern, flag);

    return this.each(function() {
        jQuery.highlight(this, re, settings.element, settings.className);
    });
};


// Common custom functions

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

// Table of contents h2 highlighter


// Back To Top Button

const showOnPx = 100;

window.addEventListener("load", () => {
    getCurrentVersion();
    initNewPage();
    document.addEventListener("scroll", e => {
    if (window.pageYOffset > showOnPx) {
        document.querySelector(".back-to-top").classList.remove("hidden");
      } else {
        document.querySelector(".back-to-top").classList.add("hidden");
      }
    });
});

$(window).scroll(function(){
    $("#breadcrumbs").css({"top": "0em"});
    $("#sidebar").css({"top": "0em"} );
    if (window.pageYOffset > 20) {
        $(".searchbox.default-animation").css({"top": "0em"} );
    } else {
        $(".searchbox.default-animation").css({"top": "4em"} );
    }
});

const goToTop = () => {
    window.scrollTo({top: 0, behavior: 'smooth'});
  };


var showSidenav = true;


function goToHomepage(event){
    event.preventDefault();
    var origin = window.location.origin;
    loadPage(origin);
}

function copyURI(evt) {
    navigator.clipboard.writeText(evt.target.closest("a").getAttribute('href')).then(() => {
    }, () => {
      console.log("clipboard copy failed")
    });
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

 function expand(event) {
    $t=$(this);

    if($t.parent('.expand-expanded.expand-marked').length){ 
        $t.next().css('display','none') 
    } else if($t.parent('.expand-marked').length){ 
        $t.next().css('display','block') 
    }else{
        $t.next('.expand-content').slideToggle(100); 
    } 

    $t.parent().toggleClass('expand-expanded');
 }



