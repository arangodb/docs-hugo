$("input.toggle").click(function(event) {
    var arrow = $(event.target).next()[0];
    if(arrow.classList.contains("open")) {
        arrow.classList.remove("open");
        arrow.classList.add("closed");
    } else {
        arrow.classList.remove("closed");
        arrow.classList.add("open");
    }
    var submenu = $(event.target).next().next().next();
    submenu.slideToggle();
    
});

function menuEntryClick(event) {
    loadPage(event.target.getAttribute('href'));
    var arrow = $(event.target).prev()[0];
    if(arrow.classList.contains("open")) {
        arrow.classList.remove("open");
        arrow.classList.add("closed");
    } else {
        arrow.classList.remove("closed");
        arrow.classList.add("open");
    }
    if (event.target.getAttribute('href') == window.location.href) {
        var submenu = $(event.target).next();
        submenu.slideToggle();
    }
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