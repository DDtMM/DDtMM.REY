
var reyRegEx = (function ($) {

    var reRegexTextUpdateTimeoutId = -1;
    var patternEditor;
    var targetEditor;
    var sessionID;

    var $editor = $('#RegexEditor');
    var $loadUrlButton = $('#RegexEditor button[id="loadUrlButton"]');
    var $urlInput = $('#RegexEditor input[id="urlInput"]');
    
    var $optionsMenu = $editor.find('#regexOptionsMenu');
    var $optionsButton = $('#regexOptionsButton');
    var $optionsItemsPanel = $optionsMenu.find('#regexOptionsItemPanel');
    var $allOptions = $optionsMenu.find('input[id^="opt"]');

    var $loader = $('#loader');

    // saves session to local storage
    function saveSession() {

        $allOptions.each(function () { dgStorage.val('RegexEditor_' + this.id, this.checked ); });
        dgStorage.val('patternEditor_INPUTTEXT', patternEditor.getText());
        
        if (dgStorage.defaultProvider.storageSize == "large") {
            dgStorage.val('activeModuleId', reyModules.activeModule.id);
            dgStorage.val('moduleValues', reyModules.getModuleValues());
            dgStorage.val('targetEditor_INPUTTEXT', targetEditor.getText());
            dgStorage.val('urlhistory', $('#loadUrlButton').selectDialog('option', 'values'));
        }

        dgStorage.val('hasData', true);
    };

    // saves a session to file system.
    function postSession(saveAsId) {
        if (saveAsId) {
            var mySessions = dgStorage.val('mySessions');
            if (!mySessions || mySessions.indexOf(saveAsId) == -1) {
                showMessage('Error', 'Can not update session.  Create a new one instead');
                return;
            }
        }

        var session = {
            ID: saveAsId,
            Regex: my.reText,
            Modifiers: my.reOptions,
            Target: targetEditor.getText().substr(0, 65535),
            ActiveModuleID: reyModules.activeModule.id,
            ModuleSettings: []
        }

        var moduleValues = reyModules.getModuleValues();
        for (var i in moduleValues) {
            for (var j in moduleValues[i]) {
                session.ModuleSettings.push({
                    ModuleID: i,
                    Key: j,
                    Value: moduleValues[i][j]
                });
            }
        }
        showLoading('Saving Session');
        $.ajax('/api/Session/', {
            method: 'post',
            data: session,
            success: function (data, status, xhr) {
                // set current session ID
                setSessionID(xhr.getResponseHeader('rey_sessionid'), true);

                showMessage('Saved', 'Session saved to:\n ' + xhr.getResponseHeader('location'));
            },
            error: function (xhr, status, data) {
                showMessage('Error', 'Unable to save session.');
                console.log(['error', status, data]);
            },
            complete: function () {
                hideLoading();
            }
        });
    };

    // begins loading any saved values.
    function BeginLoadingSavedInputs() {
        var match;

        if (match = /\/s\/([0-9a-zA-Z]+)(?:$|\?)/.exec(location.pathname)) {
            loadFromSavedSession(match[1]);
        } else {
            loadFromQueryString();
            loadInputsFromStorage();
        }
    }

    // reads inputs from query string
    function loadFromQueryString() {

        var params = {},
            toolParams = {},
            queryString = location.search.slice(1),
            re = /([^&=]+)=([^&]*)/g,
            name,
            match,
            value;


        while (match = re.exec(queryString)) {
            name = decodeURIComponent(match[1]);
            value = decodeURIComponent(match[2]);
            if (name.substr(0, 4) != 'prm.') params[name] = value;
            else toolParams[name.substr(4)] = decodeURIComponent(match[2]);
        }

        if (value = params.re) patternEditor.setText(value);
        if (value = params.txt) targetEditor.setText(value);
        if (value = params.url) loadUrl(value);
        if (value = params.options) setOptionFromString(value);
        if (value = params.tool) {
            reyModules.showModule(value);
            for (name in toolParams) reyModules.setStartupModuleValue(value, name, toolParams[name]);
        }
    }

    function loadInputsFromStorage() {
        if (dgStorage.val('hasData') == true) {
            $allOptions.each(function () { this.checked = dgStorage.val('RegexEditor_' + this.id); });
            patternEditor.setText(dgStorage.val('patternEditor_INPUTTEXT'));

            if (dgStorage.defaultProvider.storageSize == "large") {
                targetEditor.setText(dgStorage.val('targetEditor_INPUTTEXT'));
                $('#loadUrlButton').selectDialog('option', 'values', dgStorage.val('urlhistory'));
                reyModules.startupModuleId = dgStorage.val('activeModuleId');
                reyModules.startupModuleValues = (dgStorage.val('moduleValues') || {});
            }
        }
        else {
            $('#opt-reg-global').attr('checked', true);
            $('#opt-reg-insensitive').attr('checked', true);
            $('#opt-xregex-extended').attr('checked', true);
            patternEditor.setText('((?<togo>[tg])(o))\t\t\t# find to\'s or go\'s\n| ([wt](here))\t\t\t\t# or find where\'s and there\'s');
            targetEditor.setText('"If you want to go somewhere, \n\tgoto is the best way to get there."\n\n\t\t- Ken Thompson');
        }

        afterInputsLoaded();
    };

    // loads from session api, falls back to storage if fails.
    function loadFromSavedSession(id) {
        showLoading("Loading session " + id + ".");
        $.ajax('/api/Session/' + id, {
            method: 'get',
            success: function (data, status, xhr) {
                var settings = data.ModuleSettings,
                    setting;

                for (var i = 0, il = settings.length; i < il; i++) {
                    setting = settings[i];
                    reyModules.setStartupModuleValue(setting.ModuleID, setting.Key, setting.Value);
                }
                setSessionID(data.ID, false);
                targetEditor.setText(data.Target);
                patternEditor.setText(data.Regex);
                my.reOptions = data.Modifiers;
                setOptionFromString(my.reOptions);
                reyModules.startupModuleId = data.ActiveModuleID;
                afterInputsLoaded();
            },
            error: function (xhr, status, data) {
                showMessage('Error', 'Unable to load ' + id);
                console.log(['error', status, data]);
                loadInputsFromStorage();
            },
            complete: function () {
                hideLoading();
            }
        });
    }

    // checks and unchecks modifiers based on optionsStr.
    function setOptionFromString(optionsStr) {
        if (optionsStr) {
            $allOptions.each(function () {
                this.checked = (optionsStr.indexOf(this.value) >= 0);
            });
        }
    }

    // displays what modifiers are active in the modifiers button
    function updatePatternOptionsUI () {
        var options = getOptions();
        if (options.length == 0) options = 'none';
        $optionsButton.html(options);
    };


    function loadUrl(url) {
        if (url.length == 0) {
            showMessage('Error', 'Url required for import.');
            return;
        } else if (!url.match(/.+\..+/)) {
            showMessage('Error', 'Invalid Url:\r\n' + url);
            return;
        }
        showLoading("Loading " + url);
        if (url.indexOf('://') < 0) {
            url = 'http://' + url;
        }
        var url = '/GetProxy.ashx?url=' + encodeURI(url);
        $.get(url)
            .done(function (data) {
                if (data.indexOf('<error>') != 0) {
                    targetEditor.setText(data);
                } else {
                    showMessage('Error', data.substr(7, data.length - 15));
                }
            })
            .fail(function () {
                showMessage('Error', arguments[0].toString());
            })
            .always(function () {
                hideLoading();
            });
    };

    function loadFiles(files) {
        // Loop through the FileList and render image files as thumbnails.
        for (var i = 0, f; f = files[i]; i++) {

            var reader = new FileReader();
            showLoading("Loading " + f.name);
            // Closure to capture the file information.
            reader.onload = (function (theFile) {
                return function (e) {
                    targetEditor.setText(e.target.result);
                    hideLoading();
                };
            })(f);

            // Read in the image file as a data URL.
            reader.readAsText(f);
        }
    };

    // shows a modal dialog with the message
    function showMessage (heading, message) {
        $('<div />', {
            html: message.replace('\n', '<br />')
        }).dialog({
            resizableType: true,
            modal: true,
            title: heading
        });
    };

    // shows loading message.  This prevent ui elements from being accessed
    function showLoading (message)
    {
        $loader.find('#loading-message').html((message == null) ? "LOADING" : message);
        $loader.show();
    };

    // hides loading message
    function hideLoading (duration) {
        if (duration == null) {
            $loader.fadeOut(250);
        } else if (duration == 0) {
            $loader.hide();
        } else {
            $loader.fadeOut(duration);
        }
    };

    function patternOptionsChanged() {
        updatePatternOptionsUI();
        ReTextInputUpdate();
        patternEditor.setText(patternEditor.getText());
    };

    // call when an RE part has changed
    function patternEditorTextChanged() {
        clearTimeout(reRegexTextUpdateTimeoutId);
        targetEditor.removeHighlight();
        reRegexTextUpdateTimeoutId = setTimeout(ReTextInputUpdate, 500);
    };

    // call after update delay completed
    function ReTextInputUpdate() {
        var options = getOptions();
        var reText = patternEditor.getText();

        try {
            if (reText === null || reText.length < 1) {
                throw ('Regular Expression can not be blank.');
            }

            setRe(reText, options);
            showPatternEditorMessage(null, false);
        } catch (err) {
            showPatternEditorMessage(err, true);
        }
    };

    function showPatternEditorMessage(text, error) {
        if (error != null) {
            if (error) $("#patternEditorMessage").addClass('errorMode');
            else $("#patternEditorMessage").removeClass('errorMode');
        }

        if (error != null || !$("#patternEditorMessage").hasClass('errorMode')) {
            $("#patternEditorMessage").text(text || '');
        }
    };

    function reTextChanging() {
        my.tokenizedPattern = regexParser.tokenize(patternEditor.getText(), getOptions());
        my.parsedPattern = regexParser.parse(my.tokenizedPattern);
    };

    // Ace row tokenizer for pattern
    function tokenizePatternRow(row) {
        var line = this.doc.getLine(row);
        var state = this.states[row - 1];
        var formattedTokens = [];
        var rowTokens;

        if (my.tokenizedPattern && (rowTokens = my.tokenizedPattern.rows[row])) {
            formattedTokens = reyFormatting.formatRegexTokens(rowTokens);
        }

        if (this.currentLine == row) {
            this.currentLine = row + 1;
        }

        if (formattedTokens.length > 0) {
            formattedTokens[formattedTokens.length - 1].value =
                formattedTokens[formattedTokens.length - 1].value.replace('\n', '\u00B6');
        }
        return this.lines[row] = formattedTokens;
 
    }



    function onPatternTokenHover(ev, token) {
 
        if (token == null) showPatternEditorMessage('');
        else {
            if (token.parserToken != null) {
                token = token.parserToken;
                if (token.rule.namespace == 'Quantifiers') {
                    showPatternEditorMessage(
                      'Match ' + 
                      token.prevToken.rule.createActiveDescription(
                      token.prevToken.text) + ' ' +
                      token.rule.createActiveDescription(token.text));
                }
                else if (token.rule.namespace == 'Literal') {
                    showPatternEditorMessage('"' + token.text + '"');
                }
                else if (token.modeStartToken != null) {
                    showPatternEditorMessage(
                      token.rule.createActiveDescription(token.text) + ': ' +
                      token.modeStartToken.rule.createActiveDescription(
                      token.modeStartToken.text));
                } else {
                    showPatternEditorMessage(token.rule.createActiveDescription(token.text));
                }
            }
            else {
                var rule = regexSyntax.modes.allRules.getRuleFromMatch(token.value);
                showPatternEditorMessage(rule.createActiveDescription(token.value));
            }
            
        }
    }

    // gets the option value values from the UI
    function getOptions() {
        var options = '';
        $allOptions.filter(':checked').each(function () { options += this.value; });
        return options;
    };

    // sets the current regular expression
    function setRe(reText, reOptions) {
        if (reOptions !== undefined) my.reOptions = reOptions;
        my.reOptions = reOptions;
        my.reText = reText;
        $(my).trigger('reUpdated', { reText: my.reText, reOptions: my.reOptions });

        onInputsChanged();
    }

    // sets the current session id 
    function setSessionID(id, addToMySessions) {
        sessionID = id;

        var mySessions = dgStorage.val('mySessions') || new Array();

        if (id && (addToMySessions || mySessions.indexOf(id) != -1)) {
            $('#updateSession').removeClass('disabled').html('Update "<i>' + id + '</i>"');
            var url = window.location.protocol + '//' + window.location.host + '/s/' + id;
            $('#gotoSessionUrl').show().html('<a href="' + url + '">' + url + '</a>');
        }
        else {
            $('#updateSession').addClass('disabled').text('Update');
            $('#gotoSessionUrl').hide();
        }

        if (addToMySessions) {
            if (mySessions.indexOf(id) == -1) {
                mySessions.push(id);
                dgStorage.val('mySessions', mySessions);
            }
        }
    }

    // create a new instance of RegExp using currnet options and text.
    function createRe() {
        return XRegExp(my.reText, my.reOptions);
    }

    function onInputsChanged() {
        var newMap = reyRegExMap.updateMap(targetEditor.getText(), my.reText, my.reOptions);
        if (!reyRegExMap.mapsAreEqual(newMap, this.matchMap)) {
            my.matchMap = newMap;
            targetEditor.refreshMarkers();
            $(my).trigger('mapUpdated', newMap);
        }
    }

    function menuCommand(commandID) {
        switch (commandID) {
            case 'saveNewSession':
                postSession();
                break;
            case 'updateSession':
                postSession(sessionID);
                break;
        }
    }

    // called when jQuery starts.
    function init() {
        targetEditor = new reyTextEditor("targetEditor", "targetEditor");
        targetEditor.addMarker(new matchHighligher(targetEditor), true);
        targetEditor.updateDelay = 1000;
        $(targetEditor).on('changecomplete', onInputsChanged);

        patternEditor = new reyTextEditor('patternEditor', 'patternEditor');
        patternEditor.updateDelay = 1000;
        patternEditor.option('rowTokenizer', tokenizePatternRow);
        $(patternEditor).on('tokenhover', onPatternTokenHover);
        $(patternEditor).on('changecomplete', patternEditorTextChanged);
        $(patternEditor).on('change', reTextChanging);

        $('#loadUrlButton').selectDialog({
            dialogOk: function (ev, data) { loadUrl(data.value); }
        });

        $('#loadFileButton').click(function () { $('#importFile').trigger('click'); });
        $('#importFile').on('change', function (ev) { loadFiles(ev.target.files); });
        $('#docs').docs();
        $('#helpButton').on('click', function () { $('#docs').docs('show'); });

        BeginLoadingSavedInputs();

    }

    // creates ui and registers events.
    function afterInputsLoaded() {
        reyModules.init();
        patternOptionsChanged();
        // generic ui events

        $('.fillHeight').blockUtil('fillHeight');
        $(window).unload(saveSession);

        $allOptions.click(patternOptionsChanged);

        $('.menuLabel').on('click', function () {
            var $menu = $(this).parent();
            var $itemsPanel = $menu.find('.menuItemsPanel');
            clearTimeout($menu.data('hide_menu_to_id'));
            $itemsPanel.toggle({
                duration: 125,
                complete: function() {
                    $menu.one('mouseleave', function () {
                        clearTimeout($menu.data('hide_menu_to_id'));
                        $menu.find('.menuItemsPanel').hide(250);
                    });
                }
            });
        });
        $('.menu').on('mousemove click', function () {
            var $menu = $(this);
            clearTimeout($menu.data('hide_menu_to_id'));
            $menu.data('hide_menu_to_id', setTimeout(function () {
                $menu.find('.menuItemsPanel').hide(250);
            }, 5000));
        });

        $('.menuItemsPanel').children().on('click', function (ev) {
            if (!$(this).hasClass('disabled')) {
                menuCommand(this.id, this);
            }
        });

        $('.menuItemsPanel').hide();
        
        $('.dg-splitter').splitter();

        $(window).trigger('resize');
    }

    var my = {
        maxFileSize: 100000,
        setRe: setRe,
        createRe: createRe,
        reOptions: '',
        reText: '',
        matchMap: [],
        tokenizedPattern: null,
        getTargetEditor: function () { return targetEditor; },
        getPatternEditor: function () { return patternEditor; },
        toString: function() { return 'reyRegEx'; },
        init: init
    };

    return my;

}(jQuery));


jQuery(document).ready(function ($) {
    reyRegEx.init();
});

