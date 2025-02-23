/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import * as Is from './utils/is';

import { RequestType, RequestType0, NotificationType, NotificationType0, ProgressToken, ProgressType } from 'vscode-jsonrpc';

import {
	TextDocumentContentChangeEvent, Position, Range, Location, LocationLink, Diagnostic, Command,
	TextEdit, WorkspaceEdit, DocumentUri,
	TextDocumentIdentifier, VersionedTextDocumentIdentifier, TextDocumentItem, TextDocumentSaveReason,
	CompletionItem, CompletionList, Hover, SignatureHelp,
	Definition, DefinitionLink, ReferenceContext, DocumentHighlight,
	SymbolInformation, CodeLens, CodeActionContext, FormattingOptions, DocumentLink, MarkupKind,
	SymbolKind, CompletionItemKind, CodeAction, CodeActionKind, DocumentSymbol
} from 'vscode-languageserver-types';

import { ImplementationRequest, ImplementationClientCapabilities, ImplementationServerCapabilities } from './protocol.implementation';
import { TypeDefinitionRequest, TypeDefinitionClientCapabilities, TypeDefinitionServerCapabilities } from './protocol.typeDefinition';
import {
	WorkspaceFoldersRequest, DidChangeWorkspaceFoldersNotification, DidChangeWorkspaceFoldersParams, WorkspaceFolder,
	WorkspaceFoldersChangeEvent, WorkspaceFoldersInitializeParams, WorkspaceFoldersClientCapabilities, WorkspaceFoldersServerCapabilities
} from './protocol.workspaceFolders';
import { ConfigurationRequest, ConfigurationParams, ConfigurationItem, ConfigurationClientCapabilities } from './protocol.configuration';
import {
	DocumentColorRequest, ColorPresentationRequest, ColorOptions, DocumentColorParams, ColorPresentationParams,
	ColorServerCapabilities, ColorClientCapabilities,
} from './protocol.colorProvider';
import {
	FoldingRangeClientCapabilities, FoldingRangeOptions, FoldingRangeRequest, FoldingRangeParams, FoldingRangeServerCapabilities
} from './protocol.foldingRange';
import {
	DeclarationClientCapabilities, DeclarationRequest, DeclarationServerCapabilities
} from './protocol.declaration';

import { SelectionRangeClientCapabilities, SelectionRangeOptions, SelectionRangeRequest, SelectionRangeServerCapabilities, SelectionRangeParams} from './protocol.selectionRange';

// @ts-ignore: to avoid inlining LocatioLink as dynamic import
let __noDynamicImport: LocationLink | undefined;

/**
 * A document filter denotes a document by different properties like
 * the [language](#TextDocument.languageId), the [scheme](#Uri.scheme) of
 * its resource, or a glob-pattern that is applied to the [path](#TextDocument.fileName).
 *
 * Glob patterns can have the following syntax:
 * - `*` to match one or more characters in a path segment
 * - `?` to match on one character in a path segment
 * - `**` to match any number of path segments, including none
 * - `{}` to group conditions (e.g. `**​/*.{ts,js}` matches all TypeScript and JavaScript files)
 * - `[]` to declare a range of characters to match in a path segment (e.g., `example.[0-9]` to match on `example.0`, `example.1`, …)
 * - `[!...]` to negate a range of characters to match in a path segment (e.g., `example.[!0-9]` to match on `example.a`, `example.b`, but not `example.0`)
 *
 * @sample A language filter that applies to typescript files on disk: `{ language: 'typescript', scheme: 'file' }`
 * @sample A language filter that applies to all package.json paths: `{ language: 'json', pattern: '**package.json' }`
 */
export type DocumentFilter = {
	/** A language id, like `typescript`. */
	language: string;
	/** A Uri [scheme](#Uri.scheme), like `file` or `untitled`. */
	scheme?: string;
	/** A glob pattern, like `*.{ts,js}`. */
	pattern?: string;
} | {
	/** A language id, like `typescript`. */
	language?: string;
	/** A Uri [scheme](#Uri.scheme), like `file` or `untitled`. */
	scheme: string;
	/** A glob pattern, like `*.{ts,js}`. */
	pattern?: string;
} | {
	/** A language id, like `typescript`. */
	language?: string;
	/** A Uri [scheme](#Uri.scheme), like `file` or `untitled`. */
	scheme?: string;
	/** A glob pattern, like `*.{ts,js}`. */
	pattern: string;
};

/**
 * The DocumentFilter namespace provides helper functions to work with
 * [DocumentFilter](#DocumentFilter) literals.
 */
export namespace DocumentFilter {
	export function is(value: any): value is DocumentFilter {
		const candidate: DocumentFilter = value;
		return Is.string(candidate.language) || Is.string(candidate.scheme) || Is.string(candidate.pattern);
	}
}

/**
 * A document selector is the combination of one or many document filters.
 *
 * @sample `let sel:DocumentSelector = [{ language: 'typescript' }, { language: 'json', pattern: '**∕tsconfig.json' }]`;
 */
export type DocumentSelector = (string | DocumentFilter)[];

/**
 * The DocumentSelector namespace provides helper functions to work with
 * [DocumentSelector](#DocumentSelector)s.
 */
export namespace DocumentSelector {
	export function is(value: any[] | undefined | null): value is DocumentSelector {
		if (!Array.isArray(value)) {
			return false;
		}
		for (let elem of value) {
			if (!Is.string(elem) && !DocumentFilter.is(elem)) {
				return false;
			}
		}
		return true;
	}
}

/**
 * General parameters to to register for an notification or to register a provider.
 */
export interface Registration {
	/**
	 * The id used to register the request. The id can be used to deregister
	 * the request again.
	 */
	id: string;

	/**
	 * The method to register for.
	 */
	method: string;

	/**
	 * Options necessary for the registration.
	 */
	registerOptions?: any;
}

export interface RegistrationParams {
	registrations: Registration[];
}

/**
 * The `client/registerCapability` request is sent from the server to the client to register a new capability
 * handler on the client side.
 */
export namespace RegistrationRequest {
	export const type = new RequestType<RegistrationParams, void, void, void>('client/registerCapability');
}

/**
 * General parameters to unregister a request or notification.
 */
export interface Unregistration {
	/**
	 * The id used to unregister the request or notification. Usually an id
	 * provided during the register request.
	 */
	id: string;

	/**
	 * The method to unregister for.
	 */
	method: string;
}

export interface UnregistrationParams {
	unregisterations: Unregistration[];
}

/**
 * The `client/unregisterCapability` request is sent from the server to the client to unregister a previously registered capability
 * handler on the client side.
 */
export namespace UnregistrationRequest {
	export const type = new RequestType<UnregistrationParams, void, void, void>('client/unregisterCapability');
}

export interface WorkDoneProgressParams {
	/**
	 * An optional token that a server can use to report work done progress.
	 */
	workDoneToken?: ProgressToken;
}

export interface PartialResultParams {
	/**
	 * An optional token that a server can use to report partial results (e.g. streaming) to
	 * the client.
	 */
	partialResultToken?: ProgressToken;
}

/**
 * A parameter literal used in requests to pass a text document and a position inside that
 * document.
 */
export interface TextDocumentPositionParams {
	/**
	 * The text document.
	 */
	textDocument: TextDocumentIdentifier;

	/**
	 * The position inside the text document.
	 */
	position: Position;
}

//---- Initialize Method ----

/**
 * The kind of resource operations supported by the client.
 */
export type ResourceOperationKind = 'create' | 'rename' | 'delete';

export namespace ResourceOperationKind {

	/**
	 * Supports creating new files and folders.
	 */
	export const Create: ResourceOperationKind = 'create';

	/**
	 * Supports renaming existing files and folders.
	 */
	export const Rename: ResourceOperationKind = 'rename';

	/**
	 * Supports deleting existing files and folders.
	 */
	export const Delete: ResourceOperationKind = 'delete';
}

export type FailureHandlingKind = 'abort' | 'transactional' | 'undo' | 'textOnlyTransactional';

