
var reyRegEx = (function ($) {

    var re = null;
    var reRegexTextUpdateTimeoutId = -1;
    var patternEditor;
    var targetEditor;

    var $editor = $('#RegexEditor');
    var $loadUrlButton = $('#RegexEditor button[id="loadUrlButton"]');
    var $urlInput = $('#RegexEditor input[id="urlInput"]');
    
    var $optionsMenu = $editor.find('#regexOptionsMenu');
    var $optionsButton = $('#regexOptionsButton');
    var $optionsItemsPanel = $optionsMenu.find('#regexOptionsItemPanel');
    var $allOptions = $optionsMenu.find('input[id^="opt"]');

    var $loader = $('#loader');

    function windowUnloaded() {
        reyModules.destroy();

        $allOptions.each(function () { dgStorage.val('RegexEditor_' + this.id, this.checked ); });
        dgStorage.val('patternEditor_INPUTTEXT', patternEditor.getText());
        
        if (dgStorage.localStorageEnabled) {
            dgStorage.val('targetEditor_INPUTTEXT', targetEditor.getText());
            dgStorage.val('urlhistory', $('#loadUrlButton').selectDialog('option', 'values'));
        }

        dgStorage.val('hasData', true);
    };

    function loadInputs() {
        if (dgStorage.val('hasData') == true) {
            $allOptions.each(function () { this.checked = dgStorage.val('RegexEditor_' + this.id); });
            patternEditor.setText(dgStorage.val('patternEditor_INPUTTEXT'));

            if (dgStorage.localStorageEnabled) {
                targetEditor.setText(dgStorage.val('targetEditor_INPUTTEXT'));
                $('#loadUrlButton').selectDialog('option', 'values', dgStorage.val('urlhistory'));
            }
        }
        else {
            $('#opt-reg-global').attr('checked', true);
            $('#opt-reg-insensitive').attr('checked', true);
            $('#opt-xregex-extended').attr('checked', true);
            patternEditor.setText('((?<togo>[tg])(o))\t\t\t# find to\'s or go\'s\n| ([wt](here))\t\t\t\t# or find where\'s and there\'s');
            targetEditor.setText('"If you want to go somewhere, \n\tgoto is the best way to get there."\n\n\t\t- Ken Thompson');
        }
    };

    // reads the query string to add values
    function loadFromQuerystring() {
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
        if (value = params.tool) reyModules.showModule(value);
        if (value = params.options) setOptionFromString(value);

        // add any parameters to tool
        for (name in toolParams) reyModules.activeModule.val(name, toolParams[name]);
        
    }

    // checks and unchecks options based on optionsStr.
    function setOptionFromString(optionsStr) {
        if (optionsStr) {
            $allOptions.each(function () {
                this.checked = (optionsStr.indexOf(this.value) >= 0);
            });
        }
    }

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

    function showLoading (message)
    {
        $loader.find('#loading-message').html((message == null) ? "LOADING" : message);
        $loader.show();
    };

    function hideLoading (duration) {
        if (duration == null) {
            $loader.fadeOut(1000);
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
        // type = css, value = text;
        var line = this.doc.getLine(row);
        var state = this.states[row - 1];
        var formattedTokens = [];
        var subTokenizedToken;
        var token;

        var rowTokens;

        if (my.tokenizedPattern && (rowTokens = my.tokenizedPattern.rows[row])) {
            for (var i in rowTokens) {
                token = rowTokens[i];
                
                switch (token.rule.namespace) {
                    case 'Ignored':
                        token.text = token.text.replace('\n', '');
                        break;
                    case 'Literal':
                        token.text = token.text.replace('\n', '\u00B6');
                        break;
                }
                if (token.rule.capturedCount == 0) {
                    formattedTokens.push({
                        value: token.text,
                        type: token.rule.namespace.replace('.', '_'),
                        parserToken: token
                    });
                } else {
                    subTokenizedToken = tokenizeRegexToken(token);
                    for (var j in subTokenizedToken) {
                        formattedTokens.push({
                            value: subTokenizedToken[j].text,
                            type: token.rule.namespace.replace('.', '_') + subTokenizedToken[j].index,
                            parserToken: token
                        });
                    }
                    //formattedTokens.push({ value: token.text, type: token.rule.namespace.replace('.', '_') });
                }
            }
        }
        //var data = this.tokenizer.getLineTokens(line, state, row);

        if (this.currentLine == row) {
            this.currentLine = row + 1;
        }

        if (formattedTokens.length > 0) {
            formattedTokens[formattedTokens.length - 1].value =
                formattedTokens[formattedTokens.length - 1].value.replace('\n', '\u00B6');
        }
        return this.lines[row] = formattedTokens;
 
    }

    function tokenizeRegexToken(token) {
        var results = [],
            match = token.text.match(new RegExp(token.rule.regEx)),
            root = match[0],
            groupIndex,
            lastEndIndex = 0,
            capture;
        
        for (var i = 1, il = match.length; i < il; i++) {
            capture = match[i];
            groupIndex = root.indexOf(capture, lastEndIndex);

            // readd parts of the root
            if (groupIndex > lastEndIndex) {
                results.push({ text: root.substr(lastEndIndex, groupIndex - lastEndIndex), index: '' })
            }
            results.push({ text: capture, index: '-' + i });
            lastEndIndex = groupIndex + capture.length;
        }

        if (root.length > lastEndIndex) results.push({ text: root.substr(lastEndIndex), index: '' });

        return results;
    }

    function onPatternTokenHover(token) {
        
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

    function getRe() {
        return re;
    }

    function setRe(reText, reOptions) {
        re = XRegExp(reText, reOptions);
        my.reOptions = reOptions;
        my.reText = reText;
        my.trigger('reUpdated');

        onInputsChanged();
    }

    function onInputsChanged() {
        rexRegExMap.updateMap(targetEditor.getText(), my.reText, my.reOptions);
    }

    var my = {
        maxFileSize: 100000,
        getRe: getRe,
        setRe: setRe,
        reOptions: '',
        reText: '',
        getTargetEditor: function () { return targetEditor; },
        getPatternEditor: function () { return patternEditor; },
        toString: function() { return 'reyRegEx'; },
        on: function (event, callback) { eventManager.subscribe(my, event, callback); },
        trigger: function (event, data) { eventManager.trigger(my, event, data); },
        init: function () {
            targetEditor = new rexTextEditor("targetEditor", "targetEditor");
            targetEditor.addMarker(new matchHighligher(targetEditor), true);
            targetEditor.updateDelay = 1000;
            targetEditor.on('changecomplete', onInputsChanged);
            patternEditor = new rexTextEditor('patternEditor', 'patternEditor', onPatternTokenHover);
            patternEditor.updateDelay = 1000;
            patternEditor.option('rowTokenizer', tokenizePatternRow);
            patternEditor.on('changecomplete', patternEditorTextChanged);
            patternEditor.on('change', reTextChanging);

            reyModules.init();
            rexRegExMap.on('updated', function () {
                 targetEditor.refreshMarkers();
            });

            $('.fillHeight').fillHeight();
 
            $(window).unload(windowUnloaded);
            $('#loadUrlButton').selectDialog({
                dialogOk: function (ev, data) { loadUrl(data.value); }
            });

            EVMGR($('.menuLabel')).on('click', function () {
                $(this).parent().find('.menuItemsPanel').toggle(200);
            });

            EVMGR($('.menu')).on('mousemove click', function () {
                var id = EVMGR($(this)).delayedTrigger('idle', null, 5000, true);
            });
            
            EVMGR($('.menu')).on('mouseleave', function () {
                var $menu = $(this);
                if ($menu.css('display') != 'none') {
                    EVMGR($menu).cancelTrigger('idle');
                    $menu.find('.menuItemsPanel').hide(500);
                }
            });
            
            EVMGR($('.menu')).on('idle', function () {
                var $itemsPanel = $(this).find('.menuItemsPanel');
                if ($itemsPanel.css('display') != 'none') $itemsPanel.hide(500);
            });

            $('.menuItemsPanel').hide();


            $('.panelSplitterWidth').each(function() { 
                var $this = $(this);
                var $prev = $this.prev();
                var $next = $this.next();
                var offsetX;
                var currentWidth;
                var spliiterWidth = $this.width();

                currentWidth = $prev.css('width');
                if (currentWidth.indexOf('%') > -1) {
                    currentWidth = $prev.parent().width() * (parseFloat(currentWidth) / 100);
                }
                else if (currentWidth.match(/\D/)) currentWidth = parseFloat(currentWidth);


                $prev.css('width', currentWidth);
                $this.css('left', currentWidth);
                $next.css('left', currentWidth + spliiterWidth);

                $this.on('mousedown', function () {
                    var minWidth = $prev.css('min-width');
                    var offset1 = $prev.offset();
                    offset1.left += (minWidth.indexOf('px') > 0) ? parseFloat(minWidth) : 0.0;

                    var offset2 = $next.offset();
                    offset2.top += $next.outerHeight(true);
                    offset2.left += $next.outerWidth(true);
                    minWidth = $next.css('min-width');
                    offset2.left -= (minWidth.indexOf('px') > 0) ? parseFloat(minWidth) : 0.0;

                    offsetX = $this.parent().offset().left;
                    
                    $this.draggable('option', 'containment', [offset1.left, offset1.top, offset2.left, offset2.top]);
                });
                $this.draggable({
                    axis: 'x',
                    drag: function (ev, ui) {
                        $next.css('left', ui.offset.left - offsetX + spliiterWidth);
                        $prev.css('width', ui.offset.left - offsetX);
                    },
                    stop: function (ev, ui) {
                        $(window).trigger('resize');
                    }
                });
            });

            $('.panelSplitterHeight').each(function () {
                var $this = $(this);
                var $prev = $this.prev();
                var $next = $this.next();
                var offsetY;
                var currentHeight;
                var spliiterHeight = $this.height();

                currentHeight = $prev.css('height');
                if (currentHeight.indexOf('%') > -1) {
                    currentHeight = $prev.parent().height() * (parseFloat(currentHeight) / 100);
                }
                else if (currentHeight.match(/\D/)) currentHeight = parseFloat(currentHeight);
  
                
 
                $prev.css('height', currentHeight);
                $this.css('top', currentHeight);
                $next.css('top', currentHeight + spliiterHeight);

                $this.on('mousedown', function () {
                    var minHeight = $prev.css('min-height');
                    var offset1 = $prev.offset();
                    offset1.top += (minHeight.indexOf('px') > 0) ? parseFloat(minHeight) : 0.0;

                    var offset2 = $next.offset();
                    offset2.top += $next.outerHeight(true);
                    offset2.left += $next.outerWidth(true);
                    minHeight = $next.css('min-height');
                    offset2.top -= (minHeight.indexOf('px') > 0) ? parseFloat(minHeight) : 0.0;

                    offsetY = $this.parent().offset().top;

                    $this.draggable('option', 'containment', [offset1.left, offset1.top, offset2.left, offset2.top]);
                });
                $this.draggable({
                    axis: 'y',
                    drag: function (ev, ui) {
                        $next.css('top', ui.offset.top - offsetY + spliiterHeight);
                        $prev.css('height', ui.offset.top - offsetY);
                    },
                    stop: function (ev, ui) {
                        $(window).trigger('resize');
                    }
                });
            });
            $allOptions.click(patternOptionsChanged);

            $('#loadFileButton').click(function () { $('#importFile').trigger('click'); });
            $('#importFile').on('change', function (ev) { loadFiles(ev.target.files); });
            $('#docs').docs();
            $('#helpButton').on('click', function () { $('#docs').docs('show'); });
            loadInputs();
            loadFromQuerystring();
            patternOptionsChanged();
            $(window).trigger('resize');
        }
    };

    return my;

}(jQuery));

var rexTextEditor = function (replaceDivId, name, tokenHoverCallback, theme) {
    this.editor = null;
    this.updateDelay = 100;
    this.name = name;
    this.changing = false;

    // private variables
    this._timeoutId = -1;
    this._removableMarkers = [];
    this.init(replaceDivId, tokenHoverCallback, theme);
};
(function () {
    this.init = function (replaceDivId, tokenHoverCallback, theme) {
        var my = this;

        this.editor = ace.edit(replaceDivId);
        this.editor.setTheme((theme || "ace/theme/monokai"));
        this.editor.setShowPrintMargin(false);
        this.editor.setHighlightActiveLine(false);

        if (tokenHoverCallback != null) {
            $('#' + replaceDivId).on('mousemove', function (ev) {
                var pos = my.editor.renderer.pixelToScreenCoordinates(ev.clientX, ev.clientY);
                tokenHoverCallback(my.editor.getSession().getTokenAt(pos.row, pos.column));
            });
            $('#' + replaceDivId).on('mouseout', function (ev) {
                tokenHoverCallback(null);
            });
        }

        var session = this.editor.getSession();
        session.setUseWrapMode(true);
        session.setUseSoftTabs(false);

        this.editor.on('change', function (data) {
            eventManager.trigger(my, 'change', arguments);
            if (my.updateDelay > 0) {
                if (!my.changing) {
                    my.changing = true;
                    eventManager.trigger(my, 'changestart', arguments);
                    for (var i = 0, marker; (marker = my._removableMarkers[i]) !== undefined; i++) {
                        my.editor.session.removeMarker(marker.id, false);
                        marker.isAdded = false;
                    }
                    my.removeHighlight();
                    my.editor.updateSelectionMarkers();
                }
                clearTimeout(my._timeoutId);
                my._timeoutId = setTimeout(function () {
                    my.changing = false;
                    eventManager.trigger(my, 'changecomplete', arguments);
                    my.refreshMarkers();
                }, my.updateDelay);
            } else {
                eventManager.trigger(my, 'changecomplete', arguments);
            }
        });

        $(window).on('resize', function () {
            my.editor.resize(true);
        });
    };

    this.gotoLine = function (line, col) {
        this.editor.gotoLine(line + 1, col + 1, false);
        this.editor.moveCursorTo(line, col)
        this.editor.centerSelection();
    };

    // gets text from editor
    this.getText = function() {
        return this.editor.getSession().getValue();
    };

    // sets text on editor
    this.setText = function (value) {
        this.editor.getSession().setValue(value);
    };

    this.on = function (event, callback) {
        eventManager.subscribe(this, event, callback)

    };

    this.highlightRange = function (startLine, startCol, endLine, endCol, highlightClass) {
        var Range = require("ace/range").Range;
        this.removeHighlight();
        
        if (highlightClass == null) highlightClass = 'ace_active-line';
        var range = new Range(startLine, startCol, endLine, endCol);
        this._lastHighlightID = this.editor.session.addMarker(range, highlightClass, 'text', false);
        return this._lastHighlightID;
    };

    this.removeHighlight = function (highlightID) {
        if (highlightID == null) highlightID = this._lastHighlightID;
        this.editor.getSession().removeMarker(highlightID);
    }


    // refreshes the editor
    this.refreshMarkers = function () {
        var result,
            session = this.editor.session

        for (var i = 0, marker; (marker = this._removableMarkers[i]) !== undefined; i++) {
            if (marker.isAdded != true) {
                session.addDynamicMarker(marker, false);
                marker.isAdded = true;
            }
        }

        this.editor.updateSelectionMarkers();
    }

    // updates markers;
    this.addMarker = function (marker, removeDuringChange) {
        this.editor.session.addDynamicMarker(marker, false);
        marker.isAdded = true;
        if (removeDuringChange) this._removableMarkers.push(marker);
    }

    // gets or sets an option like jQuery
    this.option = function (name, value) {
        if (value === undefined) {
            switch (name) {
                case 'readOnly': return this.editor.getReadOnly();
                case 'theme': return this.editor.getTheme();
                case 'mode': return this.editor.getSession().getMode();
                case 'rowTokenizer': return this.editor.getSession().bgTokenizer.$tokenizeRow;
            }
        }
        else {
            switch (name) {
                case 'readOnly': this.editor.setReadOnly(value); break;
                case 'theme': this.editor.setTheme(value); break;
                case 'mode': this.editor.getSession().setMode(value); break;
                case 'rowTokenizer': this.editor.getSession().bgTokenizer.$tokenizeRow = value; break;
            }
        }
    }

}).call(rexTextEditor.prototype);


var matchHighligher = function () {
    this.type = 'text';
};

(function () {

    this.update = function (html, markerLayer, session, config) {
        var Range = require("ace/range").Range;

        var matches = rexRegExMap.flattenMatches(rexRegExMap.getMatchesInRange(config.firstRow, config.lastRow));
        var match;
        var range;
        var className;

        for (var i in matches) {

            match = matches[i];
            range = new Range(match.startLine, match.startLineCol, match.endLine, match.endLineCol).toScreenRange(session);

            className = 'cgroup cgroup-' + (match.groupIndex % 20) +
                ((Math.floor(match.groupIndex / 20) % 2 == 1) ? ' cgroup-20-40' : '');
            
            if (!range.isMultiLine()) {
                markerLayer.drawSingleLineMarker(
                    html, range, className, config, null, this.type
                );
            } else {
                markerLayer.drawMultiLineMarker(
                    html, range, className, config, null, this.type
                );
            }
        }
    };
}).call(matchHighligher.prototype);



jQuery(document).ready(function ($) {
    reyRegEx.init();
});

