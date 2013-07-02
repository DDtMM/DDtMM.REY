/*
options:
nodes: object with nodes.
dataTemplate: default dataTemplate.

node properties:
dataTemplate (optional): jquery object to clone.  if none is provide, the parents' dataTemplate is used
children: an array of child nodes (optional)
id: node id (optional) - If not given one will be created
value: either a primitave value, or object.
*/
$.widget("dg.simpleTree", {
    
    options: {
        dataTemplate: $('<div />', { 'class': 'dg-tree-label' }),
        handleTemplate: $('<div />', { 'class': 'dg-tree-handle' }).html('&nbsp;'),
        nodeTransform: function (oldNode) { return oldNode; },
        transformGetChildren: function (oldNode) { null; }
    },

    _create: function() {
        this._$itemTemplate = $('<li />');
        this._$listTemplate = $('<ul />', { 'class': 'dg-tree-list' });
        this._$rootUl = $('<ul />', { 'class': 'dg-tree', 'data-tree-level': 0 });
        this._root = { children: new Array(), value: null, id: '_0_' };
        this._nodeIndex = {};
        this.element.append(this._$rootUl);

    },
    

    getNode: function (nodeID) {
        return this._nodeIndex[nodeID];
    },

    // calls the node TransformMethod;
    _executeNodeTransform: function(oldNode) {
        var node = this.options.nodeTransform(oldNode);
        var oldChildren = this.options.transformGetChildren(oldNode);
        if (oldChildren) {
            node.children = new Array();
            for (var i in oldChildren) {
                node.children.push(this._executeNodeTransform(oldChildren[i]));
            }
        }
        return node;
    },

    addNode: function (node, parentID) {
        this.addNodes([node], parentID);
    },

    addNodes: function (nodes, parentID) {

        var parentNode = (!parentID) ? this._root : this._nodeIndex[parentID];
        if (!parentNode.children) {
            parentNode.children = new Array();
        }

        var node;
        for (var i in nodes) {
            node = this._executeNodeTransform(nodes[i]);
            // if transform did not include id, create one.
            if (node.id === undefined) node.id = parentNode.id + '.' + i;
            parentNode.children.push(node);
            node.parent = parentNode;
            this._populateNodeIndex(node);
        }


        this._renderChildren(parentNode, {
            level: this._getNodeLevel(parentNode),
            $dataTemplate: this._getNodeTemplate(parentNode),
            $ul: this._getNodeUl(parentNode)
        });
        
    },

    // attempts to maintain state
    swapNodes: function (nodes) {
        
        var expanded = [];
        var newNode;
        this._nodesWithProperty(this._root.children, 'expanded', true, expanded);
        this.empty();
        
        this.addNodes(nodes);
        for (var oldId in expanded) {

            if ((newNode = this._nodeIndex[expanded[oldId]])) {
                this.expandNode(newNode, false, {});
            }
        }
 
    },

    _nodesWithProperty: function(nodes, propName, propVal, results) {
        var node;
        for (var i in nodes) {
            node = nodes[i];
            if (node[propName] == propVal) results.push(node.id);
            if (this._hasChildren(node))
                this._nodesWithProperty(node.children, propName, propVal, results);
        }
    },

    _renderNode: function (node, parentUiState) {
        var value = node.value,
            dataID;

        var $dataTemplate = (node.dataTemplate) ? node.dataTemplate : parentUiState.$dataTemplate;
        var $labelElement = $dataTemplate.clone();
   
        var self = this;
        var uiState;
        $labelElement.click(function () { self._onNodeClick(this); });

        if (typeof value == 'object') {
            for (dataID in value) {
                $labelElement.find('[name="' + dataID + '"]').attr(dataID, value[dataID]);
                $labelElement.find('[data-dataTemplate-ID="' + dataID + '"').html(value[dataID]);
            }
        } else {
            $labelElement.html(value);
        }

        var $itemElement = this._$itemTemplate.clone();
        $itemElement.attr({ 'data-tree-id': node.id });
        $itemElement.append($labelElement);

        if (this._hasChildren(node)) {
            $labelElement.before(this.options.handleTemplate.clone().click(function () { self._onHandleClick(this); }));
            $labelElement.dblclick(function () { self._onHandleClick(this); });
  
            if (node.expanded) {
                $itemElement.addClass('dg-tree-parent dg-tree-expanded');
                uiState = {
                    $dataTemplate: $dataTemplate,
                    level: parentUiState.level + 1,
                    $ul: this._$listTemplate.clone()
                        .attr({'data-tree-level': parentUiState.level + 1})
                };
               
                $itemElement.append(this._renderChildren(node, uiState));
            } else {
                $itemElement.addClass('dg-tree-parent dg-tree-collapsed');
            }
        } else {
            $labelElement.before(this.options.handleTemplate.clone().click(function () { self._onNodeClick(this); }));
            $itemElement.addClass('dg-tree-empty');
        }

        return $itemElement;
    },

    /* adds ui elements to parentULelement
     * uiState: 
     *  $dateTemplate: currentDataTemplate
     *  level: parent level
     *  $ul: optional parent ul element
    */
    _renderChildren: function (node, uiState) {
        var nodes = node.children,
            $ul = uiState.$ul;

        if (this._jQueryEmpty($ul))
            uiState.$ul = $ul = this._$listTemplate.clone().attr('data-tree-level', uiState.level);

        for (var nodeID in nodes) {
            $ul.append(this._renderNode(nodes[nodeID], uiState));
        }
       
        return $ul;
    },

    empty: function(nodeID) {
        if (nodeID) {
            this._getNodeUl(nodeID).empty();
            var node = this._nodeIndex[nodeID];
            if (this._hasChildren(node)) {
                for (var i in node.children) {
                    this._removeNodeFromNodeIndex(node.children[i]);
                }
            }
            this.node.children = new Array();
        }
        else {
            this._root.children = new Array();
            this._rootUpdated();
        }
        return this;
    },


    _rootUpdated: function() {
        this._nodesIndex = { };
        this._$rootUl.empty();
        this._populateNodeIndex(this._root);
        this._renderChildren(this._root, {
            level: 0,
            $ul: this._$rootUl,
            $dataTemplate: this.options.dataTemplate
        });
    },

    _hasChildren: function(node) {
        return (node.children && node.children.length > 0);
    },

    _getNodeLi: function (node) {
        return this._$rootUl.find('li[data-tree-id="' + node.id + '"]');
    },
    _getNodeUl: function (node) {
        if (node === this._root) return this._$rootUl;

        return this._$rootUl.find('li[data-tree-id="' + node.id + '"] > ul[class="dg-tree-list"]');
    },

    _getNodeTemplate: function (node) {
        return (node.dataTemplate) ? node.dataTemplate
            : (node.parent) ? this._getNodeTemplate(node.parent) : this.options.dataTemplate;
    },
    _getNodeLevel: function(node) {
        var level = 0;
        while ((node = node.parent)) level++;
        return level;
    },
    _getNodeIndex: function(node) {
        return (node.parent) ? node.parent.children.indexOf(node) : -1;
    },

    _removeNodeFromParent: function(node) {
        var index = this._getNodeIndex(node);
        if (index > -1) node.parent.children.splice(index, 1);
    },

    // removes node from the index
    _removeNodeFromNodeIndex: function (node) {
        delete this._nodeIndex[node.id];
        if (this._hasChildren(node)) {
            for (var childID in node.children) {
                this._removeNodeFromNodeIndex(node.children[childID]);
            }
        }
    },

    // completely removes node
    removeNode: function (node) {
        this._$rootUl.remove('li[data-tree-id="' + node.id + '"]');
        this._removeNodeFromParent(node);
        this._removeNodeFromNodeIndex(node);

    },


    // populates node index with children.  
    _populateNodeIndex: function(node) {
        this._nodeIndex[node.id] = node;
        if (this._hasChildren(node)) {
            var childNode;
            for (var i in node.children) {
                childNode = node.children[i];
                childNode.parent = node;
                this._populateNodeIndex(childNode);
            }
        }
    },

    /** SECTION Toggling **/

    toggleNode: function (node, animate) {
        if (!this._hasChildren(node)) return;
        var toggleSuccess;

        this._trigger("togglestart", null, { node: node });

        if (!node.expanded) {
            toggleSuccess = this.expandNode(node, animate, {});
        } else {
            toggleSuccess = this.collapseNode(node, animate, {});
        }
        if (!toggleSuccess) this._trigger("togglefail", null, { node: node });
    },

    // gets common ui elements and ensures that a toggle can occur.
    _toggleStart: function (node, uiState) {
        if (this._jQueryEmpty(uiState.$li)) uiState.$li = this._getNodeLi(node);

        // in the middle of changing state
        if (uiState.$li.hasClass('dg-tree-toggling')) return false;
        
        return true;
    },

    _doToggle: function (node, animate, uiState, postFunction) {
        uiState.$li.addClass('dg-tree-toggling');
        if (animate) {
            uiState.$ul.toggle(250, function (data) {
                postFunction(node, uiState);
            });
        }
        else {
            uiState.$ul.toggle();
            postFunction(node, uiState);
        }
    },

    /* 
       node: a node object, 
       animate: bool to run animate, 
       uiState: { } node ui Properties
       skipChecks: bool, trust the callee has provided all information.
    */
    expandNode: function (node, animate, uiState) {
        if (node.expanded || !this._toggleStart(node, uiState)) return false;
        if (this._jQueryEmpty(uiState.$dataTemplate)) uiState.$dataTemplate =
                this._getNodeTemplate(node);
        if (uiState.level == null) uiState.level = this._getNodeLevel(node);

        uiState.$li.append(this._renderChildren(node, uiState).css({ display: 'none' }));
        
        return this._doToggle(node, animate, uiState, this._afterExpand);
    },

    _afterExpand: function (node, uiState) {
        uiState.$li.removeClass('dg-tree-collapsed dg-tree-toggling').addClass('dg-tree-expanded');
        node.expanded = true;
    },

    collapseNode: function (node, animate, uiState) {
        if (!node.expanded || !this._toggleStart(node, uiState)) return false;
        if (this._jQueryEmpty(uiState.$ul)) uiState.$ul = this._getNodeUl(node);
        this._doToggle(node, animate, uiState, this._afterCollapse);
        return true;
    },

    _afterCollapse: function (node, uiState) {
        uiState.$li.removeClass('dg-tree-expanded dg-tree-toggling').addClass('dg-tree-collapsed');
        uiState.$ul.remove();
        node.expanded = false;
    },


    /** SECTION Events **/

    _onNodeClick: function (target) {
        this._trigger("click", null, { node: this._nodeIndex[$(target).parent().attr('data-tree-id')] });
    },

    _onHandleClick: function (target) {
        var nodeID = $(target).parent().attr('data-tree-id');
        var node = this._nodeIndex[nodeID];
        this.toggleNode(node, true);
    },

    _jQueryEmpty: function($elem) {
        return (!$elem || $.isEmptyObject($elem));
    },

    _setOption: function (key, value) {
        this._super(key, value);
    },

    _setOptions: function (options) {
        this._super(options);
    },

    destroy: function () {
        this.element.remove(".dg-tree-root");

        // call the base destroy function
        $.Widget.prototype.destroy.call(this);
    }
});