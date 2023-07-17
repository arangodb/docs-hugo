var theme = true;


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

var showSidenav = true;

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

        var prev = tag.previousSibling;
        var isHeader = $(prev).is(':header')
        while (!isHeader) {
            prev = prev.previousSibling;
            console.log(tag)
            console.log(prev)
            isHeader = $(prev).is(':header')
        }

        newTag = tag.outerHTML
        prev.insertAdjacentHTML('afterEnd', newTag);
        tag.remove();
    }
}




