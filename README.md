# Webvs

A Winamp AVS like clone in Javascript.

## Demo

http://azeemarshad.in/webvs


## Writing Presets

Presets are written in JSON. The root JSON Object contains the following properties
+ **name** *String* (default: "") - Name of the preset
+ **author** *String* (default: "") - Preset Author information
+ **description** *String* (default: "") - Preset description
+ **clearFrame** *Boolean* (default: false) - Indicates whether every frame should be cleared or not
+ **components** *Array[Objects]* (required) - List of AVS Components. Each component is an object of the form `{"type" : "[ComponentName]", "[ComponentOption]": [OptionValue] .. }`

Supported Components and their options are as follows

### EffectList
Effect list allows offscreen rendering like capabilities. Components within effectlist render to a separate
buffer which can then be blended to the parent.
+ **clearFrame** *Boolean* (default: false) - Indicated whether the internal buffer should be cleared for every frame.
+ **output** *String* (default: "REPLACE") - Output blend mode. This determines how the buffer, after rendering all the components in this list, should be blended to the parent
+ **components** *Array[Objects]* - List of sub components in this effectlist

### OnBeatClear
OnBeatClear clears the buffer when a beat happens
+ **n** *Number* (default: 1) - The buffer is cleared every `n` beats
+ **color** *Array[Number]* (default: [0,0,0]) - rgb tuple for the color to which the screen should be cleared
+ **blend** *Boolean* (default: false) - if set, the current buffer will be 50/50 blended with cleared buffer

### Picture
Displays a picture at a fixed location
+ **src** *String* (required) - location for the image
+ **x** *Number* (required) - x position of the image
+ **y** *Number* (required) - y position of the image

### SuperScope
SuperScope allows us to draw different kinds of primitives, based on spectrum or waveform data
+ **code** *Object* (required) - AVS Expressions that determine how the scope is drawn.
    + **init** *String* (default: "") - Run once during initialization.
    + **onBeat** *String* (default: "") - Run when a song beat is in progress.
    + **perFrame** *String* (default: "") - Run once for every frame.
    + **perPoint** *String* (default: "") - Run once for every point.

    AVS Expression variables available in SuperScope code and their meanings are as follows.
    + **n** (default: 100) - determines the number of points in the scope. Assign to change number of points
    + **w**, **h** - the width and height of the screen.
    + **b** - 1 if a beat is in progress 0 otherwise.
    + **x**, **y** - float values ranging from -1 to 1. determines the position of a point. Assign in perPoint code.
    + **red**, **green**, **blue** (default: computed by color setting) - float values ranging from 0 to 1. Assign in perPoint code to change color of each point.
    + **v** - float value ranging from -1 to 1. Gives the value of the scope (waveform data or spectrum data) at current point. Use inside perPoint code.
    + **i** - float value ranging from 0 to 1. Gives the index of the current point. 0 being first point and 1 being the last. Use inside perPoint code.
+ **spectrum** *Boolean* (default: false) - If set then the data in the scope code will be spectrum values, otherwise waveform.
+ **dots** *Boolean* (default: false) - If set then only dots are drawn at point positions. Otherwise lines are drawn between points.
+ **colors** *Array[Array[Int]]* (default: [[255,255,255]]) - Decides the color of all pixels for a frame. The colors are cycled through smoothly for each frame. Per point color values can be overridden by assigning to red, green, blue variables in perPoint code
+ **thickness* *Int* (default: 1) - Determines the line width or dot size.