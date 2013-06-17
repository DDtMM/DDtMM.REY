var textRowColFinder = function (text) {
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

        return { row: foundRow, col: charIndex - this.lineStarts[foundRow] }
    };

    this.findCharIndex = function (row, col) {
        return this.lineStarts[row] + col;
    };

}).call(textRowColFinder.prototype);