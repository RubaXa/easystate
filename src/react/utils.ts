
import {
	useEffect,
	useLayoutEffect,
	createContext,
	useReducer,
	useState,
} from 'react';
import { easyStateObserve } from '../easystate';

export const useIsomorphicLayoutEffect =
	typeof window !== 'undefined' &&
	typeof window.document !== 'undefined' &&
	typeof window.document.createElement !== 'undefined'
		? useLayoutEffect
		: useEffect
;

export type Writeable<T extends object> = {
	-readonly [P in keyof T]: T[P];
}

export function writeable<T extends object>(obj: T, patch?: Partial<T>): Writeable<T> {
	patch && Object.assign(obj, patch);
	return obj;
}

export type LikeComponent<P extends object> = (props: P) => JSX.Element;
export type AnyComponent = LikeComponent<object>;

export const EasyContext = createContext(null as (object | null));
export const EasyConsumer = EasyContext.Consumer;
export const EasyProvider = EasyContext.Provider;

export function isLikePromise<T>(val: any): val is Promise<T> {
	return val ? typeof val.then === 'function' : false;
}

const useForceUpdateReducer = (x: number) => x + 1;

export function useForceUpdate(): () => void {
	return useReducer(useForceUpdateReducer, 0)[1] as any;
}

export function useEasyStateObserve<S extends object>(
	state: S,
	callback?: (state: S) => void,
): [number, () => void] {
	const [, forceUpdate] = useReducer(useForceUpdateReducer, 0) as any;

	useIsomorphicLayoutEffect(() => easyStateObserve(state, () => {
		callback && callback(state);
		forceUpdate();
	}), [state]);

	return forceUpdate;
}

export function useCache<T extends object>(initial: Partial<T>): [Partial<T>, () => void] {
	const [cache] = useState(initial as Partial<T>);
	const forceUpdate = useForceUpdate();
	return [cache, forceUpdate];
}