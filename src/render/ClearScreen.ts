/**
 * Copyright (c) 2013-2015 Azeem Arshad
 * See the file license.txt for copying permission.
 */
import * as _ from 'lodash';
import IMain from '../IMain';
import Component, {IContainer} from '../Component';
import ShaderProgram from '../webgl/ShaderProgram';
import ClearScreenProgram from '../webgl/ClearScreenProgram';
import {Color, BlendModes, parseColorNorm} from '../utils';

interface ClearScreenOpts {
    beatCount: number,
    color: string,
    blendMode: string
}

// A component that clears the screen
export default class ClearScreen extends Component {
    static componentName = "ClearScreen";
    static componentTag = "render";
    protected static defaultOptions: ClearScreenOpts = {
        beatCount: 0,
        color: "#000000",
        blendMode: "REPLACE"
    }
    protected static optUpdateHandlers = {
        color: "updateColor",
        blendMode: "updateProgram"
    }

    private prevBeat: boolean;
    private beatCount: number;
    private program: ClearScreenProgram;
    private color: Color;
    protected opts: ClearScreenOpts;

    constructor(main: IMain, parent: IContainer, opts: any) {
        super(main, parent, opts);
    }

    init() {
        this.prevBeat = false;
        this.beatCount = 0;

        this.updateColor();
        this.updateProgram();
    }

    draw() {
        let clear = false;
        if(this.opts.beatCount === 0) {
            clear = true;
        } else {
            if(this.main.analyser.beat && !this.prevBeat) {
                this.beatCount++;
                if(this.beatCount >= this.opts.beatCount) {
                    clear = true;
                    this.beatCount = 0;
                }
            }
            this.prevBeat = this.main.analyser.beat;
        }

        if(clear) {
            this.program.run(this.parent.fm, null, this.color);
        }
    }

    destroy() {
        super.destroy();
        this.program.destroy();
    }

    updateColor() {
        this.color = parseColorNorm(this.opts.color);
    }

    updateProgram() {
        const blendMode = BlendModes[this.opts.blendMode];
        const program = new ClearScreenProgram(this.main.rctx, blendMode);
        if(this.program) {
            this.program.destroy();
        }
        this.program = program;
    }
}