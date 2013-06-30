var reyGroupInfo = (function () {

    // counts the number of groups in a regex
    function countReGroups(reText) {
        // assumes stripped of comments and whitespace
        /* find groups re
            \\{2}                       # escaped escaped
                  |\\\[|\\\]            # escaped sets
                  |(?:\[(?:\\{2}|\\\]|[^\]])*\])    # sets
                  |\\\)|\\\(            # escaped paren
                  |\\                   # escape ??
                  |\(\?(?::|\#|=|!)     # no matching group like structures
            |(\()                       # open paren means group
            */
        var countGroupsRe = /\\{2}|\\\[|\\\]|(?:\[(?:\\{2}|\\\]|[^\]])*\])|\\\)|\\\(|\\|\(\?(?::|=|!)|(\()/g,
            match,
            originalGroupCount = 0;

        while (match = countGroupsRe.exec(reText)) originalGroupCount++;

        return originalGroupCount;
    }

    // removes meta information From re
    function preGroupallStrip(reText, reOptions) {
        // remove inline comments
        reText = reText.replace(/\(\?#[^)]*\)/, '');

        // end of line comments and ignore whitespace are active.  Remove them
        if (/x/i.test(reOptions)) {
            // eat escaped slashes or escaped pounds, then anything matched in the group actually remove
            reText = reText.replace(/\\{2}|\\\#|(\#.*$)/gm, function (match, $1) {
                if ($1) {
                    return '';
                }
                return match;
            });
            // eat escaped escapes, replace escaped whitesapce with whitespace, and remove whitespace and newlines
            reText = reText.replace(/\\{2}|(\\ )|(\s+)/g, function (match, $1, $2) {
                if ($1) return ' '; // escaped space
                if ($2) return ''; // whitespace or newline gone
                return match;
            });
        }
        
        return reText;
    };


    // class that represents a group within a regex
    function GroupSection(props) {
        // capture index
        this.startIndex = props.start;
        this.token = (props.token) ? props.token : '';
        this.tokenEndIndex = (this.token) ? this.startIndex + this.token.length : -1;
        this.endToken = (props.endToken) ? props.endToken : '';
        this.groupId = (props.groupId === undefined) ? -1 : props.groupId;
        this.internalGroupId = -1;
        this.isCaptureGroup = (this.groupId > 0);
        this.isGroup = (this.token.length > 0);
        this.children = new Array();
        this.neverGroup = (props.neverGroup || false);
        this.canGroup = (this.neverGroup || this.isGroup);
        this.label = (this.token.substr(0, 3) == '(?<') ? this.token.substr(3, this.token.length - 4) : '';
        this.parent = null;
        this.endIndex = -1;

        if (props.parent) props.parent.add(this);
        if (props.endIndex !== undefined) {
            this.close(props.endIndex);
        }
    };

    GroupSection.prototype = {
        add: function (child) {
            child.parent = this;
            child.root = this.root;
            this.root._structuredChanged = true;
            return this.children.push(child);
        },
        // call when end index is found.  Removes itself if empty
        close: function (endIndex, endToken) {
            this.endIndex = endIndex;
            if (endToken) this.endToken = endToken;
            this.removeIfEmpty();
        },
		removeIfEmpty: function () {
			if (this.startIndex >= this.endIndex && this.parent) {
			    this.parent.children.splice(this.parent.children.indexOf(this), 1);
			    this.root._structuredChanged = true;
				return true;
			}
			return false;
		},
		removeEmpties: function () {
			var child;
			for (var i = this.children.length - 1; i >= 0; i--) {
				if (!(child = this.children[i]).removeIfEmpty()) child.removeEmpties();
			}
		},
		hasChildren: function () {
			return (this.children.length > 0);
		},
        // detects capture group within descendants
		descendantHasCaptureGroup: function () {
		    if (!this.root._structuredChanged && this._descHasCap !== undefined) return this._descHasCap;

		    var child;
		    for (var i = 1, il = this.children.length; i < il; i++) {
		        if ((child = this.children[i]).isCaptureGroup || child.descendantHasCaptureGroup())
		            return this._descHasCap = true;
		    }
		    return this._descHasCap = false;
		},
        // do descendants have same grouping, either all are grouped or none are
		descendantsAllGroupingMatched: function () {
		    if (!this.root._structuredChanged && this._descGroupMatch !== undefined) return this._descGroupMatch;

		    if (this.children.length == 0) return this._descGroupMatch = true;

		    var child;
		    var firstCaptures = this.children[0].isCaptureGroup;

			for (var i = 1, il = this.children.length; i < il; i++) {
			    if ((child = this.children[i]).isCaptureGroup != firstCaptures ||
                    child.descendantHasCaptureGroup() != firstCaptures) {

			        return this._descGroupMatch = false;
			    }
			}

			return this._descGroupMatch = true;
		},
		nextParentGroupId: function () {
			if (this.parent) {
				if (this.parent.groupId != -1) return this.parent.groupId;
				return this.parent.nextParentGroupId();
			}
			return -1;
		},
		// finds descendant by internal id.
		findDescendantByInternalId: function (inGrpId) {
			var child, found;
			for (var i = 0, il = this.children.length; i < il; i++) {
				child = this.children[i];
				if (child.internalGroupId == inGrpId) return child;
				else if (child.hasChildren() && (found = child.findDescendantByInternalId(inGrpId))) return found;
			}
			return null;
		},
		createRegEx: function (reText, _shared) {
		    if (!this.hasChildren()) {
				return reText.substring(this.startIndex, this.endIndex);
			}

		    var doGrouping = !this.descendantsAllGroupingMatched(),
				child,
				newReText = this.token,
				childText;

			if (!_shared) _shared = { counter: 1 };
			for (var i = 0, il = this.children.length; i < il; i++) {
			    child = this.children[i];

			    if ((doGrouping && !child.neverGroup) || child.isCaptureGroup)
			        child.internalGroupId = _shared.counter++;

				childText = child.createRegEx(reText, _shared);
				if (doGrouping && !child.neverGroup && !child.isCaptureGroup) {
					if (child.token == '(?:') {
						// turn non capturing group into capturing
					    //childText = '(?<__' + child.startIndex + '>' + childText.substring(3);
					    childText = '(' + childText.substring(3);
					}
					else {
					    // childText = '(?<__' + child.startIndex + '>' + childText + ')';
					    childText = '(' + childText + ')';
					}
				}
				newReText += childText;
			}

			if (this.isGroup) newReText += this.endToken;

			return newReText;
		},
		// creates an array corresponding to internal group ids
		createInternalMap: function (_inside) {
			var root = this, map = [], child;

			// move up to root
			if (!_inside) while (root.parent) root = root.parent;
			for (var i = 0, il = this.children.length; i < il; i++) {
				child = this.children;
				map.push(child);
				map = map.concat(child.createInternalMap(true));
			}

			return map;
		}
    }

    function RootSection(props) {
        GroupSection.apply(this, arguments);
        this.root = this;
        this._structuredChanged = false;
        this.groupedSections = [];
    }
    RootSection.prototype = new GroupSection({});

	// group the entire regular expression, putting ungroupe
	function groupAllRegex(reText, reOptions) {
	    // old re: didn't handle | => \\{2}|\\\(|\\\)|\\\[|\\\]|(\((?:\?(?::|<[^>]+>|!|=|\#))?|\)(?:[+*?]\??|\{\d+(?:,\d*)?\}\??)?|\[|\])
		var match,
            re = XRegExp(/\\{2}|\\\(|\\\)|\\\[|\\\]|\\\||(\||\((?:\?(?::|<[^>]+>|!|=|#))?|\)(?:[+*?]\??|\{\d+(?:,\d*)?\}\??)?|\[|\])/g),
            sections = [],
            stack = [],
            mode = 'normal',
            token,
            sectionRoot,
            sectionParent,
            sectionCur,
            groupCounter = 0,
            endIndex;
		;

		reText = preGroupallStrip(reText, reOptions);
		sectionParent = sectionRoot = new RootSection({ start: 0 });
		sectionCur = new GroupSection({ start: 0, parent: sectionRoot });

		while (match = re.exec(reText)) {

			if (token = match[1]) {
				if (mode == 'set') {
					if (token == ']') mode = 'normal';
				}
				else if (mode == 'inlineComment') {
				    if (token == ')') mode = 'normal';
				}
				else {
				    switch (token) {
				        case '[': mode = 'set'; break;
				        case '(?#': mode = 'inlineComment'; break;
				        case '|':
				            // or splits up section
				            endIndex = match.index + 1;
				            sectionCur.close(match.index);

				            sectionCur = new GroupSection({
				                start: match.index,
				                token: token,
				                neverGroup: true,
				                endIndex: endIndex,
				                parent: sectionParent
				            });
				            // new text group
				            sectionCur = new GroupSection({ start: endIndex, parent: sectionParent });

				            break;
				        default:
				            if (/^\)/.test(token)) {

				                // close (Quantifiers are included)
				                endIndex = match.index + token.length;
				                sectionCur.close(match.index);
				                sectionParent.close(endIndex, token);
				                // move up one
				                sectionParent = sectionParent.parent;
				                // new text group
				                sectionCur = new GroupSection({ start: endIndex, parent: sectionParent });

				            }
				            else {
				                sectionCur.close(match.index);

				                // create new parent section
				                sectionParent = new GroupSection({
				                    start: match.index,
				                    token: token,
				                    groupId: (!(/^\(\?(:|=|!)$/.test(token))) ? ++groupCounter : -1,
				                    parent: sectionParent
				                });

				                // create new text section
				                sectionCur = new GroupSection({
				                    start: sectionParent.tokenEndIndex,
				                    parent: sectionParent
				                });
				            }
				            break;
				    }
				}
			}

		}
		
		while (sectionCur) {
			sectionCur.close(reText.length);
			sectionCur = sectionCur.parent;
		}


		return sectionRoot;
	}

	
	var my = {
		countReGroups: countReGroups,
		groupAllRegex: groupAllRegex
	}

	return my;
	//function createGroupallRegex(reText, reOptions) {
	//	// I removed comment handling from below
	//	/*
	//    (?:\(\?\#[^)]*\)) #inline comment
	//    |(?:
	//      (?:\((?:\?(?:(:)|<[^>]+>|!|=|\#))|\()              
	//      # match group that have no parenthesis within
	//      (?:
	//      \\{2}                       # escaped escaped
	//      |\\\[|\\\]                   # escaped brackets
	//      |\[(?:\\{2}|\\\]|[^\]])*\]     # sets
	//      |\\\)|\\\(                   # escaped parens
	//      |[^()]                       # non parens
	//      )*
	//    \))
	//    |(?:\((?:\?(?:(:)|<[^>]+>|!|=|\#))|\()  # we don't want to group parens
	//    |(
	//    \\{2}                       # escaped escaped
	//      |\\\[|\\\]                   # escaped brackets
	//      |(?:\[(?:\\{2}|\\\]|[^\]])*\])    # sets
	//      |\\\)|\\\(
	//      |\\
	//      |[^()[\\]+
	//    )  
	//    */

	//	var findUngroupedRe = /(?:(?:\((?:\?(?:(:)|<[^>]+>|!|=))|\()(?:\\{2}|\\\[|\\\]|\[(?:\\{2}|\\\]|[^\]])*\]|\\\)|\\\(|[^()])*\))|(?:\((?:\?(?:(:)|<[^>]+>|!|=|\#))|\()|(\\{2}|\\\[|\\\]|(?:\[(?:\\{2}|\\\]|[^\]])*\])|\\\)|\\\(|\\|[^()[\\]+)/g;

	//	var groupsMadeCounter = 0,
	//        originalGroupCount = 0;

	//	reText = preGroupallStrip(reText, reOptions);

	//	reText = reText.replace(findUngroupedRe, function (match, $1, $2, $3, index) {
	//		// no capturing groups appear in two places we want them to be captured
	//		if ($1 || $2) return match.replace(/^\(\?:/, '(?<_$_$' + index + '>');
	//		if ($3) return '(?<_$_$' + index + '>' + $3 + ')'
	//		return match;
	//		groupsMadeCounter++;
	//	});

	//	return reText;
	//}
}());