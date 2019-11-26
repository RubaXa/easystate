import {
	useState,
	useContext,
	createElement,
	ReactNode,
	Fragment,
} from 'react';
import {
	EasyContext,
	LikeComponent,
	useEasyStateObserve,
} from './utils';

export type EasyComponentProps<
	S extends object,
	P extends object,
> = EasyComponentWithChildrenProps<S> | EasyComponentWithoutChildrenProps<S, P>;

export type EasyComponentWithoutChildrenProps<
	S extends object,
	P extends object,
> = {
	is: LikeComponent<P>;
	state?: S;
	mapToProps: (state: S) => P;
}

export type EasyComponentWithChildrenProps<S extends object> = {
	state: S;
	children: (state: S) => ReactNode;
}

export function EasyComponent<
	S extends object,
	P extends object,
>(props: EasyComponentProps<S, P>) {
	const ctxState = useContext(EasyContext) as S;
	const {
		is,
		state = ctxState,
		mapToProps,
		children,
	} = props as EasyComponentWithoutChildrenProps<S, P> & EasyComponentWithChildrenProps<S>;
	const [cache, setCache] = useState({} as (
		& {frag: JSX.Element | undefined}
		& EasyComponentWithoutChildrenProps<any, any>
	));

	useEasyStateObserve(state, () => {
		setCache({
			...cache,
			frag: void 0,
		});
	});

	if (children !== undefined) {
		return createElement(Fragment, {}, children(state));
	} else if (
		cache.frag === void 0
		|| cache.is !== is
		|| cache.state !== state
		|| cache.mapToProps !== mapToProps
	) {
		cache.frag = createElement(
			is,
			(mapToProps ? mapToProps(state) : state) as P,
		);
		cache.is = is;
		cache.state = state;
		cache.mapToProps = mapToProps;
	}

	return cache.frag;
}

export function easyMapToProps<S extends object>(state: S): S {
	return state;
}