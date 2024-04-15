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
            // n-times line-height * root em, larger than to-be-applied max-height to always reveal some lines
            // False for currently collapsed code ("Show output" with display: none)
            if ( code.prop('scrollHeight') > 20 * 1.8 * 16 ) {
              code.addClass('code-long');
              var showMore = $('<button class="code-show-more"></button>');
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
