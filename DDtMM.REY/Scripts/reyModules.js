var reyModules = (function () {
    var modules = [];
    var moduleIDIndex = {};

    function init() {
        var baseModules = [modCurrentSyntax, modFindAndReplace, modMapVisualizer, modStringSplit];
        for (var i = 0, il = baseModules.length; i < il; i++) {
            addModule(baseModules[i]);
        }

        var activeModule = getModuleByID(dgStorage.val('reyModules_activeModule'));
        if (activeModule != null) showModule(activeModule);
        else showModule(modules[0]);
    };

    function addModule(module) {
        var newIndex = modules.push(module) - 1;
        module._values = {};
        module.val = function (name, newValue) {
            if (newValue === undefined) return this._values[name];

            if (newValue != this._values[name]) {
                this._values[name] = newValue;
                if (this.onValueChanged != null) {
                    this.onValueChanged(name, newValue);
                }
            }
        }
        moduleIDIndex[module.id] = newIndex;
        initModule(module);
    };

    function initModule(module) {
        var $host;
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
            my.activeModule.stop();
            $('#' + my.activeModule.id).hide();
        }

        if (typeof module === 'string') {
            module = getModuleByID(module);
        }
        my.activeModule = module;
        module.start();
        $('#moduleName').text(module.name);
        $('#' + module.id).show(0, function () { $('#moduleContainer').trigger('resize') });
    };

    function destroy() {
        dgStorage.val('reyModules_activeModule', my.activeModule.id);
        for (var i = 0, il = modules.length; i < il; i++) {
            if (modules[i].destroy != null) modules[i].destroy();
        }
    }

    var my = {
        activeModule: null,
        init: init,
        addModule: addModule,
        showModule: showModule,
        destroy: destroy
    };

    return my;
}());

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