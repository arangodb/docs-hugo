var lunrIndex, pagesIndex;


var autoComplete = (function(){
    // "use strict";
    function autoComplete(options){
        if (!document.querySelector) return;

        // helpers
        function hasClass(el, className){ 
            return el.classList ? el.classList.contains(className) : new RegExp('\\b'+ className+'\\b').test(el.className); }

        function addEvent(el, type, handler){
            if (el.attachEvent) el.attachEvent('on'+type, handler); else el.addEventListener(type, handler);
        }
        function removeEvent(el, type, handler){
            // if (el.removeEventListener) not working in IE11
            if (el.detachEvent) el.detachEvent('on'+type, handler); else el.removeEventListener(type, handler);
        }
        function live(elClass, event, cb, context){
            addEvent(context || document, event, function(e){
                var found, el = e.target || e.srcElement;
                while (el && !(found = hasClass(el, elClass))) el = el.parentElement;
                if (found) cb.call(el, e);
            });
        }

        var o = {
            selector: 0,
            source: 0,
            minChars: 3,
            delay: 150,
            offsetLeft: 0,
            offsetTop: 1,
            cache: 1,
            menuClass: '',
            selectorToInsert: 0,
            renderItem: function (item, search){
                // escape special characters
                search = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                var re = new RegExp("(" + search.split(' ').join('|') + ")", "gi");
                return '<div class="autocomplete-suggestion" data-val="' + item + '">' + item.replace(re, "<b>$1</b>") + '</div>';
            },
            onSelect: function(e, term, item){}
        };
        for (var k in options) { if (options.hasOwnProperty(k)) o[k] = options[k]; }

        // init
        var elems = typeof o.selector == 'object' ? [o.selector] : document.querySelectorAll(o.selector);
        for (var i=0; i<elems.length; i++) {
            var that = elems[i];

            // create suggestions container "sc"
            that.sc = document.createElement('div');
            that.sc.className = 'autocomplete-suggestions '+o.menuClass;

            that.autocompleteAttr = that.getAttribute('autocomplete');
            that.setAttribute('autocomplete', 'off');
            that.cache = {};
            that.last_val = '';

			var parentElement;
            if (typeof o.selectorToInsert === "string" && document.querySelector(o.selectorToInsert) instanceof HTMLElement) {
				parentElement = document.querySelector(o.selectorToInsert);
			}
			that.updateSC = function(resize, next){
                var rect = that.getBoundingClientRect();
				var parentOffsetLeft = 0;
                var parentOffsetTop = 0;
                var pageXOffset = 0;
                var pageYOffset = 0;
                if (parentElement != undefined) {
                    parentOffsetLeft = parentElement.getBoundingClientRect().left;
                    parentOffsetTop = parentElement.getBoundingClientRect().top;
                } else {
                    pageXOffset = window.pageXOffset || document.documentElement.scrollLeft;
                    pageYOffset = window.pageYOffset || document.documentElement.scrollTop;
                }
                that.sc.style.left = '30vw';
                that.sc.style.top = '12vh';
                that.sc.style.width = Math.round(rect.right - rect.left) * 3 + 'px'; // outerWidth
   
                if (!resize) {
                    that.sc.style.display = 'block';
                    var backgroundPage = document.querySelector('#page-wrapper');
                    backgroundPage.style.opacity = '0.4';
                    if (!that.sc.maxHeight) { that.sc.maxHeight = parseInt((window.getComputedStyle ? getComputedStyle(that.sc, null) : that.sc.currentStyle).maxHeight); }
                    if (!that.sc.suggestionHeight) that.sc.suggestionHeight = that.sc.querySelector('.autocomplete-suggestion').offsetHeight;
                    if (that.sc.suggestionHeight)
                        if (!next) that.sc.scrollTop = 0;
                        else {
                            var scrTop = that.sc.scrollTop, selTop = next.getBoundingClientRect().top - that.sc.getBoundingClientRect().top;
                            if (selTop + that.sc.suggestionHeight - that.sc.maxHeight > 0)
                                that.sc.scrollTop = selTop + that.sc.suggestionHeight + scrTop - that.sc.maxHeight;
                            else if (selTop < 0)
                                that.sc.scrollTop = selTop + scrTop;
                        }
                }
            }
            addEvent(window, 'resize', that.updateSC);
           

            if (typeof o.selectorToInsert === "string" && document.querySelector(o.selectorToInsert) instanceof HTMLElement) {
                document.querySelector(o.selectorToInsert).appendChild(that.sc);
            } else {
                document.body.appendChild(that.sc);
            }

            live('autocomplete-suggestion', 'mouseleave', function(e){
                var sel = that.sc.querySelector('.autocomplete-suggestion.selected');
                if (sel) setTimeout(function(){ sel.className = sel.className.replace('selected', ''); }, 20);
            }, that.sc);
            live('autocomplete-suggestion', 'mouseover', function(e){
                var sel = that.sc.querySelector('.autocomplete-suggestion.selected');
                if (sel) sel.className = sel.className.replace('selected', '');
                this.className += ' selected';
            }, that.sc);

            live('autocomplete-suggestion', 'mousedown', function(e){
                if (hasClass(this, 'autocomplete-suggestion')) { // else outside click
                    var v = this.getAttribute('data-val');
                    that.value = v;
                    o.onSelect(e, v, this);
                    that.sc.style.display = 'none';
                    var backgroundPage = document.querySelector('#page-wrapper');
                    backgroundPage.style.opacity = '1';
                }
            }, that.sc);

            that.blurHandler = function(){
                try { var over_sb = document.querySelector('.autocomplete-suggestions:hover'); } catch(e){ var over_sb = 0; }
                if (!over_sb) {
                    that.last_val = that.value;
                    that.sc.style.display = 'none';
                    var backgroundPage = document.querySelector('#page-wrapper');
                    backgroundPage.style.opacity = '1';
                    setTimeout(function(){ that.sc.style.display = 'none'; }, 350); // hide suggestions on fast input
                } else if (that !== document.activeElement) setTimeout(function(){ that.focus(); }, 20);
            };
            addEvent(that, 'blur', that.blurHandler);

            var suggest = function(data){
                var val = that.value;
                that.cache[val] = data;
                if (data.length && val.length >= o.minChars) {
                    var s = '';
                    for (var i=0;i<data.length;i++) s += o.renderItem(data[i], val);
                    that.sc.innerHTML = s;
                    that.updateSC(0);
                }
                else
                    that.sc.style.display = 'none';
            }

            that.keydownHandler = function(e){
                var key = window.event ? e.keyCode : e.which;
                // down (40), up (38)
                if ((key == 40 || key == 38) && that.sc.innerHTML) {
                    var next, sel = that.sc.querySelector('.autocomplete-suggestion.selected');
                    if (!sel) {
                        next = (key == 40) ? that.sc.querySelector('.autocomplete-suggestion') : that.sc.childNodes[that.sc.childNodes.length - 1]; // first : last
                        next.className += ' selected';
                        that.value = next.getAttribute('data-val');
                    } else {
                        next = (key == 40) ? sel.nextSibling : sel.previousSibling;
                        if (next) {
                            sel.className = sel.className.replace('selected', '');
                            next.className += ' selected';
                            that.value = next.getAttribute('data-val');
                        }
                        else { sel.className = sel.className.replace('selected', ''); that.value = that.last_val; next = 0; }
                    }
                    that.updateSC(0, next);
                    return false;
                }
                // esc
                else if (key == 27) { 
                    that.value = that.last_val; 
                    that.sc.style.display = 'none';
                    var backgroundPage = document.querySelector('#page-wrapper');
                    backgroundPage.style.opacity = '1';
                 }
                // enter
                else if (key == 13 || key == 9) {
                    var sel = that.sc.querySelector('.autocomplete-suggestion.selected');
                    if (sel && that.sc.style.display != 'none') { o.onSelect(e, sel.getAttribute('data-val'), sel); setTimeout(function(){ that.sc.style.display = 'none'; }, 20); }
                }
            };
            addEvent(that, 'keydown', that.keydownHandler);

            that.keyupHandler = function(e){
                var key = window.event ? e.keyCode : e.which;
                if (!key || (key < 35 || key > 40) && key != 13 && key != 27) {
                    var val = that.value;
                    if (val.length >= o.minChars) {
                        if (val != that.last_val) {
                            that.last_val = val;
                            clearTimeout(that.timer);
                            if (o.cache) {
                                if (val in that.cache) { suggest(that.cache[val]); return; }
                                // no requests if previous suggestions were empty
                                for (var i=1; i<val.length-o.minChars; i++) {
                                    var part = val.slice(0, val.length-i);
                                    if (part in that.cache && !that.cache[part].length) { suggest([]); return; }
                                }
                            }
                            that.timer = setTimeout(function(){ o.source(val, suggest) }, o.delay);
                        }
                    } else {
                        that.last_val = val;
                        that.sc.style.display = 'none';
                        var backgroundPage = document.querySelector('#page-wrapper');
                        backgroundPage.style.opacity = '1';
                    }
                }
            };
            addEvent(that, 'keyup', that.keyupHandler);

            that.focusHandler = function(e){
                that.last_val = '\n';
                that.keyupHandler(e)
            };
            if (!o.minChars) addEvent(that, 'focus', that.focusHandler);
        }

        // public destroy method
        this.destroy = function(){
            var backgroundPage = document.querySelector('#page-wrapper');
            backgroundPage.style.opacity = '1';
            for (var i=0; i<elems.length; i++) {
                var that = elems[i];
                removeEvent(window, 'resize', that.updateSC);
                removeEvent(that, 'blur', that.blurHandler);
                removeEvent(that, 'focus', that.focusHandler);
                removeEvent(that, 'keydown', that.keydownHandler);
                removeEvent(that, 'keyup', that.keyupHandler);
                if (that.autocompleteAttr)
                    that.setAttribute('autocomplete', that.autocompleteAttr);
                else
                    that.removeAttribute('autocomplete');
                try {
                    if (o.selectorToInsert && document.querySelector(o.selectorToInsert).contains(that.sc)) {
                        document.querySelector(o.selectorToInsert).removeChild(that.sc);
                    } else {
                        document.body.removeChild(that.sc);
                    }
                } catch (error) {
                    console.log('Destroying error: can\'t find target selector', error);
                    throw error;
                }
                that = null;
            }
        };
    }
    return autoComplete;
})();

