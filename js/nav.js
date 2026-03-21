(function () {
  var isPost = window.location.pathname.indexOf('/posts/') !== -1;
  var basePath = isPost ? '../' : '';

  var navHTML = `
    <nav class="wolfman-nav" id="wolfmanNav">
      <svg class="nav-bg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 375 100" aria-hidden="true">
        <path d="M0,100 L0,46 L95,46 C125,46 158,0 187.5,0 C217,0 250,46 280,46 L375,46 L375,100 Z"/>
      </svg>
      <button class="nav-btn nav-btn--left" id="navSettings" aria-label="Open settings"></button>
      <button class="nav-btn nav-btn--center wolf-btn" id="wolfBtn" aria-label="Open menu">
        <img src="${basePath}images/site_images/White Bronze LogoAsset 12300.png" alt="Wolfman">
      </button>
      <button class="nav-btn nav-btn--right nav-dev" id="navDev" aria-label="Development"></button>
    </nav>

    <nav class="menu-overlay" id="menuOverlay" aria-hidden="true">
      <button class="menu-close" id="menuClose" aria-label="Close menu">&times;</button>
      <div class="menu-inner">
        <p class="menu-prompt">What shall we do?</p>
        <ul class="menu-links">
          <li class="nav-intentions"><a href="${basePath}intentions.html">set an intention</a></li>
          <li class="nav-shop"><a href="${basePath}shop.html">buy something cool</a></li>
          <li class="nav-about"><a href="${basePath}about.html">discover Wolfman</a></li>
        </ul>
        <div class="menu-footer-icons">
          <a href="${basePath}index.html" aria-label="Go home">
            <img class="menu-footer-icon" id="menuFooterLogo" src="${basePath}images/site_images/White Bronze LogoAsset 12300.png" alt="Wolfman home">
          </a>
          <a href="${basePath}development.html" aria-label="Development page">
            <img class="menu-footer-icon" src="${basePath}images/site_images/claudecode-color.png" alt="Claude Code development">
          </a>
        </div>
      </div>
    </nav>

    <div class="settings-overlay" id="settingsOverlay" aria-hidden="true">
      <button class="settings-close" id="settingsClose" aria-label="Close settings">&times;</button>
      <div class="settings-inner">
        <p class="settings-overlay-title">settings</p>
        <div class="settings-group">
          <p class="settings-label">appearance</p>
          <div class="theme-toggle">
            <button class="theme-btn" data-theme="dark" onclick="WolfmanTheme.setTheme('dark')">dark</button>
            <button class="theme-btn" data-theme="light" onclick="WolfmanTheme.setTheme('light')">light</button>
          </div>
        </div>
        <div class="settings-group">
          <p class="settings-label">reading size</p>
          <div class="fontsize-toggle">
            <button class="fontsize-btn" data-size="normal" onclick="WolfmanTheme.setFontSize('normal')">normal</button>
            <button class="fontsize-btn" data-size="large" onclick="WolfmanTheme.setFontSize('large')">large</button>
            <button class="fontsize-btn" data-size="xlarge" onclick="WolfmanTheme.setFontSize('xlarge')">extra large</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', navHTML);

  var wolfBtn = document.getElementById('wolfBtn');
  var menuClose = document.getElementById('menuClose');
  var menuOverlay = document.getElementById('menuOverlay');
  var navSettings = document.getElementById('navSettings');
  var navDev = document.getElementById('navDev');
  var settingsOverlay = document.getElementById('settingsOverlay');
  var settingsClose = document.getElementById('settingsClose');

  function openMenu() {
    menuOverlay.classList.add('is-open');
    menuOverlay.setAttribute('aria-hidden', 'false');
    wolfBtn.setAttribute('aria-label', 'Close menu');
  }

  function closeMenu() {
    menuOverlay.classList.remove('is-open');
    menuOverlay.setAttribute('aria-hidden', 'true');
    wolfBtn.setAttribute('aria-label', 'Open menu');
  }

  function openSettings() {
    settingsOverlay.classList.add('is-open');
    settingsOverlay.setAttribute('aria-hidden', 'false');
    navSettings.setAttribute('aria-label', 'Close settings');
  }

  function closeSettings() {
    settingsOverlay.classList.remove('is-open');
    settingsOverlay.setAttribute('aria-hidden', 'true');
    navSettings.setAttribute('aria-label', 'Open settings');
  }

  wolfBtn.addEventListener('click', function () {
    menuOverlay.classList.contains('is-open') ? closeMenu() : openMenu();
  });

  menuClose.addEventListener('click', closeMenu);

  navSettings.addEventListener('click', function () {
    settingsOverlay.classList.contains('is-open') ? closeSettings() : openSettings();
  });

  settingsClose.addEventListener('click', closeSettings);

  navDev.addEventListener('click', function () {
    window.location.href = basePath + 'development.html';
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeMenu();
      closeSettings();
    }
  });
})();
