import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import ts from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser'

import pkg from './package.json';

export default [
	{
		plugins: [resolve(),commonjs(),ts()],
		input: 'src/index.ts',
		onwarn: shoosh,
		output: [
			{ file: pkg.module, format: 'es', sourcemap: false },
			{ file: pkg.main, format: 'cjs', sourcemap: false },
			{ file: pkg.module.replace(/\.js$/, '.min.js'), format: 'es', plugins: [terser()]},
			{ file: pkg.main.replace(/\.js$/, '.min.js'), format: 'cjs', plugins: [terser()]}
		],
	},
];

function shoosh( warning, warn) {
	if (warning.code == 'CIRCULAR_DEPENDENCY') {
		if (/node_modules.*?chevrotain/.test( warning.importer )) return; // I am not rewriting chevrotain to fix this.
	}
	if ( /node_modules.*?chevrotain/.test( warning.id ) ) {
		if (warning.code == 'EVAL') return; //they use it to stop optimisation.
		if (warning.code == 'THIS_IS_UNDEFINED') return; //they check for existence and provide alternate impl
		return;
	}
	warn(warning);
}
