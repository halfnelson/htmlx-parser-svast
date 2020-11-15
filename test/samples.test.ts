import * as path from 'path';
import * as fs from 'fs';

import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { parse } from '../src/index'; 

const fixtures = path.join(__dirname, 'samples');

const inputs = fs
	.readdirSync(fixtures, { encoding: 'utf-8', withFileTypes: true })
	.filter(f => f.isDirectory() && !f.name.match(/\.skip$/))
	.map((f) => f.name)

const samples = suite('samples');

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