// Initialize lunrjs using our generated index file
function initLunr() {
    // First retrieve the index file
    $.getJSON(index_url)
        .done(function(index) {
            pagesIndex = index;
            // Set up lunrjs by declaring the fields we use
            // Also provide their boost level for the ranking
            lunrIndex = lunr(function() {
                this.use(lunr.multiLanguage.apply(null, ["en"]));
                this.ref('index');
                this.field('title', {
                    boost: 15
                });
                this.field('tags', {
                    boost: 10
                });
                this.field('content', {
                    boost: 5
                });

                this.pipeline.remove(lunr.stemmer);
                this.searchPipeline.remove(lunr.stemmer);

                // Feed lunr with each file and let lunr actually index them
                pagesIndex.forEach(function(page, idx) {
                    page.index = idx;
                    this.add(page);
                }, this);
            })
        })
        .fail(function(jqxhr, textStatus, error) {
            console.log("fail")

            var err = textStatus + ', ' + error;
            console.error('Error getting Hugo index file:', err);
        });
}

/**
 * Trigger a search in lunr and transform the result
 *
 * @param  {String} term
 * @return {Array}  results
 */
function search(term) {
    // Find the item in our index corresponding to the lunr one to have more info
    // Remove Lunr special search characters: https://lunrjs.com/guides/searching.html
    var searchTerm = lunr.tokenizer(term.replace(/[*:^~+-]/, ' ')).reduce( function(a,token){return a.concat(searchPatterns(token.str))}, []).join(' ');
    return !searchTerm ? [] : lunrIndex.search(searchTerm).map(function(result) {
        return { index: result.ref, matches: Object.keys(result.matchData.metadata) }
    });
}

