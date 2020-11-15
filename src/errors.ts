import { ILexingError, IRecognitionException } from "chevrotain";
import { Point } from "svast";
import { end, start } from "./util";

export type ParseError = {
    source: "Lexer" | "Parser"
    name: string
    message: string    
    position: {
        start: Point,
        end: Point
    }
}

export function lexerError(error: ILexingError): ParseError {
    return {
        source: "Lexer",
        name: "Lexing Error",
        message: error.message,
        position: {
            start: {
                line: error.line,
                column: error.column,
                offset: error.offset
            },
            end: {
                line: error.line,
                column: error.column + length, //TODO ensure there are no new lines, maybe use locator
                offset: error.offset + length
            }
        }
    }
}

export function parserError(error: IRecognitionException): ParseError {
    return {
        source: "Parser",
        name: error.name,
        message: error.message,
        position: {
            start: start(error.token),
            end: error.resyncedTokens.length ? end(error.resyncedTokens[error.resyncedTokens.length - 1]) : end(error.token)
        }
    }
}
