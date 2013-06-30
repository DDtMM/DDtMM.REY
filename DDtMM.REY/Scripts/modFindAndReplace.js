var modFindAndReplace = (function () {
    var replaceEditor,
        replaceResultsViewer,
        $replaceWithSelect;

    function createReplaceFunction (functionBody) {
        return new function () {
            try {
                return eval(functionBody);
            }
            catch (err) {
                return 'Error: ' + err;
            }
        }
    }

    function init($elem) {
        $elem.append([
            $('<div id="replaceEditPanel" class="panel">\
                <div class="moduleMenu">\
                    Replace With\
                    <select id="replaceWithSelect">\
                        <option value="replace-text" selected="selected">String</option>\
                        <option value="replace-function">Function</option>\
                    </select>\
                </div>\
                <div id="replaceEditor" class="fillHeight"></div>\
            </div>'),
            '<div class="panelSplitter panelSplitterHeight">&nbsp;</div>',
            $('<div id="replaceResultsPanel" class="panel">\
                 <div id="replaceResultsViewer" style="height:100%" ></div>\
            </div>')
        ]);

        
        $replaceWithSelect = $elem.find('#replaceWithSelect');
        $replaceWithSelect.on('change', onReplaceWithSelectChange);

        replaceEditor = new rexTextEditor('replaceEditor', 'replaceEditor');
        replaceEditor.updateDelay = 1000;

        replaceResultsViewer = new rexTextEditor('replaceResultsViewer', 'replaceResultsViewer');
        replaceResultsViewer.option('readOnly', true);

        val('text', (dgStorage.val('rexFindAndReplace_textValue') || 'REPLACED'));
        val('function', (dgStorage.val('rexFindAndReplace_functionValue')
            || 'function () {\n\treturn arguments[0] + \'!\';\n}'));
        val('mode', (dgStorage.val('rexFindAndReplace_currentMode') || 'replace-text'));
    }

    function onReplaceWithSelectChange() {
        val('mode', $replaceWithSelect.val());
    }

    // short hand for my.val;
    function val(name, value) {
        return my.val(name, value);
    }

    function onValueChanged(name, value) {
        // in text or function updates I check to see if the replaceEditor matches the text.
        // this is riggish.
        switch (name) {
            case 'function':
                if (val('mode') == 'replace-function' && value != replaceEditor.getText()) {
                    replaceEditor.setText(value);
                }
                update();
                break;
            case 'text':
                if (val('mode') == 'replace-text' && value != replaceEditor.getText()) {
                    replaceEditor.setText(value);
                }
                update();
                break;
            case 'mode':
                $replaceWithSelect.val(value);
                onModeChanged();
                break;
        }
    }

    function onModeChanged() {
        switch (val('mode')) {
            case 'replace-function':
                replaceEditor.setText(val('function'));
                replaceEditor.option('mode', 'ace/mode/javascript');
                replaceEditor.option('theme', 'ace/theme/monokai');
                break;
            default:
                replaceEditor.setText(val('text'));
                replaceEditor.option('mode', 'ace/mode/text');
                replaceEditor.option('theme', 'ace/theme/dawn');
                break;
        }

        update();
    }

    // called after replace text changed to save the value and update the ui;
    function replaceTextChanged() {
        storeTextValue();
        update();
    };

    // saves the editor text value.
    function storeTextValue() {
        switch (val('mode')) {
            case 'replace-function':
                val('function', replaceEditor.getText());
                break;
            case 'replace-text':
                val('text', replaceEditor.getText());
                break;
        }
    }

    function update() {
        var replaceWith;

        if (val('mode') == 'replace-function') {
            replaceWith = createReplaceFunction('(' + val('function') + ')');
        } else {
            replaceWith = val('text');
        }

        replaceResultsViewer.setText(
            reyRegEx.getTargetEditor().getText().replace(reyRegEx.getRe(), replaceWith)
        );
    }

    function start() {
        rexRegExMap.on('updated', update);
        replaceEditor.on('changecomplete', replaceTextChanged);
        onModeChanged();
    }

    function stop() {
        storeTextValue();
        eventManager.unsubscribe(rexRegExMap, 'updated', update);
        eventManager.unsubscribe(replaceEditor, 'changecomplete', update);
    }

    function destroy() {
        dgStorage.val('rexFindAndReplace_currentMode', val('mode'));
        dgStorage.val('rexFindAndReplace_functionValue', val('function'));
        dgStorage.val('rexFindAndReplace_textValue', val('text'));
    }

    var my = {
        name: 'Find and Replace',
        id: 'modFindAndReplace',
        onValueChanged: onValueChanged,
        update: update,
        init: init,
        start: start,
        stop: stop,
        destroy: destroy
    }

    return my;
}());

