import { parseSvelte, parser } from './parser';
import CodeMirror from 'codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/mode/htmlmixed/htmlmixed'
import { createSyntaxDiagramsCode } from 'chevrotain';

const inputText = "<svelte:self component|preventDefault={hi} component2='{hi}' booleanattr />"

function main() {
    
    var inputEditor = CodeMirror(document.getElementById('inputEditor') as HTMLDivElement, {
        value: inputText,
        mode: "htmlmixed",
        lineNumbers: true,
    });
    inputEditor.setSize("calc(100% - 2px)", "calc(100% - 2px)");
        
    var outputEditor = CodeMirror(document.getElementById('outputEditor') as HTMLDivElement, {
        value: '',
        mode: {name: "javascript", json: true},
        lineNumbers: true,
    });
    outputEditor.setSize("calc(100% - 2px)", "calc(100% - 2px)");
    
    const result = parseSvelte(inputText);

    const htmlText = createSyntaxDiagramsCode(parser.getSerializedGastProductions());
    console.log(htmlText);
    (document.getElementById("innerFrame") as HTMLIFrameElement).src = 'data:text/html;charset=utf-8,' + encodeURI(htmlText);

    const resultJson = JSON.stringify(result, (k, v) => (['tokenTypeIdx', 'tokenType', 'startLine', 'endLine', 'startColumn', 'endColumn'].indexOf(k) >= 0 ? undefined : v), 2);
    outputEditor.setValue(resultJson);
}

document.addEventListener("DOMContentLoaded", function(){
    main();
});

