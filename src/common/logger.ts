import {
	sep
} from 'path';

export function getLoggerContext(filename: string) {

	const parts = filename.split(sep);
	const contextParts: string[] = [];
	let i = parts.length - 1;
	let part = parts[i];

	while (part !== 'src' && i > 0) {

		if (!/^[a-z]/.test(part)) {
			contextParts.unshift(part.replace(/\.\w+$/, ''));
		}

		part = parts[--i];
	}

	return contextParts.join('::');
}

export function stringify(data: any) {
	return JSON.stringify(data, null, '\t');
}