export namespace FailureHandlingKind {

	/**
	 * Applying the workspace change is simply aborted if one of the changes provided
	 * fails. All operations executed before the failing operation stay executed.
	 */
	export const Abort: FailureHandlingKind = 'abort';

	/**
	 * All operations are executed transactional. That means they either all
	 * succeed or no changes at all are applied to the workspace.
	 */
	export const Transactional: FailureHandlingKind = 'transactional';


	/**
	 * If the workspace edit contains only textual file changes they are executed transactional.
	 * If resource changes (create, rename or delete file) are part of the change the failure
	 * handling startegy is abort.
	 */
	export const TextOnlyTransactional: FailureHandlingKind = 'textOnlyTransactional';

	/**
	 * The client tries to undo the operations already executed. But there is no
	 * guaruntee that this is succeeding.
	 */
	export const Undo: FailureHandlingKind = 'undo';
}

/**
 * Workspace specific client capabilities.
 */
export interface WorkspaceClientCapabilities {
	/**
	 * The client supports applying batch edits
	 * to the workspace by supporting the request
	 * 'workspace/applyEdit'
	 */
	applyEdit?: boolean;

	/**
	 * Capabilities specific to `WorkspaceEdit`s
	 */
	workspaceEdit?: {
		/**
		 * The client supports versioned document changes in `WorkspaceEdit`s
		 */
		documentChanges?: boolean;

		/**
		 * The resource operations the client supports. Clients should at least
		 * support 'create', 'rename' and 'delete' files and folders.
		 */
		resourceOperations?: ResourceOperationKind[];

		/**
		 * The failure handling strategy of a client if applying the workspace edit
		 * failes.
		 */
		failureHandling?: FailureHandlingKind;
	};

	/**
	 * Capabilities specific to the `workspace/didChangeConfiguration` notification.
	 */
	didChangeConfiguration?: {
		/**
		 * Did change configuration notification supports dynamic registration.
		 */
		dynamicRegistration?: boolean;
	};

	/**
	 * Capabilities specific to the `workspace/didChangeWatchedFiles` notification.
	 */
	didChangeWatchedFiles?: {
		/**
		 * Did change watched files notification supports dynamic registration. Please note
		 * that the current protocol doesn't support static configuration for file changes
		 * from the server side.
		 */
		dynamicRegistration?: boolean;
	};

	/**
	 * Capabilities specific to the `workspace/symbol` request.
	 */
	symbol?: {
		/**
		 * Symbol request supports dynamic registration.
		 */
		dynamicRegistration?: boolean;

		/**
		 * Specific capabilities for the `SymbolKind` in the `workspace/symbol` request.
		 */
		symbolKind?: {
			/**
			 * The symbol kind values the client supports. When this
			 * property exists the client also guarantees that it will
			 * handle values outside its set gracefully and falls back
			 * to a default value when unknown.
			 *
			 * If this property is not present the client only supports
			 * the symbol kinds from `File` to `Array` as defined in
			 * the initial version of the protocol.
			 */
			valueSet?: SymbolKind[];
		}
	};

	/**
	 * Capabilities specific to the `workspace/executeCommand` request.
	 */
	executeCommand?: {
		/**
		 * Execute command supports dynamic registration.
		 */
		dynamicRegistration?: boolean;
	};
}

/**
 * Text document specific client capabilities.
 */
export interface TextDocumentClientCapabilities {

	/**
	 * Defines which synchronization capabilities the client supports.
	 */
	synchronization?: {
		/**
		 * Whether text document synchronization supports dynamic registration.
		 */
		dynamicRegistration?: boolean;

		/**
		 * The client supports sending will save notifications.
		 */
		willSave?: boolean;

		/**
		 * The client supports sending a will save request and
		 * waits for a response providing text edits which will
		 * be applied to the document before it is saved.
		 */
		willSaveWaitUntil?: boolean;

		/**
		 * The client supports did save notifications.
		 */
		didSave?: boolean;
	};

	/**
	 * Capabilities specific to the `textDocument/completion`
	 */
	completion?: {
		/**
		 * Whether completion supports dynamic registration.
		 */
		dynamicRegistration?: boolean;

		/**
		 * The client supports the following `CompletionItem` specific
		 * capabilities.
		 */
		completionItem?: {
			/**
			 * Client supports snippets as insert text.
			 *
			 * A snippet can define tab stops and placeholders with `$1`, `$2`
			 * and `${3:foo}`. `$0` defines the final tab stop, it defaults to
			 * the end of the snippet. Placeholders with equal identifiers are linked,
			 * that is typing in one will update others too.
			 */
			snippetSupport?: boolean;

			/**
			 * Client supports commit characters on a completion item.
			 */
			commitCharactersSupport?: boolean

			/**
			 * Client supports the follow content formats for the documentation
			 * property. The order describes the preferred format of the client.
			 */
			documentationFormat?: MarkupKind[];

			/**
			 * Client supports the deprecated property on a completion item.
			 */
			deprecatedSupport?: boolean;

			/**
			 * Client supports the preselect property on a completion item.
			 */
			preselectSupport?: boolean;
		},

		completionItemKind?: {
			/**
			 * The completion item kind values the client supports. When this
			 * property exists the client also guarantees that it will
			 * handle values outside its set gracefully and falls back
			 * to a default value when unknown.
			 *
			 * If this property is not present the client only supports
			 * the completion items kinds from `Text` to `Reference` as defined in
			 * the initial version of the protocol.
			 */
			valueSet?: CompletionItemKind[];
		},

		/**
		 * The client supports to send additional context information for a
		 * `textDocument/completion` requestion.
		 */
		contextSupport?: boolean;
	};

	/**
	 * Capabilities specific to the `textDocument/hover`
	 */
	hover?: {
		/**
		 * Whether hover supports dynamic registration.
		 */
		dynamicRegistration?: boolean;

		/**
		 * Client supports the follow content formats for the content
		 * property. The order describes the preferred format of the client.
		 */
		contentFormat?: MarkupKind[];
	};

	/**
	 * Capabilities specific to the `textDocument/signatureHelp`
	 */
	signatureHelp?: {
		/**
		 * Whether signature help supports dynamic registration.
		 */
		dynamicRegistration?: boolean;

		/**
		 * The client supports the following `SignatureInformation`
		 * specific properties.
		 */
		signatureInformation?: {
			/**
			 * Client supports the follow content formats for the documentation
			 * property. The order describes the preferred format of the client.
			 */
			documentationFormat?: MarkupKind[];

			/**
			 * Client capabilities specific to parameter information.
			 */
			parameterInformation?: {
				/**
				 * The client supports processing label offsets instead of a
				 * simple label string.
				 */
				labelOffsetSupport?: boolean;
			}
		};
	};

	/**
	 * Capabilities specific to the `textDocument/references`
	 */
	references?: {
		/**
		 * Whether references supports dynamic registration.
		 */
		dynamicRegistration?: boolean;
	};

	/**
	 * Capabilities specific to the `textDocument/documentHighlight`
	 */
	documentHighlight?: {
		/**
		 * Whether document highlight supports dynamic registration.
		 */
		dynamicRegistration?: boolean;
	};

	/**
	 * Capabilities specific to the `textDocument/documentSymbol`
	 */
	documentSymbol?: {
		/**
		 * Whether document symbol supports dynamic registration.
		 */
		dynamicRegistration?: boolean;

		/**
		 * Specific capabilities for the `SymbolKind`.
		 */
		symbolKind?: {
			/**
			 * The symbol kind values the client supports. When this
			 * property exists the client also guarantees that it will
			 * handle values outside its set gracefully and falls back
			 * to a default value when unknown.
			 *
			 * If this property is not present the client only supports
			 * the symbol kinds from `File` to `Array` as defined in
			 * the initial version of the protocol.
			 */
			valueSet?: SymbolKind[];
		},

		/**
		 * The client support hierarchical document symbols.
		 */
		hierarchicalDocumentSymbolSupport?: boolean;
	};

