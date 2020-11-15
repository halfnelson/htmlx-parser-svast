import { IToken } from "chevrotain";
import { Point, Position } from "svast";

export function offset_col(p: Point, col_offset: number) {
    return {
        offset: p.offset + col_offset,
        column: p.column + col_offset,
        line: p.line
    }
}

export function start(node: IToken): Point {
    return {
        offset: node.startOffset,
        column: node.startColumn,
        line: node.startLine
    }
}

export function end(node: IToken) {
    return {
        offset: node.endOffset,
        column: node.endColumn,
        line: node.endLine
    }
}

export function after(node: IToken) {
    const imgLength = node.image.length;
    const endsWithNewline = (imgLength && node.image[imgLength - 1] == '\n');
    return {
        offset: node.endOffset + 1,
        column: endsWithNewline ? 1 : node.endColumn + 1,
        line: endsWithNewline ? node.endLine + 1 : node.endLine
    }
}

export function pos(start: Point, end: Point): Position {
    return {
        start: start,
        end: end
    }
}