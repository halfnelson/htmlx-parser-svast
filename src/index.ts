import { SvelteParser, SvelteLexer } from './parser';

let parser = new SvelteParser();

function parseInput(text: string) {
    const lexingResult = SvelteLexer.tokenize(text);
    parser.input = lexingResult.tokens;
    let result = parser.tag_children();

    console.log("Errors", JSON.stringify(parser.errors, null, 2));
    return result;
}

const inputText = "<svelte:self component|preventDefault={hi} component2='{hi}' booleanattr />"
const result = parseInput(inputText);
console.log(JSON.stringify(result, (k,v) => (['tokenTypeIdx', 'tokenType', 'startLine', 'endLine', 'startColumn','endColumn'].indexOf(k) >= 0 ? undefined : v), 2));