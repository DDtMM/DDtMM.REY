var modCurrentSyntax = (function () {
    var $rootPanel,
        $normalTable,
        $setTable,
        $moduleMenu;

    var viewOptions = [
        { opt: 'normal', text: 'Normal and Within Groups' },
        { opt: 'sets', text: 'Within Sets' },
    ];

    function init($elem) {
        var normalName = 'Normal and Within Groups',
            setName = 'Within Sets';


        $normalTable = $('<table class="moduleTable" />');
        $setTable = $('<table class="moduleTable" style="display:none"/>');

        $elem.append(
            $rootPanel = $('<div class="panel" />').append([
                $moduleMenu = $('<div class="moduleMenu tabs">'),
                $('<div class="fillHeight window" />').append([
                    $normalTable,
                    $setTable
                ]),

            ])
        );

        for (var i = 0, il = viewOptions.length, opt; i < il; i++) {
            opt = viewOptions[i];
            $moduleMenu.append($('<div class="tab" />').html(opt.text).data('opt', opt.opt));
        }

        $moduleMenu.simpleOption({ mode: 'children' }).on('selected', function (ev, data) {
            my.val('viewOption', $(data.selected).data('opt'), 'menu');
        });

        $(this).on("valueChanged", onValueChanged);
        my.val('viewOption', (my.val('viewOption') || 'normal'))
    }

    function onValueChanged(event, data) {
        switch (data.name) {
            case 'viewOption':
                if (data.source != 'menu') {
                    $moduleMenu.children().filter(function () {
                        return $(this).data("opt") == data.value
                    }).simpleOption('select');
                }
                switch (data.value) {
                    case 'sets':
                        $normalTable.hide();
                        $setTable.show();
                        break;
                    default:
                        $normalTable.show();
                        $setTable.hide();
                        break;
                }
                break;
        }
    }

    function update() {
        appendRules($normalTable, regexSyntax.modes.normal.rules, reyRegEx.reOptions, true);
        appendRules($setTable, regexSyntax.modes.set.rules, reyRegEx.reOptions, false);
    }

    function appendRules($table, rules, options, showQuantifiable) {
        var rule,
            currentNamespace = '',
            description = '',
            createFunction;
        
        $table.empty();

        createFunction = (showQuantifiable) ?
            function(usage, description, affectedByOptions, quantifiable) {
                return $('<tr />').append([
                    $('<td class="index" />').text(usage),
                    $('<td />').html(description),
                    $('<td />').html((quantifiable) ? 'Yes' : 'No')
                ]).addClass((affectedByOptions) ? 'affedtedByOptions' : '');
            }
            :
            function(usage, description, affectedByOptions) {
                return $('<tr />').append([
                    $('<td class="index" />').text(usage),
                    $('<td />').html(description)
                ]).addClass((affectedByOptions) ? 'affedtedByOptions' : '');
            }

        for (var i in rules) {
            rule = rules[i];

            if (!rule.namespace.match(/Literal|Bad_Characters|Ignored/) &&
                (rule.optionsMatch == null || options.match(rule.optionsMatch))) {
                if (rule.namespace !== currentNamespace) {
                    currentNamespace = rule.namespace;
                    appendHeading($table, currentNamespace.replace(/[_]/g, ' '), showQuantifiable);
                }

                $table.append(createFunction(rule.usage, rule.createActiveDescription(),
                    (rule.optionsMatch != null), rule.quantifiable));
            }
        }

        return $table;
    }

 
    function appendHeading($table, text, showQuantifiable) {
        $table.append([
            $('<tr class="heading"><td colspan="3">' + text + '</td></tr>'),
            $('<tr class="subHeading"/>').append($(
                '<td>Symbol</td><td>Description</td>' + ((showQuantifiable) ? '<td>Quantifiable</td>' : '')
            ))
        ]);
    }

    function start() {
        $(reyRegEx).on('reUpdated', update);
        update();
    }

    function stop() {
        $(reyRegEx).off('reUpdated', update);
    }

    var my = {
        name: 'Current Syntax',
        id: 'modCurrentSyntax',
        update: update,
        init: init,
        start: start,
        stop: stop,
    }

    return my;
}());

