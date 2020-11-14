import { CstNode } from 'chevrotain';
import { Root } from 'svast'
import { HtmlxParser } from './parser';


const parserInstance = new HtmlxParser();

const BaseHtmlxLVisitor = parserInstance.getBaseCstVisitorConstructor()


class HtmlxVisitor extends BaseHtmlxLVisitor {
    constructor() {
        super()
        this.validateVisitor()
    }
    
}




export function cst2svast(root :CstNode): Root {
    const visitor = new HtmlxVisitor();
    return visitor.visit(root) as Root;
}