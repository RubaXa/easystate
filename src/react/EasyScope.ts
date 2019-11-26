import {
	useState,
	createElement,
	useContext,
	createContext,
	ReactNode,
} from 'react';

import {
	LikeComponent,
	useIsomorphicLayoutEffect,
	EasyContext,
	EasyProvider,
	writeable,
	isLikePromise,
	useEasyStateObserve,
	useCache,
} from './utils';

export const EasyScopeManagerContext = createContext<EasyScopeManager<any> | null>(null);

export type EasyScopeController<P extends object> = {
	viewProps: () => P;
	prepare?: () => Promise<any> | void;
	onActivate?: () => void;
	onDeactivate?: () => void;
}

export type EasyScopeControllerFactoryParams<S extends object> = {
	state: S;
	manager: EasyScopeManager<S>;
}

export type EasyScopeControllerFactory<
	S extends object,
	P extends object,
> = (params: EasyScopeControllerFactoryParams<S>) => EasyScopeController<P>;

type MaybeAsync<T> = (() => Promise<T>) | T;

export type EasyScopeProps<
	P extends object,
	S extends object = P,
> = {
	name?: string;
	active?: boolean;
	prefetch?: boolean;
	state?: S;
	view: MaybeAsync<LikeComponent<P>>;
	controller?: MaybeAsync<EasyScopeControllerFactory<S, P>>;
	fallback?: JSX.Element;
	errback?: JSX.Element;
	onActivate?: () => void;
	onDeactivate?: () => void;
}

export const easyScopeController = createEasyScopeController<any>(() => ({
	viewProps: () => ({}),
}));

export function useEasyScopeManager<S extends object>(): EasyScopeManager<S> {
	return useContext(EasyScopeManagerContext)!;
}

function EasyScope<
	P extends object,
	S extends object,
>(props: EasyScopeProps<P, S>) {
	const ctxState = useContext(EasyContext) as S;
	const manager = useContext<EasyScopeManager<S> | null>(EasyScopeManagerContext);
	const [cache, forceUpdate] = useCache({state: 0} as {
		state: number;
		View: LikeComponent<P>;
		ctrlFactory: EasyScopeControllerFactory<S, P>;
		ctrl: EasyScopeController<P>;
	});
	let {
		name,
		state = ctxState,
		view,
		active,
		prefetch,
		controller = easyScopeController,
		fallback,
	} = props;
	let imNext = isNextScope(manager, name);

	active = active === undefined ? isActiveScope(manager, name) || !manager : active;
	prefetch = active || props.prefetch || imNext;

	if (prefetch) {
		if (cache.state === 0) {
			cache.state = 1;
			Promise
				.all([load(view), load(controller)])
				.then(([View, ctrlFactory]) => {
					writeable(cache, {state: 2, View, ctrlFactory})
					forceUpdate();
				})
			;
		} else if (cache.state === 2) {
			cache.state = 3;
			cache.ctrl = cache.ctrlFactory!({state, manager: manager!});

			if (cache.ctrl.prepare) {
				cache.state = 4;
				Promise.resolve(cache.ctrl.prepare()).then(() => {
					cache.state = 5;
					forceUpdate();
				});
			} else {
				cache.state = 5;
			}
		}
	} else if (!active) {
		cache.state = 0;
	}

	if (cache.state === 5) {
		if (imNext) {
			const prev = manager!.activeScope.name;
			writeable(manager!.activeScope, {locked: false, next: '', name, prev});
		} else {
			return createElement(EasyScopeWrapper, {
				is: cache.View!,
				name,
				ctrl: cache.ctrl!,
				onActivate: props.onActivate,
				onDeactivate: props.onDeactivate,
			});
		}
	}

	return active ? fallback || null : null;
}

type EasyScopeWrapperProps = {
	is: LikeComponent<any>;
	name?: string;
	ctrl: EasyScopeController<any>;
	onActivate?: () => void;
	onDeactivate?: () => void;
}

function EasyScopeWrapper(props: EasyScopeWrapperProps) {
	const {
		is,
		name,
		ctrl,
		onActivate,
		onDeactivate
	} = props;

	useIsomorphicLayoutEffect(() => {
		console.log(name, 'onActivate');
		safeCall(ctrl.onActivate);
		safeCall(onActivate);

		return () => {
			console.log(name, 'onDeactivate');
			safeCall(ctrl.onDeactivate);
			safeCall(onDeactivate);
		};
	}, []);

	return createElement(is, ctrl.viewProps());
}

export type EasyScopeActiveState = {
	name: string;
	readonly prev?: string;
	readonly next?: string;
	readonly locked?: boolean;
}

export function createEasyScopeActiveState(name: string): EasyScopeActiveState {
	return {
		name,
	};
}

export interface EasyScopeManager<S extends object> {
	readonly locked: boolean
	readonly state: S;
	readonly activeScope: EasyScopeActiveState;

	switchScope(name: string): void;
	switchScope(promise: Promise<string>): void;
}

export type EasyScopeManagerProps = {
	state: object;
	initialScope: EasyScopeActiveState;
	children: ReactNode;
}

function switchScope(this: EasyScopeManager<any>, name: string): void
function switchScope(this: EasyScopeManager<any>, promise: Promise<string>): void;
function switchScope(this: EasyScopeManager<any>, val: string | Promise<string>): void {
	if (isLikePromise(val)) {
		writeable(this.activeScope, { locked: true });
		val.then(next => {
			writeable(this.activeScope, {
				next,
				locked: true,
			});
		}); // todo: catch
	} else {
		writeable(this.activeScope, {
			next: val,
			locked: true,
		});
	}
}


export function EasyScopeManagerComponent(props: EasyScopeManagerProps) {
	const {state} = props;
	const [activeScope] = useState(props.initialScope);

	useEasyStateObserve(state);

	return createElement(
		EasyProvider,
		{value: state},
		createElement(
			EasyScopeManagerContext.Provider,
			{value: {
				state,
				locked: !!activeScope.locked,
				activeScope,
				switchScope,
			}},
			props.children,
		),
	);
}

// export const EasyScope: typeof PureEasyScope & {Manager: typeof EasyScopeManagerComponent} = memo(
// 	PureEasyScope,
// 	function areEqual(prevProps, nextProps) {
// 		return (
// 			prevProps.active !== nextProps.active &&
// 			prevProps.state !== nextProps.state &&
// 			prevProps.view !== nextProps.view &&
// 			prevProps.controller !== nextProps.controller
// 		);
// 	},
// ) as any;

EasyScope.Manager = EasyScopeManagerComponent;
export {EasyScope};

export function createEasyScopeController<
	S extends object,
	P extends object = S,
>(
	factory: (params: EasyScopeControllerFactoryParams<S>) => EasyScopeController<P>,
): EasyScopeControllerFactory<S, P> {
	(factory as any).isEasyCtrl = true
	return factory;
}

function isAsync<T extends Function>(fn: MaybeAsync<T>): fn is () => Promise<T> {
	return fn && fn.length === 0 && !(fn as any)['isEasyCtrl'];
}

function load<T extends Function>(fn: MaybeAsync<T>): Promise<T> {
	return Promise.resolve(isAsync(fn) ? fn() : fn);
}

function safeCall<
	R extends any,
>(fn?: () => R): R | undefined {
	return fn ? fn() : undefined;
}

function isActiveScope(manager: EasyScopeManager<any> | null, name?: string): boolean {
	return manager ? manager.activeScope.name === name : false;
}

function isNextScope(manager: EasyScopeManager<any> | null, name?: string): boolean {
	return manager ? manager.activeScope.next === name : false;
}