import {
	createElement,
	AllHTMLAttributes,
} from 'react';

import {
	EasyFormElementState,
	EasyFormValue,
} from '../form';

export type EasyFormElementProps<V extends EasyFormValue> = {
	type: 'textarea'
		| 'button'
		| 'checkbox'
		| 'file'
		| 'hidden'
		| 'image'
		| 'password'
		| 'radio'
		| 'reset'
		| 'submit'
		| 'text'
		| 'color'
		| 'date'
		| 'datetime'
		| 'datetime-local'
		| 'email'
		| 'number'
		| 'range'
		| 'search'
		| 'tel'
		| 'time'
		| 'url'
		| 'month'
		| 'week'
	;
	value?: V;
	state: EasyFormElementState<V>;
}

export function PureEasyFormElementProps<
	S extends string | number | boolean,
>(
	props: EasyFormElementProps<S>,
) {
	const {
		type,
		state,
		value,
	} = props;
	const domProps: AllHTMLAttributes<HTMLInputElement> = {
		type,
		value: value as string,
		readOnly: state.locked,
	};

	if (type === 'checkbox') {
		domProps.checked = state.value as boolean;
	} else if (type === 'radio') {
		domProps.checked = state.value === value;
	} else {
		domProps.value = state.value as string;
	}

	return createElement(
		type === 'textarea' ? 'textarea' : 'input',
		domProps,
	);
}