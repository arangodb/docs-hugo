function addShowMoreButton(parentElem) {
    $(parentElem).find("pre > code").each(function() {
        code = $(this);
        // n-times line-height * root em, larger than to-be-applied max-height to always reveal some lines
        // False for currently collapsed code ("Show output" with display: none)
        if (!code.hasClass('code-long') && code.prop('scrollHeight') > 20 * 1.8 * 16 ) {
            code.addClass('code-long');
            var showMore = $('<button class="code-show-more"></button>');
            code.after(showMore);
        }
    });
}

function initCopyToClipboard() {
    $('article pre > code').each(function() {
        code = $(this);
        code.addClass('copy-to-clipboard-code');
        code.parent().addClass( 'copy-to-clipboard' );

        var span = $('<span>').addClass("copy-to-clipboard-button").attr("title", window.T_Copy_to_clipboard).attr("onclick", "copyCode(event);")
        code.before(span);

        span.mouseleave(function() {
            setTimeout(function() {
                span.removeClass("tooltipped");
            }, 1000);
        });
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
