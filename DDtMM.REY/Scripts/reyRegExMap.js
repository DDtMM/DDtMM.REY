function captureInfo(text, captureIndex, captureName, parent, distanceFromLastMatch) {
    // capture index
    this.captureIndex = captureIndex || 0;
    this.captureName = captureName || this.captureIndex;
    this.text = text;
    // parent match
    this.parent;
    this.children = new Array();
    // index in parent string
    this.startIndex;
    this.startLine;
    this.endIndex;
    this.endLine;
    // start index with the match;
    this.captureStartIndex;
    this.captureEndIndex;

    this.startLineCol;
    this.endLineCol;

    if (parent != null) {
        this.link(parent, distanceFromLastMatch);
    }
};

captureInfo.prototype = {
    link: function (parent, distanceFromLastMatch) {
        var textLength = this.text.length;
        this.captureStartIndex = distanceFromLastMatch + parent.lastGroupEndIndex();
        this.captureEndIndex = this.captureStartIndex + textLength;
        this.startIndex = parent.startIndex + this.captureStartIndex;
        this.endIndex = this.startIndex + textLength;
        this.parent = parent;
        parent.children.push(this);
        this.setLineIndices();
        return this;
    },

    lastGroupEndIndex: function () {
        var len = this.children.length;
        return (len > 0) ? this.children[len - 1].captureEndIndex : 0;
    },

    lastEndIndex: function () {
        var len = this.children.length;
        return (len > 0) ? this.children[len - 1].endIndex : 0;
    },

    unMatchedText: function () {
        return this.text.substr(this.lastGroupEndIndex());
    },

    setLineIndices: function (rowColFinder) {
        var parentStartLine, parentEndLine, rowCol;
        if (this.parent != null) {
            parentStartLine = this.parent.startLine;
            parentEndLine = this.parent.endLine;
        } else {
            parentStartLine = 0;
            parentEndLine = rexRegExMap._rowColFinder.maxIndex;
        }
        rowCol = rexRegExMap._rowColFinder.findRowCol(this.startIndex, parentStartLine, parentEndLine);
        this.startLine = rowCol.row;
        this.startLineCol = rowCol.col;
        rowCol = rexRegExMap._rowColFinder.findRowCol(this.endIndex, parentStartLine, parentEndLine);
        this.endLine = rowCol.row;
        this.endLineCol = rowCol.col;
    },

    equals: function (other) {
        if (other == null) return false;

        var hasParent = (this.parent == null);
        var childrenLength = this.children.length;
        if ((hasParent) != (other.parent == null)) return false;

        if (
            childrenLength != other.children.length ||
            this.startIndex != other.startIndex ||
            this.startLine != this.startLine ||
            this.endIndex != this.endIndex ||
            this.endLine != this.endLine ||
            this.startLineCol != this.startLineCol ||
            this.endLineCol != this.startLineCol ||
            this.children.length != other.children.length) return false;


        for (var i = 0; i < childrenLength; i++) {
            if (!this.children[i].equals(other.children[i])) return false;
        }

        return true;
    },

};



var rexRegExMap = (function () {

    // sets this.map with a list of all matches broken down into a tree of a captures.
    // returns true if an update occurs.
    function updateMap(allText, re) {
        my.trigger('beginupdate');
        if (re == null) {
            if (!equals([])) {
                my.map = [];
                my.trigger('updated');
            }
            my.trigger('endupdate');
            return false;
        }
        
        var match;
        var matchMap = new Array();

        var capturesLength;
        var i;
        var rootCapture;
        var currentCapture;
        var text;
        var indexOf;
        var matchCounter = 0;
        var captureLabels = [];

        my._rowColFinder = new textRowColFinder(allText);

        // speed things up by putting capture labels into an array
        if (re.xregexp.captureNames != null) {
            for (var i = 0, il = re.xregexp.captureNames.length; i < il; i++) {
                captureLabels.push((re.xregexp.captureNames[i] || i));
            }
        }

        // if not global - only get one match
        if (!re.global) matchCounter = my.maxMatches - 1;

        while ((match = re.exec(allText)) !== null && (my.maxMatches > matchCounter++)) {
            capturesLength = match.length;
 
            rootCapture = new captureInfo(match[0]);
            rootCapture.startIndex = rootCapture.matchStartIndex = match.index;
            rootCapture.endIndex = rootCapture.matchEndIndex = match.index + match[0].length;
            rootCapture.setLineIndices();
            currentCapture = rootCapture;

            for (var i = 1; i < capturesLength; i++) {
                text = match[i];
                if (text !== undefined) {
                    while (currentCapture != null) {
                        if ((indexOf = currentCapture.unMatchedText().indexOf(text)) >= 0) {
                            currentCapture = new captureInfo(text, i, captureLabels[i - 1], currentCapture, indexOf);
                            break;
                        } else {
                            currentCapture = currentCapture.parent;
                        }
                    }
                }
            }

            // increment last index if we matched an empty string (like a word boundary).
            if (rootCapture.text.length == 0) {
                re.lastIndex = re.lastIndex + 1;
            }
            
            // clean remaining text.
            //while (currentCapture != null) {
            //    currentCapture = currentCapture.parent;
            //}

            matchMap.push(rootCapture);
        }
 
        if (!equals(matchMap)) {
            my.map = matchMap;
            my.trigger('updated');
            return true;
        }
        my.trigger('endupdate');

        return false;

    };


    // tests if two match map arrays are equal
    function equals(newMap) {
        var map = my.map;

        if (newMap == null || map == null) return false;

        var mapLength = map.length;
        if (newMap.length != mapLength) return false;

        for (var i = 0; i < mapLength; i++) {
            if (!map[i].equals(newMap[i])) return false;
        }

        return true;
    };

    function getMatchesInRange (startLine, endLine) {

        if (my.map == null) return new Array();
 
        var startIndex = -1, endIndex = -1, maxIndex = my.map.length - 1, i;

        for (i = 0; i <= maxIndex; i++) {
            if (my.map[i].endLine >= startLine) {
                startIndex = i;
                break;
            }
        }

        if (startIndex == -1) return new Array();

        for (i = maxIndex; i >= startIndex; i--) {
            if (my.map[i].startLine <= endLine) {
                endIndex = i;
                break;
            }
        }

        if (endIndex == -1) return new Array();

        return my.map.slice(startIndex, endIndex + 1);
    };

    function flattenMatches (mapArray) {
        var flatMap = new Array();
        var match;
        for (var i in mapArray) {
            flatMap.push(match = mapArray[i]);
            flattenMatchesSub(match, flatMap);
        }
        return flatMap;
    };

    function flattenMatchesSub (parentMatch, flatMap) {
        var child;
        for (var i in parentMatch.children) {
            flatMap.push(child = parentMatch.children[i]);
            flattenMatchesSub(child, flatMap);
        }
    };

    var my = {
        maxMatches: 10000,
        map: null,
        getMatchesInRange: getMatchesInRange,
        updateMap: updateMap,
        flattenMatches: flattenMatches,
        on: function (event, callback) { eventManager.subscribe(my, event, callback); },
        trigger: function (event) { eventManager.trigger(my, event); },
        toString: function() { return 'rexRegExMap'; }
    };

    return my;

}());