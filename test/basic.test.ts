import { suite } from 'uvu'
import { parseSvelte } from '../src/parser'
import * as assert from 'uvu/assert'
import { CstNode } from 'chevrotain';

const parser = suite('parser');

parser('returns cstNode', () => {
    const res: CstNode = parseSvelte('<h1></h1>')
    assert.ok(res)
    assert.equal(res.name, 'tag_content');
})

parser.run();