import * as path from 'path';
import * as fs from 'fs';

import { parse } from '../src/index'; //Modified to suit htmlx-parser-svast

const fixtures = path.join(__dirname, 'compat-samples');

const inputs = fs
	.readdirSync(fixtures, { encoding: 'utf-8', withFileTypes: true })
	.filter(
		f => f.isDirectory()
	)
	.map((f) => f.name)
    .filter(n => !n.match(/\.skip$/))


import { suite } from 'uvu';
import * as assert from 'uvu/assert';

const samples = suite('compat-sample');

inputs.forEach(sample_folder => {
	samples(`inputs should equal outputs: ${sample_folder}`, () => {
        const input = fs.readFileSync(path.join(fixtures, sample_folder, 'input.svelte')).toString().replace(/\r\n/gi, "\n");
        const expected = JSON.parse(
			fs.readFileSync(path.join(fixtures, sample_folder, 'output.json')).toString()
		)
		assert.equal(parse(input).ast, expected);
	});
});

samples.run();