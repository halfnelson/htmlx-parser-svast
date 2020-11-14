import { parseHtmlxToCst } from './parser'
import { cstToSvast } from './cst-to-svast'

export function parse(input: string) {
    let cstRes = parseHtmlxToCst(input);
    let astRes = cstToSvast(cstRes.cst);
    return {
        ast: astRes,
        parser_errors: cstRes.parse_errors,
        lexer_errors: cstRes.lex_errors
    }
}