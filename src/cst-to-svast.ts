import { CstChildrenDictionary,  CstNode,  IToken } from 'chevrotain';
import { BranchingBlock, Root, SvelteComponent, SvelteElement, SvelteExpression, VoidBlock, Text, SvelteMeta, Property, Directive, Branch, Literal, Point, Position, Node, Comment, SvelteScript, SvelteStyle } from 'svast'
import { RCurly } from './lexer';

import { HtmlxParser } from './parser';


const parserInstance = new HtmlxParser();

const BaseHtmlxLVisitor = parserInstance.getBaseCstVisitorConstructor()

function textNode(value: IToken): Text {
    return {
        type: "text",
        value: value.image,
        position: pos(start(value), after(value))
    }
}

function expressionNode(value: IToken): SvelteExpression {
    return {
        type: "svelteExpression",
        value: value.image,
        position: pos(start(value), after(value))
    }
}

function offset_col(p: Point, col_offset: number) {
    return {
        offset: p.offset + col_offset,
        column: p.column + col_offset,
        line: p.line
    }
}

function start(node: IToken): Point {
    return {
        offset: node.startOffset,
        column: node.startColumn,
        line: node.startLine
    }
}

function end(node: IToken) {
    return {
        offset: node.endOffset,
        column: node.endColumn,
        line: node.endLine
    }
}

function after(node: IToken) {
    const imgLength = node.image.length;
    const endsWithNewline = (imgLength && node.image[imgLength - 1] == '\n');
    return {
        offset: node.endOffset + 1,
        column: endsWithNewline ? 1 : node.endColumn + 1,
        line: endsWithNewline ? node.endLine + 1 : node.endLine
    }
}

function pos(start: Point, end: Point): Position {
    return {
        start: start,
        end: end
    }
}

type TagChild = SvelteComponent | SvelteElement | SvelteMeta | SvelteExpression | BranchingBlock | VoidBlock | Text | SvelteScript | SvelteStyle | Comment

type TagType = SvelteComponent | SvelteElement | SvelteMeta

class HtmlxVisitor extends BaseHtmlxLVisitor {
    constructor() {
        super()
        this.validateVisitor()
    }

    // root := tag_content
    root(n: CstChildrenDictionary): Root {
        const children = this.visit(n.tag_content[0] as CstNode)
        return { 
            type: "root",
            children: children,
            position: children.length == 0 
                ? pos({column: 0, line: 0, offset: 0}, {column: 0, line: 0, offset: 0}) 
                : pos(children[0].position.start, children[children.length - 1].position.end)
        } 
    }

    // tag_content := tag_child*
    tag_content(n: CstChildrenDictionary): TagChild[] {
        return n.tag_child?.map(c => this.visit(c as CstNode)).filter(Boolean) ?? []
    }

    // tag_child := tag | text | void_block | branch_block | expression
    tag_child(n: CstChildrenDictionary): TagChild  {
        if (n.tag) return this.visit(n.tag[0] as CstNode);
        if (n.text) return this.visit(n.text[0] as CstNode);
        if (n.void_block) return this.visit(n.void_block[0] as CstNode);
        if (n.branch_block) return this.visit(n.branch_block[0] as CstNode);
        if (n.expression) return this.visit(n.expression[0] as CstNode);
        if (n.script_tag) return this.visit(n.script_tag[0] as CstNode);
        if (n.style_tag) return this.visit(n.style_tag[0] as CstNode);
        if (n.comment_tag) return this.visit(n.comment_tag[0] as CstNode);
        console.log(n);
        throw new Error("Unknown tag child")
    }

    tag(n: CstChildrenDictionary): TagType {
        var el:Partial<TagType> = {}
        let name = (n.OpenTag[0] as IToken).image.substr(1);
        let colonIdx = name.indexOf(':')
        if (colonIdx >= 0) {
            el.type = "svelteMeta"
            el.tagName = name.substring(name.indexOf(':') + 1)
        } else {
            el.type = (name[0].toLowerCase() == name[0]) ? "svelteElement" : "svelteComponent"
            el.tagName = name
        }
        el.selfClosing = !!n.Slash;
        el.properties = this.visit(n.attribute_list[0] as CstNode)
        el.children = n.tag_content ?  this.visit(n.tag_content[0] as CstNode) : []

        if (el.selfClosing) {
            el.position = pos(start(n.OpenTag[0] as IToken), after(n.RAngle[0] as IToken))
        } else {
            if (n.closetag) {
                const closeTag = this.visit(n.closetag[0] as CstNode) as Node;
                el.position = pos(start(n.OpenTag[0] as IToken), closeTag.position.end);
            } else {
                console.log("didn't get expected closeTag", n);
                throw new Error("fail");
                
            }
        }
       
        return el as TagType
    }

