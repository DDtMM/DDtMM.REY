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
    // if provider is not set, then default provider is used
    function set(key, value, provider) {
        return (provider || my.defaultProvider).set(key, JSON.stringify(value));
    }

    // stores value for later use
    // if provider is not set, then default provider is used
    function get(key, provider) {
        return JSON.parse((provider || my.defaultProvider).get(key));
    }

    // deletes a value
    // if provider is not set, then default provider is used
    function remove(key, provider) {
        return JSON.parse((provider || my.defaultProvider).remove(key));
    }

    // gets the value using the default provider if just key provided, otherwise sets it
    function val(key, value) {
        if (value === undefined) return get(key);
        else return set(key, value);
    }

    // empty storage provider
    var emptyStorageProvider = function () {
        return {
            storageSize: "none",
            get: function () { },
            set: function () { return false; },
            remove: function () { }
        };
    };

    // provides access to local storage 
    var localProvider = (function () {
        return {
            storageSize: "large",
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
            storageSize: "small",
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
            provider.isFunctional = true;
            return true;
        } catch (ex) {
            provider.isFunctional = false;
            return false;
        }
    }


    // saves an element, using the element id as the key.  
    // if key is passed that is used instead
    // if a non input is passed, innerHtml is saved
    // if an input is passed, that appropriate value is saved.
    // for radios and checkboxes, the checkstate and value is saved.
    // if provider is null then uses default
    function saveElement(elem, key, provider) {
        if (!key) key = elem.id || elem.name;

        switch (elem.nodeName) {
            case 'INPUT':
                var type = (elem.type || 'text').toLowerCase();
                switch (type) {
                    case 'checkbox':
                    case 'radio':
                        set(key + '.checked', elem.checked || false, provider);
                        break;
                    default:
                        set(key + '.value', elem.value, provider);
                        break;
                }
                break;
            case 'TEXTAREA':
                set(key + '.value', elem.value, provider);
                break;
            case 'SELECT':
                var selectedOptions = [];
                for (var i = 0, il = elem.options.length; i < il; i++) {
                    if (elem.options[i].selected) selectedOptions.push(elem.options[i].value);
                }
                set(key + '.selected', selectedOptions, provider);
                break;
            default:
                set(key + '.innerHTML', elem.innerHTML, provider);
                break;
        }
    }

    // loads an element, using the element id as the key
    // if provider is null then uses default
    function loadElement(elem, key, provider) {
        if (!key) key = elem.id || elem.name;
        var value;

        switch (elem.nodeName) {
            case 'INPUT':
                var type = (elem.type || 'text').toLowerCase();
                switch (type) {
                    case 'checkbox':
                    case 'radio':
                        if ((value = get(key + '.checked', provider)) !== undefined) elem.checked = value;
                        break;
                    default:
                        if ((value = get(key + '.value', provider)) !== undefined) elem.value = value;
                        break;
                }
                break;
            case 'TEXTAREA':
                if ((value = get(key + '.value', provider)) !== undefined) elem.value = value;
                break;
            case 'SELECT':
                if ((value = get(key + '.selected', provider)) !== undefined) {
                    for (var i = 0, il = elem.options.length; i < il; i++) {
                        if (value.indexOf(elem.options[i].value) >= 0) {
                            elem.options[i].selected = true;
                        }
                        else elem.options[i].selected = false;
                    }

                }
                break;
            default:
                if ((value = get(key + '.innerHTML', provider)) !== undefined) elem.innerHTML = value;
                break;
        }
    }

    // loads the elements value, and saves it on window unload
    function trackElement(elem, key, provider) {
        loadElement(elem, key, provider);
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
        get: get,
        set: set,
        remove: remove,
        trackElement: trackElement,
        saveElement: saveElement,
        loadElement: loadElement,
        defaultProvider: emptyStorageProvider,
        providers: [localProvider, cookieProvider],
    };

    if (testProvider(localProvider)) my.defaultProvider = localProvider;
    else if (testProvider(cookieProvider)) my.defaultProvider = cookieProvider;

    if (window.addEventListener) window.addEventListener('unload', saveTrackedElements);
    else window.attachEvent('unload', saveTrackedElements);

    return my;

})();