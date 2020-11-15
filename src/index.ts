import { parseHtmlxToCst } from './parser'
import { cstToSvast } from './cst-to-svast'
import { ParseError, parserError, lexerError } from './errors'
import { Root } from 'svast';

type ParseResult = {
    ast: Root,
    errors: ParseError[]
}

export function parse(input: string): ParseResult {
    let cstRes = parseHtmlxToCst(input);
    let astRes = cstToSvast(cstRes.cst);
    return {
        ast: astRes,
        errors: [
            ...cstRes.lex_errors.map(lexerError),
            ...cstRes.parse_errors.map(parserError)
        ]
    }
}