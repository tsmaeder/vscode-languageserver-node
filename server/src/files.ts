/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import * as url from 'url';
import * as path from 'path';
import * as fs from 'fs';
import { spawnSync, fork, ChildProcess, SpawnSyncOptionsWithStringEncoding } from 'child_process';

/**
 * @deprecated Use the `vscode-uri` npm module which provides a more
 * complete implementation of handling VS Code URIs.
 */
export function uriToFilePath(uri: string): string | undefined {
	let parsed = url.parse(uri);
	if (parsed.protocol !== 'file:' || !parsed.path) {
		return undefined;
	}
	let segments = parsed.path.split('/');
	for (var i = 0, len = segments.length; i < len; i++) {
		segments[i] = decodeURIComponent(segments[i]);
	}
	if (process.platform === 'win32' && segments.length > 1) {
		let first = segments[0];
		let second = segments[1];
		// Do we have a drive letter and we started with a / which is the
		// case if the first segement is empty (see split above)
		if (first.length === 0 && second.length > 1 && second[1] === ':') {
			// Remove first slash
			segments.shift();
		}
	}
	return path.normalize(segments.join('/'));
}

function isWindows(): boolean {
	return process.platform === 'win32';
}

export function resolve(moduleName: string, nodePath: string | undefined, cwd: string | undefined, tracer: (message: string, verbose?: string) => void): Thenable<string> {
	interface Message {
		c: string;
		s?: boolean;
		a?: any;
		r?: any
	}

	const nodePathKey: string = 'NODE_PATH';

	const app: string = [
		'var p = process;',
		'p.on(\'message\',function(m){',
		'if(m.c===\'e\'){',
		'p.exit(0);',
		'}',
		'else if(m.c===\'rs\'){',
		'try{',
		'var r=require.resolve(m.a);',
		'p.send({c:\'r\',s:true,r:r});',
		'}',
		'catch(err){',
		'p.send({c:\'r\',s:false});',
		'}',
		'}',
		'});'
	].join('');

	return new Promise<any>((resolve, reject) => {
		let env = process.env;
		let newEnv = Object.create(null);
		Object.keys(env).forEach(key => newEnv[key] = env[key]);

		if (nodePath) {
			if (newEnv[nodePathKey]) {
				newEnv[nodePathKey] = nodePath + path.delimiter + newEnv[nodePathKey];
			} else {
				newEnv[nodePathKey] = nodePath;
			}
			if (tracer) {
				tracer(`NODE_PATH value is: ${newEnv[nodePathKey]}`);
			}
		}
		newEnv['ELECTRON_RUN_AS_NODE'] = '1';
		try {
			let cp: ChildProcess = fork('', [], <any>{
				cwd: cwd,
				env: newEnv,
				execArgv: ['-e', app]
			});
			if (cp.pid === void 0) {
				reject(new Error(`Starting process to resolve node module  ${moduleName} failed`));
				return;
			}
			cp.on('error', (error: any) => {
				reject(error);
			});
			cp.on('message', (message: Message) => {
				if (message.c === 'r') {
					cp.send({ c: 'e' });
					if (message.s) {
						resolve(message.r);
					} else {
						reject(new Error(`Failed to resolve module: ${moduleName}`));
					}
				}
			});
			let message: Message = {
				c: 'rs',
				a: moduleName
			};
			cp.send(message);
		} catch (error) {
			reject(error);
		}
	});

}

export function resolveGlobalNodePath(tracer?: (message: string) => void): string | undefined {
	let npmCommand = 'npm';
	let options: SpawnSyncOptionsWithStringEncoding = {
		encoding: 'utf8'
	};
	if (isWindows()) {
		npmCommand = 'npm.cmd';
		options.shell = true;
	}

	let handler = () => {};
	try {
		process.on('SIGPIPE', handler);
		let stdout = spawnSync(npmCommand, ['config', 'get', 'prefix'], options).stdout;

		if (!stdout) {
			if (tracer) {
				tracer(`'npm config get prefix' didn't return a value.`);
			}
			return undefined;
		}
		let prefix = stdout.trim();
		if (tracer) {
			tracer(`'npm config get prefix' value is: ${prefix}`);
		}

		if (prefix.length > 0) {
			if (isWindows()) {
				return path.join(prefix, 'node_modules');
			} else {
				return path.join(prefix, 'lib', 'node_modules');
			}
		}
		return undefined;
	} catch (err) {
		return undefined;
	} finally {
		process.removeListener('SIGPIPE', handler);
	}
}

interface YarnJsonFormat {
	type: string;
	data: string;
}

export function resolveGlobalYarnPath(tracer?: (message: string) => void): string | undefined {
	let yarnCommand = 'yarn';
	let options: SpawnSyncOptionsWithStringEncoding = {
		encoding: 'utf8'
	};

	if (isWindows()) {
		yarnCommand = 'yarn.cmd';
		options.shell = true;
	}

	let handler = () => {};
	try {
		process.on('SIGPIPE', handler);
		let results = spawnSync(yarnCommand, ['global', 'dir', '--json'], options);

		let stdout = results.stdout;
		if (!stdout) {
			if (tracer) {
				tracer(`'yarn global dir' didn't return a value.`);
				if (results.stderr) {
					tracer(results.stderr);
				}
			}
			return undefined;
		}
		let lines = stdout.trim().split(/\r?\n/);
		for (let line of lines) {
			try {
				let yarn: YarnJsonFormat = JSON.parse(line);
				if (yarn.type === 'log') {
					return path.join(yarn.data, 'node_modules');
				}
			} catch (e) {
				// Do nothing. Ignore the line
			}
		}
		return undefined;
	} catch (err) {
		return undefined;
	} finally {
		process.removeListener('SIGPIPE', handler);
	}
}

export namespace FileSystem {

	let _isCaseSensitive: boolean | undefined = undefined;
	export function isCaseSensitive(): boolean {
		if (_isCaseSensitive !== void 0) {
			return _isCaseSensitive;
		}
		if (process.platform === 'win32') {
			_isCaseSensitive = false;
		} else {
			// convert current file name to upper case / lower case and check if file exists
			// (guards against cases when name is already all uppercase or lowercase)
			_isCaseSensitive = !fs.existsSync(__filename.toUpperCase()) || !fs.existsSync(__filename.toLowerCase());
		}
		return _isCaseSensitive;
	}

	export function isParent(parent: string, child: string): boolean {
		if (isCaseSensitive()) {
			return path.normalize(child).indexOf(path.normalize(parent)) === 0;
		} else {
			return path.normalize(child).toLowerCase().indexOf(path.normalize(parent).toLowerCase()) === 0;
		}
	}
}

export function resolveModulePath(workspaceRoot: string, moduleName: string, nodePath: string, tracer: (message: string, verbose?: string) => void): Thenable<string> {
	if (nodePath) {
		if (!path.isAbsolute(nodePath)) {
			nodePath = path.join(workspaceRoot, nodePath);
		}

		return resolve(moduleName, nodePath, nodePath, tracer).then((value) => {
			if (FileSystem.isParent(nodePath, value)) {
				return value;
			} else {
				return Promise.reject<string>(new Error(`Failed to load ${moduleName} from node path location.`));
			}
		}).then<string, string>(undefined, (_error: any) => {
			return resolve(moduleName, resolveGlobalNodePath(tracer), workspaceRoot, tracer);
		});
	} else {
		return resolve(moduleName, resolveGlobalNodePath(tracer), workspaceRoot, tracer);
	}
}