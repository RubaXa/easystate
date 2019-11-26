import { isPlainObject } from '../util';

const REV_SYMBOL = Symbol(`__easystate:rev__`);
const RAW_SYMBOL = Symbol(`__easystate:raw__`);
const OBSERVERS_SYMBOL = Symbol(`__easystate:observers__`);

let globalRev = 0;

export type EasyObserver<S extends object> = (state: S) => void;
export type EasyUnobserver<S extends object> = () => void;

export type LikeEasyState<S extends object> = S & {
	[REV_SYMBOL]?: number;
	[RAW_SYMBOL]?: S;
	[OBSERVERS_SYMBOL]?: Set<EasyObserver<S>>;
}

let easySyncActive = 0;
let easySyncQueue = new Set<() => void>();
let easySyncTasks = [] as Array<() => void>;
let easySyncTasksBusy = false;

function processingEasySyncTasks() {
	const tasks = easySyncTasks.slice(0);

	easySyncTasksBusy = true;
	easySyncTasks.length = 0;

	for (let i = 0, n = tasks.length; i < n; i++) {
		tasks[i]();
	}
}

export function easySync<A extends any[], R>(fn: (...args: A) => R, args: A): R {
	if (easySyncActive > 0) {
		return fn(...args);
	}

	easySyncActive = 1;
	const ret = fn(...args);
	easySyncActive = 2;
	easySyncQueue.forEach(dispatchEasyStateChangeIterator);
	easySyncQueue.clear();
	easySyncActive = 0;
	return ret;
}

export function easySyncCallback<A extends any[]>(fn: (...args: A) => void) {
	return (...args: A) => easySync(fn, args);
}

export function createEasyState<S extends object>(state: S): S {
	if (isEasyState(state)) {
		return state;
	}

	let rev = ++globalRev;
	const observers = new Set<EasyObserver<S>>()
	const unobservers = {} as {
		[K in keyof S]?: EasyUnobserver<S>;
	};

	const proxy =  new Proxy(state, {
		get<K extends keyof S>(target: S, key: K): S[K] {
			if (key === OBSERVERS_SYMBOL) {
				return observers as any;
			} else if (key === REV_SYMBOL) {
				return rev as any;
			} else if (key === RAW_SYMBOL) {
				return target as any;
			}

			let val = target[key];

			if (unobservers[key] === void 0) {
				unobservers[key] = noop;

				if (isPlainObject(val) || Array.isArray(val)) {
					val = createEasyState(val);

					target[key] = val;
					unobservers[key] = easyStateObserve(val, delayedEasyNotify);
				}
			}

			return val;
		},

		set<K extends keyof S>(target: S, key: K, value: S[K]): boolean {
			if (target[key] !== value) {
				if (unobservers[key] !== void 0) {
					unobservers[key]!();
					unobservers[key] = void 0;
				}

				target[key] = value;
				delayedEasyNotify();
			}

			return true;
		},
	});

	let easyNotifyLocked = false;

	const easyNotify = () => {
		rev = ++globalRev;
		easyNotifyLocked = false;
		dispatchEasyStateChange(proxy);
	};

	const delayedEasyNotify = () => {
		if (easySyncTasksBusy) {
			easyNotify();
		} else if (easySyncActive === 1) {
			easySyncQueue.add(easyNotify);
		} else if (easySyncActive === 2) {
			easyNotify();
		} else if (!easyNotifyLocked) {
			easyNotifyLocked = true;
			if (easySyncTasks.push(easyNotify) === 1) {
				requestAnimationFrame(processingEasySyncTasks);
			}
		}
	};

	return proxy;
}

export function easyStateObserve<S extends object>(state: LikeEasyState<S>, fn: (state: S) => void): EasyUnobserver<S> {
	expectEasyState(state);

	state[OBSERVERS_SYMBOL]!.add(fn);
	return () => {
		state[OBSERVERS_SYMBOL]!.delete(fn);
	};
}

export function isEasyState<S extends object>(state: S): state is LikeEasyState<S> {
	return state ? (state as any)[OBSERVERS_SYMBOL] !== void 0 : false;
}

export function getEasyStateRev<S extends object>(state: S): number {
	return expectEasyState(state)[REV_SYMBOL]!;
}

function dispatchEasyStateChange<S extends object>(state: LikeEasyState<S>) {
	state[OBSERVERS_SYMBOL]!.forEach(dispatchEasyStateChangeIterator, state);
}

function dispatchEasyStateChangeIterator<S extends object>(this: S, fn: EasyObserver<S>) {
	fn(this);
}

function expectEasyState<S extends object>(state: S): LikeEasyState<S> {
	if (!isEasyState(state)) {
		throw new Error(`I'ts not easy state`);
	}

	return state;
}

function noop() {
}