	/**
	 * Capabilities specific to the `textDocument/formatting`
	 */
	formatting?: {
		/**
		 * Whether formatting supports dynamic registration.
		 */
		dynamicRegistration?: boolean;
	};

	/**
	 * Capabilities specific to the `textDocument/rangeFormatting`
	 */
	rangeFormatting?: {
		/**
		 * Whether range formatting supports dynamic registration.
		 */
		dynamicRegistration?: boolean;
	};

	/**
	 * Capabilities specific to the `textDocument/onTypeFormatting`
	 */
	onTypeFormatting?: {
		/**
		 * Whether on type formatting supports dynamic registration.
		 */
		dynamicRegistration?: boolean;
	};

	/**
	 * Capabilities specific to the `textDocument/definition`
	 */
	definition?: {
		/**
		 * Whether definition supports dynamic registration.
		 */
		dynamicRegistration?: boolean;

		/**
		 * The client supports additional metadata in the form of definition links.
		 */
		linkSupport?: boolean;
	};

	/**
	 * Capabilities specific to the `textDocument/codeAction`
	 */
	codeAction?: {
		/**
		 * Whether code action supports dynamic registration.
		 */
		dynamicRegistration?: boolean;

		/**
		 * The client support code action literals as a valid
		 * response of the `textDocument/codeAction` request.
		 */
		codeActionLiteralSupport?: {
			/**
			 * The code action kind is support with the following value
			 * set.
			 */
			codeActionKind: {

				/**
				 * The code action kind values the client supports. When this
				 * property exists the client also guarantees that it will
				 * handle values outside its set gracefully and falls back
				 * to a default value when unknown.
				 */
				valueSet: CodeActionKind[];
			};
		};
	};

	/**
	 * Capabilities specific to the `textDocument/codeLens`
	 */
	codeLens?: {
		/**
		 * Whether code lens supports dynamic registration.
		 */
		dynamicRegistration?: boolean;
	};

	/**
	 * Capabilities specific to the `textDocument/documentLink`
	 */
	documentLink?: {
		/**
		 * Whether document link supports dynamic registration.
		 */
		dynamicRegistration?: boolean;
	};

	/**
	 * Capabilities specific to the `textDocument/rename`
	 */
	rename?: {
		/**
		 * Whether rename supports dynamic registration.
		 */
		dynamicRegistration?: boolean;
		/**
		 * Client supports testing for validity of rename operations
		 * before execution.
		 */
		prepareSupport?: boolean;
	};

	/**
	 * Capabilities specific to `textDocument/publishDiagnostics`.
	 */
	publishDiagnostics?: {
		/**
		 * Whether the clients accepts diagnostics with related information.
		 */
		relatedInformation?: boolean;

		/**
		 * Client supports the tag property to provide meta data about a diagnostic.
		 */
		tagSupport?: boolean;
	};
}

/**
 * Defines the capabilities provided by the client.
 */
export interface _ClientCapabilities {
	/**
	 * Workspace specific client capabilities.
	 */
	workspace?: WorkspaceClientCapabilities;

	/**
	 * Text document specific client capabilities.
	 */
	textDocument?: TextDocumentClientCapabilities;

    /**
     * Window specific client capabilities.
     */
    window?: object;

	/**
	 * Experimental client capabilities.
	 */
	experimental?: any;
}

export type ClientCapabilities = _ClientCapabilities & ImplementationClientCapabilities & TypeDefinitionClientCapabilities &
	WorkspaceFoldersClientCapabilities & ConfigurationClientCapabilities & ColorClientCapabilities & FoldingRangeClientCapabilities &
	DeclarationClientCapabilities & SelectionRangeClientCapabilities;

/**
 * Defines how the host (editor) should sync
 * document changes to the language server.
 */
export namespace TextDocumentSyncKind {
	/**
	 * Documents should not be synced at all.
	 */
	export const None = 0;

	/**
	 * Documents are synced by always sending the full content
	 * of the document.
	 */
	export const Full = 1;

	/**
	 * Documents are synced by sending the full content on open.
	 * After that only incremental updates to the document are
	 * send.
	 */
	export const Incremental = 2;
}

export type TextDocumentSyncKind = 0 | 1 | 2;

/**
 * Static registration options to be returned in the initialize
 * request.
 */
export interface StaticRegistrationOptions {
	/**
	 * The id used to register the request. The id can be used to deregister
	 * the request again. See also Registration#id.
	 */
	id?: string;
}

/**
 * The StaticRegistrationOptions namespace provides helper functions to work with
 * [StaticRegistrationOptions](#StaticRegistrationOptions) literals.
 */
export namespace StaticRegistrationOptions {
	export function hasId(value: object): value is { id: string } {
		const candidate = value as StaticRegistrationOptions;
		return candidate && Is.string(candidate.id) && candidate.id.length > 0;
	}
}

/**
 * General text document registration options.
 */
export interface TextDocumentRegistrationOptions {
	/**
	 * A document selector to identify the scope of the registration. If set to null
	 * the document selector provided on the client side will be used.
	 */
	documentSelector: DocumentSelector | null;
}

/**
 * The TextDocumentRegistrationOptions namespace provides helper functions to work with
 * [TextDocumentRegistrationOptions](#TextDocumentRegistrationOptions) literals.
 */
export namespace TextDocumentRegistrationOptions {
	export function is(value: any): value is TextDocumentRegistrationOptions {
		const candidate = value as TextDocumentRegistrationOptions;
		return candidate && (candidate.documentSelector === null || DocumentSelector.is(candidate.documentSelector));
	}
}

/**
 * Completion options.
 */
export interface CompletionOptions extends WorkDoneProgressOptions {
	/**
	 * Most tools trigger completion request automatically without explicitly requesting
	 * it using a keyboard shortcut (e.g. Ctrl+Space). Typically they do so when the user
	 * starts to type an identifier. For example if the user types `c` in a JavaScript file
	 * code complete will automatically pop up present `console` besides others as a
	 * completion item. Characters that make up identifiers don't need to be listed here.
	 *
	 * If code complete should automatically be trigger on characters not being valid inside
	 * an identifier (for example `.` in JavaScript) list them in `triggerCharacters`.
	 */
	triggerCharacters?: string[];

	/**
	 * The list of all possible characters that commit a completion. This field can be used
	 * if clients don't support individual commmit characters per completion item. See
	 * `ClientCapabilities.textDocument.completion.completionItem.commitCharactersSupport`
	 */
	allCommitCharacters?: string[];

	/**
	 * The server provides support to resolve additional
	 * information for a completion item.
	 */
	resolveProvider?: boolean;
}

/**
 * Hover options.
 */
export interface HoverOptions extends WorkDoneProgressOptions {
}

/**
 * Signature help options.
 */
export interface SignatureHelpOptions extends WorkDoneProgressOptions {
	/**
	 * The characters that trigger signature help
	 * automatically.
	 */
	triggerCharacters?: string[];
}

/**
 * Definition options.
 */
export interface DefinitionOptions extends WorkDoneProgressOptions {
}

/**
 * Reference options.
 */
export interface ReferenceOptions extends WorkDoneProgressOptions {
}

/**
 * Document highlight options.
 */
export interface DocumentHighlightOptions extends WorkDoneProgressOptions {
}

/**
 * Document symbol options.
 */
export interface DocumentSymbolOptions extends WorkDoneProgressOptions {
}

/**
 * Workspace symbol options.
 */
export interface WorkspaceSymbolOptions extends WorkDoneProgressOptions {
}

/**
 * Code Action options.
 */
export interface CodeActionOptions extends WorkDoneProgressOptions {
	/**
	 * CodeActionKinds that this server may return.
	 *
	 * The list of kinds may be generic, such as `CodeActionKind.Refactor`, or the server
	 * may list out every specific kind they provide.
	 */
	codeActionKinds?: CodeActionKind[];
}

/**
 * Code Lens options.
 */
export interface CodeLensOptions extends WorkDoneProgressOptions {
	/**
	 * Code lens has a resolve provider as well.
	 */
	resolveProvider?: boolean;
}

