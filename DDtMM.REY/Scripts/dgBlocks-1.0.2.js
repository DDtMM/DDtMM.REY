/***
By: Daniel Gimenez
License: Freeware
Some useful functions for dealing with block objects
***/
(function ($) {
    // display properties tracked to deterimine if an update needs to occur
    // $elem: single jQuery element being tracked.
    // [addData]: additional data to add to the object.
    var TrackedProps = function ($elem, addData) {
        this.width = $elem.width(),
        this.height = $elem.height(),
        this.display = $elem.css('display')

        if (addData) {
            for (var i in addData) this[i] = addData[i];
        }
    };

    (function () {
        // copies display properties to object.
        this.copyTo = function (props) {
            props.width = this.width;
            props.height = this.height;
            props.display = this.display;
        }
        // compares to a TrackedProps object.
        this.equals = function (props) {
            return (this.height == props.height && this.width == props.width && this.display == props.display);

        }
    }).call(TrackedProps.prototype);

    var heightElements = [],
        heightElementsData = [],
        ignorePositionRe = /absolute|fixed/i,
        ignoreDisplayRe = /none/i,
        resizeParents = [],
        resizeParentsData = [],
        refreshTimerID;


    $(function () {
        refreshTimerID = window.setTimeout(beginUpdate, $.fn.blockUtil.pollingInterval);
    });

    $(window).resize(function () {
        window.clearTimeout(refreshTimerID);
        beginUpdate();
    });

    //
    function beginUpdate() {
        updateElementsWithChangedData();
        refreshTimerID = window.setTimeout(beginUpdate, $.fn.blockUtil.pollingInterval);
    }

    function attachForFillHeight($elem) {
        fillHeight($elem);
        if (heightElements.indexOf($elem) < 0) {
            heightElements.push($elem);
            heightElementsData.push(new TrackedProps($elem));
            $elem.parents().each(function () {
                var parentIndex, $parent = $(this);

                if ((parentIndex = resizeParents.indexOf($parent)) >= 0) {
                    resizeParentsData[parentIndex].children.push($elem);
                } else {
                    resizeParents.push($parent);
                    resizeParentsData.push(new TrackedProps($parent, { children: [$elem] }));
                }
            });
        }
    }

    // resizes the height of any elements, or their parents, that have changed data.
    function updateElementsWithChangedData() {
        var updateElements = [],
            props, newProps, $elem;

        // add children of any parent resized
  
        for (var i = 0, il = resizeParents.length; i < il; i++) {
            $elem = resizeParents[i];
            if ($elem.filter(':visible').length) {
                props = resizeParentsData[i];
                newProps = new TrackedProps($elem);

                if (!newProps.equals(props)) {
                    for (var j in props.children) {
                        if (updateElements.indexOf($elem = props.children[j]) == -1) updateElements.push($elem);
                    }
                    newProps.copyTo(props);
                }
            }
        }
 
    
        for (i = 0, il = heightElements.length; i < il; i++) {
            $elem = heightElements[i];

            if ($elem.filter(':visible').length && updateElements.indexOf($elem) == -1) {
                props = heightElementsData[i];
                newProps = new TrackedProps($elem);
                if (!newProps.equals(props)) {
                    updateElements.push($elem);
                    newProps.copyTo(props);
                }
            }
        }
  
        for (i in updateElements) fillHeight(updateElements[i]);
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


        

    $.fn.blockUtil = function (method) {
        var jq = this;
      
        function moveRightOf ($elem, offsetLeft) {
            var pos = $elem.offset();
            pos.left += $elem.width() + (offsetLeft || 0);

            return jq.each(function () { $(this).offset(pos); });
        }
        function moveUnder($elem, offsetTop) {
            var pos = $elem.offset();
            pos.top += $elem.height() + (offsetTop || 0);

            return jq.each(function () { $(this).offset(pos); });
        }
        function beginFillHeight() {
            return jq.each(function () { attachForFillHeight($(this)); });
        }
        switch (method) {
            case 'moveRightOf': return moveRightOf(arguments[1], arguments[2]); break;
            case 'moveUnder': return moveUnder(arguments[1], arguments[2]); break;
            case 'fillHeight': return beginFillHeight(); break;
        }
    };

    $.fn.blockUtil.pollingInterval = 1000;


}(jQuery));





