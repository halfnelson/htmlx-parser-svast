//import resolve from 'rollup-plugin-node-resolve';
//import commonjs from 'rollup-plugin-commonjs';
//import json from 'rollup-plugin-json';
import ts from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

import pkg from './package.json';

export default [
	{
		plugins: [ts()],
		input: 'src/index.ts',
		output: [
			{ file: pkg.module, format: 'es', sourcemap: false },
			{ file: pkg.main, format: 'cjs', sourcemap: false },
		],
	},
	{
		plugins: [dts()],
		input: 'src/index.ts',

		output: [
			{ file: pkg.module.replace(/\.js$/, '.d.ts'), format: 'es' },
			{ file: pkg.main.replace(/\.js$/, '.d.ts'), format: 'cjs' },
		],
	}, 
];