/**
 * Document formatting options.
 */
export interface DocumentFormattingOptions extends WorkDoneProgressOptions {
}

/**
 * Document range formatting options.
 */
export interface DocumentRangeFormattingOptions extends WorkDoneProgressOptions {
}

/**
 * Format document on type options
 */
export interface DocumentOnTypeFormattingOptions {
	/**
	 * A character on which formatting should be triggered, like `}`.
	 */
	firstTriggerCharacter: string;

	/**
	 * More trigger characters.
	 */
	moreTriggerCharacter?: string[];
}

/**
 * Rename options
 */
export interface RenameOptions extends WorkDoneProgressOptions {
	/**
	 * Renames should be checked and tested before being executed.
	 */
	prepareProvider?: boolean;
}

/**
 * Document link options
 */
export interface DocumentLinkOptions extends WorkDoneProgressOptions {
	/**
	 * Document links have a resolve provider as well.
	 */
	resolveProvider?: boolean;
}

/**
 * Execute command options.
 */
export interface ExecuteCommandOptions extends WorkDoneProgressOptions {
	/**
	 * The commands to be executed on the server
	 */
	commands: string[]
}

/**
 * Save options.
 */
export interface SaveOptions {
	/**
	 * The client is supposed to include the content on save.
	 */
	includeText?: boolean;
}

export interface TextDocumentSyncOptions {
	/**
	 * Open and close notifications are sent to the server. If omitted open close notification should not
	 * be sent.
	 */
	openClose?: boolean;
	/**
	 * Change notifications are sent to the server. See TextDocumentSyncKind.None, TextDocumentSyncKind.Full
	 * and TextDocumentSyncKind.Incremental. If omitted it defaults to TextDocumentSyncKind.None.
	 */
	change?: TextDocumentSyncKind;
	/**
	 * If present will save notifications are sent to the server. If omitted the notification should not be
	 * sent.
	 */
	willSave?: boolean;
	/**
	 * If present will save wait until requests are sent to the server. If omitted the request should not be
	 * sent.
	 */
	willSaveWaitUntil?: boolean;
	/**
	 * If present save notifications are sent to the server. If omitted the notification should not be
	 * sent.
	 */
	save?: SaveOptions;
}

export interface WorkDoneProgressOptions {
	workDoneProgress?: boolean;
}

/**
 * The WorkDoneProgressOptions namespace provides helper functions to work with
 * [WorkDoneProgressOptions](#WorkDoneProgressOptions) literals.
 */
export namespace WorkDoneProgressOptions {
	export function is(value: any): value is WorkDoneProgressOptions {
		const candidate = value as WorkDoneProgressOptions;
		return Is.objectLiteral(candidate) && (candidate.workDoneProgress === undefined || Is.boolean(candidate.workDoneProgress));
	}
	export function hasWorkDoneProgress(value: any): value is { workDoneProgress: boolean } {
		const candidate = value as WorkDoneProgressOptions;
		return candidate && Is.boolean(candidate.workDoneProgress);
	}
}

/**
 * Defines the capabilities provided by a language
 * server.
 */
export interface _ServerCapabilities<T = any> {
	/**
	 * Defines how text documents are synced. Is either a detailed structure defining each notification or
	 * for backwards compatibility the TextDocumentSyncKind number.
	 */
	textDocumentSync?: TextDocumentSyncOptions | TextDocumentSyncKind;
	/**
	 * The server provides hover support.
	 */
	hoverProvider?: boolean | HoverOptions;
	/**
	 * The server provides completion support.
	 */
	completionProvider?: CompletionOptions;
	/**
	 * The server provides signature help support.
	 */
	signatureHelpProvider?: SignatureHelpOptions;
	/**
	 * The server provides goto definition support.
	 */
	definitionProvider?: boolean | DefinitionOptions;
	/**
	 * The server provides find references support.
	 */
	referencesProvider?: boolean | ReferenceOptions;
	/**
	 * The server provides document highlight support.
	 */
	documentHighlightProvider?: boolean | DocumentHighlightOptions;
	/**
	 * The server provides document symbol support.
	 */
	documentSymbolProvider?: boolean | DocumentSymbolOptions;
	/**
	 * The server provides workspace symbol support.
	 */
	workspaceSymbolProvider?: boolean | WorkspaceSymbolOptions;
	/**
	 * The server provides code actions. CodeActionOptions may only be
	 * specified if the client states that it supports
	 * `codeActionLiteralSupport` in its initial `initialize` request.
	 */
	codeActionProvider?: boolean | CodeActionOptions;
	/**
	 * The server provides code lens.
	 */
	codeLensProvider?: CodeLensOptions;
	/**
	 * The server provides document formatting.
	 */
	documentFormattingProvider?: boolean | DocumentFormattingOptions;
	/**
	 * The server provides document range formatting.
	 */
	documentRangeFormattingProvider?: boolean | DocumentRangeFormattingOptions;
	/**
	 * The server provides document formatting on typing.
	 */
	documentOnTypeFormattingProvider?: DocumentOnTypeFormattingOptions;
	/**
	 * The server provides rename support. RenameOptions may only be
	 * specified if the client states that it supports
	 * `prepareSupport` in its initial `initialize` request.
	 */
	renameProvider?: boolean | RenameOptions;
	/**
	 * The server provides document link support.
	 */
	documentLinkProvider?: DocumentLinkOptions;
	/**
	 * The server provides execute command support.
	 */
	executeCommandProvider?: ExecuteCommandOptions;
	/**
	 * Experimental server capabilities.
	 */
	experimental?: T;
}

export type ServerCapabilities<T = any> = _ServerCapabilities<T> & ImplementationServerCapabilities & TypeDefinitionServerCapabilities & WorkspaceFoldersServerCapabilities &
	ColorServerCapabilities & FoldingRangeServerCapabilities &  DeclarationServerCapabilities & SelectionRangeServerCapabilities;

/**
 * The initialize request is sent from the client to the server.
 * It is sent once as the request after starting up the server.
 * The requests parameter is of type [InitializeParams](#InitializeParams)
 * the response if of type [InitializeResult](#InitializeResult) of a Thenable that
 * resolves to such.
 */
export namespace InitializeRequest {
	export const type = new RequestType<InitializeParams & WorkDoneProgressParams, InitializeResult, InitializeError, void>('initialize');
}

/**
 * The initialize parameters
 */
export interface _InitializeParams extends WorkDoneProgressParams {
	/**
	 * The process Id of the parent process that started
	 * the server.
	 */
	processId: number | null;

	/**
	 * The rootPath of the workspace. Is null
	 * if no folder is open.
	 *
	 * @deprecated in favour of rootUri.
	 */
	rootPath?: string | null;

	/**
	 * The rootUri of the workspace. Is null if no
	 * folder is open. If both `rootPath` and `rootUri` are set
	 * `rootUri` wins.
	 *
	 * @deprecated in favour of workspaceFolders.
	 */
	rootUri: DocumentUri | null;

	/**
	 * The capabilities provided by the client (editor or tool)
	 */
	capabilities: ClientCapabilities;

	/**
	 * User provided initialization options.
	 */
	initializationOptions?: any;

	/**
	 * The initial trace setting. If omitted trace is disabled ('off').
	 */
	trace?: 'off' | 'messages' | 'verbose';
}

export type InitializeParams = _InitializeParams & WorkspaceFoldersInitializeParams

/**
 * The result returned from an initialize request.
 */
export interface InitializeResult<T = any> {
	/**
	 * The capabilities the language server provides.
	 */
	capabilities: ServerCapabilities<T>;
	/**
	 * Custom initialization results.
	 */
	[custom: string]: any;
}

/**
 * Known error codes for an `InitializeError`;
 */
export namespace InitializeError {
	/**
	 * If the protocol version provided by the client can't be handled by the server.
	 * @deprecated This initialize error got replaced by client capabilities. There is
	 * no version handshake in version 3.0x
	 */
	export const unknownProtocolVersion: number = 1;
}

