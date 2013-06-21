var regexParser = (function () {
    var reBreakup = /(\\*?)([\|\(|\)\[\]])/g;

    var parserNode = function (rule, parent) {
        this.parent = parent;
        this.rule = rule;
        this.children = new Array();
        this.captureGroup = 0;
        this.captureGroupName = '';
        this.text = '';

        if (parent) {
            parent.add(this);
        }
    };

    (function () {
        this.lastChild = function () {
            var childrenLength = this.children.length;
            return (childrenLength > 0) ? this.children[--childrenLength] : null;
        }

        // remove a child and set its parent to null
        this.remove = function (node) {
            var nodeIndex;
            if ((nodeIndex = this.children.indexOf(node)) >= 0) {
                this.children.splice(nodeIndex, 1);
                node.parent = null;
            }
        }

        // takes children from parent
        this.takeChildren = function (oldParent) {
            for (var i in oldParent.children) {
                this.add(oldParent.children[i]);
            }
            oldParent.children = [];
        }

        // add a child and set its parent
        this.add = function (node) {
            node.parent = this;
            this.children.push(node);
        }

        this.addRule = function (rule) {
            return new parserNode(rule, this);
        }

        this.findCaptureGroupByID = function (groupID) {
            if (this.captureGroup == groupID) return this;

            var found;
            for (var i = 0, il = this.children.length; i < il; i++) {
                if (found = this.children[i].findCaptureGroupByID(groupID)) return found;
            }
        }

        this.findCaptureGroupByName = function (groupName) {
            if (this.captureGroupName == groupName) return this;

            var found;
            for (var i = 0, il = this.children.length; i < il; i++) {
                if (found = this.children[i].findCaptureGroupByName(groupName)) return found;
            }
        }
    }).call(parserNode.prototype);



    function tokenInfo(text, index, position, previousToken, rule) {
        this.text = text;
        this.rule = rule;
        this.index = index;
        this.row = position.row;
        this.col = position.col;
        this.nextToken = null;
        this.prevToken = previousToken;
        this.modeEndToken = null;
        this.modeStartToken = null;
    }

    // tokenizes a regex
    // options can be standard RegExp options plus XRegExp options. X turns on standard XRegExp stuff
    function tokenize(text, options) {
        if (text == null) return [];
        regexSyntax.updateModeOptions(options);
 
        var counter = 0;
        var tokens = new Array();
        var groupStack = [];
        var modeStack = [];
        var modeInfoAtStart;
        var modeInfo = startMode('normal', new tokenInfo('_START_', -1, { row: -1, col: -1 }, null, regexSyntax.startRule),
            modeStack);
        var token;
        var lastToken;
        var match;
 
        var textFinder = new TextRowColFinder(text);

        var result = {
            tokens: [],
            warnings: [],
            errors: [],
            rows: {}
        };
        while ((match = modeInfo.re.exec(text)) !== null) {
            if (counter++ >= this.maxTokens) break;
            lastToken = modeInfo.lastToken;

            token = new tokenInfo(match[0], match.index, textFinder.findRowCol(match.index), lastToken);

            token.rule = modeInfo.mode.getRuleFromCaptures(match, 1);
            modeInfoAtStart = modeInfo;
 
            switch (token.rule.namespace) {
                case 'Literal':
                    if (lastToken != null && lastToken.rule.namespace.match('Literal') && lastToken.text.indexOf('\n') == -1) {
                        lastToken.text += token.text;
                        continue;
                    }
                    break;
                case 'Mode':
                case 'BadChars':
                    switch (token.text.substr(0,1)) {
                        case '(':
                            modeInfo = startMode('normal', token, modeStack);
                            groupStack.push(token);
                            break;
                        case ')':
                            if (groupStack.length == 0) {
                                result.errors.push({ message: 'badclosegroup', token: token });

                            } else {
                                groupStack.pop();
                                modeInfo.startToken.modeEndToken = token;
                                token.modeStartToken = modeInfo.startToken;
                                modeInfo = endMode(modeStack);
                            }
                            if (token.index != 0 && tokens[tokens.length - 1] == '|') {
                                result.warnings.push({ message: 'oremptyend', token: token });
                            }
                            break;
                        case '[':
                            modeInfo = startMode('set', token, modeStack);
                            break;
                        case ']':
                            modeInfo.startToken.modeEndToken = token;
                            token.modeStartToken = modeInfo.startToken;
                            modeInfo = endMode(modeStack);
                            break;
                        case '\\':
                            result.warnings.push({ message: 'badescape', token: token });
                            break;
                        case '|':
                            if (token.index == 0 || tokens[tokens.length - 1].text == '(') {
                                result.warnings.push({ message: 'oremptystart', token: token });
                            } else if (text.length - 1 == token.index) {
                                result.warnings.push({ message: 'oremptyend', token: token });
                            }
                            break;
                    }
                    break;
            }

            tokens.push(token);
            lastToken.nextToken = token;
            modeInfo.lastToken = token;

            // we need to keep track what rows tokens appear in for highlighting later
            if (result.rows[token.row] == null) result.rows[token.row] = [token];
            else result.rows[token.row].push(token);
        }

        if (modeInfo.name.match('set')) {
            var lastSetIndex = findLastIndexOfRule(tokens, '\\[', 'Mode')
            result.errors.push({ token: tokens[lastSetIndex], message: 'unfinishedset' });
        }

        if (groupStack.length > 0) {
            for (var i in groupStack) {
                result.errors.push({ token: groupStack[i], message: 'unfinishedgroup' });
            };
        }

        result.tokens = tokens;
 
        return result;
    };

 

    function findLastIndexOfRule(tokens, key, namespace) {
        for (var i = tokens.length - 1; i >= 0; i--) {
            if ((tokens[i].rule.regEx == key) && (tokens[i].rule.namespace == namespace)) {
                return i;
                break;
            }
        }
        return -1;
    };

    function endMode(modeStack) {
        var oldMode = modeStack.pop();
        var returnMode = modeStack[modeStack.length - 1];
        returnMode.re.lastIndex = oldMode.re.lastIndex;
        return returnMode;
    };

    function startMode(newModeName, startToken, modeStack) {
        var mode = regexSyntax.modes[newModeName];

        var newModeInfo = {
            name: newModeName,
            mode: mode,
            re: new RegExp(mode.rulesRe.source, 'gm'),
            lastToken: startToken,
            startToken: startToken
        }
        
        if (modeStack[modeStack.length - 1] != null) {
            newModeInfo.re.lastIndex = modeStack[modeStack.length - 1].re.lastIndex;
        }

        modeStack.push(newModeInfo);

        return newModeInfo;
    };

    // returns expression tree
	function parse(tokenizeResult) {
	    if (!tokenizeResult || tokenizeResult.errors.length) {
	        return new parserNode();
	    }

	    var regEx,
	        text,
	        root = new parserNode('root'),
	        parentNode = root,
	        newNode,
	        token,
	        captureGroupIndex = 0,
	        tempNode,
            tempRule;

	    root.errors = [];

	    for (var i in tokenizeResult.tokens) {
	        token = tokenizeResult.tokens[i];

	        switch (token.rule.namespace) {
	            case 'Quantifiers':
	                if ((tempNode = parentNode.lastChild()) != null) {
	                    if (!tempNode.rule.quantifiable) {
	                        root.errors.push({ error: 'badquantifier', token: token });
	                    }
	                } else {
	                    root.errors.push({ error: 'badquantifier', token: token });
	                }

	                parentNode.addRule(token.rule);
	                break;
	            case 'Mode':
	                switch (token.rule.regEx.substr(0, 2)) {
	                    case '\\[':
	                        parentNode = new parserNode(token.rule, parentNode);
	                        break;
	                    case '\\(':
	                        parentNode = new parserNode(token.rule, parentNode);
	                        if (token.rule.regEx == '\\(') {
	                            parentNode.captureGroup = ++captureGroupIndex;
	                        } else if (token.rule.regEx == '\\(\\?<([^>]*)>') {
	                            parentNode.captureGroup = ++captureGroupIndex;
	                            parentNode.captureGroupName = token.text.substr(3, token.text.length - 4);
	                        }
                            break;
	                    case '\\]':
	                        parentNode = parentNode.parent;
	                        break;
	                    case '\\)':
	                        // scope up to parent.  If in OR, keep looking for Parenthesis match.
	                        while (parentNode.rule.regEx.substr(0, 2) != '\\(') {
	                            parentNode = parentNode.parent;
	                        }
	                        parentNode = parentNode.parent;
	                        break;
	                    case '\\|':
	                        if (parentNode.rule.regEx != '\\|') {
                                // add start OR node and take rules up to this point
	                            newNode = new parserNode(token.rule);
	                            newNode.takeChildren(parentNode);
	                            parentNode.add(newNode);
	                            parentNode = newNode;
	                        }
	                        // parent is an OR node with matches, we will start a new OR node to take future 
                            // matches.
	                        parentNode = new parserNode(token.rule, parentNode.parent);
	                        break;
	                }
	                break;
                case 'Classes':
	            case 'Special_Characters':
	            case 'Escaped_Reserved':
	            case 'Escaped_Reserved_Optional':
	            case 'Boundaries':
	            case 'Back_References':
	                parentNode.addRule(token.rule);
	                break;
	            case 'Literal':
	                parentNode.addRule(token.rule).text = token.text;
	                break;

	        };

	    };

	    return root;
	};

	var my = {
        maxTokens: 100000,
	    tokenize: tokenize,
	    parse: parse
	};

	return my;
}());

