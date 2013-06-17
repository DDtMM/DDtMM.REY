/***
By: Daniel Gimenez
License: Freeware
Description:
Useful for text editors, keeps track of line breaks in a string, by searching for newline chars.
NOTE: We're going for speed here, so there are few checks for valid input
***/
var TextRowColFinder = function (text) {
    var reBreaks = /\n/g;
    var lineStarts = [],
        match;
        
    // create an array of line starts. To make sure we have the full bounds of text covered
    // we add an extra line representing the text length plus 1.
    lineStarts.push(0);
    while ((match = reBreaks.exec(text)) !== null) {
        lineStarts.push(match.index + 1);
    }
    lineStarts.push(text.length + 1);

    this.lineStarts = lineStarts;
    this.textLen = text.length;
    this.maxIndex = lineStarts.length - 1;
};

(function () {
    // returns { row, column } starting from 0, of a charIndex.
    // startingLow and startingHigh are line indices, can be null, and narrow the search range.
    // consider passing these values when doing a sequential search of char indices.
    this.findRowCol = function (charIndex, startingLow, startingHigh) {
        var foundRow = null,
			low = (startingLow || 0),
            high = (startingHigh || this.maxIndex);

        if (charIndex < this.lineStarts[0]) foundRow = 0;
        else if (charIndex >= this.lineStarts[high]) foundRow = high;
        else if (startingLow == startingHigh) foundRow = startingLow;

        while (foundRow == null) {
            mid = Math.floor((low + high) / 2);
            if (charIndex >= this.lineStarts[mid]) {
                if (charIndex < this.lineStarts[mid + 1]) foundRow = mid;
                else low = mid + 1;
            } else high = mid;
        }

        return { row: foundRow, col: charIndex - this.lineStarts[foundRow] };
    };

    // returns the char index from a given row and column.
    this.findCharIndex = function (row, col) {
        return this.lineStarts[row] + col;
    };

}).call(TextRowColFinder.prototype);