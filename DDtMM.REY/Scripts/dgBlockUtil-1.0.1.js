/***
By: Daniel Gimenez
License: Freeware
Some useful functions for dealing with block objects
***/
var dgBlockUtil = (function ($) {
    var heightElements = [],
        widthElements = [],
        ignorePositionRe = /absolute|fixed/i,
        ignoreDisplayRe = /none/i;

    $(window).resize(function () {

        fillAllHeight();

    });

    $.fn.fillHeight = function () {
        return this.each(attachForFillHeight);
    };

    function attachForFillHeight(index, elem) {
        var $elem = $(elem);
        fillHeight($elem);
        if (heightElements.indexOf($elem) < 0) {
            heightElements.push($elem);
            $elem.parent().on('resize', function () { fillHeight($elem); });
        }
    }

    function fillAllHeight() {
        for (var i in heightElements) fillHeight(heightElements[i]);
    }


    function fillHeight($elem) {
        var usedHeight = 0,
            $parent = $elem.parent(),
            $sibling;

        $parent.children().not($elem).each(function () {
            $sibling = $(this);
 
            if (!$sibling.css('position').match(ignorePositionRe) &&
                !$sibling.css('display').match(ignoreDisplayRe)) {
                usedHeight += Math.ceil($sibling.outerHeight(true));
            }
        });

        $elem.height(Math.floor(Math.max(0, $elem.height() - $elem.outerHeight(true) + $parent.height() - usedHeight)));
    }

    $.fn.moveUnder = function ($elem, offsetTop) {
        var pos = $elem.offset();
        pos.top += $elem.height() + (offsetTop || 0);

        return this.each(function () { $(this).offset(pos); });
    };

    $.fn.moveRightOf = function ($elem, offsetLeft) {
        var pos = $elem.offset();
        pos.left += $elem.width() + (offsetLeft || 0);

        return this.each(function () { $(this).offset(pos); });
    };
}(jQuery));