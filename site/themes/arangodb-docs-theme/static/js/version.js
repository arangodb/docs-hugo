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

window.addEventListener("load", () => {
    getCurrentVersion();
    renderVersion();
    loadMenu(window.location.href);
});

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
    renderVersion();
    loadMenu(window.location.href);
}