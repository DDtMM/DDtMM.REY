var modFindAndReplace = (function () {
    var replaceEditor,
        replaceResultsViewer,
        $replaceWithSelect;

    function createReplaceFunction (functionBody) {
        try {
            // test it first by creating a new function
            var f = new Function('return  (' + functionBody + ').apply(modFindAndReplace, arguments);');
            return f;
        }
        catch (err) {
            console.log('Error: ' + err);
            return 'Error: ' + err;
        }
    }

 
    function init($elem) {
        $(this).on("valueChanged", onValueChanged);

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
            '<div class="dg-splitter dg-splitter-v">&nbsp;</div>',
            $('<div id="replaceResultsPanel" class="panel">\
                 <div id="replaceResultsViewer" style="height:100%" ></div>\
            </div>')
        ]);

        
        $replaceWithSelect = $elem.find('#replaceWithSelect');
        $replaceWithSelect.on('change', onReplaceWithSelectChange);

        replaceEditor = new reyTextEditor('replaceEditor', 'replaceEditor');
        replaceEditor.updateDelay = 1000;

        replaceResultsViewer = new reyTextEditor('replaceResultsViewer', 'replaceResultsViewer');
        replaceResultsViewer.option('readOnly', true);

        // set initial value
        my.val('text', (my.val('text') || 'REPLACED'));
        my.val('function', (my.val('function') || 'function doReplace () {\n\treturn arguments[0] + \'!\';\n}'));
        my.val('mode', (my.val('mode') || 'replace-text'));
    }

    function onReplaceWithSelectChange() {
        my.val('mode', $replaceWithSelect.val());
    }


    function onValueChanged(event, data) {
        // in text or function updates I check to see if the replaceEditor matches the text.
        // this is riggish.

        switch (data.name) {
            case 'function':
                if (data.source != 'replaceEditor') {
                    replaceEditor.setText(data.value);
                }
                update();
                break;
            case 'text':
                if (data.source != 'replaceEditor') {
                    replaceEditor.setText(data.value);
                }
                update();
                break;
            case 'mode':
                $replaceWithSelect.val(data.value);
                onModeChanged();
                break;
        }
    }

    function onModeChanged() {
        switch (my.val('mode')) {
            case 'replace-function':
                replaceEditor.setText(my.val('function'));
                replaceEditor.option('mode', 'ace/mode/javascript');
                replaceEditor.option('theme', 'ace/theme/monokai');
                break;
            default:
                replaceEditor.setText(my.val('text'));
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
        switch (my.val('mode')) {
            case 'replace-function':
                my.val('function', replaceEditor.getText(), 'replaceEditor');
                break;
            case 'replace-text':
                my.val('text', replaceEditor.getText(), 'replaceEditor');
                break;
        }
    }

    function update() {
        var replaceWith;

        if (my.val('mode') == 'replace-function') {
            replaceWith = createReplaceFunction(my.val('function'));
        } else {
            replaceWith = my.val('text');
        }

        replaceResultsViewer.setText(
            reyRegEx.getTargetEditor().getText().replace(reyRegEx.createRe(), replaceWith)
        );
    }

    function start() {
        $(reyRegEx).on('mapUpdated', update);
        $(replaceEditor).on('changecomplete', replaceTextChanged);
        onModeChanged();
    }

    function stop() {
        storeTextValue();
        $(reyRegEx).off('mapUpdated', update);
        $(replaceEditor).off('changecomplete', update);
    }

    var my = {
        name: 'Find and Replace',
        id: 'modFindAndReplace',
        onValueChanged: onValueChanged,
        update: update,
        init: init,
        start: start,
        stop: stop,
    }

    return my;
}());

