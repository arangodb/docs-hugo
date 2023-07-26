var stableVersion;

function getCurrentVersion() {
    var url = window.location.href;
    var urlRe = url.match("\/[0-9.]+\/")
    var urlVersion = stableVersion;

    if (urlRe) {
        urlVersion = urlRe[0].replaceAll("\/", "");
    }
    console.log(urlVersion)
    localStorage.setItem('docs-version', urlVersion);
    console.log(urlVersion)
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
});

function changeVersion() {
    var oldVersion = localStorage.getItem('docs-version');
    console.log(oldVersion)
    var versionSelector = document.getElementById("arangodb-version");
    var newVersion  = versionSelector.options[versionSelector.selectedIndex].value;

    try {
        localStorage.setItem('docs-version', newVersion);
        renderVersion()
        console.log(newVersion)
    } catch(exception) {
        changeVersion();
    }

    var newUrl = window.location.href.replace(oldVersion, newVersion)
    updateHistory("", newUrl);
}