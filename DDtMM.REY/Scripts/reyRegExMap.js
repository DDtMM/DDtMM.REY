function captureInfo(text, groupIndex, groupName, parent, distanceFromLastMatch) {
    // capture index
    this.groupIndex = groupIndex || 0;
    this.groupName = groupName || this.groupIndex;
    this.internalGroupIndex = -1;
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
    link: function (parent, startIndex) {
        var textLength = this.text.length;
        this.captureStartIndex = startIndex;
        this.captureEndIndex = this.captureStartIndex + textLength;
        this.startIndex = parent.startIndex + this.captureStartIndex;
        this.endIndex = this.startIndex + textLength;
        this.parent = parent;
        // since captures are being added in reverse, add to beginning of array.
        parent.children.splice(0, 0, this);
        this.setLineIndices();
        return this;
    },

    firstGroupStartIndex: function () {
        return (this.children.length) ? this.children[0].captureStartIndex : this.text.length;
    },

    unMatchedTextFromEnd: function () {
        return this.text.substr(0, this.firstGroupStartIndex());
    },

    findByInternalGroupId: function (internalId) {
        var child;
        for (var i = 0, il = this.children.length; i < il; i++) {
            if ((child = this.children[i]).internalGroupIndex == internalId) return child;
            else if (child = child.findByInternalGroupId(internalId)) return child;
        }
    },
    setLineIndices: function (rowColFinder) {
        var parentStartLine, parentEndLine, rowCol;
        if (this.parent != null) {
            parentStartLine = this.parent.startLine;
            parentEndLine = this.parent.endLine;
        } else {
            parentStartLine = 0;
            parentEndLine = reyRegExMap._rowColFinder.maxIndex;
        }
        rowCol = reyRegExMap._rowColFinder.findRowCol(this.startIndex, parentStartLine, parentEndLine);
        this.startLine = rowCol.row;
        this.startLineCol = rowCol.col;
        rowCol = reyRegExMap._rowColFinder.findRowCol(this.endIndex, parentStartLine, parentEndLine);
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



var reyRegExMap = (function () {

    // sets this.map with a list of all matches broken down into a tree of a captures.
    // returns true if an update occurs.
    function updateMap(allText, reText, reOptions) {
        my.trigger('beginupdate');
        if (!reText) {
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
        //var currentCapture;
        var parentGroupInfo;
        var text;
        var indexOf;
        var matchCounter = 0;
        var groupInfo;
        var parentGroup;
        var re;
        my._rowColFinder = new TextRowColFinder(allText);



   
        //reText = createGroupallRegex(reText, reOptions);
        var reGroupInfo = reyGroupInfo.groupAllRegex(reText, reOptions);
        
        reText = reGroupInfo.createRegEx(reText);

        re = XRegExp(reText, reOptions);
        

        // if not global - only get one match
        if (!re.global) matchCounter = my.maxMatches - 1;

        while ((match = re.exec(allText)) !== null && (my.maxMatches > matchCounter++)) {
            capturesLength = match.length;
            rootCapture = new captureInfo(match[0]);
            rootCapture.startIndex = rootCapture.matchStartIndex = match.index;
            rootCapture.endIndex = rootCapture.matchEndIndex = match.index + match[0].length;
            rootCapture.setLineIndices();

            addCaptures(match, reGroupInfo, rootCapture);

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

    // adds captures, going in reverse order for instances like (.)* 
    function addCaptures(match, parentGroupInfo, parentCapture) {
        var groupInfo, indexOf, currentCapture;
        for (var i = parentGroupInfo.children.length - 1; i >= 0; i--) {
            groupInfo = parentGroupInfo.children[i];
            text = match[groupInfo.internalGroupId];
            if (text) {
                indexOf = parentCapture.unMatchedTextFromEnd().lastIndexOf(text);
                currentCapture = new captureInfo(text, groupInfo.groupId, groupInfo.label, parentCapture, indexOf);
                currentCapture.internalGroupIndex = i;
                addCaptures(match, groupInfo, currentCapture);
            }
        }
    }

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
        toString: function() { return 'reyRegExMap'; }
    };

    return my;

}());