    script_tag(n: CstChildrenDictionary): SvelteScript {
        let contentAndTagToken = (n.ScriptContentAndEndTag[0] as IToken);
        const endTagLength = "</script>".length;
        return {
            type: "svelteScript",
            properties: this.visit(n.attribute_list[0] as CstNode),
            selfClosing: false,
            tagName: 'script',
            children: [{
                type: "text",
                value: contentAndTagToken.image.substring(0,contentAndTagToken.image.length - endTagLength),
                position: pos(start(contentAndTagToken), offset_col(after(contentAndTagToken), -endTagLength))
            }],
            position: pos(start(n.OpenScriptTag[0] as IToken), after(contentAndTagToken)),
        }
    }

    style_tag(n: CstChildrenDictionary): SvelteStyle {
        let contentAndTagToken = (n.StyleContentAndEndTag[0] as IToken);
        const endTagLength = "</style>".length;
        return {
            type: "svelteStyle",
            properties: this.visit(n.attribute_list[0] as CstNode),
            selfClosing: false,
            tagName: 'style',
            children: [{
                type: "text",
                value: contentAndTagToken.image.substring(0,contentAndTagToken.image.length - endTagLength),
                position: pos(start(contentAndTagToken), offset_col(after(contentAndTagToken), -endTagLength))
            }],
            position: pos(start(n.OpenStyleTag[0] as IToken), after(contentAndTagToken)),
        }
    }

    comment_tag(n: CstChildrenDictionary): Comment {
        const commentToken = n.CommentTag[0] as IToken;
        return {
            type: "comment",
            value: commentToken.image.substring('<!--'.length, commentToken.image.length - '-->'.length),
            position: pos(start(commentToken), after(commentToken))
        }
    }

    void_block(n: CstChildrenDictionary): VoidBlock {
        return {    
            type: "svelteVoidBlock",
            name: (n.VoidBlock[0] as IToken).image.substring(1),
            expression: expressionNode(n.ExprContent[0] as IToken),
            position: pos(start(n.LCurly[0] as IToken), after(n.RCurly[0] as IToken))
        } as VoidBlock
    }

    branch_block(n: CstChildrenDictionary): BranchingBlock {
        const startBranch: Branch = this.visit(n.start_branch[0] as CstNode);
        const otherBranches: Branch[] = n.branch?.map(b => this.visit(b as CstNode)) ?? [];
        return {
            type: "svelteBranchingBlock",
            branches: [startBranch, ...otherBranches],
            name: startBranch.name,
            position: pos(startBranch.position.start, after(n.RCurly[0] as IToken))
        }
    }

    start_branch(n: CstChildrenDictionary): Branch {
        const children = n.tag_content ? this.visit(n.tag_content[0] as CstNode) : [];
        const endPos = children.length ? (children[children.length - 1] as TagChild).position.end : after(n.RCurly[0] as IToken);
        return {
            type: "svelteBranch",
            name: (n.BranchBlockOpen[0] as IToken).image.substring(1),
            expression: n.ExprContent ? expressionNode(n.ExprContent[0] as IToken) : null,
            children: children,
            position: pos(start(n.LCurly[0] as IToken), endPos)
        }
    }

    branch(n: CstChildrenDictionary): Branch {
        const children = n.tag_content ? this.visit(n.tag_content[0] as CstNode) : [];
        const endPos = children.length ? (children[children.length - 1] as TagChild).position.end : after(n.RCurly[0] as IToken);
        return {
            type: "svelteBranch",
            name: (n.BranchBlockContinue[0] as IToken).image.substring(1),
            expression: n.ExprContent ? expressionNode(n.ExprContent[0] as IToken) : null,
            children: children,
            position: pos(start(n.LCurly[0] as IToken), endPos)
        }
    }

    text(n: CstChildrenDictionary): Text {
        return textNode(n.TagContent[0] as IToken)
    }

    attribute_list(n: CstChildrenDictionary): (Property | Directive)[] {
        return n.attribute_or_expression?.map(a => this.visit(a as CstNode)) ?? []
    }

