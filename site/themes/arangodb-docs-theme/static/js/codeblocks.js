
function switchTab(tabGroup, tabId) {
    var tabs = jQuery(".tab-panel").has("[data-tab-group='"+tabGroup+"'][data-tab-item='"+tabId+"']");
    var allTabItems = tabs.find("[data-tab-group='"+tabGroup+"']");
    var targetTabItems = tabs.find("[data-tab-group='"+tabGroup+"'][data-tab-item='"+tabId+"']");

    allTabItems.removeClass("selected");
    targetTabItems.addClass("selected");

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
            if ( code.text().split(/\r\n|\r|\n/).length > 16) {
              var showMore = $('<button class="code-show-more"></button>')
              code.after(showMore);
            }

            span.mouseleave( function() {
                setTimeout(function(){
                    span.removeClass("tooltipped");
                },1000);
        });
    }
    });
}


function copyCode(event) {
    var parent = $(event.target).siblings('code')[0];
    var text = parent.innerText;
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