var regexSyntax = (function () {
    var octalText = function (text, c1) {
        return 'Octal ' + c1 + ': &#' + c1 ;
    };

    var hexText = function (text, c1) {
        return 'Hexadecimal ' + c1 + ': &#' + parseInt(c1, 16) ;
    };

    var unicodeText = function (text, c1) {
        return 'Unicode ' + c1 + ': &#' + parseInt(c1, 16) ;
    };

    var controlCharText = function (text, c1) {
        var chars = ['NUL', 'SOH', 'STX', 'ETX', 'EOT', 'ENQ', 'ACK', 'BEL', 'BS', 'HT', 'LF', 'VT', 'FF', 'CR',
            'SO', 'SI', 'DLE', 'DC1', 'DC2', 'DC3', 'DC4', 'NAK', 'SYN', 'ETB', 'CAN', 'EM', 'SUB'];

        return 'Control Char ' + c1 + ': ' + chars[c1.charCodeAt(0) - 64] ;
    };

    var escSpecialChars = [
        ['\\\\ ', '\\ ', 'space', 0, true, 'x'],
        ['\\\\n', '\\n', 'new line', 0, true],
        ['\\\\f', '\\f', 'form feed', 0, true],
        ['\\\\r', '\\r', 'carriage return', 0, true],
        ['\\\\t', '\\t', 'tab ', 0, true],
        ['\\\\v', '\\v', 'vertical tab', 0, true],
        ['\\\\c([A-Z])', '\\cA-Z::\\cJ', controlCharText, 1, true],
        ['\\\\0(?!\\d)', '\\0', 'NUL character', 0, true],
        //['\\\\(12[0-7]|1[0-1][0-7]|0[0-7]{1,2}|[0-7]{1,2})', '\\[0-127]::\\126', octalText, 1, true],
        ['\\\\x(\[0-9A-Fa-f]{2})', '\\x[00-FF]::\\xFF', hexText, 1, true],
        ['\\\\u(\[0-9A-Fa-f]{4})', '\\u[0000-FFFF]::\\u0223', unicodeText, 1, true]
    ];
    createNamespace(escSpecialChars, 'Special_Characters');

    var escReserved = [
        ['\\\\\\\\', '\\\\', '\\', 0, true],
        ['\\\\\\^', '\\^', '^', 0, true],
        ['\\\\\\$', '\\$', '$', 0, true],
        ['\\\\\\.', '\\.', '.', 0, true],
        ['\\\\\\|', '\\|', '|', 0, true],
        ['\\\\\\?', '\\?', '?', 0, true],
        ['\\\\\\*', '\\*', '*', 0, true],
        ['\\\\\\+', '\\+', '+', 0, true],
        ['\\\\\\(', '\\(', '(', 0, true],
        ['\\\\\\)', '\\)', ')', 0, true],
        ['\\\\\\{', '\\{', '{', 0, true],
        ['\\\\\\}', '\\}', '}', 0, true],
        ['\\\\\\[', '\\[', '[', 0, true],
        ['\\\\\\]', '\\]', ']', 0, true],
        ['\\\\\\#', '\\#', '#', 0, true, 'x']
    ];
    createNamespace(escReserved, 'Escaped_Reserved');

    var setReserved = [
        ['\\\\\\\\', '\\\\', '\\', 0, true],
        ['\\\\\\^', '\\^', '^', 0, true],
        ['\\\\\\-', '\\-', '-', 0, true],
        ['\\\\\\]', '\\]', ']', 0, true]
    ];
    createNamespace(setReserved, 'Escaped_Reserved');

    var setReservedOptional = [
        ['\\\\\\$', '\\$', '$', 0, true],
        ['\\\\\\.', '\\.', '.', 0, true],
        ['\\\\\\|', '\\|', '|', 0, true],
        ['\\\\\\?', '\\?', '?', 0, true],
        ['\\\\\\*', '\\*', '*', 0, true],
        ['\\\\\\+', '\\+', '+', 0, true],
        ['\\\\\\(', '\\(', '(', 0, true],
        ['\\\\\\)', '\\)', ')', 0, true],
        ['\\\\\\{', '\\{', '{', 0, true],
        ['\\\\\\}', '\\}', '}', 0, true],
        ['\\\\\\[', '\\[', '[', 0, true],
        ['\\\\\\#', '\\#', '#', 0, true, 'x']
    ];
    createNamespace(setReservedOptional, 'Escaped_Reserved_Optional');

    var escCharacterClasses = [
        ['\\\\w', '\\w', 'word', 0, true],
        ['\\\\W', '\\W', 'non-word', 0, true],
        ['\\\\d', '\\d', 'digit', 0, true],
        ['\\\\D', '\\D', 'non-digit', 0, true],
        ['\\\\s', '\\s', 'whitespace', 0, true],
        ['\\\\S', '\\S', 'non-whitespace', 0, true]
    ];
    createNamespace(escCharacterClasses, 'Classes');

    var escBackReferences = [
        ['\\\\([1-9]\\d*)', '\\1', 'back-reference to group #$1', 1, true],
        ['\\\\k<(.*?)>', '\\k<X>', 'back-reference to group "$1"', 1, true]
    ];
    createNamespace(escBackReferences, 'Back_References');

    var escBoundaries = [
        ['\\\\b',  '\\b', 'word boundary', 0, false],
        ['\\\\B',  '\\B', 'not word boundary', 0, false]
    ];
    createNamespace(escBoundaries, 'Boundaries');

    var anchors = [
        ['\\^',  '^', 'start of the string', 0, false, '^[^m]+$'],
        ['\\^',  '^', 'start of the string or line', 0, false, 'm'],
        ['\\$',  '$', 'end of string', 0, false, '^[^m]+$'],
        ['\\$',  '$', 'end of the string or line', 0, false, 'm'],

    ];
    createNamespace(anchors, 'Line_Anchors');
 
    var characterClasses = [
         ['\\.', '.', 'any character', 0, true, 's'],
         ['\\.', '.', 'any character but newline or carriage return', 0, true, '^[^s]+$']
    ];
    createNamespace(characterClasses, 'Classes');

    var quantifiers = [
        ['\\+\\?', '+?', 'one or more (lazy)', 0, false],
        ['\\+', '+ ', 'one or more', 0, false],
        ['\\*\\?', '*?', 'zero or more (lazy)', 0, false],
        ['\\*', '* ', 'zero or more', 0, false],
        ['\\?\\?', '??', 'zero or one (lazy)', 0, false],
        ['\\?', '?', 'zero or one', 0, false],
        ['{(.+?)}', '{X} ', '$1 instances', 1, false],
        ['{(.+?),(.+?)}', '{X,Y} ', 'between $1 and $2', 2, false],
        ['{(.+?),}\\?', '{X,}?', 'at least $1 (lazy)', 1, false],
        ['{(.+?),}', '{X,}', 'at least $1', 1, false]
        
    ];
    createNamespace(quantifiers, 'Quantifiers');

    var setClasses = [
        ['(.)-(.)', 'A-B', 'from $1 to $2', 2, true]
    ];
    createNamespace(setClasses, 'Classes');

    var escSetSpecialChars = [
        ['\\\\b', '\\b', 'backspace character', 0, true],
    ];
    createNamespace(escSetSpecialChars, 'Special_Characters');

    var normalMode = [
        ['\\(\\?:', '(?:', 'noncapturing group', 0, true],
        ['\\(\\?<([^>]*)>', '(?<n>', 'named capture group "$1"', 1, true],
        ['\\(\\?=', '(?=', 'look ahead', 0, false],
        ['\\(\\?!', '(?!', 'negated look ahead', 0, false],
        ['\\(', '(', 'group', 0, true],
        ['\\)', ')', 'end group', 0, true],
        ['\\|', '|', 'or', 0, false],
        ['\\[\\^', '[^', 'negated set', 0, true],
        ['\\[', '[', 'set', 0, true]
    ]
    createNamespace(normalMode, 'Mode');

    var setMode = [
        ['\\]', ']', 'end set', 0, true]
    ];
    createNamespace(setMode, 'Mode');

    var badChars = [
        ['\\\\', '\\', 'unmatched escape', 0, true]
    ]
    createNamespace(badChars, 'Bad_Characters');

    var literal = [
        ['[\\s\\S]', 'literal', '"$1"', 0, true]
    ];
    createNamespace(literal, 'Literal');

    var comments = [
        ['\\(\\?#([^\\)]*)\\)', '(?#n)', 'inline comment: $1', 1, false],
        ['#(.*)$', '#n', 'endline comment: $1', 1, false, 'x']
    ];
    createNamespace(comments, 'Comments');

    var ignored = [
        ['\\s', ' ', 'whitespace', 0, false, 'x']
    ];
    createNamespace(ignored, 'Ignored');

    // turns array of tokens into object and adds namespace.
    function createNamespace(rulesArray, namespaceName) {
        for (var i in rulesArray) {
            rulesArray[i] = createRuleFromParameterArray(rulesArray[i], namespaceName);
        }
    };

    function createRuleFromParameterArray(parameters, namespaceName) {
        var usageArray = parameters[1].split('::');
        return {
            regEx: parameters[0],
            usage: usageArray[0],
            sampleData: usageArray[1],
            text: parameters[2],
            capturedCount: parameters[3],
            quantifiable: parameters[4],
            optionsMatch: parameters[5],
            namespace: namespaceName,
            createActiveDescription: function (sampleData) {
                if (sampleData == null) sampleData = ((this.sampleData == null) ? this.usage : this.sampleData);
                return sampleData.replace(new RegExp(this.regEx, 'g'), this.text).replace('<', '&lt;').replace('>', '&gt;');
            },
        };
    };

    // creates a mode from set of rules.
    function createMode(rulesArray) {

        var mode = {
            rules: rulesArray,
            rulesRe: null,
            findIndex: {},
            activeRules: [],

            // gets the index of the found capture from the capture array
            getgroupIndex: function (captureArray, startIndex) {
                startIndex = (startIndex || 0);

                for (var i = startIndex, il = captureArray.length; i < il; i++) {
                    if (captureArray[i] != null) return (i - startIndex);
                }
                return -1;
            },

            // uses findIndex to find rule based on captures result.
            getRuleFromCaptures: function (captureArray, startIndex, useFindIndex) {
                if (useFindIndex || useFindIndex == null) {
                    return this.findIndex[this.getgroupIndex(captureArray, startIndex)];
                } else {
                    return getRuleFromMatch(captureArray[this.getgroupIndex(captureArray, startIndex)]);
                }
            },

            // gets the rule from the matched text.  slower than using find index. 
            getRuleFromMatch: function (text) {
                var match;

                if ((match = new RegExp(this.rulesRe.source, 'gm').exec(text)) != null) {
                    return this.findIndex[this.getgroupIndex(match, 1)];
                }

            },
            // creates the re, based on options
            updateRe: function (options) {
                this.findIndex = {};
                this.activeRules = [];

                var regex = '';
                var rule;

                var captureOffset = 0;
                var arrayLength = rulesArray.length;

                for (var i = 0, il = rulesArray.length; i < il; i++) {
                    rule = rulesArray[i];

                    if (rule.optionsMatch == null || options == null || options.match(rule.optionsMatch)) {
                        regex += '(' + rule.regEx + ')|';
                        this.activeRules.push(rule);
                        this.findIndex[i + captureOffset] = rule;
                        captureOffset += rule.capturedCount;
                    } else {
                        // skip rule
                        captureOffset--;
                    }
                }

                this.rulesRe = RegExp(regex.substr(0, regex.length - 1), 'gm');
            },

            clone: function () {
                return createMode(this.rules);
            }
        };
        mode.updateRe('');
        return mode;
    };

    var my = {};

    my.startRule = createRuleFromParameterArray(['$', 'start', 'start', 0, false], 'Internal');

    my.updateModeOptions = function(options) {
        for (var i in my.modes) {
            my.modes[i].updateRe(options);
        }
    };

    my.modes = {};

    my.modes.set = createMode([].concat(
        setClasses,
        escCharacterClasses,
        escSetSpecialChars,
        escSpecialChars,
        setReserved,
        setReservedOptional,
        setMode,
        badChars,
        literal));

    my.modes.normal = createMode([].concat(
        ignored,
        comments,
        escBoundaries,
        characterClasses,
        escCharacterClasses,
        escSpecialChars,
        escReserved,
        escBackReferences,
        normalMode,
        anchors,
        quantifiers,
        badChars,
        literal));

    my.modes.allRules = createMode([].concat(
        ignored,
        comments,
        escBoundaries,
        escCharacterClasses,
        escSpecialChars,
        escReserved,
        setReserved,
        setReservedOptional,
        setClasses,
        setMode,
        normalMode,
        anchors,
        characterClasses,
        quantifiers,
        badChars,
        literal));

    return my;
}());