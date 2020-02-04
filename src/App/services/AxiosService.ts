import Axios, {
	CancelTokenSource
} from 'axios';
import qs from 'qs';

export * from 'axios';

export const AxiosServiceToken = Symbol('AxiosServiceToken');

Object.assign(Axios.defaults, {
	responseType: 'json'
});

export function create() {
	return Axios.create({
		paramsSerializer: params => qs.stringify(params, { indices: false })
	});
}

export type AxiosConstructor = typeof create;

export default {
	provide:  AxiosServiceToken,
	useValue: create
};

const {
	CancelToken
} = Axios;

const cancelTokens = new Map<any, CancelTokenSource>();

export function getCancelToken(key: any) {

	if (cancelTokens.has(key)) {
		cancelTokens.get(key).cancel();
	}

	const source = CancelToken.source();

	cancelTokens.set(key, source);

	return source.token;
}
