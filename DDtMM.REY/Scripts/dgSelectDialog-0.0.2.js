/*
options:
Displays a select dialog
IE bugginess with dialog.
*/
$.widget("dg.selectDialog", {

    options: {
        values: [ ],
        value: '',
        maxValues: 20,
        title: 'Select',
        okText: 'ok',
        cancelText: 'close',
        description: 'Select one...',
        inputID: ''
    },

    _create: function () {
        this.isDisplayed = false;
        this.options.inputID = 'dg_selectdialog-input-' +
            ((this.inputIDCounter != null) ? this.inputIDCounter++ : this.inputIDCounter = 1);
        $(this.element).click(function () { $(this).selectDialog('show'); });
    },

    show: function() {
        var self = this;
        var options = this.options;
        this.$dialogElement = $('<div />', { title: options.title, 'class': 'dg-selectdialog' }).append(
            $('<div class="dg-selectdialog-width" />').append([
                '<label class="dg-selectdialog-desc" for="' + options.inputID + '">' + options.description + '</div>',
                this.$input = $('<input />', { type: 'text', value: options.value, id: options.inputID }),
                this.$itemsList = $('<ul />', { 'class': 'dg-selectdialog-list' })
            ])
        );

        
        this.result = { type: 'cancelled', value: this.options.value };


        this.$dialogElement.dialog({
            width: 'auto',
            modal: true,
            buttons: [
                { text: options.cancelText, click: function () { self._onCancelled(); } },
                { text: options.okText, click: function () { self._onConfirmed(arguments); } }],
            close: function (ev) { self._onConfirmed(ev); }
        });

        this.$input.autocomplete();
        this.$input.keyup(function (ev) { if (ev.keyCode == 13) self._onConfirmed(ev); });
        this.$itemsList.selectable({
            selected: function (ev, elem) { self.$input.val(elem.selected.innerHTML); }
        });
        this.$itemsList.on('dblclick', function (ev) { self._onConfirmed(ev); });
        this.isInitialized = true;
        this._onValuesChanged();
    },

    _onConfirmed: function (ev) {
        var options = this.options;

        var value = this.$input.val().trim();
        var valueRegExp = new RegExp('^' + value.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") + '$', 'i');
        var existingIndex = -1;
        for (var i = 0, il = options.values.length; i < il; i++) {
            if (options.values[i].match(valueRegExp)) {
                existingIndex = i;
                break;
            }
        }
        
        options.value = value;
        options.values.unshift(value);

        if (existingIndex >= 0) {
            options.values.splice(existingIndex + 1, 1);
        } else if (options.values.length > options.maxValues) {
            options.values.pop();
        }

        this.result = { type: 'ok', value: options.value };
        this.$dialogElement.dialog('close');
        this._trigger('dialogOk', ev, this.result);
        
    },

    _onCancelled: function (ev) {
        if (this.isInitialized) {
            this.isInitialized = false;
            this.$dialogElement.remove();
            delete this.$dialogElement;
            if (this.result.type == 'cancelled') this._trigger('dialogCancelled', ev);
        }
    },

    _onValuesChanged: function() {
        if (this.isInitialized) {
            var values = this.options.values;
            values.splice(this.options.maxValues - 1, values.length - this.options.maxValues);
            this.$input.autocomplete('option', 'source', values);
            this.$itemsList.empty();
            for (var i in values) {
                this.$itemsList.append($('<li />').text(values[i]));
            }
        }
    },

    _setOption: function (key, value) {
        
        this._super(key, value);
        if (key == 'value') this._onValuesChanged();
    },

    destroy: function () {
        this._onCancelled();

        // call the base destroy function
        $.Widget.prototype.destroy.call(this);
    }
});