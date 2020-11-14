import * as path from 'path';
import * as fs from 'fs';

import { parse } from '../../src/index'; //Modified to suit htmlx-parser-svast

const fixtures = path.join(__dirname, 'fixtures');

const inputs = fs
	.readdirSync(fixtures, { encoding: 'utf-8', withFileTypes: true },)
	.filter(
		f => f.isDirectory()
	)
	.map((f) => [
		f.name,
		fs.readFileSync(path.join(fixtures, f.name, 'input.svelte')).toString().replace(/\r\n/gi, "\n"),
		JSON.parse(
			fs.readFileSync(path.join(fixtures, f.name, 'output.json')).toString()
		),
	])

const input_outputs = inputs.filter((a,i) => i < 1); //.map(([f, input, output]) => {
	// if (f === '02-Table-Table') {
	// 	console.log(
	// 		JSON.stringify(parse({ value: input, generatePositions: false }), null, 2)
	// 	);
	// }
//	return [f, input, output];
//});

import { suite } from 'uvu';
import * as assert from 'uvu/assert';

const samples = suite('parsing-samples');

input_outputs.forEach(([testname, input, output], i) => {
	samples(`inputs should equal outputs: ${testname}`, () => {
		assert.equal(parse(input).ast, output );
	});
});

samples.run();
