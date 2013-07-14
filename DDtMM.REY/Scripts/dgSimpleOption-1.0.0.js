/*
Creates a group of selectable items.
*/
(function () {
	// closure for "global" counter
	var unspecifiedGroupIDCounter = -999999999;

	$.widget("dg.simpleOption", {
		groups: {}
		,

		options: {
			autoSelectFirst: true,
			selectedClass: 'sel',
			itemClass: '',
			groupID: '',
			// mode: group either 'item', or item's 'children'.
			mode: 'item',
		
		},

		_create: function () {
			// create a group id if one is not given
			if (!this.options.groupID) this.options.groupID = unspecifiedGroupIDCounter++;

			if (this.options.mode == 'item') {
				this._addItem(this.element, this.options.groupID);
			} else if (this.options.mode == 'children') {
				this.add(this.element.children());
			}
		},

		// adds an element to the same group and with the same Css Class options
		add: function ($element) {
			$element.simpleOption({ 
				groupID: this.options.groupID, 
				selectedClass: this.options.selectedClass,
				itemClass: this.options.itemClass
			});
		},

		_addItem: function ($element) {
			var groupID = this.options.groupID;

			// add element and create group if required
			if (!(group = this.groups[groupID])) {
				this.groups[groupID] = group = {
					items: [],
					selectedItem: null
				};
			}
			group.items.push($element[0]);

			$element.on('click', function () {
				$(this).simpleOption('select');
			});

			if (group.itemClass) $element.addClass(group.itemClass);
			if (group.items.length == 1 && this.options.autoSelectFirst) {
				this.select();
			}
		},

		select: function() {
			var // the group id may have changed since this was created.
				group = this.groups[this.options.groupID],
				selectedClass = this.options.selectedClass,
				$this = $(this.element),
				deselected;

			deselected = $(group.items)
				.filter('[class~="' + selectedClass + '"]')
				.removeClass(selectedClass)
				.trigger('deselected');

			group.selectedItem = this.element;

			$this
				.addClass(selectedClass)
				.trigger('selected', { selected: $this, deselected: deselected });
		},

		selectedItem: function(group) {
			if (!group) group = this.groups[this.options.groupID];
			return group.selectedItem;
		},

		selectNext: function() {
			var group = this.groups[this.options.groupID],
				selected,
				index;

			if (group.items.length) {
				if (!(selected = this.selectedItem(group)) ||
					(index = group.items.indexOf(selected) + 1) >= group.items.length) {

					index = 0;
				}
				$(group.items[index]).simpleOption('select');
			} else {
				group.selectedItem = null;
			}


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
}).call();