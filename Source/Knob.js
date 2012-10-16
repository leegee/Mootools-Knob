/*
---
description: A rotary knob input control

license: MIT-style

authors:
- Lee Goddard

requires:
- Core

provides: [Knob]

*/

/*
	Version 0.1

	This code is copyright (C) 2012 Lee Goddard, Server-side Systems Ltd.
	All Rights Reserved.
	
	Available under the same terms as Perl5.

	Provides events:
	
		onMousedown - when the knob is clicked
		onTick - every time the knob turns
		onMouseup - when the knob is released
*/

var __ActiveMooToolsKnobCtrl__ = null;

var Knob = new Class({
	Implements: [Options, Events],
	
	options: {
		element: 		null,	/* conatiner to replace with canvas/image */
		value:			0,		/* Initial value of control: if not supplied, taken from attributes 'value' or 'data-value' */
		range:			[-100, 100], 	/* Minimum and maximum values */
		scale:			1,		/* Multiplier applied to number of px moved, to acheive change in .value */
		
		onTick:			function(){},
		onMousedown: 	function(){},
		onMouseUp:		function(){}
	},

	element:			null,
	movement:		null,	/* The Euclidean distance of dragged cursor from origin in element  */
	anchor:			null,	/* Position of element at knob mouse down */
	value:			null,	/* Actual value of control */
	initialValue:	null,	/* Cache of 'value', prior to drag starts */
	finalValue:		null,	/* When drag ends and is not canceled */
	dragging:		false,	/* Flag */
	
	initialize: function( options, actx ){
		var self = this;
		this.setOptions(options);
		
		this.element = (typeof this.options.element == 'string')?
			document.id(this.options.element) 
			: this.element = this.options.element;
			
		var block = this.element.getStyle('display');
		if (block=='inline' || block=='')
			this.element.setStyle('display', 'inline-block'); 
			
		this.value = this.options.value;
		this.element.store('self', this);
		this.attach();
	},

	attach: function(){
		this.element.addEvent('mousedown', this.mousedown);
	},

	destroy: function(){ this.detach() },
	
	detach: function(){
		this.element.removeEvent('mousedown', this.mousedown);
		if (this.dragging) 
			window.removeEvent('mouseup', __ActiveMooToolsKnobCtrl__.mouseup);
		if (__ActiveMooToolsKnobCtrl__) 
			window.removeEvent('mousemove', __ActiveMooToolsKnobCtrl__.mousemove);
	},
	
	mousedown: function(e){
		// Get element position here, not earlier, to allow for resizing:
		var self = this.retrieve('self');
		e.stop();
		self.anchor = this.getPosition();
		self.initialValue = self.value;
		window.addEvent('mousemove', self.mousemove );
		// How to maintain lexical context?
		window.addEvent('mouseup', self.mouseup );
		self.dragging = true;
		__ActiveMooToolsKnobCtrl__ = self;
		self.fireEvent('mousedown');
	},
	
	mouseup: function(e){
		var self = __ActiveMooToolsKnobCtrl__;
		e.stop();
		window.removeEvent('mousemove', self.mousemove);
		window.removeEvent('mouseup', self.mouseup);
		self.dragging = false;
		self.fireEvent('mouseup');
		__ActiveMooToolsKnobCtrl__ = null;
	},
	
	/* Sets the x, y field as the position of the mouse curosr relative to the knob,
	   sets the movement field as the greater of these two, 
	   and increments the value field by 'movement' multiplied by the value of
	   the scale field. 
	   If there is a range field, and the value falls outside of it,
	   the value is constrained.
	   The value field is passed to the degree field,
	   and then the onTick event is fired, to allow something interesting
	   to be done with these fields, prior to the CSS 'rotate' transformation,
	   which uses the degree field.
	*/
	mousemove: function(e){
		var self = __ActiveMooToolsKnobCtrl__;
		if (!self.dragging) return;
		
		e.stop();
		if (window.getSelection && document.createRange) {
			var sel = window.getSelection();
			sel.removeAllRanges();
		}
    	
		self.x = e.page.x - self.anchor.x;
		self.y = e.page.y - self.anchor.y;
        // var d = Math.sqrt(  Math.pow(self.anchor.x + x, 2)  + Math.pow(self.anchor.y + y, 2)  );
		
		self.movement = (Math.abs(self.x) > Math.abs(self.y)? self.x : self.y);
		self.value    = self.initialValue + ( self.movement * self.options.scale);
		
		if (self.options.range){
			if (self.value < self.options.range[0]) self.value = self.options.range[0];
			else if (self.value > self.options.range[1]) self.value = self.options.range[1];
		}
		
		if (self.element.get('value')) self.element.set('value', self.value);
		
		self.degrees = self.value;
		
		var range = self.options.range[0] * -1
			+ Math.abs( self.options.range[1] );
		self.degrees = self.value * (360 / range);

		self.fireEvent('tick');
		self.element.setStyles({ 
			'transform': 'rotate('+self.degrees+'deg)',
			'-ms-transform': 'rotate('+self.degrees+'deg)',
			'-webkit-transform': 'rotate('+self.degrees+'deg)',
			'-o-transform': 'rotate('+self.degrees+'deg)',
			'-moz-transform': 'rotate('+self.degrees+'deg)',
		});
	}
});


Knob.parseDOM = function( selector ){
	selector = selector || '.mooknob';
	$$(selector).each( function(el){
		var opts = {
			element:	 el,
		};
		Object.keys(el.dataset).each( function(i){
			opts[i] = eval( el.dataset[i] );
		});
		
		if (el.get('value')) 
			opts.value = el.get('value') || el.dataset.value || 0;
		new Knob(opts);
	});
}	

document.addEvent('domready', function(){
	Knob.parseDOM();	
});

