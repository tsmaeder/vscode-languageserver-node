/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import * as code from 'vscode';
import * as proto from 'vscode-languageserver-protocol';
import * as Is from './utils/is';
import ProtocolCompletionItem from './protocolCompletionItem';
import ProtocolCodeLens from './protocolCodeLens';
import ProtocolDocumentLink from './protocolDocumentLink';
import { MarkdownString } from 'vscode';

export interface Converter {

	asUri(uri: code.Uri): string;

	asTextDocumentIdentifier(textDocument: code.TextDocument): proto.TextDocumentIdentifier;

	asVersionedTextDocumentIdentifier(textDocument: code.TextDocument): proto.VersionedTextDocumentIdentifier;

	asOpenTextDocumentParams(textDocument: code.TextDocument): proto.DidOpenTextDocumentParams;

	asChangeTextDocumentParams(textDocument: code.TextDocument): proto.DidChangeTextDocumentParams;
	asChangeTextDocumentParams(event: code.TextDocumentChangeEvent): proto.DidChangeTextDocumentParams;

	asCloseTextDocumentParams(textDocument: code.TextDocument): proto.DidCloseTextDocumentParams;

	asSaveTextDocumentParams(textDocument: code.TextDocument, includeContent?: boolean): proto.DidSaveTextDocumentParams;
	asWillSaveTextDocumentParams(event: code.TextDocumentWillSaveEvent): proto.WillSaveTextDocumentParams;

	asTextDocumentPositionParams(textDocument: code.TextDocument, position: code.Position): proto.TextDocumentPositionParams;

	asCompletionParams(textDocument: code.TextDocument, position: code.Position, context: code.CompletionContext): proto.CompletionParams

	asWorkerPosition(position: code.Position): proto.Position;

	asPosition(value: code.Position): proto.Position;
	asPosition(value: undefined): undefined;
	asPosition(value: null): null;
	asPosition(value: code.Position | undefined | null): proto.Position | undefined | null;

	asPositions(value: code.Position[]): proto.Position[];

	asRange(value: code.Range): proto.Range;
	asRange(value: undefined): undefined;
	asRange(value: null): null;
	asRange(value: code.Range | undefined | null): proto.Range | undefined | null;

	asLocation(value: code.Location): proto.Location;
	asLocation(value: undefined): undefined;
	asLocation(value: null): null;
	asLocation(value: code.Location | undefined | null): proto.Location | undefined | null;

	asDiagnosticSeverity(value: code.DiagnosticSeverity): number;
	asDiagnosticTag(value: code.DiagnosticTag): number | undefined;

	asDiagnostic(item: code.Diagnostic): proto.Diagnostic;
	asDiagnostics(items: code.Diagnostic[]): proto.Diagnostic[];

	asCompletionItem(item: code.CompletionItem): proto.CompletionItem;

	asTextEdit(edit: code.TextEdit): proto.TextEdit;

	asReferenceParams(textDocument: code.TextDocument, position: code.Position, options: { includeDeclaration: boolean; }): proto.ReferenceParams;

	asCodeActionContext(context: code.CodeActionContext): proto.CodeActionContext;

	asCommand(item: code.Command): proto.Command;

	asCodeLens(item: code.CodeLens): proto.CodeLens;

	asFormattingOptions(item: code.FormattingOptions): proto.FormattingOptions;

	asDocumentSymbolParams(textDocument: code.TextDocument): proto.DocumentSymbolParams;

	asCodeLensParams(textDocument: code.TextDocument): proto.CodeLensParams;

	asDocumentLink(item: code.DocumentLink): proto.DocumentLink;

	asDocumentLinkParams(textDocument: code.TextDocument): proto.DocumentLinkParams;
}

export interface URIConverter {
	(value: code.Uri): string;
}

