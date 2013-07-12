/***
By: Daniel Gimenez
License: Freeware
Description:
Adds functions to array
***/
var dgArrayDecorators = (function () {


    /* endless array  */
    var endlessArray = function (sourceArray) {
        this._ary = sourceArray;
        this.index = -1;

    };

    (function () {
        // gets next value or start value.  adjusts index to match.
        this.next = function () {
            if (++this.index < this._ary.length) return this._ary[this.index];
            else if (this._ary.length) return this._ary[this.index = 0];
            return null;
        },
        // looks at next value without incrementing
        this.peekNext = function () {
            var nextIndex = this.index + 1;
            if (nextIndex < this._ary.length) return this._ary[nextIndex];
            else if (this._ary.length) return this._ary[0];
            return null;
        },
        // gets the current value.  If elements are reduced and index is out of range will return null.
        // assigns newValue to found element if newValue is not undefined
        this.val = function (newValue) {
            if (this._ary.length > this.index) {
                if (newValue !== undefined) this._ary[this.index] = newValue;
                return this._ary[this.index];
            }
            return null;
        },
                
        // restarts by setting current index to -1;
        this.restart = function() {
            this.index = -1
        }

    }).call(endlessArray.prototype);

    var queriesArray = function (sourceArray) {
        this._ary = sourceArray;
        this._savedQueries = {};
        this.mutators = {
            // used in place of missing mutator
            defaultValueReturn: function (value, i) {
                return value;
            },
            indexReturn: function (value, i) {
                return i;
            },
            indexValueReturn: function (value, i) {
                return { index: i, value: value };
            }
        };
    };

    (function () {
        // return the first item that causes evaluator to return true
        // if mutator is passed, then the result of mutator(value, index) is returned
        this.findFirst = function (evaluator, mutator) {
            var value;
            for (var i = 0, il = this._ary.length; i < il; i++) {
                value = this._ary[i];
                if (evaluator(value)) return this._mutatorOrDefault(mutator)(value, i);
            }
            return undefined;
        }

        // returns an array of all found matches
        this.findAll = function (evaluator, mutator) {
            var value,
                results = [];
            mutator = this._mutatorOrDefault(mutator);
            for (var i = 0, il = this._ary.length; i < il; i++) {
                value = this._ary[i];
                if (evaluator(value)) results.push(mutator(value));
            }
            return results;
        }

        // negation of findAll
        this.excludeAll = function (evaluator, mutator) {
            var value,
                results = [];
            mutator = this._mutatorOrDefault(mutator);
            for (var i = 0, il = this._ary.length; i < il; i++) {
                value = this._ary[i];
                if (!evaluator(value)) results.push(mutator(value));
            }
            return results;
        }

        // returns the count of all the values that match evalutor
        this.count = function (evaluator) {
            var count = 0;

            for (var i = 0, il = this._ary.length; i < il; i++) {
                if (!evaluator(this._aryp[i])) count++;
            }
            return results;
        }

        // saves a query for reuse
        // savedName is the name for later
        // query: the function name or function
        // evaluator: the evaluator to call
        // mutator to call
        this.saveQuery = function (savedName, query, evaluator, mutator) {
            this._savedQueries[savedName] = {
                query: (typeof query === 'string') ? this[query] : query,
                evaluator: evaluator,
                mutator: this._mutatorOrDefault(mutator)
            }
        }

        // executes a savedQuery
        this.execQuery = function (savedName) {
            var sq = this._savedQueries[savedName];
            return sq.query(sq.evaluator, sq.mutator);
        }

        // if the mutator is null, default return is used as mutator
        this._mutatorOrDefault = function(mutator)  {
            return (mutator) ? mutator : this.mutators.defaultValueReturn;
        }
        
    }).call(queriesArray.prototype);

    return {
        // adds .endless to array
        addEndless: function (ary) {
            ary.endless = new endlessArray(ary);
        },
        addQueries: function (ary) {
            ary.qry = new queriesArray(ary);
        }
    }
})();