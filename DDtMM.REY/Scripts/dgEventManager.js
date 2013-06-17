var eventManager = (function () {
    // calls the event manager methods from source.
    var eventManagerOnSource = function (source) {
        this.source = (source.length != null) ? source : [source];
    };
    (function () {
        this._callEvents = function (eventString, func) {
            var args = [null, null];
            for (var a = 2, al = arguments.length; a < al; a++) {
                args.push(arguments[a]);
            }

            var events = eventString.split(/\s/g);
            for (var i = 0, il = this.source.length; i < il; i++) {
                for (var j = 0, jl = events.length; j < jl; j++) {
                    args.splice(0, 2, this.source[i], events[j]);
                    func.apply(eventManager, args);
                }
            }
            return this;
        };

        this._callSources = function (func) {
            var args = [null];
            for (var a = 1, al = arguments.length; a < al; a++) {
                args.push(arguments[a]);
            }
            for (var i = 0, il = this.source.length; i < il; i++) {
                args.splice(0, 1, this.source[i])
                func.apply(eventManager, args);
            }
        };

        // subscribes to the sources event
        this.on = function (eventString, callback) {
            return this._callEvents(eventString, eventManager.subscribe, callback);
        };
        // unsubscribes to the sources event
        this.off = function (eventString, callback) {
            return this._callEvents(eventString, eventManager.unsubscribe, callback);
        };
        // executes a predefined sequence, which is an event that triggers an another event.
        // sequenceName : idle | bubble.
        // idle will fire an event after all other events haven't been fired for a certain amount of time.
        // params.delay = ms to wait, params.autoFire = fire as soon as registered
        // bubble will fire an event after an event has been fired.  params.source, params.event
        this.sequence = function (eventString, sequenceName, params) {
            return this._callEvents(eventString, eventManager.registerSequence, sequenceName, params);
        }

        // triggers an event.
        this.trigger = function (eventString, data) {
            return this._callEvents(eventString, eventManager.trigger, data);
        }

        // triggers an event after delay ms.  Restart clears events waiting to trigger of same type.
        this.delayedTrigger = function (eventString, data, delay, restart) {
            return this._callEvents(eventString, eventManager.startTimedTrigger, data, delay, restart);
        }

        // cancels delayed trigger.
        this.cancelTrigger = function (eventString) {
            return this._callEvents(eventString, eventManager.cancelTimedTrigger);
        }

        // removes all subscribed events for source.
        this.remove = function () {
            return this._callSources("", eventManager.removeSource);
        }
    }).call(eventManagerOnSource.prototype);

    window.EVMGR = function (source) {
        return new eventManagerOnSource(source);
    }

    var triggerInfo = function (data, event, evChain) {
        this.data = data;
        this.event = event;
        this.timerId = -1;
        this.eventChain = evChain;
    };
    (function () {

        this.doTrigger = function () {
            this.event.trigger(this.data, this.eventChain);
            this.cancel();
        }
        
        this.cancel = function () {
            clearTimeout(this.timerId);
            this.event._removeTimedTrigger(this);
        };

    }).call(triggerInfo.prototype);

    // creates a chain of events
    var eventChain = function (event, priorChain) {
        this.event = event;
        this.domEvent = null;
        this.prior = priorChain;
        this.originalEvent = (!priorChain) ? event : priorChain.originalEvent;
        this.cancelled = priorChain && priorChain.cancelled;
    };
    var eventHandler = function (source, name) {
        this.source = source;
        this.name = name;
        this.subscribers = [];
        this.timedTriggers = [];
        this.triggerCount = 0;

        // if an event is attached to a DOM object, this is the callback to eventHandler.trigger method
        this.domCallback = null;

        // try to subscribe to DOM event
        if (source.addEventListener || source.attachEvent) {
            var self = this;
            this.domCallback = function (event)
            {
                self.trigger(event, new eventChain(event));
            }
            if (source.addEventListener) source.addEventListener(name, this.domCallback);
            else source.attachEvent(name, this.domCallback);
        }
    };

    (function () {
        // executes the event, and returns the chain of events
        this.trigger = function (data, evChain) {
            if (!evChain || !evChain.cancelled) {
                evChain = new eventChain(this, evChain);
                var self = this;
                for (var i in this.subscribers) {
                    this.subscribers[i].call(this.source, data, evChain);
                }
            }
            return evChain;
        };
        
        // callback: a function to call on event
        // globalEventID: an id from the event manager that is unique to associate with event
        this.subscribe = function (callback) {
            this.subscribers.push(callback);
        };

        // unsubscribe, return if found
        this.unsubscribe = function (callback) {
            var eventIndex = this.subscribers.indexOf(callback);
            if (eventIndex > -1) {
                this.subscribers.splice(eventIndex, 1);
                return true;
            }

            return false;
        };

        this.startTimedTrigger = function (data, delay, restart, evChain) {
            if (restart == true) this.cancelAllTimedTriggers();
            this.triggerCount++;
            var tt = new triggerInfo(data, this, evChain);
            tt.timerId = setTimeout(function () { tt.doTrigger() }, delay);
            
            this.timedTriggers.push(tt);

   
            return tt;
        };

        this.cancelAllTimedTriggers = function () {
            var timedTriggers = this.timedTriggers;
            for (var i in timedTriggers) {
                timedTriggers[i].cancel();
            }
        };

        this.cancelTimedTrigger = function(id) {
            this.timedTriggers[id].cancel();
        };

        this._removeTimedTrigger = function (timedTrigger) {
            this.timedTriggers.splice(this.timedTriggers.indexOf(timedTrigger), 1);
        };

        // cancel all triggers, clear subscribers, detach from DOM
        this.destroy = function () {
            delete this.subscribers;
            this.cancelAllTimedTriggers();
            delete this.timedTriggers;
            this.source = null;
            if (this.domCallback) {
                if (this.source.removeEventListener) this.source.removeEventListener(name, this.domCallback);
                else this.source.detachEvent(name, this.domCallback);
            }
        }

    }).call(eventHandler.prototype);

    var INTERNAL_PREFIX = '__EM__';
    var EVENT_CREATED_EVENT = INTERNAL_PREFIX + 'eventcreated';
    var ANY_EVENT = INTERNAL_PREFIX + 'anyevent';
    var SOURCE_ID = INTERNAL_PREFIX + 'sourceID';

    // index of sources
    var sources = [];
    var timedTriggers = {};
    var sequenceRegistrations = {};
    var noToStringRe = /^\[object/;
    var hashSourceIds = {};

    // params.delay: time before execute, params.autoStart = start time now;
    sequenceRegistrations['idle'] = function (source, eventName, params) {
        var dontSubscribeRegex = new RegExp('^' + eventName + '$|^' + INTERNAL_PREFIX);
        eventManager.subscribe(source, ANY_EVENT, function (data, evChain) {
            if (!evChain.originalEvent.name.match(dontSubscribeRegex)) {
                startTimedTrigger(source, eventName, data, params.delay, true, evChain);
            };
        });

        if (params.autoStart) {
            startTimedTrigger(source, eventName, null, params.delay, true);
        }
    };

    // params.source = source to trigger. params.eventName = event to trigger
    sequenceRegistrations['bubble'] = function (source, eventName, params) {
        subscribe(source, eventName, function (data, evChain) {
            triggerEvent(params.source, params.eventName, data, evChain);
        });
    };

    // the gets a source, attempting to call toHash() to get a hash and then
    // using toString as a hash.  If the toString returns '[object...'
    // an id is created and added to the object to use as an idenfier.  
    function getSourceEvents(source) {
        var events;
        var hash;
        var sourceIndex;
 
        if ((hash = getHash(source)) != null) {
            sourceIndex = hashSourceIds[hash];
        } else {
            sourceIndex = source[SOURCE_ID];
        }
        
        if (sourceIndex == null) {
            sources.push(events = {});
            sourceIndex = sources.length - 1;

            if (hash == null) source[SOURCE_ID] = sourceIndex;
            else hashSourceIds[hash] = sourceIndex;
            
        } else {
            events = sources[sourceIndex];
        }

        return events;
    };

    function getHash(obj) {

        if (obj.toHash !== undefined) return obj.toHash();
        else if (my.useToStringAsHash && !obj.toString().match(noToStringRe)) return obj.toString();
        return null;
    };

    function getEvent(source, eventName) {
        var events = getSourceEvents(source);
        var event = events[eventName];
        if (event == null) {
            events[eventName] = event = new eventHandler(source, eventName);
        }
        return event;
    };
    
    function subscribe(source, eventName, callback) {
        getEvent(source, eventName).subscribe(callback);
    };

    function unsubscribe(source, eventName, callback) {
        getEvent(source, eventName).unsubscribe(callback);
    };

    function registerSequence(source, eventName, sequenceName, params) {
        sequenceRegistrations[sequenceName](source, eventName, params);
    };
    

    // trigger an event. data, type and source are returned
    function triggerEvent(source, eventName, data, evChain) {
        evChain = getEvent(source, eventName).trigger(data, evChain);
        getEvent(source, ANY_EVENT).trigger(data, evChain);
    };

    // 
    // source: source of event.
    // eventName: name of event.
    // data: data to pass.
    // delay: time to wait to execute
    // [restart]: cancels previous events
    // [evChain]: eventChain up to this point.
    function startTimedTrigger(source, eventName, data, delay, restart, evChain) {
        return getEvent(source, eventName).startTimedTrigger(data, delay, restart, evChain).timerId;
    };

    function cancelTimedTrigger(source, eventName, id) {
        if (id != null) getEvent(source, eventName).cancelTimedTrigger(id);
        else getEvent(source, eventName).cancelAllTimedTriggers();
    };

    // stops all event listening for a source
    function removeSource(source) {
        var events = getSourceEvents(source);
        for (var i in events) {
            events[i].destroy();
        }

        sources.splice(sources.indexOf(events), 1, undefined);
        var hash = getHash(source);
        if (hash) delete hashSourceIds[hash];
    };

    var my = {
        useToStringAsHash: true,
        subscribe: subscribe,
        unsubscribe: unsubscribe,
        registerSequence: registerSequence,
        trigger: triggerEvent,
        startTimedTrigger: startTimedTrigger,
        cancelTimedTrigger: cancelTimedTrigger,
        removeSource: removeSource
    };

    return my;
}());

