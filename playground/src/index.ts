import { parseSvelte, parser } from './parser/index';
import CodeMirror from 'codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/mode/htmlmixed/htmlmixed'
import { createSyntaxDiagramsCode } from 'chevrotain';


function main() {
    
    var inputEditor = CodeMirror(document.getElementById('inputEditor') as HTMLDivElement, {
        value: '',
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
    
    inputEditor.on("change", ()=> {
        const value =  inputEditor.getValue()
        const result = parseSvelte(value);
        const resultJson = JSON.stringify(result, (k, v) => (['tokenTypeIdx', 'tokenType', 'startLine', 'endLine', 'startColumn', 'endColumn'].indexOf(k) >= 0 ? undefined : v), 2);
        outputEditor.setValue(resultJson);
    })

    inputEditor.setValue('<h1>Hello {name}! </h1>')
    //do at least one parse to init the grammer
    parseSvelte('<h1>Hello {name}! </h1>');
    const htmlText = createSyntaxDiagramsCode(parser.getSerializedGastProductions());
    (document.getElementById("innerFrame") as HTMLIFrameElement).src = 'data:text/html;charset=utf-8,' + encodeURI(htmlText);
}

document.addEventListener("DOMContentLoaded", function(){
    main();
});

