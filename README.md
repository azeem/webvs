# Webvs

A Winamp AVS like clone in Javascript.

## Demo

http://azeemarshad.in/webvs


## Writing Presets

Presets are written in JSON. The root JSON Object contains the following properties
+ `name` *String* (default: "") : Name of the preset
+ `author` *String* (default: "") : Preset Author information
+ `description` *String* (default: "") : Preset description
+ `clearFrame` *Boolean* (default: false) : Indicates whether every frame should be cleared or not
+ `components` *Array[Objects]* (required) : List of AVS Components. Each component is an object of the form `{"type" : "[ComponentName]", "[ComponentOption]": [OptionValue] .. }`

Supported Components and their options are as follows

### EffectList
Effect list allows offscreen rendering like capabilities. Components within effectlist render to a separate
buffer which can then be blended to the parent.
+ `clearFrame` *Boolean* (default: false) : Indicated whether the internal buffer should be cleared for every frame.
+ `output` *String* (default: "REPLACE") : Output blend mode. This determines how the buffer, after rendering all the components in this list, should be blended to the parent
+ `components` *Array[Objects]* : List of sub components in this effectlist

### SuperScope
SuperScope allows drawing of different kinds of primitives, based on spectrum or waveform data
+ `code` *Object* (required) : AVS Expressions that determine how the scope is drawn.
    + `init` *String* (default: "") : Run once during initialization.
    + `onBeat` *String* (default: "") : Run when a song beat is in progress.
    + `perFrame` *String* (default: "") : Run once for every frame.
    + `perPoint` *String* (default: "") : Run once for every point.

    AVS Expression variables available in SuperScope code and their meanings are as follows.
    + `n` (default: 100) : determines the number of points in the scope. Assign to change number of points
    + `w`, `h` : the width and height of the screen.
    + `b` : 1 if a beat is in progress 0 otherwise.
    + `x`, `y` : float values ranging from -1 to 1. determines the position of a point. Assign in perPoint code.
    + `red`, `green`, `blue` (default: computed by `colors` setting) : float values ranging from 0 to 1. Assign in perPoint code to change color of each point.
    + `v` : float value ranging from -1 to 1. Gives the value of the scope (waveform data or spectrum data) at current point. Use inside perPoint code.
    + `i` : float value ranging from 0 to 1. Gives the index of the current point. 0 being first point and 1 being the last. Use inside perPoint code.
+ `spectrum` *Boolean* (default: false) : If set then the data in the scope code will be spectrum values, otherwise waveform.
+ `dots` *Boolean* (default: false) : If set then only dots are drawn at point positions. Otherwise lines are drawn between points.
+ `colors` *Array[Array[Int]]* (default: [[255,255,255]]) : Decides the color of all pixels for a frame. The colors are cycled through smoothly for each frame. Per point color values can be overridden by assigning to red, green, blue variables in perPoint code
+ `thickness` *Int* (default: 1) : Determines the line width or dot size.

### DynamicMovement
DynamicMovement allows displacing pixels based on AVS expressions.
+ `code` *Object* (required) : AVS Expressions that determine how the pixels should be displaced.
    + `init` *String* (default: "") : Run once during initialization
    + `onBeat` *String* (default: "") : Run when a song beat is in progress
    + `perFrame` *String* (default: "") : Run once every frame
    + `perPixel` *String* (default: ""): Run once for every pixel to be displaced

    AVS Expression variables available in DynamicMovement and their meanings are as follows
    + `x`, `y` : float values ranging from -1 to 1 containing position of pixel. Assign to change the position.
    + `r`, `d` : float values ranging from -$PI to $PI and 0 to sqrt(2), containing the polar coordinate position of the pixel. Assign to change position. Works only in polar coordinate mode.
    + `w`, `h` : the width and height of the screen.
    + `b` : 1 if a beat is in progress 0 otherwise.
+ `coord` *String* (default: "POLAR") : "POLAR" or "RECT", determines the coordinate mode for the displacement.
+ `gridW`, `gridH` *Int* (default: 16, 16) : Decides the grid width and grid height. To avoid computing displaced positions for all pixels, the screen is divided into a grid. `perPixel` code is run once for every grid intersection points, remaining positions are interpolated.

### ChannelShift
ChannelShift allows rearranging rgb values of all pixels.
+ `channel` *String* (default: "RGB") : "RGB", "RBG", "BRG", "BGR", "GBR" or"GRB", determines how the output pixel are mapped
+ `onBeatRandom` *Boolean* (default: false) : Randomly change channel setting when a beat occurs.

### Convolution
Convolution applies a simple 3x3 convolution kernel
+ `kernel` *Array[Float]* (required) - Array of 3*3=9 values containing the 3x3 kernel values.

### FadeOut
FadeOut fades the screen out at fixed speed.
+ `speed` *Float* (default: 1) - float value ranging from 0 to 1 that determines how quickly the screen fades out. 0 being no effect and 1 being clear every screen
+ `color` *Array[Int]* (default: [0,0,0]) - rgb tuple containing color the which the screen fades.

### OnBeatClear
OnBeatClear clears the buffer when a beat occurs
+ `n` *Number* (default: 1) : The buffer is cleared every `n` beats
+ `color` *Array[Number]* (default: [0,0,0]) : rgb tuple for the color to which the screen will be cleared
+ `blend` *Boolean* (default: false) : if set, the current buffer will be 50/50 blended with cleared buffer

### Picture
Displays a picture at a fixed location
+ `src` *String* (required) : location for the image
+ `x` *Number* (required) : x position of the image
+ `y` *Number* (required) : y position of the image

### Example

        {
            "name" : "Science of Superscope",
            "author" : "Marco",
            "clearFrame": false,
            "components": [
                {
                    "type": "EffectList",
                    "output": "ADDITIVE",
                    "components": [
                        {
                            "type": "FadeOut",
                            "speed": 0.4
                        },
                        {
                            "type": "SuperScope",
                            "code": {
                                "init": "n=800",
                                "onBeat": "t=t+0.3;n=100+rand(900);",
                                "perFrame": "t=t-v*0.5",
                                "perPoint": "d=D/n;r=(i-(t*3)); x=(atan(r+d-t)*cos(r+d-t+i)); y=((i+cos(d+v*1.2))-1.5)*1.7;z=-(cos(t+i)+log(v)*cos(r*3))*3;red=cos(r)+1;blue=sin(r);green=sin(i)/2"
                            }
                        },
                    ]
                },
                {
                    "type": "Convolution",
                    "kernel": "blur"
                },
                {
                    "type": "Convolution",
                    "kernel": "blur"
                },
                {
                    "type": "OnBeatClear"
                }
            ]
        }