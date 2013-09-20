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
            click: function (ev, data) { my.displayContent(data.node.id); }
        });

        // reorganize elements
        this.element.after($displayElement);
        $content.append(this.element);

        this.element.children().each(function () {
            $page = $(this);
            $page.hide(0);
            $nav.simpleTree('addNode', {
                id: $page.prop('id'),
                value: $page.attr('title'),
            }, $page.attr('data-parent'));
        });
        
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
        this.displayContent(this.element.children().first());
    },
    
    _praseSize: function(sizeStr, windowDimensionValue) {
        if (sizeStr == 'auto') return sizeStr;
        else if (/%/.test(sizeStr)) return windowDimensionValue * parseInt(sizeStr) / 100;

        return parseInt(sizeStr);
    },

    show: function () {
        if (!this.isOpen) {
            //this._$displayElement.dialog('option', { height: $(window).height() / 1.2 });
            if (!this._$currentPage) this.displayContent(this.element.first());
            this.isOpen = true;
            this._$displayElement.dialog('open');
        }
    },

    // content can be element or id
    displayContent: function (content) {
        if (this._$currentPage) this._$currentPage.hide();
        this._$currentPage = (jQuery.type(content) === 'string') ?
            this.element.find($('#' + content)) : $(content);

        if (!this._$currentPage.data('dg.docs.linksProcessed')) this._processLinks(this._$currentPage);
        
        var title = (this.options.title || this.element.attr('title') || '')
        if (title) title += ': ';
        
        var pathTitles = []
        $.each(this.getContentPath(this._$currentPage), function () {
            pathTitles.push(this.attr('title'));
        });
        title += pathTitles.join(" > ");

        this._$currentPage.show();
        this._$displayElement.dialog('option', 'title', title);
    },

    // creates the path to the $elem
    getContentPath: function($elem) {
        var path = [];
        var parentID;
        while ($elem && $elem.length > 0) {
            path.unshift($elem); //add to the beginning
            if ((parentID = $elem.attr('data-parent'))) $elem = this.element.children('#' + parentID);
            else break;
        }
        return path;
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

                if (!this.innerHTML) this.innerHTML = my.element.children('#' + href.substr(2)).attr('title');
                $(this).click(function (ev) {
                    ev.preventDefault();
                    my.displayContent(this.getAttribute('href').substr(2));
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