function searchPatterns(word) {
    return [
        word + '^100',
        word + '*^10',
        '*' + word + '^10',
        word + '~' + Math.floor(word.length / 4) + '^1' // allow 1 in 4 letters to have a typo
    ];
}

// Let's get started
initLunr();
$(function() {
    var searchList = new autoComplete({
        /* selector for the search box element */
        selectorToInsert: '#header-wrapper',
        selector: '#search-by',
        /* source is the callback to perform the search */
        source: function(term, response) {
            response(search(term));
        },
        /* renderItem displays individual search results */
        renderItem: function(item, term) {
            var page = pagesIndex[item.index];
            var numContextWords = 20;
            var contextPattern = '(?:\\S+ +){0,' + numContextWords + '}\\S*\\b(?:' +
                item.matches.map( function(match){return match.replace(/\W/g, '\\$&')} ).join('|') +
                ')\\b\\S*(?: +\\S+){0,' + numContextWords + '}';
            var context = page.content.match(new RegExp(contextPattern, 'i'));
            var divcontext = document.createElement('div');
            divcontext.className = 'context';
            divcontext.innerText = (context || '');
            var divsuggestion = document.createElement('div');
            divsuggestion.className = 'autocomplete-suggestion';
            divsuggestion.setAttribute('data-term', term);
            divsuggestion.setAttribute('data-title', page.title);
            var dataUri = baseUri + page.uri;
            var version = localStorage.getItem('docs-version');
            if (!dataUri.includes(version)) {
                divsuggestion.style.display = 'none';
            }
            divsuggestion.setAttribute('data-uri', dataUri);
            divsuggestion.setAttribute('data-context', context);
            divsuggestion.innerHTML = '<p class="suggestion-title">» ' + page.title + '</p>\n<p class="suggestion-path">' + page.uri + '</p>';
            divsuggestion.appendChild(divcontext);
            return divsuggestion.outerHTML;
        },
        /* onSelect callback fires when a search suggestion is chosen */
        onSelect: function(e, term, item) {
            location.href = item.getAttribute('data-uri');
        }
    });

    // JavaScript-autoComplete only registers the focus event when minChars is 0 which doesn't make sense, let's do it ourselves
    // https://github.com/Pixabay/JavaScript-autoComplete/blob/master/auto-complete.js#L191
    var selector = $('#search-by').get(0);
});

