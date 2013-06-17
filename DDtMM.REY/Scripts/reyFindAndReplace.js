var findAndReplace = (function () {
    var replaceEditor,
        replaceResultsViewer,
        $replaceWithSelect,
        functionValue,
        textValue,
        currentMode;

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

    function changeMode() {

        currentMode = $replaceWithSelect.val();

        switch (currentMode) {
            case 'replace-function':
                replaceEditor.setText(functionValue);
                replaceEditor.option('mode', 'ace/mode/javascript');
                replaceEditor.option('theme', 'ace/theme/monokai');
                break;
            default:
                replaceEditor.setText(textValue);
                replaceEditor.option('mode', 'ace/mode/text');
                replaceEditor.option('theme', 'ace/theme/dawn');
                break;
        }
    }

    function init($elem) {
        textValue = (dgStorage.val('rexFindAndReplace_textValue') || 'REPLACED');
        functionValue = (dgStorage.val('rexFindAndReplace_functionValue')
            || 'function () {\n\treturn arguments[0] + \'!\';\n}');
        currentMode = (dgStorage.val('rexFindAndReplace_currentMode') || 'replace-text');

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
        $replaceWithSelect.val(currentMode);
        $replaceWithSelect.on('change', onReplaceWithSelectChange);

        replaceEditor = new rexTextEditor('replaceEditor', 'replaceEditor');
        replaceEditor.updateDelay = 1000;

        replaceResultsViewer = new rexTextEditor('replaceResultsViewer', 'replaceResultsViewer');
        replaceResultsViewer.option('readOnly', true);

    }

    function onReplaceWithSelectChange() {
        storeTextValue();
        changeMode();
        update();
    }

    // saves the editor text value.
    function storeTextValue() {
        switch (currentMode) {
            case 'replace-function':
                functionValue = replaceEditor.getText();
                break;
            case 'replace-text':
                textValue = replaceEditor.getText();
                break;
        }
    }

    function update() {
        var replaceWith = replaceEditor.getText();
        if (currentMode == 'replace-function') replaceWith = createReplaceFunction('(' + replaceWith + ')');
        replaceResultsViewer.setText(
            rexRegEx.getTargetEditor().getText().replace(rexRegEx.getRe(), replaceWith)
        );
    }

    function start() {
        rexRegExMap.on('updated', update);
        replaceEditor.on('changecomplete', update);
        changeMode();
        update();
    }

    function stop() {
        storeTextValue();
        eventManager.unsubscribe(rexRegExMap, 'updated', update);
        eventManager.unsubscribe(replaceEditor, 'changecomplete', update);
    }

    function destroy() {
        dgStorage.val('rexFindAndReplace_currentMode', currentMode);
        dgStorage.val('rexFindAndReplace_functionValue', functionValue);
        dgStorage.val('rexFindAndReplace_textValue', textValue);
    }

    var my = {
        name: 'Find and Replace',
        id: 'rexFindAndReplace',
        update: update,
        init: init,
        start: start,
        stop: stop,
        destroy: destroy
    }

    return my;
}());

