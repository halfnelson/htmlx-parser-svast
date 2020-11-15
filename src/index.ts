import { parseHtmlxToCst } from './parser'
import { cstToSvast } from './cst-to-svast'

const existingTrimRight = (String.prototype.trimEnd || String.prototype.trimRight);
const trimRight = existingTrimRight ? (s: String) => existingTrimRight.apply(s) : (s: String) => ('*'+s).trim().substring(1);

export function parse(input: string) {
    let cstRes = parseHtmlxToCst(trimRight(input));
    let astRes = cstToSvast(cstRes.cst);
    return {
        ast: astRes,
        parser_errors: cstRes.parse_errors,
        lexer_errors: cstRes.lex_errors
    }
}