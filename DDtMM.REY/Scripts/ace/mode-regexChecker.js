define('ace/mode/regexChecker', ['require', 'exports', 'module', 'ace/lib/oop', 'ace/mode/text', 'ace/tokenizer', 'ace/mode/regexChecker_highlight_rules', 'ace/mode/matching_brace_outdent', 'ace/mode/behaviour/cstyle', 'ace/mode/folding/cstyle'], function (require, exports, module) {


    var oop = require("../lib/oop");
    var TextMode = require("./text").Mode;
    var Tokenizer = require("../tokenizer").Tokenizer;
    var regexCheckerHighlightRules = require("./regexChecker_highlight_rules").regexCheckerHighlightRules;

    var Mode = function () {
        this.$tokenizer = new Tokenizer(new regexCheckerHighlightRules().getRules());
        this.reload = new function () {
            this.$tokenizer = new Tokenizer(new regexCheckerHighlightRules().getRules());
        }
    };
    oop.inherits(Mode, TextMode);

    (function () {

        this.lineCommentStart = "//";
        this.blockComment = { start: "/*", end: "*/" };

    }).call(Mode.prototype);

    exports.Mode = Mode;
});
define('ace/mode/regexChecker_highlight_rules', ['require', 'exports', 'module', 'ace/lib/oop', 'ace/mode/doc_comment_highlight_rules', 'ace/mode/text_highlight_rules'], function (require, exports, module) {

    var oop = require("../lib/oop");
    var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

    var regexCheckerHighlightRules = function () {
        var counter = 0;
 
        //re = new RegExp(re.source, re.options);
        this.$rules = {
            "start": [
                {
                    onMatch: function (value, currentState, stack) {
                        var tokens = value.split(this.splitRegex);
                        var output = new Array();
                        for (var i = 0; i < tokens.length; i++) {
                            if (tokens[i] != null && tokens[i].length > 0) {
                                //output.push({ type: 'c' + i, value: tokens[i] });
                                output.push({ next: 'confuse', type: 'c' + (counter++ % 7), value: tokens[i] });
                            }
                        }
                        //stack.push('start', output[output.length-1]);
                        return output;
                    },
                    regex: /[\s\S]*/
                }
            ],
            "confuse": [
                {
                    onMatch: function (value, currentState, stack) {
                        var tokens = value.split(this.splitRegex);
                        var output = new Array();
                        for (var i = 0; i < tokens.length; i++) {
                            if (tokens[i] != null && tokens[i].length > 0) {
                                //output.push({ type: 'c' + i, value: tokens[i] });
                                output.push({ next: 'start', type: 'c' + (counter++ % 7), value: tokens[i] });
                            }
                        }
                        //stack.push('start', output[output.length-1]);
                        return output;
                    },
                    regex: /[\s\S]*/
                }
            ]
        };

        this.normalizeRules();
    };

    oop.inherits(regexCheckerHighlightRules, TextHighlightRules);

    exports.regexCheckerHighlightRules = regexCheckerHighlightRules;
});

