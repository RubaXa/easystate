EasyState
---------
Ой, всё, да, это очередное хрен знает что ;] нужно просто чтобы было и не спорьте!

```sh
npm i --save easystate
```

### Usage

```tsx
import { createEasyState } from 'easystate';
import { EasyComponent } from 'easystate/react';

const appState = createEasyState({
	counter: {
		value: 0,
	},
});

function Counter(props: {value: number}) {
	return <span>{props.value}</span>;
}

<div>
	<EasyComponent is={Counter} state={appState} mapToProps={(s) => s.counter} />
	<button onClick={() => { appState.counter.value += 1; }}>+</button>
</div>

<EasyScope
	active={ false }
	state={ appState }
	view={ ... }
	controller={ ... }
/>

<EasyScope.Manager
	state={ appState }
	initialActiveScope={ appState.step }
	onActivateScopeChange={ (state) => { appState.step = state; } }
>
	<EasyScope
		name="login"
		view={ ... }
		controller={ ... }
		fallback={ <Loading/> }
	/>
</EasyScope.Manager>
```


```tsx
const appState = createEasyState({
	users: {
		list: createEasyStateAsync([] as User),
		/*{
			state: User[], // данные
			ready: boolean, // готово к использованию
			expired: boolean, // данные устарели
			interactive: boolean, // готово, но с данными идет какая работа
			error: Error | null,
		}*/
	},
});

const fetchUsers = createEasyFetch('users.list', async (users: User[], offset: number, limit: number) => {
	const json = await easy.get('api/v1/users/list', {offset, limit});
	return json.body.list;
});

const removeUser = createEasyMutation('users.list.remove', async (users: User[], user: User) => {
	users.state = easyDelete(users.state, user);
	await easy.post('api/v1/users/remove', {id: user.id});
});


function List(props) {
	const {
		offset,
		limit,
		users, // appState.users.list
	} = props;
	const users = fetchUsers(users, offset, limit);

	if (!users.ready) {
		return <EasyFetchStatus
			value={users}
			loading={Loading}
			error={Err}
		/>;
	}

	return <>
		{users.interactive && <Spinner title="Синхронизация"/>}

		<ul>{users.state.map(item
			<li
				key={ item.id }
				onClick={ () => removeUser(users, item) }
			>
				{item.value}
			</li>
		)}</ul>
	</>;
}
```