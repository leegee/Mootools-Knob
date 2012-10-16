Mootools-Knob
=============

Provides a rotary knob control for Mootools

![Screenshot](https://raw.github.com/leegee/Mootools-Knob/master/Docs/screenshot.png)

How to use
----------

Until docs are written, please see Docs/index.html for a working example

This widget aims to provide a rotary knob control for MooTools.

A *Knob* object can be instantiated with a variety of options,
and the library also parses the DOM for elements with class *.mooknob*,
replacing each with an instance of the Knob control.

CSS
---

As seems to be usual for MooTools, no CSS is supplied. However,
the Docs/index.html page contains some examples. A basic gray
and round knob can be achieved without graphics if you client
supports the *border-radius* property of CSS3:

	<style>
	.rotary {
		border: 1px solid black;
		background: silver;
		text-align: center;
		border-radius: 50%;
		font-weight: bold;
		font-size:28pt;
		width: 32pt;
		height: 32pt;
	}
	</style>	

If you place in your knob-to-be element a UTF-8 up-arrow of some kind, 
it looks passable.

Use in HTML, without Javascript
-------------------------------

The widget can be configued using the attribute of any element 
which it consumes.

The range of values the widget will supports defaults to +/-100,
but can be set with the aria-valuemin and aria-valuemax attributes 
of the element. 

The initial value can be set via the value attribute
or data-value attribute. 

The chosen value of the control will be placed
in the aria-valuenow and aria-valuetext attributes, and in the value
attribute, if present, otherwise in the data-value attribute.

For example, the following element will produce a rotary knob with
an up-arrow (↑), an initial value of 10, and range between -20 and 20:

	<span id='knob1' 
		data-value='10' 
		aria-valuemin='-20'
		aria-valuemax='20'
	>↑</span>

JavaScript API
--------------

The equivalent to the above HTML would be:

	new Knob({
		element: 'knob1',
		range: [-20, 20],
		value: 10
	});
	
The following events are supplied:

* **onMousedown**: fired when the knob is clicked
* **onMouseup**: fired when the knob is released but before it is rendered
* **	onTick**: fired as the knob is turned

The **onTick** event is intended to allow the user to adjust the behaviour 
of the widget, using the following object fields:

* **x** and **y** represent the position of the mouse curosr relative to the knob
* **movement**  contains the greater of these two, 
* **value** contains the previous value incremented by **movement** multiplied by the value of the **scale** option (*this.options.scale*).
* **degrees** contains the amount by which the knob will be rotated, and can be set in accordance with the values accepted by the CSS3 Transform/rotate property (0-360, afik)
	
The **onTick** event could just be used to update a text display field.


