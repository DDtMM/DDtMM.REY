var modRegexHistory = (function () {
    var $elem;
    var history = new LimitedStack(50);
    var maxReLength = 60;
    var selectedIndex = -1;

    function createTokenHTML(token) {
        return '<span class="' + token.type + '">' +
            token.value.replace('<', '&lt;').replace('>', '&gt;') + '</span>';
    }

    function stylizeRe(tokenizedPattern, ignoreLength) {
        var strLen = 0,
            token,
            styledReText = '';
        
        var formatted = reyFormatting.formatRegexTokens(tokenizedPattern.tokens);
  
        for (var i = 0, il = formatted.length; i < il; i++) {
            if (!ignoreLength && strLen > maxReLength) {
                // jump ahead because this is too long
                styledReText += '<i> ... </i>';
                i = il - 1;
            }
            token = formatted[i];
            strLen += token.value.length;
            
            styledReText += createTokenHTML(token);
            
        }

        return styledReText;
    }

    function init($parentElement) {
        $(reyRegEx).on('reUpdated', function (event, data) {

            var addData = (history.isEmpty() || history.peek().reText != data.reText);

            if (selectedIndex > -1) {
                if (history.val(selectedIndex).reText != data.reText) {
                    history.popTo(selectedIndex + 1);
                }
                else addData = false;
            }

            if (addData) {
                var id = history.length();
                history.push({
                    reText: data.reText,
                    reOptions: data.reOptions,
                    value: '<span class="handle">' + (id + 1) + ': </span>' + stylizeRe(reyRegEx.tokenizedPattern),
                    id: id
                });
                selectedIndex = -1;
                if (my.isRunning) updateTree();
            }
        });

        $elem = $parentElement;
        $elem.simpleTree({
            nodeTransform: function (data) {
                return {
                    reText: data.reText,
                    reOptions: data.reOptions,
                    value: data.value,
                    id: data.id
                }
            },
            click: function (ev, data) {

                var nodeID = data.node.id;
                selectedIndex = parseInt(nodeID);
                var $treeElem = $elem.find('[data-tree-id="' + nodeID + '"]');
                $treeElem.nextAll().addClass('history-cut');
                $treeElem.removeClass('history-cut').prevAll().removeClass('history-cut');
                reyRegEx.getPatternEditor().setText(data.node.reText);
            }
        }).one('simpletreemouseover', treeNodeMouseover);
    }

    // tree node mousever event handler
    function treeNodeMouseover(ev, data) {
        var node = data.node;
        node.originalHtml = node.value;
        node.value = '<span class="handle">' + (node.id + 1) + ': </span>' +
            stylizeRe(regexParser.tokenize(node.reText, node.reOptions), true);
        $elem.simpleTree('refreshNode', node)
            .one('simpletreemouseleave', function () {
            node.value = node.originalHtml;
            node.originalHtml = '';
              $elem.simpleTree('refreshNode', node)
                .one('simpletreemouseover', treeNodeMouseover);
        });
    }

    function onValueChanged(event, data) {
        // in text or function updates I check to see if the replaceEditor matches the text.
        // this is riggish.
        switch (data.name) {
            case 'history':
                if (val('mode') == 'replace-function' && data.value != replaceEditor.getText()) {
                    replaceEditor.setText(value);
                }
                update();
                break;
            case 'text':
                if (val('mode') == 'replace-text' && data.value != replaceEditor.getText()) {
                    replaceEditor.setText(value);
                }
                update();
                break;
            case 'mode':
                $replaceWithSelect.val(data.value);
                onModeChanged();
                break;
        }
    }

    function updateTree() {
        $elem.simpleTree('swapNodes', history.getValues());
    }

    function start() {
          updateTree();
    }

    function stop() {
        // even though we're not visible, we're still going to be collecting history
    }

    var my = {
        name: 'History',
        id: 'modRegexHistory',
        init: init,
        start: start,
        stop: stop
    }

    return my;
}());