/**
 * The data type of the ResponseError if the
 * initialize request fails.
 */
export interface InitializeError {
	/**
	 * Indicates whether the client execute the following retry logic:
	 * (1) show the message provided by the ResponseError to the user
	 * (2) user selects retry or cancel
	 * (3) if user selected retry the initialize method is sent again.
	 */
	retry: boolean;
}

export interface InitializedParams {
}

/**
 * The intialized notification is sent from the client to the
 * server after the client is fully initialized and the server
 * is allowed to send requests from the server to the client.
 */
export namespace InitializedNotification {
	export const type = new NotificationType<InitializedParams, void>('initialized');
}

//---- Shutdown Method ----

/**
 * A shutdown request is sent from the client to the server.
 * It is sent once when the client decides to shutdown the
 * server. The only notification that is sent after a shutdown request
 * is the exit event.
 */
export namespace ShutdownRequest {
	export const type = new RequestType0<void, void, void>('shutdown');
}

//---- Exit Notification ----

/**
 * The exit event is sent from the client to the server to
 * ask the server to exit its process.
 */
export namespace ExitNotification {
	export const type = new NotificationType0<void>('exit');
}

//---- Configuration notification ----

/**
 * The configuration change notification is sent from the client to the server
 * when the client's configuration has changed. The notification contains
 * the changed configuration as defined by the language client.
 */
export namespace DidChangeConfigurationNotification {
	export const type = new NotificationType<DidChangeConfigurationParams, DidChangeConfigurationRegistrationOptions>('workspace/didChangeConfiguration');
}

export interface DidChangeConfigurationRegistrationOptions {
	section?: string | string[]
}

/**
 * The parameters of a change configuration notification.
 */
export interface DidChangeConfigurationParams {
	/**
	 * The actual changed settings
	 */
	settings: any;
}

//---- Message show and log notifications ----

/**
 * The message type
 */
export namespace MessageType {
	/**
	 * An error message.
	 */
	export const Error = 1;
	/**
	 * A warning message.
	 */
	export const Warning = 2;
	/**
	 * An information message.
	 */
	export const Info = 3;
	/**
	 * A log message.
	 */
	export const Log = 4;
}

export type MessageType = 1 | 2 | 3 | 4;

/**
 * The parameters of a notification message.
 */
export interface ShowMessageParams {
	/**
	 * The message type. See {@link MessageType}
	 */
	type: MessageType;

	/**
	 * The actual message
	 */
	message: string;
}

/**
 * The show message notification is sent from a server to a client to ask
 * the client to display a particular message in the user interface.
 */
export namespace ShowMessageNotification {
	export const type = new NotificationType<ShowMessageParams, void>('window/showMessage');
}

export interface MessageActionItem {
	/**
	 * A short title like 'Retry', 'Open Log' etc.
	 */
	title: string;
}

export interface ShowMessageRequestParams {
	/**
	 * The message type. See {@link MessageType}
	 */
	type: MessageType;

	/**
	 * The actual message
	 */
	message: string;

	/**
	 * The message action items to present.
	 */
	actions?: MessageActionItem[];
}

/**
 * The show message request is sent from the server to the client to show a message
 * and a set of options actions to the user.
 */
export namespace ShowMessageRequest {
	export const type = new RequestType<ShowMessageRequestParams, MessageActionItem | null, void, void>('window/showMessageRequest');
}

/**
 * The log message notification is sent from the server to the client to ask
 * the client to log a particular message.
 */
export namespace LogMessageNotification {
	export const type = new NotificationType<LogMessageParams, void>('window/logMessage');
}

/**
 * The log message parameters.
 */
export interface LogMessageParams {
	/**
	 * The message type. See {@link MessageType}
	 */
	type: MessageType;

	/**
	 * The actual message
	 */
	message: string;
}

//---- Telemetry notification

/**
 * The telemetry event notification is sent from the server to the client to ask
 * the client to log telemetry data.
 */
export namespace TelemetryEventNotification {
	export const type = new NotificationType<any, void>('telemetry/event');
}

//---- Text document notifications ----

/**
 * The parameters send in a open text document notification
 */
export interface DidOpenTextDocumentParams {
	/**
	 * The document that was opened.
	 */
	textDocument: TextDocumentItem;
}

/**
 * The document open notification is sent from the client to the server to signal
 * newly opened text documents. The document's truth is now managed by the client
 * and the server must not try to read the document's truth using the document's
 * uri. Open in this sense means it is managed by the client. It doesn't necessarily
 * mean that its content is presented in an editor. An open notification must not
 * be sent more than once without a corresponding close notification send before.
 * This means open and close notification must be balanced and the max open count
 * is one.
 */
export namespace DidOpenTextDocumentNotification {
	export const type = new NotificationType<DidOpenTextDocumentParams, TextDocumentRegistrationOptions>('textDocument/didOpen');
}

/**
 * The change text document notification's parameters.
 */
export interface DidChangeTextDocumentParams {
	/**
	 * The document that did change. The version number points
	 * to the version after all provided content changes have
	 * been applied.
	 */
	textDocument: VersionedTextDocumentIdentifier;

	/**
	 * The actual content changes. The content changes describe single state changes
	 * to the document. So if there are two content changes c1 and c2 for a document
	 * in state S then c1 move the document to S' and c2 to S''.
	 */
	contentChanges: TextDocumentContentChangeEvent[];
}

/**
 * Describe options to be used when registered for text document change events.
 */
export interface TextDocumentChangeRegistrationOptions extends TextDocumentRegistrationOptions {
	/**
	 * How documents are synced to the server.
	 */
	syncKind: TextDocumentSyncKind;
}

/**
 * The document change notification is sent from the client to the server to signal
 * changes to a text document.
 */
export namespace DidChangeTextDocumentNotification {
	export const type = new NotificationType<DidChangeTextDocumentParams, TextDocumentChangeRegistrationOptions>('textDocument/didChange');
}

/**
 * The parameters send in a close text document notification
 */
export interface DidCloseTextDocumentParams {
	/**
	 * The document that was closed.
	 */
	textDocument: TextDocumentIdentifier;
}

/**
 * The document close notification is sent from the client to the server when
 * the document got closed in the client. The document's truth now exists where
 * the document's uri points to (e.g. if the document's uri is a file uri the
 * truth now exists on disk). As with the open notification the close notification
 * is about managing the document's content. Receiving a close notification
 * doesn't mean that the document was open in an editor before. A close
 * notification requires a previous open notification to be sent.
 */
export namespace DidCloseTextDocumentNotification {
	export const type = new NotificationType<DidCloseTextDocumentParams, TextDocumentRegistrationOptions>('textDocument/didClose');
}

/**
 * The parameters send in a save text document notification
 */
export interface DidSaveTextDocumentParams {
	/**
	 * The document that was closed.
	 */
	textDocument: VersionedTextDocumentIdentifier;

	/**
	 * Optional the content when saved. Depends on the includeText value
	 * when the save notification was requested.
	 */
	text?: string;
}

/**
 * Save registration options.
 */
export interface TextDocumentSaveRegistrationOptions extends TextDocumentRegistrationOptions, SaveOptions {
}

/**
 * The document save notification is sent from the client to the server when
 * the document got saved in the client.
 */
export namespace DidSaveTextDocumentNotification {
	export const type = new NotificationType<DidSaveTextDocumentParams, TextDocumentSaveRegistrationOptions>('textDocument/didSave');
}

/**
 * The parameters send in a will save text document notification.
 */
export interface WillSaveTextDocumentParams {
	/**
	 * The document that will be saved.
	 */
	textDocument: TextDocumentIdentifier;

	/**
	 * The 'TextDocumentSaveReason'.
	 */
	reason: TextDocumentSaveReason;
}

/**
 * A document will save notification is sent from the client to the server before
 * the document is actually saved.
 */
export namespace WillSaveTextDocumentNotification {
	export const type = new NotificationType<WillSaveTextDocumentParams, TextDocumentRegistrationOptions>('textDocument/willSave');
}

