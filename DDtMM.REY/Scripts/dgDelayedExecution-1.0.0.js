var delayedExec = (function () {
    var execData = {};

    // Cancels execution of function with existing id, and begins new delayed execution of function.
    // func: function to execute
    // duration: timeout duration
    // id: Identifier
    // funcArgs: optional array of arguments
    // thisObj: optional this for function
    // Description:
    function start(func, duration, id, funcArgs, thisObj) {

        cancel(id);

        var execItem = {
            func: func,
            duration: duration,
            funcArgs: funcArgs || [],
            thisObj: thisObj || this,
            state: 'waiting',
            timeoutID: 0
        };
        execData[id] = execItem;
        execItem.timeoutID = setTimeout(optimisticExecute, duration, id);

        return this;
    }

    // cancel execution with matching id if it hasn't been executed yet.
    // sets state to cancelled
    function cancel(id) {

        var execItem = execData[id];

        if (execItem && execItem.state == 'waiting') {
            clearTimeout(execItem.timeoutID);
            execItem.timeoutID = 0;
            execItem.state = 'cancelled';
        }

        return this;
    }

    // executes item from execData with matching id.
    function optimisticExecute(id) {

        execute(execData[id]);

        return this;
    }

    // executes item with matching id if it exists and hasn't been executed yet.
    function safeExecute(id) {

        var execItem = execData[id];

        if (execItem && execItem.state == 'waiting') {
            clearTimeout(execItem.timeoutID);
            execute(execItem);
        }

        return this;
    }

    // performs exeuction of a function, and resets id, and sets state to executed
    function execute(execItem) {
        execItem.func.apply(execItem.thisObj, execItem.funcArgs);
        execItem.timeoutID = 0;
        execItem.state = 'executed';

        return this;
    }

    var my = {
        start: start,
        cancel: cancel,
        exec: safeExecute
    }

    return my;
}());

