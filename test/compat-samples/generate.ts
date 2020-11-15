import * as path from 'path';
import * as fs from 'fs';
import { parse } from 'svelte-parse';


const fixtures =__dirname;

const inputs = fs
	.readdirSync(fixtures, { encoding: 'utf-8', withFileTypes: true })
	.filter(
		f => f.isDirectory()
	)
    .map((f) => f.name)
    
inputs.forEach(sample_folder => {
    const input = fs.readFileSync(path.join(fixtures, sample_folder, 'input.svelte')).toString().replace(/\r\n/gi, "\n");
    const expected = parse({value: input, generatePositions: true});
    fs.writeFileSync(path.join(fixtures, sample_folder, 'output.json'), JSON.stringify(expected, null, 2));
})
