import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const UserContext = createContext({});

export function UserContextProvider({children}) {
	const [username, setUsername] = useState(null);
	const [id, setId] = useState(null);
	
	useEffect(() => {
		axios.get('/profile').then(({data}) => {
			setId(data.userId);
			setUsername(data.username);
		})
	}, []);

	return(
		<UserContext.Provider value={{username, setUsername, id, setId}}>
			{children}
		</UserContext.Provider>
	)
}