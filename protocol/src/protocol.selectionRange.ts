/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { RequestType, RequestHandler, ProgressType } from 'vscode-jsonrpc';
import { TextDocumentIdentifier, Position, SelectionRange } from 'vscode-languageserver-types';
import { TextDocumentRegistrationOptions, WorkDoneProgressOptions, StaticRegistrationOptions, WorkDoneProgressParams, PartialResultParams } from './protocol';

// ---- capabilities

export interface SelectionRangeClientCapabilities {
	/**
	 * The text document client capabilities
	 */
	textDocument?: {
		/**
		 * Capabilities specific to `textDocument/selectionRange` requests
		 */
		selectionRange?: {
			/**
			 * Whether implementation supports dynamic registration for selection range providers. If this is set to `true`
			 * the client supports the new `(SelectionRangeProviderOptions & TextDocumentRegistrationOptions & StaticRegistrationOptions)`
			 * return value for the corresponding server capability as well.
			 */
			dynamicRegistration?: boolean;
		};
	};
}

export interface SelectionRangeOptions extends WorkDoneProgressOptions {
}

export interface SelectionRangeRegistrationOptions extends SelectionRangeOptions, TextDocumentRegistrationOptions {
}

export interface SelectionRangeServerCapabilities {
	/**
	 * The server provides selection range support.
	 */
	selectionRangeProvider?: boolean | SelectionRangeOptions | (SelectionRangeRegistrationOptions & StaticRegistrationOptions);
}

/**
 * A parameter literal used in selection range requests.
 */
export interface SelectionRangeParams extends WorkDoneProgressParams, PartialResultParams {
	/**
	 * The text document.
	 */
	textDocument: TextDocumentIdentifier;

	/**
	 * The positions inside the text document.
	 */
	positions: Position[];
}

/**
 * A request to provide selection ranges in a document. The request's
 * parameter is of type [SelectionRangeParams](#SelectionRangeParams), the
 * response is of type [SelectionRange[]](#SelectionRange[]) or a Thenable
 * that resolves to such.
 */
export namespace SelectionRangeRequest {
	export const type: RequestType<SelectionRangeParams, SelectionRange[] | null, any, SelectionRangeRegistrationOptions> = new RequestType('textDocument/selectionRange');
	export const resultType = new ProgressType<SelectionRange[]>();
	export type HandlerSignature = RequestHandler<SelectionRangeParams, SelectionRange[] | null, void>;
}
