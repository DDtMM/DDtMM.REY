/*
dgSimpleTree version 1.0.5

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
        this._root = { children: new Array(), value: null, id: '_0_', expanded: true };
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

    addNode: function (node, parentID, startIndex) {
        this.addNodes([node], parentID);
    },

    addNodes: function (nodes, parentID, startIndex) {

        var parentNode = (!parentID) ? this._root : this._nodeIndex[parentID];
        if (!parentNode.children) {
            parentNode.children = new Array();
        }

        var node,
            nodesToAdd = [];

        for (var i in nodes) {
            node = this._executeNodeTransform(nodes[i]);
            // if transform did not include id, create one.
            if (node.id === undefined) node.id = parentNode.id + '.' + i;
            nodesToAdd.push(node);
            node.parent = parentNode;
            this._populateNodeIndex(node);
        }

        // insert children if start is specified
        if (startIndex !== undefined && startIndex > -1 && startIndex < parentNode.children.length) {
            parentNode.children = parentNode.children.slice(0, startIndex)
                .concat(nodesToAdd, parentNode.children.slice(startIndex));
        } else {
            parentNode.children = parentNode.children.concat(nodesToAdd);
        }

        if (parentNode.expanded) {
            this._renderChildren(parentNode, {
                level: this._getNodeLevel(parentNode),
                $dataTemplate: this._getNodeTemplate(parentNode),
                $ul: this._getNodeUl(parentNode)
            });
        }
        
    },

    
    // swaps all nodes in the tree, attempting to maintain open and closed state
    swapNodes: function (nodes) {
        var newNode;
        var expanded = this._nodesWithProperty(this._root.children, 'expanded', true);

        this.empty();
        this.addNodes(nodes);
        this.expandNodes(expanded);
    },

    // exchanges node with matching id.
    swapNode: function(node) {
        var originalNode = this.getNode(node.id);
        var nodeIndex = originalNode.parent.indexOf(originalNode);
        this.removeNode(originalNode);
        this.addNode(node, originalNode.parent.id, nodeIndex);

        if (originalNode.expanded) {
            this.expandNode(node, false);
            this.expandNodes(this._nodesWithProperty(originalNode.children, 'expanded', true));
        }
    },

    // returns all node ids representing a node with a given propertyname and value;
    _nodesWithProperty: function(nodes, propName, propVal) {
        var node,
            results = [];

        for (var i in nodes) {
            node = nodes[i];
            if (node[propName] == propVal) results.push(node.id);
            if (this._hasChildren(node)) {
                results = results.concat(this._nodesWithProperty(node.children, propName, propVal));
            }
        }

        return results;
    },

    _renderNode: function (node, parentUiState) {
        var value = node.value,
            dataID;

        var $dataTemplate = (node.dataTemplate) ? node.dataTemplate : parentUiState.$dataTemplate;
        var $labelElement = $dataTemplate.clone();
   
        var self = this;
        var uiState;

        // handle label click.
        $labelElement.on('click mousedown mouseup mouseover mouseleave', function (ev) {
            self._onNodeEvent(ev, this);
        });

        // set label text, if node value is an object then we want to update template, otherwise just use the value.
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
            $labelElement.before(this.options.handleTemplate.clone().click(function (ev) {
                self._onHandleClick(this);
                ev.preventDefault();
            }));
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
            $labelElement.before(this.options.handleTemplate.clone().on(
                'click mousedown mouseup mouseover mouseleave', function (ev) {
                    self._onNodeEvent(ev, $labelElement);
            }));
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

        $ul.empty();

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

    getNodeLi: function (node) {
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

    // gets node from element (dom or jquery), moving up the tree until it finds data-tree-id attribute
    getElementNode: function ($element) {
        if ($element) {
            if (!$element.jquery) $element = $($element);
            if ($element.length > 0) {
                var nodeID = $element.attr('data-tree-id');
                if (nodeID !== undefined) return this.getNode(nodeID);
                else if ($element != this._$rootUl) {
                    return this.getElementNode($element.parent());
                }
            }
        }
        return null;
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
            toggleSuccess = this.expandNode(node, animate);
        } else {
            toggleSuccess = this.collapseNode(node, animate, {});
        }
        if (!toggleSuccess) this._trigger("togglefail", null, { node: node });
    },

    // gets common ui elements and ensures that a toggle can occur.
    _toggleStart: function (node, uiState) {
        if (this._jQueryEmpty(uiState.$li)) uiState.$li = this.getNodeLi(node);

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
       uiState: bag of node ui Properties (internal use only)
    */
    expandNode: function (node, animate, uiState) {
        // start ui state
        if (!uiState) uiState = {};
        if (node.expanded || !this._toggleStart(node, uiState)) return false;
        if (this._jQueryEmpty(uiState.$dataTemplate)) uiState.$dataTemplate =
                this._getNodeTemplate(node);
        if (uiState.level == null) uiState.level = this._getNodeLevel(node);

        uiState.$li.append(this._renderChildren(node, uiState).css({ display: 'none' }));
        
        return this._doToggle(node, animate, uiState, this._afterExpand);
    },

    // expands an array of node ids
    expandNodes: function(nodeIDs, animate) {
        var node;
        for (var i in nodeIDs) {
            if ((node = this._nodeIndex[nodeIDs[i]])) {
                this.expandNode(node, animate);
            }
        }
    },

    refreshNode: function(node) {
        if (node.parent.expanded) {
            this.getNodeLi(node).replaceWith(
                this._renderNode(node, {
                    level: this._getNodeLevel(node),
                    $dataTemplate: this._getNodeTemplate(node)
                })
            );
        }
    },

    _afterExpand: function (node, uiState) {
        uiState.$li.removeClass('dg-tree-collapsed dg-tree-toggling').addClass('dg-tree-expanded');
        node.expanded = true;
    },

    collapseNode: function (node, animate, uiState) {
        if (!uiState) uiState = {};
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
    // bubble up node event
    _onNodeEvent: function (ev, nodeElement) {
        var node = this.getElementNode(nodeElement);
        if (node != null) {
            this._trigger(ev.type, null, { node: node });
        }
    },

    _onHandleClick: function (target) {
        var nodeID = $(target).parent().attr('data-tree-id');
        var node = this._nodeIndex[nodeID];
        this.toggleNode(node, true);
    },

    _jQueryEmpty: function($elem) {
        return (!$elem || $.isEmptyObject($elem));
    },

    /** SECTION options **/
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