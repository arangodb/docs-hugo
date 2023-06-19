function hideEmptyOpenapiDiv() {
    var lists = document.getElementsByClassName("openapi-parameters")
    for (let list of lists) {
        if ($(list).find(".openapi-table").text().trim() == "") {
            $(list).addClass("hidden");
        }
    }
 }




function initClickHandlers() {
    hideEmptyOpenapiDiv();

    $(".openapi-prop").click(function(event) {
        if (this === event.target) {
            $(event.target).toggleClass("collapsed");
            console.log($(event.target).find('.openapi-prop-content').first())
            $(event.target).find('.openapi-prop-content').first().toggleClass("hidden");
        }
    });
    
    $(".openapi-table.show-children").click(function(event) {
        $(event.target).toggleClass("collapsed");
        $(event.target).next(".openapi-table").toggleClass("hidden");
    });

    $('#search-by').keypress(
        function(event){
          if (event.which == '13') {
            event.preventDefault();
          }
      });
    
}