// Foundation JavaScript
// Documentation can be found at: http://foundation.zurb.com/docs
$(document).foundation();

$(document).ready(function() {

  /*

  if($(".masonry").length > 0) {

    // init Isotope
    var $grid = $('.masonry');

    // layout Isotope after each image loads
    $grid.imagesLoaded( function() {
      $grid.isotope({
        itemSelector: '.masonry-item',
        layout: 'masonry'
      });
    });

  }

  */


  /* SEARCH TOGGLE */

  $(".search-toggle").click(function(event) {
    event.stopPropagation();
    searchToggle();
  });

  $(document).on('click', '.hasSearchEnabled', function(e) {
    if(!$(e.target).parents('.searchFormWrap').length) {
      searchToggle();
    }
  });

  function searchToggle() {
    $("body").toggleClass("hasSearchEnabled");
    $(".searchFormWrap").toggleClass("enabled");
  }


});
