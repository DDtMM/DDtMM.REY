var modRegexHistory = (function () {
    var $elem;
    var history = new LimitedStack(100);
    var maxReLength = 60;
    var selectedIndex = -1;

    function createTokenHTML(token) {
        return '<span class="' + token.type + '">' +
            token.value.replace('<', '&lt;').replace('>', '&gt;') + '</span>';
    }

    function stylizeRe(tokenizedPattern) {
        var strLen = 0,
            token,
            styledReText = '';
        
        var formatted = reyFormatting.formatRegexTokens(tokenizedPattern.tokens);
        for (var i = 0, il = formatted.length; i < il; i++) {
            if (strLen > maxReLength) {
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
        reyRegEx.on('reUpdated', function (data) {

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
        });
        

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

