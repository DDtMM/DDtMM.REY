var modMapVisualizer = (function () {
    var $treeElem;
    var $textElem;
    var $moduleMenu;

    var viewOptions = [
        { opt: 'tree', text: 'Interactive Tree' },
        { opt: 'text', text: 'Formatted Text' },
    ];

 
    function init($parentElement) {

         $parentElement.append(
            $('<div class="panel" />').append([
                $moduleMenu = $('<div class="moduleMenu tabs" />'),
                $('<div class="fillHeight window"  />').append([
                    $treeElem = $('<div />'),
                    $textElem = $('<div style="display:none"/>')
                ])
            ])
        );

        for (var i = 0, il = viewOptions.length, opt; i < il; i++) {
            opt = viewOptions[i];
            $moduleMenu.append($('<div class="tab" />').html(opt.text).data('opt', opt.opt));
        }

        $moduleMenu.simpleOption({ mode: 'children' }).on('selected', function (ev, data) {

            my.val('viewOption', $(data.selected).data('opt'), 'menu');
        });

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

        $(this).on("valueChanged", onValueChanged);
        my.val('viewOption', (my.val('viewOption') || 'tree'))
    }


    function onValueChanged(event, data) {
        switch (data.name) {
            case 'viewOption':
                if (data.source != 'menu') {
                    $moduleMenu.children().filter(function () {
                        return $(this).data("opt") == data.value
                    }).simpleOption('select');
                }
                update();
                break;
        }
    }
    function update() {
        var opt = my.val('viewOption');
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
        $(reyRegEx).on('mapUpdated', update);
        update();
    }

    function stop() {
        $(reyRegEx).off(reyRegEx, 'mapUpdated', update);
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

