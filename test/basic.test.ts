import { suite } from 'uvu'
import { parseHtmlxToCst } from '../src/parser'
import * as assert from 'uvu/assert'

const parser = suite('parser');

parser('returns cstNode', () => {
    const res = parseHtmlxToCst('<h1></h1>')
    assert.ok(res);
    assert.equal(res.lex_errors.length, 0);
    assert.equal(res.parse_errors.length, 0)
    assert.equal(res.cst.name, 'tag_content');
})

parser.run();