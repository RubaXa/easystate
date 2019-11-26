import { createEasyState, easyStateObserve, easySyncCallback } from './easystate';

describe('easystate', () => {
	it('check', () => {
		const state = createEasyState({
			value: 'foo',
			bar: {
				baz: 'qux',
			},
		});

		expect(state.value).toBe('foo');
		expect(state.bar.baz).toBe('qux');
	});

	it('observe', async () => {
		const state = createEasyState({value: ''});
		const log = [] as string[];

		easyStateObserve(state, (s) => {
			log.push(s.value);
		});

		await pause();
		expect(log).toEqual([]);

		state.value = 'foo';
		await pause();
		expect(log).toEqual(['foo']);

		state.value = 'bar';
		await pause();
		expect(log).toEqual(['foo', 'bar']);
	});

	it('observe (deeper)', async () => {
		const state = createEasyState({foo: {bar: {baz: '1'}}});
		const log = [] as string[];

		easyStateObserve(state, (s) => {
			log.push(JSON.stringify(s));
		});

		expect(log).toEqual([]);

		state.foo.bar.baz = 'first';
		await pause();
		expect(log).toEqual(['{\"foo\":{\"bar\":{\"baz\":\"first\"}}}']);

		log.length = 0
		state.foo.bar = {baz: 'second'};
		await pause();
		expect(log).toEqual(['{\"foo\":{\"bar\":{\"baz\":\"second\"}}}']);
	});
});

async function pause(ms = 20) {
	await new Promise(r => setTimeout(r, ms));
}