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

