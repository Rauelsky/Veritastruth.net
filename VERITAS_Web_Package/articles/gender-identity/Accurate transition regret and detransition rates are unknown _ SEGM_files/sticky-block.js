(function ($, Drupal, drupalSettings) {
  'use strict';
  Drupal.behaviors.stickyBlock = {
    attach: function (context, settings) {
      $(document).ready(function () {
        const blocks = $('.sticky-block.sticky');
        $(blocks).each(function () {
          const block = $(this);
          console.log(blockState())
          if (blockState()) {
            setTimeout(function () {
              $(block).fadeIn(400)
            }, 400);
          }

          $(block).find('.segm-button--close').click(function () {
            $(block).fadeOut(400);
            blockState(true)
          })
        })
      })

      const setCookie = (name,value,days) => {
        var expires = "";
        if (days) {
          var date = new Date();
          date.setTime(date.getTime() + (days*24*60*60*1000));
          expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "")  + expires + "; path=/";
      }

      const getCookie = (name) => {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++) {
          var c = ca[i];
          while (c.charAt(0)==' ') c = c.substring(1,c.length);
          if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
        }
        return null;
      }

      const blockState = (setState = false) => {
        if (drupalSettings.sticky_block.config.visibility_mode) {
          switch (drupalSettings.sticky_block.config.visibility_mode) {
            case '1':
              if (setState) {
                let cookie_days = drupalSettings.sticky_block.config.cookie_days
                if (!cookie_days) {
                  cookie_days = 7;
                }
                setCookie( 'visited-block', 'yes', cookie_days);
                return false
              }

              return !getCookie( 'visited-block');

            case '2':
              if (setState) {
                sessionStorage.setItem('visited-block', 'yes');
              }

              return sessionStorage.getItem('visited-block') !== 'yes'

            case '3':
              if (setState) {
                setCookie( 'visited-block', 'yes');
                return false
              }

              return !getCookie( 'visited-block');
          }
        }

        return true;
      }
    }
  };
})(jQuery, Drupal, drupalSettings);
