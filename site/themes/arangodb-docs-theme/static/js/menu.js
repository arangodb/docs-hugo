


function toggleMenuItem(event) {
    const listItem = event.target.parentNode;
    if (listItem.classList.contains("menu-leaf-entry")) 
        return

    listItem.childNodes[0].classList.toggle("open");
    jQuery(listItem.childNodes[2]).slideToggle();
    console.log(listItem)
}

function menuToggleClick(event) {
    toggleMenuItem(event);
}


function menuEntryClick() {
    $('.menu-link').click(function(event) {
        event.preventDefault();
        if (event.target.pathname == window.location.pathname) {
            toggleMenuItem(event)
            return
        }
        console.log(event.target)
        updateHistory("", event.target.getAttribute('href'))
    });
}

function renderVersion() {
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

function closeAllEntries() {
    $(".dd-item.active").removeClass("active");
    $(".dd-item > label.open").removeClass("open");
    $(".submenu").hide();
    $(".dd-item.parent").removeClass("parent");
}

function loadMenu(url) {
    url = url.replace(/#.*$/, "");

    closeAllEntries();
    var current = $('.dd-item > a[href="' + url + '"]').parent();
    
    current.addClass("active");
    while (current.length > 0 && current.prop("class") != "topics collapsible-menu") {
        if (current.prop("tagName") == "LI") {
            current.addClass("parent");
            jQuery(current.children()[0]).addClass("open") //Open label arrow
            jQuery(current.children()[2]).show()
        }
        
        current = current.parent();
    }
}

function showSidebarHandler() {
    $("#sidebar").toggleClass("active");
  }
