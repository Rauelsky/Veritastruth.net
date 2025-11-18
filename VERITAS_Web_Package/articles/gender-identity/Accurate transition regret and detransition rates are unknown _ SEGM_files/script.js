

(function ($) {

$('#t_view').on('click', function(event) {
  event.preventDefault(); // To prevent following the link (optional)
$('#t_view').hide();
  $('.hide-text').addClass('show');
});

$('.read-more-blog').on('click', function(event) {
  event.preventDefault(); // To prevent following the link (optional)
$(this).hide();
  $(this).parents('.blog-text-body').find('.hide-text').addClass('show');
});

$( "select#edit-field-group" ).change(function() {

if($('select#edit-field-group').val() =='Other - please specify'){
$('.own-text').show();
} else{$('.own-text').hide();}
});

 $(".sub_col .sub_name").click(function(){
    $(this).toggleClass("show");


});
 $(".collection_col .collection_name").not('.ishid').click(function(){
    $(this).toggleClass("show");


});
 $(".items .ite_title .bib_read_more").parent('.ite_title').click(function(){
    $(this).toggleClass("show");


});
 $(".bib_read_less").click(function(){
    $(this).parent('.hide_ite').prev('.ite_title').toggleClass("show");
});
 $(".toggle-menu").click(function(){
    $(".navigation").toggleClass("show");


});
 $(".read-more").click(function(){
    $(this).parent().toggleClass("show34");
});
$(".segm_en").click(function(){
    $(this).parents('.items').removeClass("journal_show").toggleClass("segm_show");
});
$(".journal_en").click(function(){
    $(this).parents('.items').removeClass("segm_show").toggleClass("journal_show");
});
$(".hide-all").click(function(){
    $(this).parents('.items').removeClass("segm_show").removeClass("journal_show");
});
function loadProgress() {
  if ($("div.em-progress").length){
    //$.get( "/test.php", function( data ) {
    //  $( "div.em-progress" ).html( data );
    //  console.log( "Load was performed." );
    //});
  }
  setTimeout(loadProgress, 50000);
}
$('[href*="popup1"]').append("<span class=\"pop\">Steensma T, McGuire J, Kreukels B, Beekman A, Cohen-Kettenis P. Factors Associated With Desistence and Persistence of Childhood Gender Dysphoria: A Quantitative Follow-Up Study. Journal of the American Academy of Child & Adolescent Psychiatry. 2013;52(6):582-590. doi:10.1016/j.jaac.2013.03.016</span>");
$('[href*="popup2"]').append("<span class=\"pop\">de Vries AL, McGuire JK, Steensma TD, Wagenaar EC, Doreleijers TA, Cohen-Kettenis PT. Young adult psychological outcome after puberty suppression and gender reassignment. Pediatrics. 2014;134(4):696-704. doi: 10.1542/peds.2013-2958</span>");
$('[href*="popup"]').click(
function(event){
event.preventDefault();
$('[href*="popup"] .pop').toggleClass("show");
});
loadProgress();
}(jQuery));
