var mapVisualizer = (function () {
    var $elem;

    function init($parentElement) {
        $elem = $parentElement;

        $elem.simpleTree({
            nodeTransform: function (oldNode) {
                return {
                    startLine: oldNode.startLine,
                    startCol: oldNode.startLineCol,
                    endLine: oldNode.endLine,
                    endCol: oldNode.endLineCol,
                    value:
                        '<span class="captureInfo cgroup-' + oldNode.captureIndex + '">' +
                        ((oldNode.parent == null) ? oldNode.startLine + 1 : '[' + oldNode.captureName + ']') +
                        '</span><span class="capturedText">' +
                        oldNode.text.replace('<', '&lt;').replace('>', '&gt;') +
                        '</span>',
                    id: oldNode.captureIndex + ':' + oldNode.startIndex + '-' + oldNode.endIndex
                }
            },
            transformGetChildren: function (oldNode) {
                return oldNode.children;
            },
            click: function (ev, data) {
                rexRegEx.getTargetEditor().gotoLine(data.node.startLine, data.node.startCol);
                rexRegEx.getTargetEditor().highlightRange(data.node.startLine, data.node.startCol, 
                    data.node.endLine, data.node.endCol, 'selected-capture');
            }
        });
    }

    function updateTree() {
        $elem.simpleTree('swapNodes', rexRegExMap.map);
    }

    function start() {
        rexRegExMap.on('updated', updateTree);
        updateTree();
    }

    function stop() {
         eventManager.unsubscribe(rexRegExMap, 'updated', updateTree);
    }

    var my = {
        name: 'Match Visualizer',
        id: 'rexMatchViz',
        init: init,
        start: start,
        stop: stop
    }

    return my;
}());

