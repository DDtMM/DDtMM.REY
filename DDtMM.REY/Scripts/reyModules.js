var rexModules = (function () {
    var modules = [rexCurrentSyntax, findAndReplace, mapVisualizer, rexStringSplit];
    var moduleIDIndex = {};

    function init() {
        for (var i = 0, il = modules.length; i < il; i++) {
            moduleIDIndex[modules[i].id] = i;
            initModule(modules[i]);
        }

        var activeModule = getModuleByID(dgStorage.val('rexModules_activeModule'));
        if (activeModule != null) showModule(activeModule);
        else showModule(modules[0]);
    };

    function addModule(module) {
        var newIndex = modules.push(module) - 1;
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

    function getModuleByID(id) {
        for (var i = 0, il = modules.length; i < il; i++) {
            if (modules[i].id == id) return modules[i];
        }
    };
    function showModule(module) {
        if (my.activeModule != null) {
            my.activeModule.stop();
            $('#' + my.activeModule.id).hide();
        }

        my.activeModule = module;
        module.start();
        $('#moduleName').text(module.name);
        $('#' + module.id).show(0, function () { $('#moduleContainer').trigger('resize') });
    };

    function destroy() {
        dgStorage.val('rexModules_activeModule', my.activeModule.id);
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