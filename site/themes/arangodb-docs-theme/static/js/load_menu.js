var iframe =  document.getElementById('menu-iframe');
iframe.addEventListener("load", function() {
    var content = iframe.contentDocument .getElementById('sidebar');

    document.getElementById("page-container").appendChild(content);
    document.getElementById("page-container").removeChild(iframe);
});