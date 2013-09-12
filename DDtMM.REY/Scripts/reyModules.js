var reyModules = (function ($) {
    var modules = [];
    var moduleIDIndex = {};


    function init() {
        var baseModules = [modCurrentSyntax, modFindAndReplace, modMapVisualizer,
            modStringSplit, modRegexHistory, modPerformance];
        for (var i = 0, il = baseModules.length; i < il; i++) {
            addModule(baseModules[i]);
        }

        if (my.startupModuleId) showModule(my.startupModuleId);
        else showModule(modules[0]);
    };

    // adds module to list of modules, and adds base methods and properties
    function addModule(module) {
        var newIndex = modules.push(module) - 1,
            $host;
        // add base functions and properties
        module._values = {};
        module.isRunning = false;
        module.val = function (name, newValue, source) {
            if (!source) source = module;
            if (newValue === undefined) return this._values[name];

            this._values[name] = newValue;
            $(module).trigger("valueChanged", { name: name, value: newValue, source: source });
            return newValue;
        }

        module.getValues = function () {
            return this._values;
        }
        moduleIDIndex[module.id] = newIndex;

        // create ui
        $('#moduleContainer').append(
            $host =
            $('<div />', { id: module.id, 'class': 'moduleContent' })
                .css('display', 'none')
       );
        $('#changeModuleMenu .menuItemsPanel').append(
            $('<li>' + module.name + '</li>').click(function () {
                $(this).parent().hide();
                showModule.call(this, module);
            }));

        // add any saved values
        if (my.startupModuleValues[module.id]) {
            var modValues = my.startupModuleValues[module.id];
            for (var i in modValues) {
                // we don't want to trigger onValueChanged since the module isn't initialized.
                module._values[i] = modValues[i];
            }
        }
        
        module.init($host);
    };

    // returns a module by its id.
    function getModuleByID(id) {
        for (var i = 0, il = modules.length; i < il; i++) {
            if (modules[i].id == id) return modules[i];
        }
    };

    // shows a Module.
    // module can be either a module object or its id
    function showModule(module) {
        if (my.activeModule) {
            stopModule(my.activeModule);
            $('#' + my.activeModule.id).hide();
        }

        if (typeof module === 'string') {
            module = getModuleByID(module);
        }
        startModule(my.activeModule = module);
        $('#moduleName').text(module.name);
        $('#' + module.id).show(0, function () { $('#moduleContainer').trigger('resize') });
    };

    function stopModule(module) {
        module.stop();
        module.isRunning = false;
    }
    function startModule(module) {
        module.isRunning = true;
        module.start();
    }

    // get important values for saving
    function getModuleValues() {
        var modulesValues = {}, values;
        for (var i = 0, il = modules.length; i < il; i++) {
            // save only those that have values;
            values = modules[i].getValues();
            if (!$.isEmptyObject(values)) modulesValues[modules[i].id] = values;
        }

        return modulesValues;
    }

    // sets a module value
    function setModuleValue(id, key, value) {
        getModuleByID(id).val(key, value);
    }

    // sets a startup module value
    function setStartupModuleValue(id, key, value) {
        if (!my.startupModuleValues[id]) my.startupModuleValues[id] = {};
        my.startupModuleValues[id][key] = value;
    }

    var my = {
        startupModuleValues: {},
        startupModuleId: '',
        activeModule: null,
        init: init,
        addModule: addModule,
        showModule: showModule,
        getModuleValues: getModuleValues,
        setModuleValue: setModuleValue,
        setStartupModuleValue: setStartupModuleValue
    };

    return my;
}(jQuery));

// a module that all modules must inherit from
var moduleBase = function () {
    this.values = {};
};

(function () {
    this.val = function (name, newValue) {
        return (newValue === undefined) ? this.values[name] : this.values[name] = newValue;
        if (this.onValueChanged != null) {
            this.onValueChanged(name, newValue);
        }
    }
    //this.update = function () { };
    //this.init = function () { };
    //this.start = function () { };
    //this.stop = function () { };
    //this.destroy = function () { };
}).call(moduleBase.prototype);