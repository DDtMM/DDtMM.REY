/*
requires jquery ui draggable.
Turns a div into a splitter between two block elements or creates a splitter in between two block elements.
options:
    - option.type should be either h for horizontal or v for vertical.
        - if class dg-splitter-h or dg-splitter-v is on element then it will be used for type if type is not set.
        - if you are creating the splitter and have data-splitter-type="h|v" then that will work if type is not set
    - createSplitter: creates a splitter object. type must be set.
The block elements and the splitter should be absolutely positioned:
.splitElement, .dg-splitter {
    position:absolute;
    top:0;
    left:0;
    right:0;
    bottom: 0;

    box-sizing: border-box;
    -moz-box-sizing: border-box;
    -webkit-box-sizing: border-box;
}

Other classes
.dg-splitter:hover
{
    background: #d0cba0;

}
.dg-splitter.ui-draggable-dragging
{
    background: #f0f0a0;

}
.dg-splitter-h
{
    width:.4em;
    min-width:4px;
    cursor:col-resize;
}

.dg-splitter-v
{
    height:.7em;
    min-height:4px;
    cursor:row-resize;
}
*/
$.widget("dg.splitter", {
    
    options: {
        type: '',
        createSplitter: false
    },

    _create: function () {
        var $elem;

        if (!this.options.createSplitter) {
            $elem = this.element;
            if (!this._validateTypeOption()) {
                if ($elem.hasClass('dg-splitter-v')) this.options.type = 'v';
                else if ($elem.hasClass('dg-splitter-h')) this.options.type = 'h';
                else {
                    this._throwError("notype");
                    return;
                }
            }
        } else {
 
            if (!this._validateTypeOption()) {
                this.options.type = this.element.attr('data-splitter-type');
                if (!this._validateTypeOption()) {
                    this._throwError("notype");
                    return;
                }
            }
            this.element.after($elem = $('<div />', {
                    'class': 'dg-splitter dg-splitter-' + this.options.type 
                })
            );
        }

        switch (this.options.type) {
            case 'h': this._initHorizontalSplitter($elem); break;
            case 'v': this._initVerticalSplitter($elem); break;
        }

    },

    _validateTypeOption: function () {

        return (this.options.type && /^[hv]$/i.test(this.options.type));
    },

    _throwError: function (errorType) {
        var msg;

        switch (errorType) {
            case 'notype':
                msg = 'element {$0} requires class "dg-splitter-(h|v)" or option "type" with value of h[orizontal] or v[ertical].';
                break;
            default:
                msg = 'unknown error with element {$0}.';
                break;
        }

        var args = arguments;

        msg = msg.replace(/\{\$(d+)\}/g, function (m, $1) {
            return ($1 == '0') ? this.element.prop('id') : args[parseInt($1)];
        });

        throw (msg);

    },
    _initHorizontalSplitter: function ($this) {
        var $prev = $this.prev();
        var $next = $this.next();
        var offsetX;
        var currentWidth;
        var spliiterWidth = $this.width();
        
        currentWidth = $prev.css('width');
        if (currentWidth.indexOf('%') > -1) {
            currentWidth = $prev.parent().width() * (parseFloat(currentWidth) / 100);
        }
        else if (currentWidth.match(/\D/)) currentWidth = parseFloat(currentWidth);

        
        $prev.css('width', currentWidth);
        $this.css('left', currentWidth);
        $next.css('left', currentWidth + spliiterWidth);

        $this.on('mousedown', function () {
            var minWidth = $prev.css('min-width');
            var offset1 = $prev.offset();
            offset1.left += (minWidth.indexOf('px') > 0) ? parseFloat(minWidth) : 0.0;

            var offset2 = $next.offset();
            offset2.top += $next.outerHeight(true);
            offset2.left += $next.outerWidth(true);
            minWidth = $next.css('min-width');
            offset2.left -= (minWidth.indexOf('px') > 0) ? parseFloat(minWidth) : 0.0;

            offsetX = $this.parent().offset().left;

            $this.draggable('option', 'containment', [offset1.left, offset1.top, offset2.left, offset2.top]);
        });
        $this.draggable({
            axis: 'x',
            drag: function (ev, ui) {
                $next.css('left', ui.offset.left - offsetX + spliiterWidth);
                $prev.css('width', ui.offset.left - offsetX);
            },
            stop: function (ev, ui) {
                $(window).trigger('resize');
            }
        });
    },

    _initVerticalSplitter: function ($this) {
        var $prev = $this.prev();
        var $next = $this.next();
        var offsetY;
        var currentHeight;
        var spliiterHeight = $this.height();

        currentHeight = $prev.css('height');
        if (currentHeight.indexOf('%') > -1) {
            currentHeight = $prev.parent().height() * (parseFloat(currentHeight) / 100);
        }
        else if (currentHeight.match(/\D/)) currentHeight = parseFloat(currentHeight);

        $prev.css('height', currentHeight);
        $this.css('top', currentHeight);
        $next.css('top', currentHeight + spliiterHeight);

        $this.on('mousedown', function () {
            var minHeight = $prev.css('min-height');
            var offset1 = $prev.offset();
            offset1.top += (minHeight.indexOf('px') > 0) ? parseFloat(minHeight) : 0.0;

            var offset2 = $next.offset();
            offset2.top += $next.outerHeight(true);
            offset2.left += $next.outerWidth(true);
            minHeight = $next.css('min-height');
            offset2.top -= (minHeight.indexOf('px') > 0) ? parseFloat(minHeight) : 0.0;

            offsetY = $this.parent().offset().top;

            $this.draggable('option', 'containment', [offset1.left, offset1.top, offset2.left, offset2.top]);
        });
        $this.draggable({
            axis: 'y',
            drag: function (ev, ui) {
                $next.css('top', ui.offset.top - offsetY + spliiterHeight);
                $prev.css('height', ui.offset.top - offsetY);
            },
            stop: function (ev, ui) {
                $(window).trigger('resize');
            }
        });
    },

    _setOption: function (key, value) {
        this._super(key, value);
    },

    _setOptions: function (options) {
        this._super(options);
    },

    destroy: function () {

        // call the base destroy function
        $.Widget.prototype.destroy.call(this);
    }
});