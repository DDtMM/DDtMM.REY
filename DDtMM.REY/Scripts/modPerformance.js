var modPerformance = (function () {
    var $elem;

    var $messages;
    var $progressbar;
    var $resultsPanel;

    var showMsgTimeoutID;
    var trialIndex = 0;

    function init($parentElement) {
        var $testButton, $clearButton;

        $elem = $parentElement;
        $elem.append(
           $('<div class="panel" />').append([
               $('<div class="moduleMenu" />').append([
                   $testButton = $('<div class="button">Test</div>').on('click', runTest),
                   $clearButton = $('<div class="button">Clear</div>').on('click', clearResults),
                ]),
               $resultsPanel = $('<div class="fillHeight window"  />'),
               $progressbar = $('<div>').progressbar({ max: 1, value: 0 }),
               $messages = $('<div class="moduleMessage">Click Test to begin</div>')
           ])
        );
    }

    function runTest() {
        showMessage('Running...');
        trialIndex++;
        dg.bench.doneCallback = function (test, err) {
            if (err) {
                showMessage('Error: ' + err);
            } else {
                showMessage('Complete');
                
                $resultsPanel.append($('<div />').text('Trial ' + trialIndex + '. ' + test.result.mean.toFixed(2)));
            }
            $progressbar.progressbar('option', 'value', 0);
        };
        dg.bench.updateCallback = function (sampleResult) {
            $progressbar.progressbar('option', 'value', sampleResult.index / this.samples);
            showMessage('Running...' + sampleResult.index + ' out of ' + this.samples);
        };

        var reText = reyRegEx.reText;
        var reOptions = reyRegEx.reOptions;
        var testText = reyRegEx.getTargetEditor().getText();

        dg.bench.startTest({
            samples: 20,
            maxTime: 1000,
            delay: 100,
            maxSamplesExec: 10000,
            testFunc: function () {
                re = XRegExp(reText, reOptions);
                while ((match = re.exec(testText)) !== null) { ; }
            }
        });
    }
 
    function showMessage(msg) {
        clearTimeout(showMsgTimeoutID);
        $messages.text(msg);
        showMsgTimeoutID = setTimeout(function () { $messages.text(''); }, 10000);
    }


    function clearResults() {
        trialIndex = 0;
        $resultsPanel.empty();
    }

    function onValueChanged(event, data) {

    }


    function start() {

    }

    function stop() {
        // even though we're not visible, we're still going to be collecting history
    }

    var my = {
        name: 'Performance',
        id: 'modPerformance',
        init: init,
        start: start,
        stop: stop
    }

    return my;
}());

