import { Point, Root } from 'svast';

export type ParseError = {
    source: "Lexer" | "Parser"
    name: string
    message: string    
    position: {
        start: Point,
        end: Point
    }
}

declare type ParseResult = {
    ast: Root;
    errors: ParseError[]
};

declare function parse(input: string): ParseResult;

export { parse };
