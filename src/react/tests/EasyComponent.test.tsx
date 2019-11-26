import * as React from 'react';
import { render } from 'react-dom';
import { act } from 'react-dom/test-utils';

import { createEasyState } from '../../easystate';
import {
	EasyComponent,
	easyMapToProps,
} from '../EasyComponent';

describe('EasyComponent', () => {
	const Counter = (props:{value: number}) => <b>{props.value}</b>;

	it('is', () => {
		const state = createEasyState({value: 1});
		const box = document.createElement('div');

		act(() => { render(<EasyComponent is={Counter} state={state} mapToProps={easyMapToProps} />, box); });
		expect(box.innerHTML).toBe('<b>1</b>');

		act(() => { state.value++; });
		expect(box.innerHTML).toBe('<b>2</b>');
	});

	it('is with mapToProps', () => {
		const state = createEasyState({counter: {value: 1}});
		const box = document.createElement('div');

		act(() => { render(<EasyComponent is={Counter} state={state} mapToProps={s => s.counter} />, box); });
		expect(box.innerHTML).toBe('<b>1</b>');

		act(() => { state.counter.value++; });
		expect(box.innerHTML).toBe('<b>2</b>');
	});
});