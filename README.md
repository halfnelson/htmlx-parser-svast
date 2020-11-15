# htmlx-parser-svast

A parser for [HTMLx](https://github.com/htmlx-org/HTMLx) that produces a [Svast](https://github.com/pngwn/MDsveX/tree/master/packages/svast) AST
which implements the [Unist](https://github.com/syntax-tree/unist).

Unlike its older handcrafted sibling  [svelte-parse](https://github.com/pngwn/MDsveX/tree/master/packages/svelte-parse), this library is not focused on speed. It is built with [Chevrotain](https://github.com/SAP/chevrotain) so that it may inherit the excellent error recovery properties of that parser generator. 

It was developed to help with processing [Svelte](https://svelte.dev) files during development, where the files may contain errors, or expressions and scripts written in languages that svelte's own parser can't handle (eg Typescript).

## Usage

Import and invoke the parser by calling parse.

```js
import { parse } from 'htmlx-parser-svast'

const input = '<h1 title={someExpression}>Heading</h1>';
const result = parse(input);
```

The result returned is as much of the AST as could be generated along with any errors encountered

```ts
declare type ParseResult = {
    ast: Root; //Root is a Svast AST node
    errors: ParseError[]
};
```

With errors having the type

```ts
 type ParseError = {
    source: "Lexer" | "Parser"
    name: string
    message: string    
    position: {
        start: Point,
        end: Point
    }
}
```

## Limitations

 * It doesn't implement `svast`'s each block. 
 * It is slower and larger than `svelte-parse`.
 * HTMLx expressions are parsed by looking for the nearest, unbalanced `}`.
 * The AST builder currently doesn't take full advantage of the error recovery features of `chevrotain`.
 * Writing more tests is a work in progress.