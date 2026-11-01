declare module "*.pegjs" {
    export function parse(input: string, options?: object): unknown;
}