/**
 * A document will save request is sent from the client to the server before
 * the document is actually saved. The request can return an array of TextEdits
 * which will be applied to the text document before it is saved. Please note that
 * clients might drop results if computing the text edits took too long or if a
 * server constantly fails on this request. This is done to keep the save fast and
 * reliable.
 */
export namespace WillSaveTextDocumentWaitUntilRequest {
	export const type = new RequestType<WillSaveTextDocumentParams, TextEdit[] | null, void, TextDocumentRegistrationOptions>('textDocument/willSaveWaitUntil');
}

//---- File eventing ----

/**
 * The watched files notification is sent from the client to the server when
 * the client detects changes to file watched by the language client.
 */
export namespace DidChangeWatchedFilesNotification {
	export const type = new NotificationType<DidChangeWatchedFilesParams, DidChangeWatchedFilesRegistrationOptions>('workspace/didChangeWatchedFiles');
}

/**
 * The watched files change notification's parameters.
 */
export interface DidChangeWatchedFilesParams {
	/**
	 * The actual file events.
	 */
	changes: FileEvent[];
}

/**
 * The file event type
 */
export namespace FileChangeType {
	/**
	 * The file got created.
	 */
	export const Created = 1;
	/**
	 * The file got changed.
	 */
	export const Changed = 2;
	/**
	 * The file got deleted.
	 */
	export const Deleted = 3;
}

export type FileChangeType = 1 | 2 | 3;

/**
 * An event describing a file change.
 */
export interface FileEvent {
	/**
	 * The file's uri.
	 */
	uri: DocumentUri;
	/**
	 * The change type.
	 */
	type: FileChangeType;
}

/**
 * Describe options to be used when registered for text document change events.
 */
export interface DidChangeWatchedFilesRegistrationOptions {
	/**
	 * The watchers to register.
	 */
	watchers: FileSystemWatcher[];
}

export interface FileSystemWatcher {
	/**
	 * The  glob pattern to watch. Glob patterns can have the following syntax:
	 * - `*` to match one or more characters in a path segment
	 * - `?` to match on one character in a path segment
	 * - `**` to match any number of path segments, including none
	 * - `{}` to group conditions (e.g. `**​/*.{ts,js}` matches all TypeScript and JavaScript files)
	 * - `[]` to declare a range of characters to match in a path segment (e.g., `example.[0-9]` to match on `example.0`, `example.1`, …)
	 * - `[!...]` to negate a range of characters to match in a path segment (e.g., `example.[!0-9]` to match on `example.a`, `example.b`, but not `example.0`)
	 */
	globPattern: string;

	/**
	 * The kind of events of interest. If omitted it defaults
	 * to WatchKind.Create | WatchKind.Change | WatchKind.Delete
	 * which is 7.
	 */
	kind?: number;
}

export namespace WatchKind {
	/**
	 * Interested in create events.
	 */
	export const Create = 1;

	/**
	 * Interested in change events
	 */
	export const Change = 2;

	/**
	 * Interested in delete events
	 */
	export const Delete = 4;
}

//---- Diagnostic notification ----

/**
 * Diagnostics notification are sent from the server to the client to signal
 * results of validation runs.
 */
export namespace PublishDiagnosticsNotification {
	export const type = new NotificationType<PublishDiagnosticsParams, void>('textDocument/publishDiagnostics');
}

/**
 * The publish diagnostic notification's parameters.
 */
export interface PublishDiagnosticsParams {
	/**
	 * The URI for which diagnostic information is reported.
	 */
	uri: DocumentUri;

	/**
	 * Optional the version number of the document the diagnostics are published for.
	 *
	 * @since 3.15
	 */
	version?: number;

	/**
	 * An array of diagnostic information items.
	 */
	diagnostics: Diagnostic[];
}

//---- Completion Support --------------------------

/**
 * How a completion was triggered
 */
export namespace CompletionTriggerKind {
	/**
	 * Completion was triggered by typing an identifier (24x7 code
	 * complete), manual invocation (e.g Ctrl+Space) or via API.
	 */
	export const Invoked: 1 = 1;

	/**
	 * Completion was triggered by a trigger character specified by
	 * the `triggerCharacters` properties of the `CompletionRegistrationOptions`.
	 */
	export const TriggerCharacter: 2 = 2;

	/**
	 * Completion was re-triggered as current completion list is incomplete
	 */
	export const TriggerForIncompleteCompletions: 3 = 3;
}

export type CompletionTriggerKind = 1 | 2 | 3;


/**
 * Contains additional information about the context in which a completion request is triggered.
 */
export interface CompletionContext {
	/**
	 * How the completion was triggered.
	 */
	triggerKind: CompletionTriggerKind;

	/**
	 * The trigger character (a single character) that has trigger code complete.
	 * Is undefined if `triggerKind !== CompletionTriggerKind.TriggerCharacter`
	 */
	triggerCharacter?: string;
}

/**
 * Completion parameters
 */
export interface CompletionParams extends TextDocumentPositionParams, WorkDoneProgressParams, PartialResultParams {

	/**
	 * The completion context. This is only available it the client specifies
	 * to send this using `ClientCapabilities.textDocument.completion.contextSupport === true`
	 */
	context?: CompletionContext;
}

/**
 * Registration options for a [CompletionRequest](#CompletionRequest).
 */
export interface CompletionRegistrationOptions extends TextDocumentRegistrationOptions, CompletionOptions {
}

/**
 * Request to request completion at a given text document position. The request's
 * parameter is of type [TextDocumentPosition](#TextDocumentPosition) the response
 * is of type [CompletionItem[]](#CompletionItem) or [CompletionList](#CompletionList)
 * or a Thenable that resolves to such.
 *
 * The request can delay the computation of the [`detail`](#CompletionItem.detail)
 * and [`documentation`](#CompletionItem.documentation) properties to the `completionItem/resolve`
 * request. However, properties that are needed for the initial sorting and filtering, like `sortText`,
 * `filterText`, `insertText`, and `textEdit`, must not be changed during resolve.
 */
export namespace CompletionRequest {
	export const type = new RequestType<CompletionParams, CompletionItem[] | CompletionList | null, void, CompletionRegistrationOptions>('textDocument/completion');
	export const resultType = new ProgressType<CompletionItem[]>();
}

/**
 * Request to resolve additional information for a given completion item.The request's
 * parameter is of type [CompletionItem](#CompletionItem) the response
 * is of type [CompletionItem](#CompletionItem) or a Thenable that resolves to such.
 */
export namespace CompletionResolveRequest {
	export const type = new RequestType<CompletionItem, CompletionItem, void, void>('completionItem/resolve');
}

//---- Hover Support -------------------------------

/**
 * Parameters for a [HoverRequest](#HoverRequest).
 */
export interface HoverParams extends TextDocumentPositionParams, WorkDoneProgressParams {
}

/**
 * Registration options for a [HoverRequest](#HoverRequest).
 */
export interface HoverRegistrationOptions extends TextDocumentRegistrationOptions, HoverOptions {
}

/**
 * Request to request hover information at a given text document position. The request's
 * parameter is of type [TextDocumentPosition](#TextDocumentPosition) the response is of
 * type [Hover](#Hover) or a Thenable that resolves to such.
 */
export namespace HoverRequest {
	export const type = new RequestType<HoverParams, Hover | null, void, HoverRegistrationOptions>('textDocument/hover');
}

//---- SignatureHelp ----------------------------------

/**
 * Parameters for a [SignatureHelpRequest](#SignatureHelpRequest).
 */
export interface SignatureHelpParams extends TextDocumentPositionParams, WorkDoneProgressParams {
}

/**
 * Registration options for a [SignatureHelpRequest](#SignatureHelpRequest).
 */
export interface SignatureHelpRegistrationOptions extends TextDocumentRegistrationOptions, SignatureHelpOptions {
}

export namespace SignatureHelpRequest {
	export const type = new RequestType<SignatureHelpParams, SignatureHelp | null, void, SignatureHelpRegistrationOptions>('textDocument/signatureHelp');
}

