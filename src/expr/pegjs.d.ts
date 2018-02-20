declare module '*.pegjs' {
    interface Parser {
        parse(string): any
    }
    const parser: Parser;
    export default parser;
}