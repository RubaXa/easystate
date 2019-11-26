import * as React from 'react';
import { render } from 'react-dom';
import { act } from 'react-dom/test-utils';

import { createEasyState } from '../../easystate';
import {
	EasyScope,
	createEasyScopeController,
	createEasyScopeActiveState,
} from '../EasyScope';

describe('EasyScope', () => {
	const Counter = (props:{value: number}) => <b>{props.value || '[[undefined]]'}</b>;
	const asyncCounter = () => fakeImport().then(() => Counter);
	const counterControllerFactory = createEasyScopeController<{value: number}>(({state}) => ({
		viewProps: () => state,
	}));
	const asyncCounterControllerFactory = () => fakeImport(10).then(() => counterControllerFactory);

	it('sync', async () => {
		const state = createEasyState({value: 1});
		const box = document.createElement('div');

		await act(async () => {
			render(
				<EasyScope
					state={ state }
					view={ Counter }
					controller={ counterControllerFactory }
					fallback={ <i>loading...</i> }
				/>,
				box,
			);
			expect(box.innerHTML).toBe('<b>1</b>');
		});

		act(() => { state.value++; });
		expect(box.innerHTML).toBe('<b>2</b>');
	});

	it('async', async () => {
		const state = createEasyState({value: 1});
		const box = document.createElement('div');

		await act(async () => {
			render(
				<EasyScope
					state={ state }
					view={ asyncCounter }
					controller={ asyncCounterControllerFactory }
					fallback={ <i>loading...</i> }
				/>,
				box,
			);
			expect(box.innerHTML).toBe('<i>loading...</i>');

			await pause(30);
			expect(box.innerHTML).toBe('<b>1</b>');
		});

		act(() => { state.value++; });
		expect(box.innerHTML).toBe('<b>2</b>');
	});

	it('async with prepare', async () => {
		const state = createEasyState({value: 1});
		const box = document.createElement('div');
		const ctrlFactory = createEasyScopeController<{value: number}>(({state}) => ({
			viewProps: () => state,
			prepare: () => pause(15),
		}))

		await act(async () => {
			render(
				<EasyScope
					state={ state }
					view={ Counter }
					controller={ ctrlFactory }
					fallback={ <i>loading...</i> }
				/>,
				box,
			);
			expect(box.innerHTML).toBe('<i>loading...</i>');

			await pause(10);
			expect(box.innerHTML).toBe('<i>loading...</i>');

			await pause(10);
			expect(box.innerHTML).toBe('<b>1</b>');
		});
	});
});

describe('EasyScope.Manager', () => {
	type AppState = {
		login: {state: string};
		pass: {state: string};
	};

	const Login = (props: AppState['login']) => <b>{props.state}</b>;
	const Pass = (props: AppState['pass']) => <s>{props.state}</s>;

	const ctrlLogin = createEasyScopeController<AppState, AppState['login']>(({state}) => ({
		viewProps: () => state.login,
	}));
	const ctrlPass = createEasyScopeController<AppState, AppState['pass']>(({state}) => ({
		viewProps: () => state.pass,
	}));

	it('without name', async () => {
		const appState = createEasyState({
			login: {state: 'Foo'},
			pass: {state: '123zaq'},
		});
		const box = document.createElement('div');

		await act(async () => {
			render(
				<EasyScope.Manager
					state={ appState }
					initialScope={{name: 'dddd1'}}
				>
					<EasyScope view={ Login } controller={ ctrlLogin } />
					<EasyScope view={ Pass } controller={ ctrlPass } />
				</EasyScope.Manager>,
				box,
			);
		});

		expect(box.innerHTML).toBe('<b>Foo</b><s>123zaq</s>');
	});

	it('with name', async () => {
		const appState = createEasyState({
			login: {state: 'Foo'},
			pass: {state: '123zaq'},
			step: createEasyScopeActiveState('login'),
		});
		const box = document.createElement('div');

		await act(async () => {
			render(
				<EasyScope.Manager
					state={ appState }
					initialScope={ appState.step }
				>
					<EasyScope name="login" view={ Login } controller={ ctrlLogin } />
					<EasyScope name="pass" view={ Pass } controller={ ctrlPass } />
				</EasyScope.Manager>,
				box,
			);
		});

		expect(box.innerHTML).toBe('<b>Foo</b>');

		await act(async () => { appState.step.name = 'pass'; });
		expect(box.innerHTML).toBe('<s>123zaq</s>');
	});
});

function fakeImport(ms: number = 20) {
	return pause(ms);
}

function pause(ms: number) {
	return new Promise(r => setTimeout(r, ms));
}