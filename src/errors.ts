// tslint:disable:max-classes-per-file
import { BlockElement, InlineElement } from "./ast";
import { Cardinality } from "./parseSchema";
import { ordinal } from "./utils";

export abstract class HMError extends Error {
	abstract readonly code: number;
	abstract readonly message: string;

	toString(): string {
		return `Error HM${this.code}: ${this.message}`;
	}
}

//////////////////////////////////
// 1xx Schema validation errors //
//////////////////////////////////

export abstract class ValidationError extends HMError {
	constructor(readonly code: number, readonly message: string) {
		super();
	}
}

// 100 Unknown tag error:

export class UnknownTagError extends ValidationError {
	constructor(tree: BlockElement | InlineElement) {
		super(100, `Unknown tag '${tree}'`);
	}
}

// 11x Misused tag errors:

export class InlineUsedAsBlockError extends ValidationError {
	constructor(tree: BlockElement) {
		super(110, `Expected '${tree.tag}' to be used as an inline tag`);
	}
}

export class BlockUsedAsInlineError extends ValidationError {
	constructor(tree: InlineElement) {
		super(111, `Expected '${tree.tag}' to be used as a block tag`);
	}
}

// 12x Disallowed tag errors:

export class DisallowedInBlockError extends ValidationError {
	constructor(parent: BlockElement, tree: BlockElement) {
		super(120, `Tag '#${tree.tag}' is not allowed in '#${parent.tag}'`);
	}
}

export class DisallowedInArgError extends ValidationError {
	constructor(parent: InlineElement, argIndex: number, tree: InlineElement) {
		super(
			121,
			`Tag '#${tree.tag}' is not allowed in the ${ordinal(argIndex + 1)} argument of '#${
				parent.tag
			}'`
		);
	}
}

// TODO use this, and parse head constraints correctly!
export class DisallowedInHeadError extends ValidationError {
	constructor(parent: BlockElement, tree: InlineElement) {
		super(122, `Tag '#${tree.tag}' is not allowed in the head of '#${parent.tag}'`);
	}
}

// 13x Cardinality errors

export class CardinalityError extends ValidationError {
	constructor(
		parent: BlockElement,
		children: BlockElement[],
		tag: string,
		count: number,
		cardinality: Cardinality
	) {
		super(
			130,
			`Saw ${count} occurrences of '${tag}' in ${
				parent.tag
			}, but the schema requires ${CardinalityError.cardinalityToString(cardinality)} in ${
				parent.tag
			}`
		);
	}

	static cardinalityToString(cardinality: Cardinality): string {
		if (cardinality === Cardinality.ZeroOrMore) {
			throw new Error(`${cardinality} should never be the cause of a cardinality error`);
		}
		const strings = {
			[Cardinality.One]: "exactly one",
			[Cardinality.OneOrMore]: "one or more",
			[Cardinality.Optional]: "zero or one"
		};
		return strings[cardinality] + ` ('#${cardinality}')`;
	}
}

// 14x Argument errors

export class ArgumentCountError extends ValidationError {
	constructor(inline: InlineElement, expected: number) {
		super(
			140,
			`Expected '#${inline.tag}' to have ${expected} arguments, but got ${inline.args.length} instead`
		);
	}
}