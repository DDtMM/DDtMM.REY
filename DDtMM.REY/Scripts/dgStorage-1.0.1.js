/***
By: Daniel Gimenez
License: Freeware
Description:
Useful for text editors, keeps track of line breaks in a string, by searching for newline chars.
NOTE: We're going for speed here, so there are few checks for valid input
***/
var dgStorage = (function () {
    var trackedElements = [];

    // stores value for later use
    // returns true if can use local storage
    function set(key, value) {
        return storageProivder.set(key, JSON.stringify(value));
    }

    // stores value for later use
    function get(key) {
        return JSON.parse(storageProivder.get(key));
    }


    // empty storage provider
    var storageProvider = function () {
        return {
            get: function () { },
            set: function () { return false; },
            remove: function () { }
        };
    };

    // provides access to local storage 
    var localProvider = (function () {
        return {
            get: function (key) {
                return window.localStorage.getItem(key);
            },
            set: function (key, value) {
                window.localStorage.setItem(key, value);
                return true;
            },
            remove: function (key) {
                window.localStorage.removeItem(key);
            }
        };
    })();

    // provides access to cookie storage
    var cookieProvider = (function () {
        var re = new RegExp(' ', 'i'),
            farFutureDate = new Date(),
            removeDate = new Date(); // an earlier date to expire the cookie

        farFutureDate.setDate(farFutureDate.getDate() + 7304);
        removeDate.setDate(removeDate.getDate() - 1);

        function setCookie(key, value, expirationDate) {
            document.cookie = key + "=" + encodeURIComponent(value) + "; expires=" + expirationDate.toUTCString();
        }
        
        var my = {
            expiration: new Date(),
            get: function (key) {
                re.source = '(?:^|; )' + key + '=([^;]+)';
                var match = document.cookie.match(re);
                if (match) {
                    return decodeURI(match[1]);
                }
            },
            set: function (key, value) {
                setCookie(key, value, farFutureDate);
                return true;
            },
            remove: function (key) {
                setCookie(key, '', removeDate);
            }
        };

        return my;
    })();

    // tests a provider to see if it works in the current context
    function testProvider(provider) {
        var testValue = 'as#d31%r3120ksd$v013!41-zzz0&&1';
        try {
            provider.set(testValue, testValue);
            if (provider.get(testValue) != testValue) throw ('bad result');
            provider.remove(testValue);
            return true;
        } catch (ex) {
            return false;
        }
    }

    // gets the value if just key provided, otherwise sets it
    function val (key, value) {
        if (value === undefined) return get(key);
        else return set(key, value);
    }

    // saves an element, using the element id as the key.  
    // if key is passed that is used instead
    // if a non input is passed, innerHtml is saved
    // if an input is passed, that appropriate value is saved.
    // for radios and checkboxes, the checkstate and value is saved.
    function saveElement(elem, key) {
        if (!key) key = elem.id || elem.name;

        switch (elem.nodeName) {
            case 'INPUT':
                var type = (elem.type || 'text').toLowerCase();
                switch (type) {
                    case 'checkbox':
                    case 'radio':
                        val(key + '.checked', elem.checked || false);
                        break;
                    default:
                        val(key + '.value', elem.value);
                        break;
                }
                break;
            case 'SELECT':
                var selectedOptions = [];
                for (var i = 0, il = elem.options.length; i < il; i++) {
                    if (elem.options[i].selected) selectedOptions.push(elem.options[i].value);
                }
                val(key + '.selected', selectedOptions);
                break;
            default:
                val(key + '.innerHTML', elem.innerHTML);
                break;
        }
    }

    // loads an element, using the element id as the key
    function loadElement(elem, key) {
        if (!key) key = elem.id || elem.name;
        var value;

        switch (elem.nodeName) {
            case 'INPUT':
                var type = (elem.type || 'text').toLowerCase();
                switch (type) {
                    case 'checkbox':
                    case 'radio':
                        if ((value = val(key + '.checked'))) elem.checked = value;
                        break;
                    default:
                        if ((value = val(key + '.value'))) elem.value = value;
                        break;
                }
                break;
            case 'SELECT':
                if ((value = val(key + '.selected'))) {
                    for (var i = 0, il = elem.options.length; i < il; i++) {
                        if (value.indexOf(elem.options[i].value) >= 0) {
                            elem.options[i].selected = true;
                        }
                        else elem.options[i].selected = false;
                    }
                    
                }
                break;
            default:
                if ((value = val(key + '.innerHTML')) !== undefined) elem.innerHTML = value;
                break;
        }
    }

    // loads the elements value, and saves it on window unload
    function trackElement(elem, key) {
        loadElement(elem, key);
        trackedElements.push({ elem: elem, key: key });
    }

    // saves all elements currently being tracked
    function saveTrackedElements() {
        for (var i = 0, il = trackedElements.length; i < il; i++) {
            saveElement(trackedElements[i].elem, trackedElements[i].key);
        }
    }

    var my = {
        val: val,
        saveElement: saveElement,
        loadElement: loadElement,
        noStorage: true,
        localStorageEnabled: false,
        cookiesEnabled: false
    };

    if (testProvider(localProvider)) {
        my.localStorageEnabled = true;
        my.noStorage = false;
        storageProivder = localProvider;
    }
    else if (testProvider(cookieProvider)) {
        my.cookiesEnabled = true;
        my.noStorage = false;
        storageProvider = cookieProvider;
    }

    if (window.addEventListener) window.addEventListener('unload', saveTrackedElements);
    else window.attachEvent('unload', saveTrackedElements);

    return my;

})();