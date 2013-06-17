var rexStringSplit = (function () {
    var $table;

    function init($elem) {
        $elem.append($table = $('<table class="moduleTable" />'));
    }

    function update() {
        var results = rexRegEx.getTargetEditor().getText().split(rexRegEx.getRe());
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
        id: 'rexStringSplit',
        update: update,
        init: init,
        start: start,
        stop: stop,
    }

    return my;
}());

