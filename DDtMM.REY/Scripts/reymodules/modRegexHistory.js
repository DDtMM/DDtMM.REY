var modRegexHistory = (function () {
    var $elem;
    var history = new LimitedStack(50);
    var maxReLength = 60;
    var selectedNodeId = -1;
    // last id of added history item.
    var lastID = 0;

    function createTestData() {
        for (var i = 0, il = 95; i < il; i++) {
            addToHistory('abcdefg ' + i.toString(), 'i', '<span class="handle">' + i + ': </span>' + 'abcdefg ' + i.toString());
        }
    }
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

    // adds a regular expression to history
    function addToHistory(reText, reOptions, reTextTokenized) {
        //var stackIndex = history.length();
        var displayID = ++lastID;
        history.push({
            reText: reText,
            reOptions: reOptions,
            value: '<span class="handle">' + (displayID) + ': </span>' + stylizeRe(reTextTokenized),
            id: displayID,
            displayID: displayID
        });
    }

    // called when module is first added to the DOM
    function init($parentElement) {

        $(reyRegEx).on('reUpdated', function (event, data) {
  
            var addData = (history.isEmpty() || history.peek().reText != data.reText);

            // if something is selected, and doesn't match the new re, then we want to roll back to that item and
            // add the next one.
            if (selectedNodeId > -1) {
                var selectedNode = $elem.simpleTree('getNode', selectedNodeId);

                if (selectedNode.reText != data.reText) {
                    // the tree index correlates with the history index.
                    var $nodeElem = $elem.find('[data-tree-id="' + selectedNodeId + '"]');
                    var index = $nodeElem.parent().children().index($nodeElem);
                    history.popTo(index + 1);
                }
                else addData = false;
            }

            if (addData) {
                addToHistory(data.reText, data.reOptions, reyRegEx.tokenizedPattern);
                selectedNodeId = -1;
                if (my.isRunning) updateTree();
            }
        });
        $parentElement.append(
            $('<div class="window fillHeight"/>').append(
                $elem = $('<div />')
            )
        );
        
        $elem.simpleTree({
            nodeTransform: function (data) {
                return {
                    reText: data.reText,
                    reOptions: data.reOptions,
                    value: data.value,
                    id: data.id,
                    displayID: data.displayID
                }
            },
            click: function (ev, data) {

                var nodeID = data.node.id;
                selectedNodeId = parseInt(nodeID);
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
        node.value = '<span class="handle">' + (node.displayID) + ': </span>' +
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

    // updates the tree nodes with the history stack
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

