import { suite } from 'uvu'
import { parseHtmlxToCst } from '../src/parser'
import * as assert from 'uvu/assert'

const parser = suite('parseHtmlxToCst');

parser('returns cstNode', () => {
    const res = parseHtmlxToCst('<h1></h1>')
    assert.ok(res);
    assert.ok(res.cst?.name);
})

parser('returns lexErrors', () => {
    const res = parseHtmlxToCst('<h1') //TODO: workout how to make this throw an error :)
    assert.ok(res);
    assert.ok(Array.isArray(res.lex_errors));
})

parser('returns parseErrors', () => {
    const res = parseHtmlxToCst('<h1')
    assert.ok(res);
    assert.ok(Array.isArray(res.parse_errors));
    assert.ok(res.parse_errors.length > 0);
})

parser('handles self closing tags', () => {
    const res = parseHtmlxToCst('<article><p>test1<p>test2</article>')
    assert.ok(res)
    assert.equal(res.parse_errors, [])
})

parser('handles void tags', () => {
    const res = parseHtmlxToCst('<input><area><hr>')
    assert.ok(res)
    assert.equal(res.parse_errors, [])
})

parser.run();