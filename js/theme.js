(function () {
  var LOGO_DARK = 'images/site_images/White Bronze LogoAsset 12300.png';
  var LOGO_LIGHT = 'images/site_images/Grey Bronze LogoAsset 14300.png';
  var isPost = window.location.pathname.indexOf('/posts/') !== -1;
  var base = isPost ? '../' : '';

  function getTheme() {
    return localStorage.getItem('wolfman-theme') || 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var logoSrc = base + (theme === 'light' ? LOGO_LIGHT : LOGO_DARK);
    var wolfImg = document.querySelector('#wolfBtn img');
    var footerLogo = document.getElementById('menuFooterLogo');
    var postLogo = document.querySelector('.wolf-home-link img');
    if (wolfImg) wolfImg.src = logoSrc;
    if (footerLogo) footerLogo.src = logoSrc;
    if (postLogo) postLogo.src = logoSrc;
    var toggleBtns = document.querySelectorAll('.theme-btn');
    toggleBtns.forEach(function (btn) {
      btn.classList.toggle('theme-btn--active', btn.dataset.theme === theme);
    });
  }

  function setTheme(theme) {
    localStorage.setItem('wolfman-theme', theme);
    applyTheme(theme);
  }

  applyTheme(getTheme());
  window.WolfmanTheme = { setTheme: setTheme, getTheme: getTheme };
})();
