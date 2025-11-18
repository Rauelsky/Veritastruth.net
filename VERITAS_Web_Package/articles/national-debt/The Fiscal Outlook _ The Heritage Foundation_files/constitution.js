"use strict";

var $ = jQuery;

$.fn.openEssay = function (nid, html) {
  $('.con-essay-wrapper').empty();
  $('.con-constitution').removeClass('hidden');
  $('.con-essay-container').hide();
  $('.selectric-item-list a').removeClass('active');
  $('.con-essay-block').removeClass('open');
  $('.selectric-item-list a[data-href$="essay_controller/' + nid + '"]').addClass('active');
  $('a[data-href$="essay_controller/' + nid + '"]').each(function () {
    var $link = $(this);
    var $article = $link.closest('article.node--type-constitution-guide');
    if (!$article.length) {
      $article = $('article.node--type-constitution-guide').first();
    }
    $('.con-essay-wrapper', $article).html(html);
    $('.con-essay-container', $article).show();
    $('.con-essay-block', $article).addClass('open');
    $article.trigger('openEssay');
    Drupal.attachBehaviors($('.con-essay-wrapper', $article).get(0));
  });
};

Drupal.behaviors.constitutionEssayTabs = {
  attach: function attach(context) {
    if (!$('.con-essay-tabs', context).length || typeof window.Tabby === 'undefined') {
      return;
    }
    new Tabby('.con-essay-tabs [data-tabs]');
  }
};

function handleLinksAndPaths() {
  var $essayLinks = $('a[data-href]');
  $essayLinks.each(function (i, ajaxLink) {
    var $linkElement = $(ajaxLink);
    var elementSettings = {
      base: $linkElement.attr('id'),
      element: ajaxLink
    };
    var href = $linkElement.attr('data-href');
    if (href) {
      elementSettings.url = href;
      elementSettings.event = 'click';
    }
    Drupal.ajax(elementSettings);
  });

  $essayLinks.on('click', function () {
    var path = $(this).attr('href');
    sendPageView(path);
    window.history.pushState({}, '', path);
  });

  var hash = window.location.hash;
  if (hash) {
    var target = document.querySelector(hash);
    if (target) {
      $(document).ready(function () {
        $('html, body').stop(true).animate({ scrollTop: $(hash).offset().top }, 500);
      });
    }
  }
}

function handleTooltips() {
  var $constitutionContainer = $('.constitution-container');
  $('.con-body a[data-href]').each(function () {
    var $link = $(this);
    if ($link.find('.tooltip__handler').length) return;
    var $handler = $('<span class="tooltip__handler"></span>');
    $link.append($handler);
  });

  if (typeof $.fn.tooltip === 'function' && typeof drupalSettings.constitutionEssaysTooltip === 'object') {
    $constitutionContainer.tooltip({
      items: '.con-body a[data-href^="/essay_controller/"]',
      content: function () {
        var $link = $(this);
        var target = $link.attr('data-href');
        var pos = target.indexOf('essay_controller/');
        if (pos === -1) return;
        var id = target.substr(pos + 17).trim();
        if (typeof drupalSettings.constitutionEssaysTooltip[id] === 'undefined') return;
        var output = '';
        var subheading = [];
        var essayData = drupalSettings.constitutionEssaysTooltip[id];
        if (essayData.title) output += '<div class="constitution-tooltip__title">' + essayData.title + '</div>';
        if (essayData.article) subheading.push(essayData.article);
        if (essayData.section && essayData.section !== 'NULL') subheading.push('Section ' + essayData.section);
        if (subheading.length) output += '<div class="constitution-tooltip__subheading">- ' + subheading.join(', ') + '</div>';
        return output || undefined;
      },
      classes: { "ui-tooltip": "constitution-tooltip" },
      position: {
        at: "left bottom",
        collision: "flipfit",
        using: function (position, feedback) {
          if (feedback.target && feedback.target.element) {
            var $tooltip = $(this);
            var $link = $(feedback.target.element);
            var $handler = $link.find('.tooltip__handler');
            if ($handler.length) {
              position = $handler.offset();
              position.left -= $tooltip.width() * 0.5 + 5;
              position.top += 38;
            }
          }
          $(this).css(position);
        }
      }
    });
  }
}