export function createConverter(uriConverter?: URIConverter): Converter {

	const nullConverter = (value: code.Uri) => value.toString();

	const _uriConverter: URIConverter = uriConverter || nullConverter;

	function asUri(value: code.Uri): string {
		return _uriConverter(value);
	}

	function asTextDocumentIdentifier(textDocument: code.TextDocument): proto.TextDocumentIdentifier {
		return {
			uri: _uriConverter(textDocument.uri)
		};
	}

	function asVersionedTextDocumentIdentifier(textDocument: code.TextDocument): proto.VersionedTextDocumentIdentifier {
		return {
			uri: _uriConverter(textDocument.uri),
			version: textDocument.version
		};
	}

	function asOpenTextDocumentParams(textDocument: code.TextDocument): proto.DidOpenTextDocumentParams {
		return {
			textDocument: {
				uri: _uriConverter(textDocument.uri),
				languageId: textDocument.languageId,
				version: textDocument.version,
				text: textDocument.getText()
			}
		};
	}

	function isTextDocumentChangeEvent(value: any): value is code.TextDocumentChangeEvent {
		let candidate = <code.TextDocumentChangeEvent>value;
		return !!candidate.document && !!candidate.contentChanges;
	}

	function isTextDocument(value: any): value is code.TextDocument {
		let candidate = <code.TextDocument>value;
		return !!candidate.uri && !!candidate.version;
	}

	function asChangeTextDocumentParams(textDocument: code.TextDocument): proto.DidChangeTextDocumentParams;
	function asChangeTextDocumentParams(event: code.TextDocumentChangeEvent): proto.DidChangeTextDocumentParams;
	function asChangeTextDocumentParams(arg: code.TextDocumentChangeEvent | code.TextDocument): proto.DidChangeTextDocumentParams {
		if (isTextDocument(arg)) {
			let result: proto.DidChangeTextDocumentParams = {
				textDocument: {
					uri: _uriConverter(arg.uri),
					version: arg.version
				},
				contentChanges: [{ text: arg.getText() }]
			};
			return result;
		} else if (isTextDocumentChangeEvent(arg)) {
			let document = arg.document;
			let result: proto.DidChangeTextDocumentParams = {
				textDocument: {
					uri: _uriConverter(document.uri),
					version: document.version
				},
				contentChanges: arg.contentChanges.map((change): proto.TextDocumentContentChangeEvent => {
					let range = change.range;
					return {
						range: {
							start: { line: range.start.line, character: range.start.character },
							end: { line: range.end.line, character: range.end.character }
						},
						rangeLength: change.rangeLength,
						text: change.text
					};
				})
			};
			return result;
		} else {
			throw Error('Unsupported text document change parameter');
		}
	}

	function asCloseTextDocumentParams(textDocument: code.TextDocument): proto.DidCloseTextDocumentParams {
		return {
			textDocument: asTextDocumentIdentifier(textDocument)
		};
	}

	function asSaveTextDocumentParams(textDocument: code.TextDocument, includeContent: boolean = false): proto.DidSaveTextDocumentParams {
		let result: proto.DidSaveTextDocumentParams = {
			textDocument: asVersionedTextDocumentIdentifier(textDocument)
		};
		if (includeContent) {
			result.text = textDocument.getText();
		}
		return result;
	}

	function asTextDocumentSaveReason(reason: code.TextDocumentSaveReason): 1 | 2 | 3 {
		switch (reason) {
			case code.TextDocumentSaveReason.Manual:
				return proto.TextDocumentSaveReason.Manual;
			case code.TextDocumentSaveReason.AfterDelay:
				return proto.TextDocumentSaveReason.AfterDelay;
			case code.TextDocumentSaveReason.FocusOut:
				return proto.TextDocumentSaveReason.FocusOut;
		}
		return proto.TextDocumentSaveReason.Manual;
	}

	function asWillSaveTextDocumentParams(event: code.TextDocumentWillSaveEvent): proto.WillSaveTextDocumentParams {
		return {
			textDocument: asTextDocumentIdentifier(event.document),
			reason: asTextDocumentSaveReason(event.reason)
		};
	}

	function asTextDocumentPositionParams(textDocument: code.TextDocument, position: code.Position): proto.TextDocumentPositionParams {
		return {
			textDocument: asTextDocumentIdentifier(textDocument),
			position: asWorkerPosition(position)
		};
	}

	function asTriggerKind(triggerKind: code.CompletionTriggerKind): proto.CompletionTriggerKind {
		switch(triggerKind) {
			case code.CompletionTriggerKind.TriggerCharacter:
				return proto.CompletionTriggerKind.TriggerCharacter;
			case code.CompletionTriggerKind.TriggerForIncompleteCompletions:
				return proto.CompletionTriggerKind.TriggerForIncompleteCompletions;
			default:
				return proto.CompletionTriggerKind.Invoked;
		}
	}

	function asCompletionParams(textDocument: code.TextDocument, position: code.Position, context: code.CompletionContext): proto.CompletionParams {
		return {
			textDocument: asTextDocumentIdentifier(textDocument),
			position: asWorkerPosition(position),
			context: {
				triggerKind: asTriggerKind(context.triggerKind),
				triggerCharacter: context.triggerCharacter
			}
		};
	}

	function asWorkerPosition(position: code.Position): proto.Position {
		return { line: position.line, character: position.character };
	}

	function asPosition(value: code.Position): proto.Position;
	function asPosition(value: undefined): undefined;
	function asPosition(value: null): null;
	function asPosition(value: code.Position | undefined | null): proto.Position | undefined | null
	function asPosition(value: code.Position | undefined | null): proto.Position | undefined | null {
		if (value === undefined || value === null) {
			return value;
		}
		return { line: value.line, character: value.character };
	}

	function asPositions(value: code.Position[]): proto.Position[] {
		let result: proto.Position[] = [];
		for (let elem of value) {
			result.push(asPosition(elem));
		}
		return result;
	}

	function asRange(value: code.Range): proto.Range;
	function asRange(value: undefined): undefined;
	function asRange(value: null): null;
	function asRange(value: code.Range | undefined | null): proto.Range | undefined | null;
	function asRange(value: code.Range | undefined | null): proto.Range | undefined | null {
		if (value === undefined || value === null) {
			return value;
		}
		return { start: asPosition(value.start), end: asPosition(value.end) };
	}

	function asLocation(value: code.Location): proto.Location;
	function asLocation(value: undefined): undefined;
	function asLocation(value: null): null;
	function asLocation(value: code.Location | undefined | null): proto.Location | undefined | null {
		if (value === undefined || value === null) {
			return value;
		}
		return proto.Location.create(asUri(value.uri), asRange(value.range));
	}

	function asDiagnosticSeverity(value: code.DiagnosticSeverity): proto.DiagnosticSeverity {
		switch (value) {
			case code.DiagnosticSeverity.Error:
				return proto.DiagnosticSeverity.Error;
			case code.DiagnosticSeverity.Warning:
				return proto.DiagnosticSeverity.Warning;
			case code.DiagnosticSeverity.Information:
				return proto.DiagnosticSeverity.Information;
			case code.DiagnosticSeverity.Hint:
				return proto.DiagnosticSeverity.Hint;
		}
	}

	function asDiagnosticTags(tags: undefined | null): undefined;
	function asDiagnosticTags(tags: code.DiagnosticTag[]): proto.DiagnosticTag[];
	function asDiagnosticTags(tags: code.DiagnosticTag[] | undefined | null): proto.DiagnosticTag[] | undefined;
	function asDiagnosticTags(tags: code.DiagnosticTag[] | undefined | null): proto.DiagnosticTag[] | undefined {
		if (!tags) {
			return undefined;
		}
		let result: code.DiagnosticTag[] = [];
		for (let tag of tags) {
			let converted = asDiagnosticTag(tag);
			if (converted !== undefined) {
				result.push(converted);
			}
		}
		return result.length > 0 ? result : undefined;
	}

	function asDiagnosticTag(tag: code.DiagnosticTag): proto.DiagnosticTag | undefined {
		switch (tag) {
			case code.DiagnosticTag.Unnecessary:
				return proto.DiagnosticTag.Unnecessary;
			case code.DiagnosticTag.Deprecated:
				return proto.DiagnosticTag.Deprecated;
			default:
				return undefined;
		}
	}

	function asRelatedInformation(item: code.DiagnosticRelatedInformation): proto.DiagnosticRelatedInformation {
		return {
			message: item.message,
			location: asLocation(item.location)
		};
	}

	function asRelatedInformations(items: code.DiagnosticRelatedInformation[]): proto.DiagnosticRelatedInformation[] {
		return items.map(asRelatedInformation);
	}

	function asDiagnostic(item: code.Diagnostic): proto.Diagnostic {
		let result: proto.Diagnostic = proto.Diagnostic.create(asRange(item.range), item.message);
		if (Is.number(item.severity)) { result.severity = asDiagnosticSeverity(item.severity); }
		if (Is.number(item.code) || Is.string(item.code)) { result.code = item.code; }
		if (Array.isArray(item.tags)) { result.tags = asDiagnosticTags(item.tags); }
		if (item.relatedInformation) { result.relatedInformation = asRelatedInformations(item.relatedInformation); }
		if (item.source) { result.source = item.source; }
		return result;
	}

	function asDiagnostics(items: ReadonlyArray<code.Diagnostic>): proto.Diagnostic[] {
		if (items === undefined || items === null) {
			return items;
		}
		return items.map(asDiagnostic);
	}

	function asDocumentation(format: string, documentation: string | MarkdownString): string | proto.MarkupContent {
		switch (format) {
			case '$string':
				return documentation as string;
			case proto.MarkupKind.PlainText:
				return { kind: format, value: documentation as string };
			case proto.MarkupKind.Markdown:
				return { kind: format, value: (documentation as MarkdownString).value };
			default:
				return `Unsupported Markup content received. Kind is: ${format}`;
		}
	}

	function asCompletionItemKind(value: code.CompletionItemKind, original: proto.CompletionItemKind | undefined): proto.CompletionItemKind {
		if (original !== undefined) {
			return original;
		}
		return value + 1 as proto.CompletionItemKind;
	}

	function asCompletionItem(item: code.CompletionItem): proto.CompletionItem {
		let result: proto.CompletionItem = { label: item.label };
		let protocolItem = item instanceof ProtocolCompletionItem ? item as ProtocolCompletionItem : undefined;
		if (item.detail) { result.detail = item.detail; }
		// We only send items back we created. So this can't be something else than
		// a string right now.
		if (item.documentation) {
			if (!protocolItem || protocolItem.documentationFormat === '$string') {
				result.documentation = item.documentation as string;
			} else {
				result.documentation = asDocumentation(protocolItem.documentationFormat, item.documentation);
			}
		}
		if (item.filterText) { result.filterText = item.filterText; }
		fillPrimaryInsertText(result, item as ProtocolCompletionItem);
		if (Is.number(item.kind)) {
			result.kind = asCompletionItemKind(item.kind, protocolItem && protocolItem.originalItemKind);
		}
		if (item.sortText) { result.sortText = item.sortText; }
		if (item.additionalTextEdits) { result.additionalTextEdits = asTextEdits(item.additionalTextEdits); }
		if (item.commitCharacters) { result.commitCharacters = item.commitCharacters.slice(); }
		if (item.command) { result.command = asCommand(item.command); }
		if (item.preselect === true || item.preselect === false) { result.preselect = item.preselect; }
		if (protocolItem) {
			if (protocolItem.data !== undefined) {
				result.data = protocolItem.data;
			}
			if (protocolItem.deprecated === true || protocolItem.deprecated === false) {
				result.deprecated = protocolItem.deprecated;
			}
		}
		return result;
	}

	function fillPrimaryInsertText(target: proto.CompletionItem, source: ProtocolCompletionItem): void {
		let format: proto.InsertTextFormat = proto.InsertTextFormat.PlainText;
		let text: string | undefined;
		let range: proto.Range | undefined = undefined;
		if (source.textEdit) {
			text = source.textEdit.newText;
			range = asRange(source.textEdit.range);
		} else if (source.insertText instanceof code.SnippetString) {
			format = proto.InsertTextFormat.Snippet;
			text = source.insertText.value;
		} else {
			text = source.insertText;
		}
		if (source.range) {
			range = asRange(source.range);
		}

		target.insertTextFormat = format;
		if (source.fromEdit && text && range) {
			target.textEdit = { newText: text, range: range };
		} else {
			target.insertText = text;
		}
	}

	function asTextEdit(edit: code.TextEdit): proto.TextEdit {
		return { range: asRange(edit.range), newText: edit.newText };
	}

	function asTextEdits(edits: code.TextEdit[]): proto.TextEdit[] {
		if (edits === undefined || edits === null) {
			return edits;
		}
		return edits.map(asTextEdit);
	}

	function asReferenceParams(textDocument: code.TextDocument, position: code.Position, options: { includeDeclaration: boolean; }): proto.ReferenceParams {
		return {
			textDocument: asTextDocumentIdentifier(textDocument),
			position: asWorkerPosition(position),
			context: { includeDeclaration: options.includeDeclaration }
		};
	}

	function asCodeActionContext(context: code.CodeActionContext): proto.CodeActionContext {
		if (context === undefined || context === null) {
			return context;
		}
		let only: proto.CodeActionKind[] | undefined;
		if(context.only && Is.string(context.only.value)) {
			only = [context.only.value];
		}
		return proto.CodeActionContext.create(asDiagnostics(context.diagnostics), only);
	}

	function asCommand(item: code.Command): proto.Command {
		let result = proto.Command.create(item.title, item.command);
		if (item.arguments) { result.arguments = item.arguments; }
		return result;
	}

	function asCodeLens(item: code.CodeLens): proto.CodeLens {
		let result = proto.CodeLens.create(asRange(item.range));
		if (item.command) { result.command = asCommand(item.command); }
		if (item instanceof ProtocolCodeLens) {
			if (item.data) { result.data = item.data; }
		}
		return result;
	}

	function asFormattingOptions(item: code.FormattingOptions): proto.FormattingOptions {
		return { tabSize: item.tabSize, insertSpaces: item.insertSpaces };
	}

	function asDocumentSymbolParams(textDocument: code.TextDocument): proto.DocumentSymbolParams {
		return {
			textDocument: asTextDocumentIdentifier(textDocument)
		};
	}

	function asCodeLensParams(textDocument: code.TextDocument): proto.CodeLensParams {
		return {
			textDocument: asTextDocumentIdentifier(textDocument)
		};
	}

	function asDocumentLink(item: code.DocumentLink): proto.DocumentLink {
		let result = proto.DocumentLink.create(asRange(item.range));
		if (item.target) { result.target = asUri(item.target); }
		let protocolItem = item instanceof ProtocolDocumentLink ? item as ProtocolDocumentLink : undefined;
		if (protocolItem && protocolItem.data) {
			result.data = protocolItem.data;
		}
		return result;
	}

	function asDocumentLinkParams(textDocument: code.TextDocument): proto.DocumentLinkParams {
		return {
			textDocument: asTextDocumentIdentifier(textDocument)
		};
	}

	return {
		asUri,
		asTextDocumentIdentifier,
		asVersionedTextDocumentIdentifier,
		asOpenTextDocumentParams,
		asChangeTextDocumentParams,
		asCloseTextDocumentParams,
		asSaveTextDocumentParams,
		asWillSaveTextDocumentParams,
		asTextDocumentPositionParams,
		asCompletionParams,
		asWorkerPosition,
		asRange,
		asPosition,
		asPositions,
		asLocation,
		asDiagnosticSeverity,
		asDiagnosticTag,
		asDiagnostic,
		asDiagnostics,
		asCompletionItem,
		asTextEdit,
		asReferenceParams,
		asCodeActionContext,
		asCommand,
		asCodeLens,
		asFormattingOptions,
		asDocumentSymbolParams,
		asCodeLensParams,
		asDocumentLink,
		asDocumentLinkParams
	};
}