    attribute_or_expression(n: CstChildrenDictionary): (Property | Directive) {
        if (n.attribute) return this.visit(n.attribute[0] as CstNode)
        if (n.expression) {
            const expr:SvelteExpression = this.visit(n.expression[0] as CstNode)
            return {
                type: "svelteProperty",
                value: [expr],
                shorthand: "expression",
                modifiers: [],
                name: expr.value.trim(),
                position: expr.position
            } as Property
        }
    }

    attribute(n: CstChildrenDictionary): (Property | Directive) {
        const name = (n.AttrText[0] as IToken).image;
        const colonIndex = name.indexOf(':');
        const values = n.quoted_attribute_value ? this.visit(n.quoted_attribute_value[0] as CstNode) : []

        const hasQuotes = !(n.quoted_attribute_value?.[0] as CstNode).children.unquoted_value
        const startPosition = start(n.AttrText[0] as IToken)
        const endPosition = values.length ? offset_col((values[values.length - 1] as Node).position?.end, hasQuotes ? 1 : 0) : after(n.AttrText[0] as IToken);
        
        if (colonIndex >= 0) {
            return {
                type: "svelteDirective",
                name: name.substring(0, colonIndex),
                specifier: name.substr(colonIndex+1),
                shorthand: "none",
                modifiers: this.visit(n.modifier_list[0] as CstNode),
                value: n.quoted_attribute_value ? this.visit(n.quoted_attribute_value[0] as CstNode) : [],
                position: pos(startPosition, endPosition)
            }
        } else {
            return {
                type: "svelteProperty",
                name: name,
                shorthand: n.quoted_attribute_value ? "none" : "boolean",
                modifiers: this.visit(n.modifier_list[0] as CstNode),
                value: n.quoted_attribute_value ? this.visit(n.quoted_attribute_value[0] as CstNode) : [],
                position: pos(startPosition, endPosition)
            } as Property
        }
    }

    modifier_list(n: CstChildrenDictionary): Literal[] {
        return n.AttrText?.map(a => ({
            type: "modifier",
            value: (a as IToken).image
        })) ?? []
    }

    quoted_attribute_value(n: CstChildrenDictionary):(Text|SvelteExpression)[] {
        if (n.double_quoted_value) return this.visit(n.double_quoted_value[0] as CstNode);
        if (n.single_quoted_value) return this.visit(n.single_quoted_value[0] as CstNode);
        if (n.unquoted_value) return this.visit(n.unquoted_value[0] as CstNode);
    }

    unquoted_value(n: CstChildrenDictionary):(Text|SvelteExpression)[] {
        return n.noquote_string_or_expression?.map(c => this.visit(c as CstNode)) ?? []
    }

    double_quoted_value(n: CstChildrenDictionary):(Text|SvelteExpression)[] {
        return n.dquote_string_or_expression?.map(c => this.visit(c as CstNode)) ?? []
    }

    single_quoted_value(n: CstChildrenDictionary):(Text|SvelteExpression)[] {
        return n.squote_string_or_expression?.map(c => this.visit(c as CstNode)) ?? []
    }
    
    squote_string_or_expression(n: CstChildrenDictionary):Text|SvelteExpression {
        return n.expression ? this.visit(n.expression[0] as CstNode) : textNode(n.SQuoteString[0] as IToken)
    }

    dquote_string_or_expression(n: CstChildrenDictionary):Text|SvelteExpression {
        return n.expression ? this.visit(n.expression[0] as CstNode) : textNode(n.DQuoteString[0] as IToken)
    }

    noquote_string_or_expression(n: CstChildrenDictionary):Text|SvelteExpression {
        return n.expression ? this.visit(n.expression[0] as CstNode) : textNode(n.AttrText[0] as IToken)
    }

    expression(n: CstChildrenDictionary): SvelteExpression {
        const expr =  expressionNode(n.ExprContent[0] as IToken);
        expr.position = pos(start(n.LCurly[0] as IToken), after(n.RCurly[0] as IToken))
        return expr;
    }

    closetag(n: CstChildrenDictionary): Node {
        return {
            type: "__closeTag",
            position: pos(start(n.CloseTag[0] as IToken), after(n.RAngle[0] as IToken))
        }
    }
}




export function cstToSvast(root :CstNode): Root {
    const visitor = new HtmlxVisitor();
    return visitor.visit(root) as Root;
}