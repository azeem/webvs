import * as _ from "lodash";
import AnalyserAdapter from "../analyser/AnalyserAdapter";
import { IContainer } from "../Component";
import IMain from "../IMain";
import { WebGLVarType } from "../utils";
import ShaderProgram from "../webgl/ShaderProgram";

// An object that encapsulates the generated executable code
// and its state values. Also contains implementations of
// functions callable from expressions
export default class CodeInstance {
    // creates an array of clones of code instances
    public static clone(cloneOrClones: CodeInstance | CodeInstance[], count): CodeInstance[] {
        let clones: CodeInstance[];
        if (!_.isArray(cloneOrClones)) {
            cloneOrClones.cid = 0;
            clones = [cloneOrClones];
        } else {
            clones = cloneOrClones;
        }
        const clonesLength = clones.length;
        if (clonesLength < count) {
            _.times(count - clonesLength, (index) => {
                const clone = Object.create(CodeInstance.prototype);
                _.extend(clone, clones[0]);
                clone.cid = index + clonesLength;
                clones.push(clone);
            });
        } else if (clonesLength > count) {
            clones = _.take(clones, count);
        }
        return clones;
    }

    // copies instance values from one code instance to another
    public static copyValues(dest: CodeInstance, src: CodeInstance) {
        _.each(src, (value, name) => {
            if (!_.isFunction(value) && name.charAt(0) !== "_") {
                dest[name] = value;
            }
        });
    }

    public w: number;
    public h: number;
    public cid: number;
    private bootTime: number;
    private analyser: AnalyserAdapter;
    private registerBank: {[name: string]: number};

    constructor(
        private registerUsages: string[],
        private glslRegisters: string[],
        public hasRandom: boolean,
        private uniforms: string[],
        private preCompute: {[uniformName: string]: string[]},
    ) {}

    // avs expression rand function
    public rand(max) {
        return Math.floor(Math.random() * max) + 1;
    }

    // avs expression gettime function
    public gettime(startTime: number): number {
        switch (startTime) {
            case 0:
                const currentTime = (new Date()).getTime();
                return (currentTime - this.bootTime) / 1000;
            default: throw new Error("Invalid startTime mode for gettime call");
        }
    }

    // avs expression getosc function
    public getosc(band: number, width: number, channel: number): number {
        const osc = this.analyser.getWaveform();
        const pos = Math.floor((band - width / 2) * (osc.length - 1));
        const end = Math.floor((band + width / 2) * (osc.length - 1));

        let sum = 0;
        for (let i = pos; i <= end; i++) {
            sum += osc[i];
        }
        return sum / (end - pos + 1);
    }

    // bind state values to uniforms
    public bindUniforms(program: ShaderProgram) {
        // bind all values
        _.each(this.uniforms, (name) => {
            program.setUniform(name, WebGLVarType._1F, this[name]);
        });

        // bind registers
        _.each(this.glslRegisters, (name) => {
            program.setUniform(name, WebGLVarType._1F, this.registerBank[name]);
        });

        // bind random step value if there are usages of random
        if (this.hasRandom) {
            const step = [Math.random() / 100, Math.random() / 100];
            program.setUniform("__randStep", WebGLVarType._2FV, step);
        }

        // bind precomputed values
        _.each(this.preCompute, (entry, name) => {
            const args = _.map(_.drop(entry), (arg) => {
                if (_.isString(arg)) {
                    if (arg.substring(0, 5) === "__REG") {
                        return this.registerBank[arg];
                    } else {
                        return this[arg];
                    }
                } else {
                    return arg;
                }
            });
            const result = this[entry[0]].apply(this, args);
            program.setUniform(name, WebGLVarType._1F, result);
        });
    }

    // initializes this codeinstance
    public setup(main: IMain) {
        this.registerBank = main.registerBank;
        this.bootTime = main.bootTime;
        this.analyser = main.analyser;
        this.updateDimVars(main.rctx.gl);

        // clear all used registers
        _.each(this.registerUsages, (name) => {
            if (!_.has(main.registerBank, name)) {
                main.registerBank[name] = 0;
            }
        });
    }

    public updateDimVars(gl: WebGLRenderingContext) {
        this.w = gl.drawingBufferWidth;
        this.h = gl.drawingBufferHeight;
    }
}
