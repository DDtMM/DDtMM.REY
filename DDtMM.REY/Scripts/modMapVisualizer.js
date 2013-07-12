var modMapVisualizer = (function () {
    var $treeElem;
    var $textElem;
    var $toggleButton;

    var displayAsOptions = [
        { opt: 'tree', text: 'Display as Tree' },
        { opt: 'text', text: 'Display as Copyable Text' },
       
    ];
    dgArrayDecorators.addEndless(displayAsOptions);
    dgArrayDecorators.addQueries(displayAsOptions);
 
    function init($parentElement) {
        var optVal = my.val('displayOption', (my.val('displayOption') || 'tree'));

        optVal = displayAsOptions.qry.findFirst(function (val) { return (val.opt == optVal); },
            displayAsOptions.qry.mutators.indexValueReturn);

        displayAsOptions.endless.index = optVal.index;
        
        $parentElement.append(
            $('<div class="panel" />').append([
                $('<div class="moduleMenu" />').append(
                    $toggleButton = $('<div />', {
                        'class': 'button',
                        text: displayAsOptions.endless.peekNext().text,
                        on: { 
                            click: toggleDisplayAs
                        }
                    })
                ),
                $('<div class="fillHeight window"  />').append([
                    $treeElem = $('<div />'),
                    $textElem = $('<div style="display:none"/>')
                ])
            ])
        );

        $treeElem.simpleTree({
            nodeTransform: function (oldNode) {
                return {
                    startLine: oldNode.startLine,
                    startCol: oldNode.startLineCol,
                    endLine: oldNode.endLine,
                    endCol: oldNode.endLineCol,
                    value:
                        '<span class="captureInfo cgroup-' + oldNode.groupIndex + '">' +
                        ((oldNode.parent == null) ? oldNode.startLine + 1 : '[' + oldNode.groupName + ']') +
                        '</span><span class="capturedText">' +
                        oldNode.text.replace('<', '&lt;').replace('>', '&gt;') +
                        '</span>',
                    id: oldNode.groupIndex + ':' + oldNode.startIndex + '-' + oldNode.endIndex
                }
            },
            transformGetChildren: function (oldNode) {
                //return oldNode.children;
                function findVisibleDescendants(node) {
                    var child, visibleChildren = [];
                    for (var i = 0, il = node.children.length; i < il; i++) {
                        child = node.children[i];
                        if (child.groupIndex != -1) visibleChildren.push(child);
                        else {
                            visibleChildren = visibleChildren.concat(findVisibleDescendants(child));
                        }
                    }
                    return visibleChildren;
                }
                return findVisibleDescendants(oldNode);


            },
            click: function (ev, data) {
                reyRegEx.getTargetEditor().gotoLine(data.node.startLine, data.node.startCol);
                reyRegEx.getTargetEditor().highlightRange(data.node.startLine, data.node.startCol, 
                    data.node.endLine, data.node.endCol, 'selected-capture');
            }
        });
        update();
        EVMGR(this).on("valueChanged", onValueChanged);
    }

    function toggleDisplayAs() {
        my.val('displayOption', displayAsOptions.endless.next().opt);
    }

    function onValueChanged(data, event) {

        switch (data.name) {
            case 'displayOption':
 
                $toggleButton.html(displayAsOptions.endless.peekNext().text);

                update();
                break;
        }
    }
    function update() {
        var opt = my.val('displayOption');
        if (opt == 'text') {
            $treeElem.hide();
            $textElem.show();
            updateText();
        }
        else {
            $treeElem.show();
            $textElem.hide();
            $treeElem.simpleTree('swapNodes', reyRegEx.matchMap);
        }
    }

    function updateText() {
        var flatMap = reyRegExMap.flattenMatches(reyRegEx.matchMap),
            item,
            result = '<pre>';
        
        $textElem.empty();
        if (flatMap && flatMap.length > 0) {
            var linePadding = flatMap[flatMap.length - 1].startLine.toString().length;
            var paddingSource = '';
            for (var i = 0, il = linePadding; i <= il; i++) paddingSource += ' ';

            for (var i = 0, il = flatMap.length; i < il; i++) {
                item = flatMap[i];
                if (item.groupIndex != -1) {
                    if (!item.parent) {
                        result += padLeft(item.startLine + 1, linePadding, paddingSource) + ': ';
                    }
                    else {
                        result += paddingSource + '[' + item.groupName + ']: ';
                    }
                    result += item.text.replace('<', '&lt;').replace('>', '&gt;') + '\n';
                }
            }
            result += '</pre>';
            $textElem.html(result);
            
        }
    }

    function padLeft(str, length, paddingSource) {
        var paddingLength = length = str.length;

        if (paddingLength > 0) {
            return paddingSource.substring(0, paddingLength) + str;
        }

        return str;
    }
    function start() {
        reyRegEx.on('mapUpdated', update);
        update();
    }

    function stop() {
        eventManager.unsubscribe(reyRegEx, 'mapUpdated', update);
    }

    var my = {
        name: 'Match Visualizer',
        id: 'modMatchViz',
        init: init,
        start: start,
        stop: stop
    }

    return my;
}());

