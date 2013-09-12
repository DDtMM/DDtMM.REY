(function (window) {
    // create dg namespace
    if (!window.dg) {
        window.dg = {};
    }

    // Shim for high-resolution timing from timer.js
    window.performance = window.performance || {};
    performance.now = performance.now
      || performance.mozNow
      || performance.msNow
      || performance.oNow
      || performance.webkitNow
      || function () { return Date.now(); }


    // result of a test session
    var TestResult = function () {
        this.samples = [];
        this.mean = 0;
        this.median = 0;
        this.variance = 0;
        this.standardDeviation = 0;
    };

    (function () {
        function computeMedian(values) {
            var midIndex = values.length / 2;

            if (midIndex == Math.floor(midIndex)) {
                return values[midIndex];
            }
            return (values[Math.floor(midIndex)] + values[Math.ceil(midIndex)]) / 2
        };

        this.computeStatistics = function () {
            var sampleCount = this.samples.length;

            if (sampleCount > 0) {
                var averages,
                    avg,
                    total = 0,
                    sqrDevSum = 0,
                    // absolute deviations for MAD
                    medianAbsDevs = [],
                    mad,
                    zScores = [];
                
                averages = this.samples.map(function (s) { return s.avg; }).sort();

                // sum averages
                for (var i = 0, il = averages.length; i < il; i++) total += averages[i];

                this.mean = total / sampleCount;

                this.median = computeMedian(averages);

                if (sampleCount > 1) {
                    for (var i = 0, il = averages.length; i < il; i++) {
                        avg = averages[i];
                        sqrDevSum = Math.pow(avg - this.mean, 2);
                        medianAbsDevs.push(Math.abs(avg - this.median));
                    }

                    mad = medianAbsDevs;
                    this.variance = sqrDevSum / (sampleCount - 2);
                    this.stddev = Math.sqrt(this.variance);

                    for (var i = 0, il = averages.length; i < il; i++) {
                        zScores.push(.6745 * (averages[i] - this.median) / mad);
                    }

                }
            }


        }
    }).call(TestResult.prototype);

    // result of sampling
    var SampleResult = function (index, execs, time) {
        this.index = (index != null) ? index : -1;
        this.execs = execs || 0;
        this.time = time || 0;
        this.avg = (this.time) ? this.execs / this.time : 0;
    }

    // reprsents a test of a function
    var BenchTest = function (options) {
        if (!options.samples || options.samples < 1) options.samples = 30;
        if (!options.delay) options.delay = 50;
        if (!options.maxTime) options.maxTime = 1000.0;
        if (!options.maxSampleExec) options.maxSampleExec = 10000;
        if (!options.testFunc) throw ('testFunc required');
        if (!options.updateCallback) options.updateCallback = new Function();
        this.options = options;
        this.result = new TestResult(options.maxTime / options.samples);
        this._onComplete;
        this._onAbort;
    };

    (function () {
        // executes a sample
        // adds results to this.result
        // executes update call back
        // either sets next sample to run, or calls complete callback
        function runSample (sampleIndex, benchTest) {
            var
               // shorthand to this.options
                opts = benchTest.options,
                // time sample started
                startTime,
                // max sample time
                maxSampleTime = benchTest.options.maxTime / benchTest.options.samples,
                // max times a sample can be tried
                maxSampleExec = benchTest.options.maxSampleExec,
                // exeuction time for sample
                executionTime = 0,
                // times function executed
                executions = 0,
                // results of sample
                sampleResult;

            try {

                if (opts.setupFunc) opts.setupFunc();
 
                startTime = performance.now();

                while ((executionTime = performance.now() - startTime) < maxSampleTime && executions < maxSampleExec) {
                    opts.testFunc();
                    executions++;
                }

                sampleResult = new SampleResult(sampleIndex, executions, executionTime);
                benchTest.result.samples.push(sampleResult);

                opts.updateCallback(sampleResult);
 
                if (sampleIndex < opts.samples) {
                    setTimeout(runSample, opts.delay, sampleIndex + 1, benchTest);
                }
                else {
                    benchTest._onComplete(benchTest);
                }
            } catch (err) {
                benchTest._onAbort(benchTest, err);
            }
        }


        // begins test
        this.start = function () {
            this.options.updateCallback(new SampleResult());
            this.result = new TestResult(this.options.maxTime / this.options.samples);
            runSample(0, this);
        };

    }).call(BenchTest.prototype);

    dg.bench = (function () {
        var testQueue = [];
        var testInProgress = false;

        // creates a test from object literal
        function createTest(options) {
            if (!options.samples || options.samples < 1) options.samples = my.samples;
            if (!options.maxTime) options.maxTime = my.maxTime;
            if (!options.maxSampleExec) options.maxSampleExec = my.maxSampleExec;
            if (!options.delay) options.delay = my.delay;
            if (!options.updateCallback) options.updateCallback = my.updateCallback;

            return new BenchTest(options);
        }

        // start a test, can be a BenchTest or object literal
        // if a test is in progress then test is added to the queue
        function startTest(optsOrTest) {
            test = (!(optsOrTest instanceof BenchTest)) ? test = createTest(optsOrTest) : optsOrTest;

            if (!testInProgress) {
                testInProgress = true;
                test._onComplete = testComplete;
                test._onAbort = testAbort;
                test.start();
            }
            else {
                testQueue.push(test);
            }
        }

        // call user complete call back then done
        function testComplete(test) {
            test.result.computeStatistics();
            if (my.completeCallback) {
                my.completeCallback(test);
            }
            testDone(test);
        }

        // call user abort call back then done
        function testAbort(test, err) {
            if (my.abortCallback) {
                my.abortCallback(test, err);
            }
            testDone(test, err);
        }

        // called after complete or abort
        function testDone(test, err) {
            if (my.doneCallback) {
                my.doneCallback(test, err);
            }
            testInProgress = false;

            if (testQueue.length) {
                startTest(testQueue.shift());
            }
        }

        var my = {
            // default samples in a test
            samples: 30,
            // default total time, not including delay for a test
            maxTime: 1000.0,
            // default max executions in a sample
            maxSampleExec: 10000,
            // default delay between samples
            delay: 50,
            // default update callback
            updateCallback: null,
            // called when test complete
            completeCallback: null,
            // called when test aborted
            abortCallback: null,
            // called when test done
            doneCallback: null,
            // classes
            BenchTest: BenchTest,
            SampleResult: SampleResult,
            TestResult: TestResult,
            startTest: startTest
        };

        return my;
    }());
})(window);