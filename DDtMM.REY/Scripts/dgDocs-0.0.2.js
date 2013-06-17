/*
msdn like help docs
*/
$.widget("dg.docs", {

    options: {
        title: null
    },

    _create: function () {
        this.element.hide();
        this.isOpen = false;

        this.docs = {};

        var $content,
            $displayElement,
            $nav,
            docPages,
            page,
            my = this;

        $displayElement = $('<div />', { 'class': 'dg-docs' }).append([
            $nav = $('<div />', { 'class': 'dg-docs-nav' }),
            $content = $('<div />', { 'class': 'dg-docs-content' })
        ]);

        $nav.simpleTree({
            click: function (ev, data) { my._displayContent(data.node.id); }
        });

        this.element.after($displayElement);

        for (var i = 0, il = (docPages = this.element.children()).length; i < il; i++) {
            page = docPages[i];
            this.docs[page.id] = { id: page.id, value: page.title };
        }

        $nav.simpleTree('addNodes', this.docs);

        $displayElement.dialog({
            dialogClass: 'dg-docs-dialog',
            width: $displayElement.width(),
            height: $displayElement.height(),
            title: (this.options.title || this.element.attr('title') || 'Documentation'),
            close: function () {
                my.isOpen = false;
                $displayElement.empty();
                $displayElement.remove();
            },
            autoOpen: false
        });

        this._$content = $content;
        this._$displayElement = $displayElement;
        this._displayContent(this.element.children().first().attr('id'));
    },

    show: function () {
        if (!this.isOpen) {
            this.isOpen = true;
            this._$displayElement.dialog('open');
            
        }
    },

    _displayContent: function (id) {
        var href,
            my = this,
            hashIndex;

        this._$content.html($('#' + id).html());
        this._$content.find('a').each(function () {
            href = this.href;
            if ((hashIndex = href.indexOf('#!')) > -1) {
                // link to another document
                if (!this.innerHTML) this.innerHTML = my.docs[href.substr(hashIndex + 2)].value;
                $(this).click(function (ev) {
                    ev.preventDefault();
                    my._displayContent(this.href.substr(this.href.indexOf('#!') + 2));
                });
            } else if (href.indexOf(':') > -1) {
                // external link
                this.target = '_blank';
                if (!this.className.match(/dg-docs-external-link/)) this.className += ' dg-docs-external-link';
            }
        });

        this._$displayElement.dialog('option', 'title', 
            (this.options.title || this.element.attr('title') || 'Documentation') + ': ' + $('#' + id).attr('title'));
    },

    destroy: function () {

        // call the base destroy function
        $.Widget.prototype.destroy.call(this);
    }
});