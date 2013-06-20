﻿var reyStringSplit = (function () {
    var $table;

    function init($elem) {
        $elem.append($table = $('<table class="moduleTable" />'));
    }

    function update() {
        var results = reyRegEx.getTargetEditor().getText().split(reyRegEx.getRe());
        $table.empty();
        for (var i = 0, il = results.length; i < il; i++) {
            $table.append($('<tr />')
                .append([
                    $('<td class="index">' + (i + 1) + ': </td>'),
                    $('<td />').text(results[i])
                ])
            );
        }
    }

    function start() {
        rexRegExMap.on('updated', update);
        update();
    }

    function stop() {
        eventManager.unsubscribe(rexRegExMap, 'updated', update);
    }

    var my = {
        name: 'String Split',
        id: 'reyStringSplit',
        update: update,
        init: init,
        start: start,
        stop: stop,
    }

    return my;
}());