function handleGuides() {
  $('.node--type-constitution-guide').each(function () {
    var $node = $(this);
    var constMenuBtn = $('#selectric-const-menu-btn', $node);
    var constSliderContainer = $('.con-sidebar', $node);
    var constSideBar = $('.selectric-item-list', $node);
    var constSideBarItem = $('.selectric-item-list a', $node);
    var constEssayContainer = $('#con-essay-container', $node);
    var constBodyContainer = $('.con-constitution', $node);

    constMenuBtn.on("click", function () {
      constSideBar.slideToggle(300);
      constSliderContainer.toggleClass('open');
    });

    if ($(window).width() < 700) {
      constSideBar.slideToggle(0);
      constSliderContainer.toggleClass('open');
    }

    function closeEssay() {
      var $container = $('.con-essay-container', $node);
      $container.find('.con-essay-wrapper').empty();
      var container = $container.get(0);
      if (container !== null) {
        container.classList.remove('open');
        constBodyContainer.removeClass('hidden');
        constSideBarItem.removeClass('active');
        constEssayContainer.addClass('hidden');
        constEssayContainer.removeAttr('style');
        window.history.pushState({}, '', window.location.pathname);
      }
    }

    function openEssay() {
      constEssayContainer.addClass('open');
      constBodyContainer.addClass('hidden');
      $([document.documentElement, document.body]).stop(true).animate({
        scrollTop: $(".con-essay-wrapper", $node).offset().top
      }, 500);
    }

    var $closeButton = $('.con-essay-close', $node);
    if ($closeButton.length) $closeButton.on('click', closeEssay);

    $node.on('closeEssay', closeEssay);
    $node.on('openEssay', openEssay);
  });
}

function handleSidebar() {
  var $constitutionContainer = $('.constitution-container');
  if ($constitutionContainer.length && typeof window.StickySidebar !== 'undefined') {
    new window.StickySidebar('.discussion-menu__wrapper', {
      containerSelector: '.constitution-container',
      innerWrapperSelector: '.discussion-main-menu',
      minWidth: 768
    });
  }
}

function handleTabs() {
  document.addEventListener('tabby', function (event) {
    var $tab = $(event.target);
    $('.con-essay-tabs .button-more').toggleClass('active', false);
    $tab.closest('.button-more').toggleClass('active', true);
  }, false);
}

function handleGuideLinks() {
  $(document).on('click', '.view-constitution-page .selectric-item-list a', function (e) {
    e.preventDefault(); // <- Prevent default jump
    e.stopPropagation(); // <- Stop bubbling just in case

    var path = $(this).attr('href');
    var hash = this.hash;
    var scrolled = false;

    sendPageView(path);
    window.history.pushState({}, '', path);

    if (hash && $(hash).length) {
      $('html, body').stop(true).animate({ scrollTop: $(hash).offset().top }, 500);
      scrolled = true;
    }

    if (!scrolled) {
      var section = path.split('/').pop();
      if (section && $('#' + section).length) {
        $('html, body').stop(true).animate({ scrollTop: $('#' + section).offset().top }, 500);
        scrolled = true;
      }
    }
  });
}

function handleAmendmentLinks() {
  $(document).on('click', 'ul.amendments a', function (e) {
    e.preventDefault(); // <- Prevent default jump
    e.stopPropagation();

    var path = $(this).attr('href');
    sendPageView(path);
    window.history.pushState({}, '', path);

    var hash = path.split('#')[1];
    if (hash) {
      var $target = $('#' + hash);
      if ($target.length) {
        $('html, body').stop(true).animate({ scrollTop: $target.offset().top }, 500);
      }
    }
  });
}

function sendPageView(path) {
  var args = path.split('/');
  var title = args[args.length - 1];
  title = title.replace(/-/g, " ");
  title = title.replace(/^(.)|\s(.)/g, function ($1) { return $1.toUpperCase(); });
  title = title + ' | The Heritage Guide to the Constitution';
  dataLayer.push({ event: 'pageview', page: { path: path, title: title } });
}

function init() {
  handleGuideLinks();
  handleAmendmentLinks();
  handleLinksAndPaths();
  handleSidebar();
  handleTooltips();
  handleGuides();
  handleTabs();
}

// Expose globally for Drupal
window.constitutionInit = init;
if (typeof exports !== "undefined") {
  exports.init = init;
} else {
  window.constitutionInit = init;
}
