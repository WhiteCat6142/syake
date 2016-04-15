(function() {
      var th = 300;
      var unveil = function () {
        var n = document.getElementsByClassName('lazy');
        var len = n.length;
        if (len == 0) {
          return;
        }
        var wh = screen.height + th;
        for (var i = 0; i < len; i++) {
          var bound = n[i].getBoundingClientRect();
          if (bound.top > wh || bound.bottom < 0 - th) continue;
          var ele = n[i];
          ele.setAttribute('src', ele.getAttribute('data-src'));
          ele.removeAttribute('data-src');
          ele.removeAttribute('class');
          i--;
          len--;
        }
      }
      var timer = null;
      var listen = function () {
        clearTimeout(timer);
        timer = setTimeout(unveil, 200);
      }
      window.addEventListener('resize', listen);
      window.addEventListener('scroll', listen);
      })();