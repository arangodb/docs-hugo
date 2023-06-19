
var headlineLevels = ["h1", "h2", "h3", "h4", "h5", "h6"]
var maxHeadlineLevel = 2;

function getHeadlines() {
    var contentBlock = document.querySelector("article");
    if (!contentBlock) {
      return;
    }
    return contentBlock.querySelectorAll(headlineLevels.slice(0, maxHeadlineLevel).join(","))
}

var generateToc = function() {
    var contentBlock = document.querySelector("article");
    if (!contentBlock) {
      return;
    }

    var nodes = contentBlock.querySelectorAll(headlineLevels.slice(0, maxHeadlineLevel).join(","));
    if (nodes.length == 0) {
      return;
    }
    var currentLevel = 1;
    var currentParent = document.createElement("ul");
    var parents = [
      {
        level: 1,
        element: currentParent
      }
    ];
    var lastElement = currentParent;
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes.item(i);
      var level = parseInt(node.tagName[1], 10);
      if (level < currentLevel) {
        while (level < currentLevel) {
          parents.pop();
          currentParent = parents[parents.length - 1].element;
          currentLevel = parents[parents.length - 1].level;
        }
      } else if (level > currentLevel) {
        var newParent = document.createElement("ul");
        if (lastElement) {
          lastElement.appendChild(newParent);
        }
        currentParent = newParent;
        currentLevel = level;
        parents.push({
          level: level,
          element: currentParent
        });
      }
  
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.className = "level-"+level;
      a.href = "#" + node.id;
      a.textContent = node.textContent;
  
      li.appendChild(a);
      currentParent.appendChild(li);
  
      lastElement = li;
    }
  
    var root;
    if (parents.length > 0) {
      root = parents[0].element;
    } else {
      root = currentParent;
    }

    var nav = document.createElement("nav");
    nav.className = "ps";
    nav.appendChild(root);
    document.querySelector("#TableOfContents").appendChild(nav)
    document.querySelector('.toc-container').style.display = 'block';
  };

  var anchors = getHeadlines();

  $(window).on('resize', function() {
    if (window.innerWidth < 1000) {
        $("#sidebar").removeClass("active");
    }
});

$(window).scroll(function(){
    var scrollTop = $(document).scrollTop();
    // highlight the last scrolled-to: set everything inactive first
    for (var i = 0; i < anchors.length; i++){
        let highlightedHref = $('#TableOfContents ul ul li a[href="#' + $(anchors[i]).attr('id') + '"]');
        highlightedHref.removeClass('is-active');
    }
    
    // then iterate backwards, on the first match highlight it and break
    for (var i = anchors.length-1; i >= 0; i--){
        if (scrollTop > $(anchors[i]).offset().top - 140) {
            let highlightedHref = $('#TableOfContents ul ul li a[href="#' + $(anchors[i]).attr('id') + '"]')
            highlightedHref.addClass('is-active');
            break;
        }
    }
});

