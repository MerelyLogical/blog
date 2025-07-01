(function (jtd, undefined) {

// Event handling

jtd.addEvent = function(el, type, handler) {
  if (el.attachEvent) el.attachEvent('on'+type, handler); else el.addEventListener(type, handler);
}
jtd.removeEvent = function(el, type, handler) {
  if (el.detachEvent) el.detachEvent('on'+type, handler); else el.removeEventListener(type, handler);
}
jtd.onReady = function(ready) {
  // in case the document is already rendered
  if (document.readyState!='loading') ready();
  // modern browsers
  else if (document.addEventListener) document.addEventListener('DOMContentLoaded', ready);
  // IE <= 8
  else document.attachEvent('onreadystatechange', function(){
      if (document.readyState=='complete') ready();
  });
}

// Show/hide mobile menu

function initNav() {
  jtd.addEvent(document, 'click', function(e){
    var target = e.target;
    while (target && !(target.classList && target.classList.contains('nav-list-expander'))) {
      target = target.parentNode;
    }
    if (target) {
      e.preventDefault();
      target.parentNode.classList.toggle('active');
    }
  });

  const siteNav = document.getElementById('site-nav');
  const mainHeader = document.getElementById('main-header');
  const menuButton = document.getElementById('menu-button');

  jtd.addEvent(menuButton, 'click', function(e){
    e.preventDefault();

    if (menuButton.classList.toggle('nav-open')) {
      siteNav.classList.add('nav-open');
      mainHeader.classList.add('nav-open');
    } else {
      siteNav.classList.remove('nav-open');
      mainHeader.classList.remove('nav-open');
    }
  });
}
// Site search

function initSearch() {
  var request = new XMLHttpRequest();
  request.open('GET', '/assets/js/search-data.json', true);

  request.onload = function(){
    if (request.status >= 200 && request.status < 400) {
      var docs = JSON.parse(request.responseText);
      
      lunr.tokenizer.separator = /[\s\-/]+/

      var index = lunr(function(){
        this.ref('id');
        this.field('title', { boost: 200 });
        this.field('content', { boost: 2 });
        this.field('relUrl');
        this.metadataWhitelist = ['position']

        for (var i in docs) {
          this.add({
            id: i,
            title: docs[i].title,
            content: docs[i].content,
            relUrl: docs[i].relUrl
          });
        }
      });

      searchLoaded(index, docs);
    } else {
      console.log('Error loading ajax request. Request status:' + request.status);
    }
  };

  request.onerror = function(){
    console.log('There was a connection error');
  };

  request.send();
}

function searchLoaded(index, docs) {
  var index = index;
  var docs = docs;
  var searchInput = document.getElementById('search-input');
  var searchResults = document.getElementById('search-results');
  var mainHeader = document.getElementById('main-header');
  var currentInput;
  var currentSearchIndex = 0;

  function showSearch() {
    document.documentElement.classList.add('search-active');
  }

  function hideSearch() {
    document.documentElement.classList.remove('search-active');
  }

  function update() {
    currentSearchIndex++;

    var input = searchInput.value;
    if (input === '') {
      hideSearch();
    } else {
      showSearch();
      // scroll search input into view, workaround for iOS Safari
      window.scroll(0, -1);
      setTimeout(function(){ window.scroll(0, 0); }, 0);
    }
    if (input === currentInput) {
      return;
    }
    currentInput = input;
    searchResults.innerHTML = '';
    if (input === '') {
      return;
    }

    var results = index.query(function (query) {
      var tokens = lunr.tokenizer(input)
      query.term(tokens, {
        boost: 10
      });
      query.term(tokens, {
        wildcard: lunr.Query.wildcard.TRAILING
      });
    });

    if ((results.length == 0) && (input.length > 2)) {
      var tokens = lunr.tokenizer(input).filter(function(token, i) {
        return token.str.length < 20;
      })
      if (tokens.length > 0) {
        results = index.query(function (query) {
          query.term(tokens, {
            editDistance: Math.round(Math.sqrt(input.length / 2 - 1))
          });
        });
      }
    }

    if (results.length == 0) {
      var noResultsDiv = document.createElement('div');
      noResultsDiv.classList.add('search-no-result');
      noResultsDiv.innerText = 'No results found';
      searchResults.appendChild(noResultsDiv);

    } else {
      var resultsList = document.createElement('ul');
      resultsList.classList.add('search-results-list');
      searchResults.appendChild(resultsList);

      addResults(resultsList, results, 0, 10, 100, currentSearchIndex);
    }

    function addResults(resultsList, results, start, batchSize, batchMillis, searchIndex) {
      if (searchIndex != currentSearchIndex) {
        return;
      }
      for (var i = start; i < (start + batchSize); i++) {
        if (i == results.length) {
          return;
        }
        addResult(resultsList, results[i]);
      }
      setTimeout(function() {
        addResults(resultsList, results, start + batchSize, batchSize, batchMillis, searchIndex);
      }, batchMillis);
    }

    function addResult(resultsList, result) {
      var doc = docs[result.ref];

      var resultsListItem = document.createElement('li');
      resultsListItem.classList.add('search-results-list-item');
      resultsList.appendChild(resultsListItem);

      var resultLink = document.createElement('a');
      resultLink.classList.add('search-result');
      resultLink.setAttribute('href', doc.url);
      resultsListItem.appendChild(resultLink);

      var resultTitle = document.createElement('div');
      resultTitle.classList.add('search-result-title');
      resultLink.appendChild(resultTitle);

      var resultDoc = document.createElement('div');
      resultDoc.classList.add('search-result-doc');
      resultDoc.innerHTML = '<svg viewBox="0 0 24 24" class="search-result-icon"><use xlink:href="#svg-doc"></use></svg>';
      resultTitle.appendChild(resultDoc);

      var resultDocTitle = document.createElement('div');
      resultDocTitle.classList.add('search-result-doc-title');
      resultDocTitle.innerHTML = doc.doc;
      resultDoc.appendChild(resultDocTitle);
      var resultDocOrSection = resultDocTitle;

      if (doc.doc != doc.title) {
        resultDoc.classList.add('search-result-doc-parent');
        var resultSection = document.createElement('div');
        resultSection.classList.add('search-result-section');
        resultSection.innerHTML = doc.title;
        resultTitle.appendChild(resultSection);
        resultDocOrSection = resultSection;
      }

      var metadata = result.matchData.metadata;
      var titlePositions = [];
      var contentPositions = [];
      for (var j in metadata) {
        var meta = metadata[j];
        if (meta.title) {
          var positions = meta.title.position;
          for (var k in positions) {
            titlePositions.push(positions[k]);
          }
        }
        if (meta.content) {
          var positions = meta.content.position;
          for (var k in positions) {
            var position = positions[k];
            var previewStart = position[0];
            var previewEnd = position[0] + position[1];
            var ellipsesBefore = true;
            var ellipsesAfter = true;
            for (var k = 0; k < 5; k++) {
              var nextSpace = doc.content.lastIndexOf(' ', previewStart - 2);
              var nextDot = doc.content.lastIndexOf('. ', previewStart - 2);
              if ((nextDot >= 0) && (nextDot > nextSpace)) {
                previewStart = nextDot + 1;
                ellipsesBefore = false;
                break;
              }
              if (nextSpace < 0) {
                previewStart = 0;
                ellipsesBefore = false;
                break;
              }
              previewStart = nextSpace + 1;
            }
            for (var k = 0; k < 10; k++) {
              var nextSpace = doc.content.indexOf(' ', previewEnd + 1);
              var nextDot = doc.content.indexOf('. ', previewEnd + 1);
              if ((nextDot >= 0) && (nextDot < nextSpace)) {
                previewEnd = nextDot;
                ellipsesAfter = false;
                break;
              }
              if (nextSpace < 0) {
                previewEnd = doc.content.length;
                ellipsesAfter = false;
                break;
              }
              previewEnd = nextSpace;
            }
            contentPositions.push({
              highlight: position,
              previewStart: previewStart, previewEnd: previewEnd,
              ellipsesBefore: ellipsesBefore, ellipsesAfter: ellipsesAfter
            });
          }
        }
      }

      if (titlePositions.length > 0) {
        titlePositions.sort(function(p1, p2){ return p1[0] - p2[0] });
        resultDocOrSection.innerHTML = '';
        addHighlightedText(resultDocOrSection, doc.title, 0, doc.title.length, titlePositions);
      }

      if (contentPositions.length > 0) {
        contentPositions.sort(function(p1, p2){ return p1.highlight[0] - p2.highlight[0] });
        var contentPosition = contentPositions[0];
        var previewPosition = {
          highlight: [contentPosition.highlight],
          previewStart: contentPosition.previewStart, previewEnd: contentPosition.previewEnd,
          ellipsesBefore: contentPosition.ellipsesBefore, ellipsesAfter: contentPosition.ellipsesAfter
        };
        var previewPositions = [previewPosition];
        for (var j = 1; j < contentPositions.length; j++) {
          contentPosition = contentPositions[j];
          if (previewPosition.previewEnd < contentPosition.previewStart) {
            previewPosition = {
              highlight: [contentPosition.highlight],
              previewStart: contentPosition.previewStart, previewEnd: contentPosition.previewEnd,
              ellipsesBefore: contentPosition.ellipsesBefore, ellipsesAfter: contentPosition.ellipsesAfter
            }
            previewPositions.push(previewPosition);
          } else {
            previewPosition.highlight.push(contentPosition.highlight);
            previewPosition.previewEnd = contentPosition.previewEnd;
            previewPosition.ellipsesAfter = contentPosition.ellipsesAfter;
          }
        }

        var resultPreviews = document.createElement('div');
        resultPreviews.classList.add('search-result-previews');
        resultLink.appendChild(resultPreviews);

        var content = doc.content;
        for (var j = 0; j < Math.min(previewPositions.length, 3); j++) {
          var position = previewPositions[j];

          var resultPreview = document.createElement('div');
          resultPreview.classList.add('search-result-preview');
          resultPreviews.appendChild(resultPreview);

          if (position.ellipsesBefore) {
            resultPreview.appendChild(document.createTextNode('... '));
          }
          addHighlightedText(resultPreview, content, position.previewStart, position.previewEnd, position.highlight);
          if (position.ellipsesAfter) {
            resultPreview.appendChild(document.createTextNode(' ...'));
          }
        }
      }
      var resultRelUrl = document.createElement('span');
      resultRelUrl.classList.add('search-result-rel-url');
      resultRelUrl.innerText = doc.relUrl;
      resultTitle.appendChild(resultRelUrl);
    }

    function addHighlightedText(parent, text, start, end, positions) {
      var index = start;
      for (var i in positions) {
        var position = positions[i];
        var span = document.createElement('span');
        span.innerHTML = text.substring(index, position[0]);
        parent.appendChild(span);
        index = position[0] + position[1];
        var highlight = document.createElement('span');
        highlight.classList.add('search-result-highlight');
        highlight.innerHTML = text.substring(position[0], index);
        parent.appendChild(highlight);
      }
      var span = document.createElement('span');
      span.innerHTML = text.substring(index, end);
      parent.appendChild(span);
    }
  }

  jtd.addEvent(searchInput, 'focus', function(){
    setTimeout(update, 0);
  });

  jtd.addEvent(searchInput, 'keyup', function(e){
    switch (e.keyCode) {
      case 27: // When esc key is pressed, hide the results and clear the field
        searchInput.value = '';
        break;
      case 38: // arrow up
      case 40: // arrow down
      case 13: // enter
        e.preventDefault();
        return;
    }
    update();
  });

  jtd.addEvent(searchInput, 'keydown', function(e){
    switch (e.keyCode) {
      case 38: // arrow up
        e.preventDefault();
        var active = document.querySelector('.search-result.active');
        if (active) {
          active.classList.remove('active');
          if (active.parentElement.previousSibling) {
            var previous = active.parentElement.previousSibling.querySelector('.search-result');
            previous.classList.add('active');
          }
        }
        return;
      case 40: // arrow down
        e.preventDefault();
        var active = document.querySelector('.search-result.active');
        if (active) {
          if (active.parentElement.nextSibling) {
            var next = active.parentElement.nextSibling.querySelector('.search-result');
            active.classList.remove('active');
            next.classList.add('active');
          }
        } else {
          var next = document.querySelector('.search-result');
          if (next) {
            next.classList.add('active');
          }
        }
        return;
      case 13: // enter
        e.preventDefault();
        var active = document.querySelector('.search-result.active');
        if (active) {
          active.click();
        } else {
          var first = document.querySelector('.search-result');
          if (first) {
            first.click();
          }
        }
        return;
    }
  });

  jtd.addEvent(document, 'click', function(e){
    if (e.target != searchInput) {
      hideSearch();
    }
  });
}

// Switch theme

jtd.getTheme = function() {
  var cssFileHref = document.querySelector('[rel="stylesheet"]').getAttribute('href');
  return cssFileHref.substring(cssFileHref.lastIndexOf('-') + 1, cssFileHref.length - 4);
}

jtd.setTheme = function(theme) {
  var cssFile = document.querySelector('[rel="stylesheet"]');
  cssFile.setAttribute('href', '/assets/css/just-the-docs-' + theme + '.css');
}

// Scroll site-nav to ensure the link to the current page is visible

function scrollNav() {
  const href = document.location.pathname;
  const siteNav = document.getElementById('site-nav');
  const targetLink = siteNav.querySelector('a[href="' + href + '"], a[href="' + href + '/"]');
  if(targetLink){
    const rect = targetLink.getBoundingClientRect();
    siteNav.scrollBy(0, rect.top - 3*rect.height);
  }
}

// Document ready

jtd.onReady(function(){
  initNav();
  initSearch();
  scrollNav();
// TEMP HACK!!
// ------------------------------------------------------------------------------------------

/* config */

const kofiWidgetOverlayConfig = {
    'floating-chat.core.pageId': '',
    'floating-chat.core.closer': '<svg height="0px" width="15px"><line x1="2" y1="8" x2="13" y2="18" style="stroke:#000; stroke-width:3" /><line x1="13" y1="8" x2="2" y2="18" style="stroke:#000; stroke-width:3" /></svg>',
    'floating-chat.core.position.bottom-left': 'position: fixed; bottom: 50px; left: 10px; width: 160px; height: 65px;',

    'floating-chat.cssId': '',
    'floating-chat.notice.text': 'ko-fi.com/%HANDLE%',
    'floating-chat.donatebutton.image': 'https://storage.ko-fi.com/cdn/cup-border.png',
    'floating-chat.donateButton.background-color': '#00b9fe',
    'floating-chat.donateButton.text': 'Support me',
    'floating-chat.donateButton.text-color': '#fff',
    'floating-chat.stylesheets': '["https://fonts.googleapis.com/css?family=Nunito:400,700,800&display=swap"]',
};

var kofiWidgetOverlayFloatingChatBuilder = kofiWidgetOverlayFloatingChatBuilder || function (config, _utils) {

    const _configManager = _utils.getConfigManager(config);
    const _myType = 'floating-chat';
    const _topContainerWrapClass = 'floatingchat-container-wrap';
    const _topMobiContainerWrapClass = 'floatingchat-container-wrap-mobi';

    var widgetPageLoadInitiatedStates = [];

    var closeButtonActionBlocked = false;
   
    function getButtonId() {
        return `${_configManager.getValue(_myType, 'cssId')}-donate-button`;
    };

    function getContainerFrameId() {
        return 'kofi-wo-container' + _configManager.getValue(_myType, 'cssId');
    };

    function getMobiContainerFrameId() {
        return 'kofi-wo-container-mobi' + _configManager.getValue(_myType, 'cssId');
    };

    function getButtonImageId() {
        return `${_configManager.getValue(_myType, 'cssId')}-donate-button-image`
    };

    function createButtonContainerIframe(iframeId, mainStyleSheetFile) {

        var htmlBody = getHtml();
        var buttonBody = '<html>' +
            '<head>' +
            `<link rel="preconnect" href="https://ko-fi.com/">` +
            `<link rel="dns-prefetch" href="https://ko-fi.com/">` +
            `<link rel="preconnect" href="https://storage.ko-fi.com/">` +
            `<link rel="dns-prefetch" href="https://storage.ko-fi.com/">` +
            `<link href="${mainStyleSheetFile}" rel="stylesheet" type="text/css" />` +
            `</head>` +
            `<body style="margin: 0; position: absolute; bottom: 0;">${htmlBody}</body>` +
            '</html>';

        var iframeContainerElement = document.getElementById(iframeId).contentDocument;
        var iframe = document.getElementById(iframeId);

        var _timer = setInterval(function () {

            //delay the display of the button, so that the stylesheets get time to load
            //the stylesheet load event does not appear to work reliably
            //on safari on iOS
            var doc = iframe.contentDocument || iframe.contentWindow;
            if (doc && doc.readyState == 'complete') {
                clearInterval(_timer);

                var parentWrapper = document.getElementsByClassName(_topContainerWrapClass)[0];
                var mobiParentWrapper = document.getElementsByClassName(_topMobiContainerWrapClass)[0];


                parentWrapper.style = 'z-index:10000;';
                mobiParentWrapper.style = 'z-index:10000;';

                iframe.style = '';
            }
        }, 300);

        iframeContainerElement.write(buttonBody);
        iframeContainerElement.close();

        return iframeContainerElement;
    };

    function attachDonateButton(iframeContainerElement, iframeId, selectors, heightLimits) {

        const donateButton = iframeContainerElement.getElementById(`${getButtonId()}`);
        donateButton.addEventListener('click',
            function () {
                if (donateButton.classList.contains("closed")) {
                    activateKofiIframe(iframeId, selectors, heightLimits);
                } else if (!closeButtonActionBlocked) {
                    var popupId = _configManager.getValue(_myType, 'cssId') + `-${selectors.popupId}`;
                    var popup = document.getElementById(popupId);
                    closePopup(popup, donateButton);
                }
            });

        return donateButton;
    };

    var write = function (parentElementId) {

        var docHead = document.head;
        if (!docHead) {
            docHead = document.createElement('head');
            document.prepend(docHead);
        }

        var iframeId = getContainerFrameId();
        var mobiIframeId = getMobiContainerFrameId();


        var iframeHtml = `<div class="${_topContainerWrapClass}" style="height: 0px; transition: all 0.3s ease 0s; opacity:0;">` +
            `<iframe class="floatingchat-container" style="height: 0px; transition: all 0.6s ease 0s; opacity:0;" id="${iframeId}"></iframe>` +
            '</div>' +
            `<div class="${_topMobiContainerWrapClass}" style="height: 0px; transition: all 0.6s ease 0s; opacity:0;">` +
            `<iframe class="floatingchat-container-mobi" style="height: 0px; transition: all 0.6s ease 0s; opacity:0;" id="${mobiIframeId}"></iframe>` +
            '</div>';

        var existingPlaceHolder = document.getElementById(parentElementId);
        existingPlaceHolder.innerHTML = iframeHtml;

        var iframeContainerElement = createButtonContainerIframe(iframeId, 'https://storage.ko-fi.com/cdn/scripts/floating-chat-main.css');
        var mobiIframeContainerElement = createButtonContainerIframe(mobiIframeId, 'https://storage.ko-fi.com/cdn/scripts/floating-chat-main.css');

         _utils.loadStyleSheet('https://storage.ko-fi.com/cdn/scripts/floating-chat-wrapper.css', document);
        var styleSheetsValue = _configManager.getValue(_myType, 'stylesheets');

        if ('' !== styleSheetsValue) {

            styleSheets = JSON.parse(styleSheetsValue);

            styleSheets.forEach(stylesheetRef => {
                _utils.loadStyleSheet(stylesheetRef, document);
                _utils.loadStyleSheet(stylesheetRef, iframeContainerElement);
                _utils.loadStyleSheet(stylesheetRef, mobiIframeContainerElement);
            });
        }

        var desktopDonateButton = attachDonateButton(iframeContainerElement, iframeId, {
            popupId: 'kofi-popup-iframe',
            popupIframeContainerIdSuffix: 'popup-iframe-container'
        }, { maxHeight: 690, minHeight: 400, });
        widgetPageLoadInitiatedStates.push([desktopDonateButton, false]);
        var mobileDonateButton = attachDonateButton(mobiIframeContainerElement, mobiIframeId, {
            popupId: 'kofi-popup-iframe-mobi',
            popupIframeContainerIdSuffix: 'popup-iframe-container-mobi'
        }, { maxHeight: 690, minHeight: 350 });
        widgetPageLoadInitiatedStates.push([mobileDonateButton, false]);

        // Already create the widget popup iframe (hidden)
        insertPopupHtmlIntoBody(desktopDonateButton, {
            popupId: 'kofi-popup-iframe',
            popupClass: 'floating-chat-kofi-popup-iframe',
            noticeClass: 'floating-chat-kofi-popup-iframe-notice',
            closerClass: 'floating-chat-kofi-popup-iframe-closer',
            popupIframeContainerClass: 'floating-chat-kofi-popup-iframe-container',
            popupIframeContainerIdSuffix: 'popup-iframe-container',
            popuupKofiIframeHeightOffset: 42
        }, parentElementId);

        insertPopupHtmlIntoBody(mobileDonateButton, {
            popupId: 'kofi-popup-iframe-mobi',
            popupClass: 'floating-chat-kofi-popup-iframe-mobi',
            noticeClass: 'floating-chat-kofi-popup-iframe-notice-mobi',
            closerClass: 'floating-chat-kofi-popup-iframe-closer-mobi',
            popupIframeContainerClass: 'floating-chat-kofi-popup-iframe-container-mobi',
            popupIframeContainerIdSuffix: 'popup-iframe-container-mobi',
            popuupKofiIframeHeightOffset: 100
        }, parentElementId);
    };

    function activateKofiIframe(iframeId, selectors, heightLimits) {

        var iframeContainerElement = document.getElementById(iframeId).contentDocument;

        const donateButton = iframeContainerElement.getElementById(`${getButtonId()}`);
        const kofiIframeState = donateButton.classList.contains('closed') ? 'open' : 'close';
        toggleKofiIframe(iframeId, kofiIframeState, donateButton, selectors, heightLimits);
    };

    function updateClass(element, oldClass, newClass) {

        if (oldClass !== '') {
            element.classList.remove(oldClass);
        }

        if (newClass !== '') {
            element.classList.add(newClass);
        }
    };

    function slidePopupOpen(popup, finalHeight) {
        popup.style = `z-index:10000;width:328px!important;height: ${finalHeight}px!important; transition: height 0.5s ease, opacity 0.3s linear; opacity:1;`;
        document.getElementsByClassName("floating-chat-kofi-popup-iframe-notice-mobi")[0].style.display = "block";
        document.getElementsByClassName("floating-chat-kofi-popup-iframe-notice")[0].style.display = "block";
    };

    function closePopup(popup, donateButton) {
        // ar popup = document.getElementById(popupId);
        popup.style = 'height: 0px; width:0px; transition:height 0.3s ease 0s , width 1s linear,opacity 0.3s linear; opacity:0;';
        updateClass(donateButton, 'open', 'closed');
        document.getElementsByClassName("floating-chat-kofi-popup-iframe-notice-mobi")[0].style.display = "none";
        document.getElementsByClassName("floating-chat-kofi-popup-iframe-notice")[0].style.display = "none";
    }

    function insertPopupHtmlIntoBody(donateButton, selectors, parentElementId) {
        var popupId = _configManager.getValue(_myType, 'cssId') + `-${selectors.popupId}`;

        var popup = document.createElement('div');
        popup.id = popupId;
        popup.classList = selectors.popupClass;
        popup.style = `z-index:10000;height: 0px; width:0px; opacity: 0; transition: all 0.6s ease 0s;`;

        if (parentElementId) {
            document.getElementById(parentElementId).appendChild(popup);
        }
        else {
            document.body.appendChild(popup);
        }

        var notice = document.createElement('div');
        notice.classList = selectors.noticeClass;


        var noticeText = _configManager.getValue(_myType, 'notice.text');
        var pageId = _configManager.getValue(_myType, 'pageId', true);

        noticeText = noticeText.replace("%HANDLE%", pageId);
        handleLink = document.createElement('a');
        handleLink.setAttribute('href', "https://"+ noticeText);
        handleLink.setAttribute('target', "_blank");
        handleLink.setAttribute('class', 'kfds-text-is-link-dark');
        linkText = document.createTextNode(noticeText);
        handleLink.appendChild(linkText);
        notice.appendChild(handleLink);
        popup.appendChild(notice);

        var closer = document.createElement('div');
        var closerContent = document.createElement('span');

        closerContent.innerHTML = _configManager.getValue(_myType, 'closer', true);
        closer.appendChild(closerContent);
        closer.classList = selectors.closerClass;

        closer.addEventListener('click', function (event) {
            closePopup(popup, donateButton);
        });

        popup.appendChild(closer);

        var popupIFrameContainer = document.createElement('div');
        popupIFrameContainer.classList = selectors.popupIframeContainerClass;
        popupIFrameContainer.style = 'height:100%';
        popupIFrameContainer.id = popupId + selectors.popupIframeContainerIdSuffix;

        popup.appendChild(popupIFrameContainer);
    };

    function toggleKofiIframe(iframeId, state, donateButton, selectors, heightLimits) {

        var popupId = _configManager.getValue(_myType, 'cssId') + `-${selectors.popupId}`;
        var existingPopup = document.getElementById(popupId);

        if (state === 'open') {

            var iframeContainerParent = document.getElementById(iframeId).parentElement;;

            var finalHeight = window.innerHeight - (window.innerHeight - iframeContainerParent.offsetTop) - 60;
            //console.log('final height 1:' + finalHeight);
            if (finalHeight > heightLimits.maxHeight) {
                finalHeight = heightLimits.maxHeight;
            } else if (finalHeight < heightLimits.minHeight) {
                finalHeight = heightLimits.minHeight;
            }
            //console.log('final height 2:' + finalHeight);
            var widgetPageLoadStateIndex = widgetPageLoadInitiatedStates.findIndex(function (s) { return s[0] == donateButton; });
            // var widgetPageLoadState = widgetPageLoadInitiatedStates.find(function(s) { return s[0] == donateButton; });// 
            var widgetPageLoadInitiated = widgetPageLoadInitiatedStates[widgetPageLoadStateIndex][1];
            if (!widgetPageLoadInitiated) {
                var popupIFrameContainerId = popupId + selectors.popupIframeContainerIdSuffix;
                _utils.loadKofiIframe(_configManager.getValue(_myType, 'pageId', true), popupIFrameContainerId, 'width: 100%; height: 98%;');
                widgetPageLoadInitiatedStates[widgetPageLoadStateIndex] = [donateButton, true];
            }

            slidePopupOpen(existingPopup, finalHeight);

            updateClass(donateButton, 'closed', 'open');

            closeButtonActionBlocked = true;
            setTimeout(function () {
                closeButtonActionBlocked = false;
            }, 1000);

        }
    };

    var getHtml = function () {

        var donateButtonImage = _configManager.getValue(_myType, 'donatebutton.image');
        var donateButtonBackgroundColor = _configManager.getValue(_myType, 'donateButton.background-color');
        var donateButtonCTAText = _configManager.getValue(_myType, 'donateButton.text');
        var donateButtonTextColor = _configManager.getValue(_myType, 'donateButton.text-color');
        var body = '<style> .hiddenUntilReady { display: none; } </style>' +
            `<div id="${getButtonId()}" class="hiddenUntilReady closed floatingchat-donate-button" style="z-index:10000; background-color: ${donateButtonBackgroundColor};">` +
            `<img id="${getButtonImageId()}" src="${donateButtonImage}" class="kofiimg" data-rotation="0" />` +
            `<span style="margin-left: 8px; color:${donateButtonTextColor}">${donateButtonCTAText}</span>`
        '</div>';
        return body;
    };

    return {
        getHtml: getHtml,
        write: write
    }
};

var kofiWidgetOverlayConstants = kofiWidgetOverlayConstants || {
    optionKeys: {
        root: 'root',
        widgetType: 'type',
        pageId: 'pageId',
        ctaText: 'ctaText',
        donateButtonStyle: 'donateButtonStyle',
        ctaTextStyle: 'ctaTextStyle',
        cssId: 'cssid'
    },
    //kofiRoot: 'http://localhost:55640/',
    kofiRoot: 'https://ko-fi.com/',
    paymentModalId: 'paymentModal'
};

var kofiWidgetOverlayUtilities = kofiWidgetOverlayUtilities || function () {

    const uuidv4 = function () {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        )
    };

    const debounce = function (debounceRef, callback) {

        if (debounceRef === null) {
            debounceRef = setTimeout(function () {
                clearTimeout(debounceRef);
                debounceRef = null;
                callback();
            }, 100);
        }
    };

    const loadKofiIframe = function (pageId, parentElementId, iframeStyle) {

        var _iframeLoading = false;
        var _iframeDebounce = null;
        var _showFeed = false;

        const tryLoad = function () {

            if (!_iframeLoading) {

                _iframeLoading = true;
                let url = kofiWidgetOverlayConstants.kofiRoot + pageId + '/?hidefeed=true&widget=true&embed=true';
                if (_showFeed) {
                    url = kofiWidgetOverlayConstants.kofiRoot + pageId + '/?widget=true&embed=true';
                }
                const iframe = document.createElement('iframe');
                const parentElement = document.getElementById(parentElementId);

                iframe.src = url;
                iframe.style = iframeStyle;
                parentElement.appendChild(iframe);

            } else {
                debounce(_iframeDebounce, tryLoad)
            }
        };

        tryLoad();
    };

    const getWindowHeightRatio = function () {
        return (window.outerHeight / 100);
    };

    const getWindowWidthRatio = function () {
        return (window.outerWidth / 100);
    };

    const mergeOptions = function (optionSetA, optionSetB) {

        for (var property in optionSetA) {
            if (optionSetA.hasOwnProperty(property)) {
                optionSetA[property] = optionSetB[property] !== undefined ? optionSetB[property] : optionSetA[property];
            }
        }
    };

    const getConfigManager = function (config) {

        return new function () {

            var _tokens = [];

            const getValue = function (overlayType, key, isCore) {

                const coreElement = isCore ? '.core' : '';
                const configKey = `${overlayType}${coreElement}.${key}`;
                if (config[configKey] !== undefined) {
                    var configdata = config[configKey];

                    if (_tokens.length > 0) {
                        _tokens.forEach(t => {
                            configdata = configdata.replace(t.token, t.value);
                        });
                    }

                    return configdata;
                }

                return '';
            };

            const setToken = function (token, value) {
                _tokens.push({ token: token, value: value });
            };

            const clearTokens = function () {
                _tokens = [];
            };

            return {
                getValue: getValue,
                setToken: setToken,
                clearTokens: clearTokens
            }
        };
    };

    const loadStyleSheet = function (styleSheetHref, targetDocument) {

        var docHead = targetDocument.head;
        if (!docHead) {
            docHead = targetDocument.createElement('head');
            targetDocument.prepend(docHead);
        }

        var styleSheet = targetDocument.querySelectorAll('[href="' + styleSheetHref + '"]')
        if (styleSheet.length === 0) {

            var sslink = targetDocument.createElement('link');
            sslink.href = styleSheetHref;
            sslink.rel = 'stylesheet';
            sslink.type = 'text/css';
            docHead.append(sslink);
        }
    };

    return {
        uuidv4: uuidv4,
        debounce: debounce,
        loadKofiIframe: loadKofiIframe,
        getWindowHeightRatio: getWindowHeightRatio,
        getWindowWidthRatio: getWindowWidthRatio,
        mergeOptions: mergeOptions,
        getConfigManager: getConfigManager,
        loadStyleSheet: loadStyleSheet
    }
};

var kofiWidgetOverlay = kofiWidgetOverlay || (function () {

    const _utils = new kofiWidgetOverlayUtilities();
    var isFirstRender = true;
    var parentButtonWrapperId = null;

    var _root = '';
    var _buildStrategy = {
        'floating-chat': {
            src: _root + 'kofi-widget-overlay-floating-chat-builder.js',
            write: function (parentId, config, utils) { return new kofiWidgetOverlayFloatingChatBuilder(config, utils).write(parentId); },
            getBody: function (config, utils) { return new kofiWidgetOverlayFloatingChatBuilder(config, utils).getHtml(); },
            id: 'kofi-widget-overlay-ribbon-builder'
        },
    };

    function getBuilder(widgetType) {

        var buildStrategy = _buildStrategy[widgetType] === undefined ? 'empty' : widgetType;
        var builder = _buildStrategy[buildStrategy];

        return builder;
    };

    const doWrite = function (builder, instanceId, config) {

        var finalConfig = JSON.parse(JSON.stringify(kofiWidgetOverlayConfig));

        _utils.mergeOptions(finalConfig, config);
        builder.write(instanceId, finalConfig, _utils);
    };

    const setConfigDefaults = function (config, widgetType, pId, instanceId) {

        config[widgetType + '.core.pageId'] = pId;
        config[widgetType + '.cssId'] = config[widgetType + '.cssId'] !== undefined && config[widgetType + '.cssId'] !== '' ? config[widgetType + '.cssId'] : instanceId;
        config[widgetType + '.stylesheets'] = config[widgetType + '.stylesheets'] !== undefined ? config[widgetType + '.stylesheets'] : '["https://fonts.googleapis.com/css?family=Nunito:400,700,800&display=swap"]';

        return config;
    }

    const draw = function (pId, config, containerId) {
        if (isFirstRender) {
            parentButtonWrapperId = 'kofi-widget-overlay-' + _utils.uuidv4();

            if (containerId != null) {
                document.getElementById(containerId).innerHTML += `<div id="${parentButtonWrapperId}"></div>`;
            }
            else {
                var div = document.createElement('div');
                div.setAttribute("id", parentButtonWrapperId);
                document.body.appendChild(div);
            }
            isFirstRender = false;
        }

        var widgetType = config[kofiWidgetOverlayConstants.optionKeys.widgetType];
        config = setConfigDefaults(config, widgetType, pId, parentButtonWrapperId);

        var builder = getBuilder(widgetType);
        if (containerId != null) {
            doWrite(builder, containerId, config);
        }
        else { doWrite(builder, parentButtonWrapperId, config); }
    };

    return {
        draw: draw,
    }
}());

// ------------------------------------------------------------------------------------------

  kofiWidgetOverlay.draw('merelylogical', {
    'type': 'floating-chat',
    'floating-chat.donateButton.text': 'Support me',
    'floating-chat.donateButton.background-color': '#323842',
    'floating-chat.donateButton.text-color': '#fff'
  });
});

})(window.jtd = window.jtd || {});