//---- Goto Definition -------------------------------------

/**
 * Parameters for a [DefinitionParams](#DefinitionParams).
 */
export interface DefinitionParams extends TextDocumentPositionParams, WorkDoneProgressParams, PartialResultParams {
}

/**
 * Registration options for a [DefinitionRequest](#DefinitionRequest).
 */
export interface DefinitionRegistrationOptions extends TextDocumentRegistrationOptions, DefinitionOptions {
}

/**
 * A request to resolve the definition location of a symbol at a given text
 * document position. The request's parameter is of type [TextDocumentPosition]
 * (#TextDocumentPosition) the response is of either type [Definition](#Definition)
 * or a typed array of [DefinitionLink](#DefinitionLink) or a Thenable that resolves
 * to such.
 */
export namespace DefinitionRequest {
	export const type = new RequestType<DefinitionParams, Definition | DefinitionLink[] | null, void, DefinitionRegistrationOptions>('textDocument/definition');
	export const resultType = new ProgressType<Location[] | DefinitionLink[]>();
}

//---- Reference Provider ----------------------------------

/**
 * Parameters for a [ReferencesRequest](#ReferencesRequest).
 */
export interface ReferenceParams extends TextDocumentPositionParams, WorkDoneProgressParams, PartialResultParams {
	context: ReferenceContext
}

/**
 * Registration options for a [ReferencesRequest](#ReferencesRequest).
 */
export interface ReferenceRegistrationOptions extends TextDocumentRegistrationOptions, ReferenceOptions {
}

/**
 * A request to resolve project-wide references for the symbol denoted
 * by the given text document position. The request's parameter is of
 * type [ReferenceParams](#ReferenceParams) the response is of type
 * [Location[]](#Location) or a Thenable that resolves to such.
 */
export namespace ReferencesRequest {
	export const type = new RequestType<ReferenceParams, Location[] | null, void, ReferenceRegistrationOptions>('textDocument/references');
	export const resultType = new ProgressType<Location[]>();
}

//---- Document Highlight ----------------------------------

/**
 * Parameters for a [DocumentHighlightRequest](#DocumentHighlightRequest).
 */
export interface DocumentHighlightParams extends TextDocumentPositionParams, WorkDoneProgressParams, PartialResultParams {
}

/**
 * Registration options for a [DocumentHighlightRequest](#DocumentHighlightRequest).
 */
export interface DocumentHighlightRegistrationOptions extends TextDocumentRegistrationOptions, DocumentHighlightOptions {
}

/**
 * Request to resolve a [DocumentHighlight](#DocumentHighlight) for a given
 * text document position. The request's parameter is of type [TextDocumentPosition]
 * (#TextDocumentPosition) the request response is of type [DocumentHighlight[]]
 * (#DocumentHighlight) or a Thenable that resolves to such.
 */
export namespace DocumentHighlightRequest {
	export const type = new RequestType<DocumentHighlightParams, DocumentHighlight[] | null, void, DocumentHighlightRegistrationOptions>('textDocument/documentHighlight');
	export const resultType = new ProgressType<DocumentHighlight[]>();
}

//---- Document Symbol Provider ---------------------------

/**
 * Parameters for a [DocumentSymbolRequest](#DocumentSymbolRequest).
 */
export interface DocumentSymbolParams extends WorkDoneProgressParams, PartialResultParams {
	/**
	 * The text document.
	 */
	textDocument: TextDocumentIdentifier;
}

/**
 * Registration options for a [DocumentSymbolRequest](#DocumentSymbolRequest).
 */
export interface DocumentSymbolRegistrationOptions extends TextDocumentRegistrationOptions, DocumentSymbolOptions {
}

/**
 * A request to list all symbols found in a given text document. The request's
 * parameter is of type [TextDocumentIdentifier](#TextDocumentIdentifier) the
 * response is of type [SymbolInformation[]](#SymbolInformation) or a Thenable
 * that resolves to such.
 */
export namespace DocumentSymbolRequest {
	export const type = new RequestType<DocumentSymbolParams, SymbolInformation[] | DocumentSymbol[] | null, void, DocumentSymbolRegistrationOptions>('textDocument/documentSymbol');
	export const resultType = new ProgressType<SymbolInformation[] | DocumentSymbol[]>();
}

//---- Workspace Symbol Provider ---------------------------

/**
 * The parameters of a [WorkspaceSymbolRequest](#WorkspaceSymbolRequest).
 */
export interface WorkspaceSymbolParams extends WorkDoneProgressParams, PartialResultParams {
	/**
	 * A non-empty query string
	 */
	query: string;
}

/**
 * Registration options for a [WorkspaceSymbolRequest](#WorkspaceSymbolRequest).
 */
export interface WorkspaceSymbolRegistrationOptions extends WorkspaceSymbolOptions {
}

/**
 * A request to list project-wide symbols matching the query string given
 * by the [WorkspaceSymbolParams](#WorkspaceSymbolParams). The response is
 * of type [SymbolInformation[]](#SymbolInformation) or a Thenable that
 * resolves to such.
 */
export namespace WorkspaceSymbolRequest {
	export const type = new RequestType<WorkspaceSymbolParams, SymbolInformation[] | null, void, WorkspaceSymbolRegistrationOptions>('workspace/symbol');
	export const resultType = new ProgressType<SymbolInformation[]>();
}

//---- Code Action Provider ----------------------------------

/**
 * The parameters of a [CodeActionRequest](#CodeActionRequest).
 */
export interface CodeActionParams extends WorkDoneProgressParams, PartialResultParams {
	/**
	 * The document in which the command was invoked.
	 */
	textDocument: TextDocumentIdentifier;

	/**
	 * The range for which the command was invoked.
	 */
	range: Range;

	/**
	 * Context carrying additional information.
	 */
	context: CodeActionContext;
}

/**
 * Registration options for a [CodeActionRequest](#CodeActionRequest).
 */
export interface CodeActionRegistrationOptions extends TextDocumentRegistrationOptions, CodeActionOptions {
}

/**
 * A request to provide commands for the given text document and range.
 */
export namespace CodeActionRequest {
	export const type = new RequestType<CodeActionParams, (Command | CodeAction)[] | null, void, CodeActionRegistrationOptions>('textDocument/codeAction');
	export const resultType = new ProgressType<(Command | CodeAction)[]>();
}

//---- Code Lens Provider -------------------------------------------

/**
 * The parameters of a [CodeLensRequest](#CodeLensRequest).
 */
export interface CodeLensParams extends WorkDoneProgressParams, PartialResultParams {
	/**
	 * The document to request code lens for.
	 */
	textDocument: TextDocumentIdentifier;
}

/**
 * Registration options for a [CodeLensRequest](#CodeLensRequest).
 */
export interface CodeLensRegistrationOptions extends TextDocumentRegistrationOptions, CodeLensOptions {
}

/**
 * A request to provide code lens for the given text document.
 */
export namespace CodeLensRequest {
	export const type = new RequestType<CodeLensParams, CodeLens[] | null, void, CodeLensRegistrationOptions>('textDocument/codeLens');
	export const resultType = new ProgressType<CodeLens[]>();
}

/**
 * A request to resolve a command for a given code lens.
 */
export namespace CodeLensResolveRequest {
	export const type = new RequestType<CodeLens, CodeLens, void, void>('codeLens/resolve');
}

//---- Formatting ----------------------------------------------

/**
 * The parameters of a [DocumentFormattingRequest](#DocumentFormattingRequest).
 */
export interface DocumentFormattingParams extends WorkDoneProgressParams {
	/**
	 * The document to format.
	 */
	textDocument: TextDocumentIdentifier;

	/**
	 * The format options
	 */
	options: FormattingOptions;
}

/**
 * Registration options for a [DocumentFormattingRequest](#DocumentFormattingRequest).
 */
export interface DocumentFormattingRegistrationOptions extends TextDocumentRegistrationOptions, DocumentFormattingOptions {
}

/**
 * A request to to format a whole document.
 */
