import { easySyncCallback } from '../easystate';

export type EasyFormValue =  number | string | boolean;

export type LikeChangeEvent = {
	type: string;
	target: EventTarget;
}

export type EasyFormElementState<V extends EasyFormValue> = {
	value: V;
	invalid: boolean;
	focused: boolean;
	touched: boolean;
	changed: boolean;
	locked: boolean;
	validator?: (value: V) => boolean,
}

export type EasyFormElementStateReturn<V extends EasyFormValue> = (
	V extends string ? EasyFormElementState<string> :
	V extends boolean ? EasyFormElementState<boolean> :
	EasyFormElementState<number>
)

export function createEasyFormElementState<
	V extends EasyFormValue,
>(
	value: V,
	validator?: (value: V) => boolean,
) {
	const state = {
		value,
		invalid: true,
		focused: false,
		touched: false,
		changed: false,
		locked: false,
		validator,
	}

	Object.defineProperty(state, 'value', {
		get() {
			return value;
		},
		set(v: V) {
			value = v;
			state.invalid = state.validator ? !state.validator(v) : false;
		},
	})

	return state as any as EasyFormElementStateReturn<V>;
}

const delayedBlurQueue = [] as Array<() => void>;

if (typeof document !== 'undefined') {
	const call = (fn: () => void) => { fn(); };
	const exec = () => {
		delayedBlurQueue.forEach(call);
		delayedBlurQueue.length = 0;
	};
	const delayedExec = () => requestAnimationFrame(exec);

	document.addEventListener('mouseup', delayedExec, true);
	document.addEventListener('touchup', delayedExec, true);
	document.addEventListener('touchcancel', delayedExec, true);
}

export type EasyFormHandle<V extends EasyFormValue> = {
	value?: V;
	checked?: boolean;
	onFocus: () => void;
	onBlur: () => void;
	onChange: (evt: LikeChangeEvent) => void;
}

export function createEasyFormElementHandle<
	V extends EasyFormValue,
>(
	state: EasyFormElementState<V>,
): EasyFormHandle<V> {
	const valueType = typeof state.value;
	let realFocus = false;
	let delayedBlurStarted = false;

	function delayedBlur() {
		delayedBlurStarted = false;

		if (!realFocus) {
			state.focused = false;
			state.touched = true;
		}
	}

	const handle: EasyFormHandle<V> = {
		onFocus: () => {
			realFocus = true;
			state.focused = true;
		},

		onBlur: () => {
			realFocus = false;

			if (!delayedBlurStarted) {
				delayedBlurStarted = true;
				delayedBlurQueue.push(delayedBlur);
			}
		},

		onChange: easySyncCallback((evt: LikeChangeEvent) => {
			const {
				type,
				value,
				checked,
			} = evt.target as HTMLInputElement;

			if (type === 'checkbox') {
				state.value = checked as V;
			} else if (type === 'radio') {
				if (checked) {
					state.value = value as V;
				}
			} else {
				state.value = (valueType === 'number' ? parseFloat(value) : value) as V;
			}

			state.changed = true;
		}),
	};

	if (valueType === 'boolean') {
		Object.defineProperty(handle, 'checked', {
			configurable: false,
			get: () => !!state.value,
		});
	} else {
		Object.defineProperty(handle, 'value', {
			configurable: false,
			get: () => state.value,
		});
	}

	return handle;
}

export function createEasyFormValidate<
	S extends {[key:string]: {valid: boolean}},
	K extends keyof S,
>(masterState: S, keys: K[]) {
	function check(this: S, key: K): boolean {
		return this[key].valid;
	}

	return (state: S = masterState) => keys.some(check, state);
}
