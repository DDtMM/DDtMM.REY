/***
By: Daniel Gimenez
License: Freeware
Description:
A stack with lmited size.  Loops around the stack
***/
var LimitedStack = function (size) {
    this._size = size;
    this._stackArray = new Array(this._size);

    // the index of the top of stack, if -1 stack is empty
    this._topIndex = -1; 
    // the index where the stack begins.
    this._bottomIndex = 0;
    // length of stack

};

(function () {
    // returns the correct index value based on offset;
    this._adjustIndex = function (indexValue, offsetValue) {
        offsetValue = offsetValue % this._size;

        indexValue += offsetValue;
        if (indexValue >= this._size) return indexValue - this._size;
        else if (indexValue < 0) return indexValue + this._size;
        return indexValue;
    },
    // makes the stack empty by resetting indices.
    this.empty = function() {
        this._topIndex = -1;
        this._bottomIndex = 0;
    },
    //this.resize = function (newSize) {

    //},

    // adds to the stack
    this.push = function (value) {
        if (this._topIndex != -1) {
            var nextIndex = this._adjustIndex(this._topIndex, 1)
            this._stackArray[nextIndex] = value;
            this._topIndex = nextIndex;
            // if indices are equal, then move bottom up.
            if (this._bottomIndex == this._topIndex) this._bottomIndex = this._adjustIndex(this._bottomIndex, 1);
        } else {
            this._stackArray[0] = value;
            this._topIndex = 0;
            this._bottomIndex = 0;
        }
    },
    // returns last item in stack. 
    this.peek = function() {
        if (!this.isEmpty()) {
            return this._stackArray[this._topIndex];
        }
    },

    // pop last item in stack.  If count has a value greater than zero, than pops that many.
    this.pop = function (count) {
        var lastValue,
            lastIndex,
            stackLength = this.length();

        if (stackLength) {
            if (!count || count <= 1) lastIndex = this._topIndex;
            else lastIndex = this._adjustIndex(this._topIndex, Math.min(count, stackLength) * -1 + 1);

            lastValue = this._stackArray[lastIndex];

            // if last index equal bottom, then the stack is now empty.
            if (lastIndex == this._bottomIndex) this.empty();
            else this._topIndex = this._adjustIndex(lastIndex, -1);
        }
        return lastValue;
    },
    // pops all from stack and returns value at index
    this.popTo = function (index) {
        if (index < this.length() && index >= 0) {
            this._topIndex = this._adjustIndex(index, this._bottomIndex);
            return this.pop(); // return last value
        }
    },

    // gets the value at a given index.  If newVal has a value then sets the value
    this.val = function (index, newValue) {
        var value;
        if (index < this.length()) {
            index = this._adjustIndex(index, this._bottomIndex);
            if (newValue !== undefined) this._stackArray[index] = value = newValue;
            else value = this._stackArray[index];
        }
        return value;
    },

    // returns a copy of the values
    this.getValues = function() {
        if (this.isEmpty()) return [];
        else if (this._topIndex >= this._bottomIndex) {
            return this._stackArray.slice(this._bottomIndex, this._topIndex + 1);
        } else {
            return this._stackArray.slice(0, this._topIndex + 1)
                .concat(this._stackArray.slice(this._bottomIndex, this._size));
        }
    },

    // does the stack have no values
    this.isEmpty = function() {
        return (this._topIndex == -1);
    },

    // number of items in stack
    this.length = function () {
        // if next > start, then return the difference, 
        return (this.isEmpty()) ? 0 :
            this._topIndex - this._bottomIndex + ((this._topIndex >= this._bottomIndex) ? 0 : this._size) + 1;
    }



}).call(LimitedStack.prototype);