export namespace DocumentFormattingRequest {
	export const type = new RequestType<DocumentFormattingParams, TextEdit[] | null, void, DocumentFormattingRegistrationOptions>('textDocument/formatting');
}

/**
 * The parameters of a [DocumentRangeFormattingRequest](#DocumentRangeFormattingRequest).
 */
export interface DocumentRangeFormattingParams extends WorkDoneProgressParams {
	/**
	 * The document to format.
	 */
	textDocument: TextDocumentIdentifier;

	/**
	 * The range to format
	 */
	range: Range;

	/**
	 * The format options
	 */
	options: FormattingOptions;
}

/**
 * Registration options for a [DocumentRangeFormattingRequest](#DocumentRangeFormattingRequest).
 */
export interface DocumentRangeFormattingRegistrationOptions extends TextDocumentRegistrationOptions, DocumentRangeFormattingOptions {
}

/**
 * A request to to format a range in a document.
 */
export namespace DocumentRangeFormattingRequest {
	export const type = new RequestType<DocumentRangeFormattingParams, TextEdit[] | null, void, DocumentRangeFormattingRegistrationOptions>('textDocument/rangeFormatting');
}

/**
 * The parameters of a [DocumentOnTypeFormattingRequest](#DocumentOnTypeFormattingRequest).
 */
export interface DocumentOnTypeFormattingParams {
	/**
	 * The document to format.
	 */
	textDocument: TextDocumentIdentifier;

	/**
	 * The position at which this request was send.
	 */
	position: Position;

	/**
	 * The character that has been typed.
	 */
	ch: string;

	/**
	 * The format options.
	 */
	options: FormattingOptions;
}

/**
 * Registration options for a [DocumentOnTypeFormattingRequest](#DocumentOnTypeFormattingRequest).
 */
export interface DocumentOnTypeFormattingRegistrationOptions extends TextDocumentRegistrationOptions, DocumentOnTypeFormattingOptions {
}

/**
 * A request to format a document on type.
 */
export namespace DocumentOnTypeFormattingRequest {
	export const type = new RequestType<DocumentOnTypeFormattingParams, TextEdit[] | null, void, DocumentOnTypeFormattingRegistrationOptions>('textDocument/onTypeFormatting');
}

//---- Rename ----------------------------------------------

/**
 * The parameters of a [RenameRequest](#RenameRequest).
 */
export interface RenameParams extends WorkDoneProgressParams {
	/**
	 * The document to rename.
	 */
	textDocument: TextDocumentIdentifier;

	/**
	 * The position at which this request was sent.
	 */
	position: Position;

	/**
	 * The new name of the symbol. If the given name is not valid the
	 * request must return a [ResponseError](#ResponseError) with an
	 * appropriate message set.
	 */
	newName: string;
}

/**
 * Registration options for a [RenameRequest](#RenameRequest).
 */
export interface RenameRegistrationOptions extends TextDocumentRegistrationOptions, RenameOptions {
}

/**
 * A request to rename a symbol.
 */
export namespace RenameRequest {
	export const type = new RequestType<RenameParams, WorkspaceEdit | null, void, RenameRegistrationOptions>('textDocument/rename');
}

export interface PrepareRenameParams extends TextDocumentPositionParams, WorkDoneProgressParams {
}

/**
 * A request to test and perform the setup necessary for a rename.
 */
export namespace PrepareRenameRequest {
	export const type = new RequestType<PrepareRenameParams, Range | { range: Range, placeholder: string } | null, void, void>('textDocument/prepareRename');
}

//---- Document Links ----------------------------------------------

/**
 * The parameters of a [DocumentLinkRequest](#DocumentLinkRequest).
 */
export interface DocumentLinkParams extends WorkDoneProgressParams, PartialResultParams {
	/**
	 * The document to provide document links for.
	 */
	textDocument: TextDocumentIdentifier;
}

/**
 * Registration options for a [DocumentLinkRequest](#DocumentLinkRequest).
 */
export interface DocumentLinkRegistrationOptions extends TextDocumentRegistrationOptions, DocumentLinkOptions {
}

/**
 * A request to provide document links
 */
export namespace DocumentLinkRequest {
	export const type = new RequestType<DocumentLinkParams, DocumentLink[] | null, void, DocumentLinkRegistrationOptions>('textDocument/documentLink');
	export const resultType = new ProgressType<DocumentLink[]>();
}

/**
 * Request to resolve additional information for a given document link. The request's
 * parameter is of type [DocumentLink](#DocumentLink) the response
 * is of type [DocumentLink](#DocumentLink) or a Thenable that resolves to such.
 */
export namespace DocumentLinkResolveRequest {
	export const type = new RequestType<DocumentLink, DocumentLink, void, void>('documentLink/resolve');
}

//---- Command Execution -------------------------------------------

/**
 * The parameters of a [ExecuteCommandRequest](#ExecuteCommandRequest).
 */
export interface ExecuteCommandParams extends WorkDoneProgressParams {

	/**
	 * The identifier of the actual command handler.
	 */
	command: string;
	/**
	 * Arguments that the command should be invoked with.
	 */
	arguments?: any[];
}

/**
 * Registration options for a [ExecuteCommandRequest](#ExecuteCommandRequest).
 */
export interface ExecuteCommandRegistrationOptions extends ExecuteCommandOptions {
}

/**
 * A request send from the client to the server to execute a command. The request might return
 * a workspace edit which the client will apply to the workspace.
 */
export namespace ExecuteCommandRequest {
	export const type = new RequestType<ExecuteCommandParams, any | null, void, ExecuteCommandRegistrationOptions>('workspace/executeCommand');
}

//---- Apply Edit request ----------------------------------------

/**
 * The parameters passed via a apply workspace edit request.
 */
export interface ApplyWorkspaceEditParams {
	/**
	 * An optional label of the workspace edit. This label is
	 * presented in the user interface for example on an undo
	 * stack to undo the workspace edit.
	 */
	label?: string;

	/**
	 * The edits to apply.
	 */
	edit: WorkspaceEdit;
}

/**
 * A response returned from the apply workspace edit request.
 */
export interface ApplyWorkspaceEditResponse {
	/**
	 * Indicates whether the edit was applied or not.
	 */
	applied: boolean;

	/**
	 * An optional textual description for why the edit was not applied.
	 * This may be used by the server for diagnostic logging or to provide
	 * a suitable error for a request that triggered the edit.
	 */
	failureReason?: string;

	/**
	 * Depending on the client's failure handling strategy `failedChange` might
	 * contain the index of the change that failed. This property is only available
	 * if the client signals a `failureHandlingStrategy` in its client capabilities.
	 */
	failedChange?: number;
}

/**
 * A request sent from the server to the client to modified certain resources.
 */
export namespace ApplyWorkspaceEditRequest {
	export const type = new RequestType<ApplyWorkspaceEditParams, ApplyWorkspaceEditResponse, void, void>('workspace/applyEdit');
}

export {
	ImplementationRequest,
	TypeDefinitionRequest,
	WorkspaceFoldersRequest, DidChangeWorkspaceFoldersNotification, DidChangeWorkspaceFoldersParams, WorkspaceFolder, WorkspaceFoldersChangeEvent,
	ConfigurationRequest, ConfigurationParams, ConfigurationItem,
	DocumentColorRequest, ColorPresentationRequest, ColorOptions, DocumentColorParams, ColorPresentationParams,
	FoldingRangeClientCapabilities, FoldingRangeOptions, FoldingRangeRequest, FoldingRangeParams, FoldingRangeServerCapabilities,
	DeclarationClientCapabilities, DeclarationRequest, DeclarationServerCapabilities,
	SelectionRangeClientCapabilities, SelectionRangeOptions, SelectionRangeServerCapabilities, SelectionRangeParams, SelectionRangeRequest
};

// To be backwards compatible
export {
	ColorOptions as ColorProviderOptions, FoldingRangeOptions as FoldingRangeProviderOptions, SelectionRangeOptions as SelectionRangeProviderOptions
};