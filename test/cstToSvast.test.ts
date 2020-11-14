import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { parseHtmlxToCst } from '../src/parser'
import { cstToSvast } from '../src/cst-to-svast'


const converter = suite('cstToSvast');


function cst(input: string) {
    return parseHtmlxToCst(input).cst;
}


converter("returns a Root", () => {
    const input = cst('{#each blah}<h1 prop=ten>hi</h1>{/each}');
    const res = cstToSvast(input);
    console.log(JSON.stringify(res,null,2));
    assert.ok(res);
    assert.is(res.type, "root")
})




converter.run();



