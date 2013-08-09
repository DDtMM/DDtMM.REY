var reyTextEditor = function (replaceDivId, name, tokenHoverCallback, theme) {
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
                //var pos = my.editor.renderer.pixelToScreenCoordinates(ev.clientX, ev.clientY);
                var pos = my.editor.renderer.screenToTextCoordinates(ev.clientX, ev.clientY);
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
    this.getText = function () {
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

}).call(reyTextEditor.prototype);


var matchHighligher = function () {
    this.type = 'text';
};

(function () {

    this.update = function (html, markerLayer, session, config) {
        var Range = require("ace/range").Range;

        var matches = reyRegExMap.flattenMatches(reyRegExMap.getMatchesInRange(reyRegEx.matchMap, config.firstRow, config.lastRow));
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
