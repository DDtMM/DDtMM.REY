var rexCurrentSyntax = (function () {
    var $rootPanel,
        $normalTable,
        $setTable;

    function init($elem) {
        var normalName = 'Normal and Within Groups',
            setName = 'Within Sets';


        $normalTable = $('<table class="moduleTable" />');
        $setTable = $('<table class="moduleTable" />');

        $elem.append(
            $rootPanel = $('<div class="modulePanel" />').append([
                $('<div class="tabStrip">').append([
                    $('<div class="tabHeading sel" />').html(normalName).on('click', function() {
                        $normalTable.show();
                        $setTable.hide();
                        $(this).parent().children('[class~="sel"]').removeClass('sel');
                        $(this).addClass('sel');
                    }),
                    $('<div class="tabHeading" />').html(setName).on('click', function () {
                        $normalTable.hide();
                        $setTable.show();
                        $(this).parent().children('[class~="sel"]').removeClass('sel');
                        $(this).addClass('sel');
                    })
                ]),
                $('<div class="modulePanel" />').append([
                    $normalTable,
                    $setTable
                ]),
                $('<div class="tabStrip">&nbsp</div>')
            ])
        );
        $setTable.hide();
    }

    function update() {
        appendRules($normalTable, regexSyntax.modes.normal.rules, rexRegEx.reOptions, true);
        appendRules($setTable, regexSyntax.modes.set.rules, rexRegEx.reOptions, false);
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
        rexRegEx.on('reUpdated', update);
        update();
    }

    function stop() {
        eventManager.unsubscribe(rexRegEx, 'reUpdated', update);
    }

    var my = {
        name: 'Current Syntax',
        id: 'rexCurrentSyntax',
        update: update,
        init: init,
        start: start,
        stop: stop,
    }

    return my;
}());

