
var headlineLevels = ["h2", "h3", "h4", "h5", "h6"]
var maxHeadlineLevel = 2;

function getHeadlines() {
    var contentBlock = document.querySelector("article");
    if (!contentBlock) {
      return [0, false];
    }
    var nodes = contentBlock.querySelectorAll(headlineLevels.slice(0, maxHeadlineLevel).join(","))
    if (nodes.length < 2) {
      return [0, false];
    }

    return [nodes, true];
}


var generateToc = function() {
    const [nodes, ok] = getHeadlines();
    if (!ok) {
      return
    }

    var nav = document.createElement("nav");
    nav.className = "ps";

    nodes.forEach(function (heading, index) {
      var headerFragment = heading.getAttribute('id')
      var level = heading.nodeName.replace('H', '')

      var anchor = document.createElement('a');
      anchor.setAttribute('name', 'toc' + index);
      anchor.setAttribute('id', 'toc' + index);

      var link = document.createElement('a');
      link.setAttribute('href', "#"+headerFragment);
      link.textContent = heading.textContent;

      var div = document.createElement('div');
      div.setAttribute('class', "level-"+level);

      div.appendChild(link);
      nav.appendChild(div);
      heading.parentNode.insertBefore(anchor, heading);
    });

    
    document.querySelector("#TableOfContents").appendChild(nav)
    document.querySelector('.toc-container').style.display = 'block';
  };

  $(window).on('resize', function() {
    if (window.innerWidth < 1000) {
        $("#sidebar").removeClass("active");
    }
});

function tocHiglighter() {
  const [anchors, ok] = getHeadlines()
  if (!ok) {
    return
  }

  anchors.forEach((anchor) => {

  });
  

  var scrollTop = $(document).scrollTop();
  for (var i = 0; i < anchors.length; i++){
    var heading = anchors[i].getAttribute('id')
    let highlightedHref = $('#TableOfContents a[href="#' + heading + '"]');
    highlightedHref.parent().removeClass('is-active');
  }

  for (var i = anchors.length-1; i >= 0; i--){
    if (scrollTop > $(anchors[i]).offset().top - 180) {
        var heading = anchors[i].getAttribute('id')

        let highlightedHref = $('#TableOfContents a[href="#' + heading + '"]')
        highlightedHref.parent().addClass('is-active');
        break;
    }
  }
}

$(window).scroll(function(){
  tocHiglighter();
});


