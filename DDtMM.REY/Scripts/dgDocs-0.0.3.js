/*
msdn like help docs
*/
$.widget("dg.docs", {

    options: {
        title: null,
        width: '90%',
        height: '70%',
        minWidth: '400px',
        minHeight: '300px'
    },

    _create: function () {

        this.isOpen = false;
        this.docs = {};
        this._$currentPage = null;

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

        // reorganize elements
        this.element.after($displayElement);
        $content.append(this.element);

        if ((docPages = this.element.children()).length) {
            for (var i = 0, il = docPages.length; i < il; i++) {
                page = docPages[i];
                this.docs[page.id] = { id: page.id, value: page.title };
                $(page).hide();
            }
        }
        $nav.simpleTree('addNodes', this.docs);
        
        $displayElement.dialog({
            dialogClass: 'dg-docs-dialog',
            width: this._praseSize(this.options.width, $(window).width()),
            height: this._praseSize(this.options.height, $(window).height()),
            minWidth: this._praseSize(this.options.minWidth, $(window).width()),
            minHeight: this._praseSize(this.options.minHeight, $(window).height()),
            title: (this.options.title || this.element.attr('title') || 'Documentation'),
            close: function () {
                my.isOpen = false;
            },
            autoOpen: false
        });

        this._$content = $content;
        this._$displayElement = $displayElement;
        this._displayContent(this.element.children().first().attr('id'));
    },
    
    _praseSize: function(sizeStr, windowDimensionValue) {
        if (sizeStr == 'auto') return sizeStr;
        else if (/%/.test(sizeStr)) return windowDimensionValue * parseInt(sizeStr) / 100;

        return parseInt(sizeStr);
    },

    show: function () {
        if (!this.isOpen) {
            //this._$displayElement.dialog('option', { height: $(window).height() / 1.2 });
            if (!this._$currentPage && this.docs.length > 0) this._displayContent(this.docs[0].id);
            this.isOpen = true;
            this._$displayElement.dialog('open');
        }
    },

    _displayContent: function (id) {

        if (this._$currentPage) this._$currentPage.hide();
        this._$currentPage = this.element.find($('#' + id));
        if (!this._$currentPage.data('dg.docs.linksProcessed')) this._processLinks(this._$currentPage);
        
        this._$currentPage.show();
        this._$displayElement.dialog('option', 'title', 
            (this.options.title || this.element.attr('title') || 'Documentation') + ': ' + $('#' + id).attr('title'));
    },

    // modifies links within contents to support various functions
    _processLinks: function($page) {
        var href,
            my = this,
            hashIndex;

        $page.find('a').each(function () {
            href = this.getAttribute('href');

            if ((hashIndex = href.indexOf('#!')) == 0) {
                // link to another document

                if (!this.innerHTML) this.innerHTML = my.docs[href.substr(2)].value;
                $(this).click(function (ev) {
                    ev.preventDefault();
                    my._displayContent(this.getAttribute('href').substr(2));
                });
            } else if ((hashIndex = href.indexOf('#')) == 0) {
   
                $(this).click(function (ev) {
                    ev.preventDefault();
                    $(this).parents('.dg-docs-content').scrollTop(
                        $(this.getAttribute('href')).offset().top);
                });
            } else if (href.indexOf(':') > -1) {
                // external link
                this.target = '_blank';
                if (!this.className.match(/dg-docs-external-link/)) this.className += ' dg-docs-external-link';
            }
        });
        $page.data('dg.docs.linksProcessed', true);
    },

    destroy: function () {
        // call the base destroy function
        $.Widget.prototype.destroy.call(this);
    }
});