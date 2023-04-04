import axios from "axios";
import { useContext, useState } from "react"
import { Navigate } from "react-router-dom";
import { UserContext } from "./UserContext";

export default function RegisterAndLoginForm() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [redirect, setRedirect] = useState(false);
	const [isLoggedInOrRegistered, setIsLoggedInOrRegistered] = useState('login');
	// Deconstructing renaming
	const {setUsername:setLoggedInUsername, setId} = useContext(UserContext);
	
  async function handleSubmit(ev) {
		ev.preventDefault();
		try {
			const url = isLoggedInOrRegistered === 'register' ? '/register' : '/login';
			const {data} =  await axios.post(url, {username, password});
			setLoggedInUsername(username);
			setId(data.id);
			setRedirect(true);
		} catch (e) {
			alert('Login failed');
		}
	}

	if (redirect) {
		return <Navigate to={"/chat"} />
	}
	
	return(
		<div className="bg-green-50 h-screen flex items-center">
			<form className="w-72 mx-auto mb-12" onSubmit={handleSubmit}>
				<input value={username} 
					   onChange={ev => setUsername(ev.target.value)} 
					   type="text" 
					   placeholder="username" 
					   className="block w-full rounded-md p-2 mb-2 border"/>
				<input value={password} 
					   onChange={ev => setPassword(ev.target.value)} 
					   type="password" 
					   placeholder="password" 
					   className="block w-full rounded-md p-2 mb-2 border"/>
				{/* If you want to make sure that only a specific button triggers the form submission, 
				you can add the type="submit" attribute to that button, and leave the other buttons without it. */}
				
				{/* button is automatically associated with the form element. 
				When the user clicks the button, the form is submitted and the onsubmit event is triggered. 
				The onClick prop is not needed in this case, since the onsubmit event is already handling the form submission. */}
				<button className="bg-green-500 text-white block w-full rounded-md p-2">
					{isLoggedInOrRegistered === 'register' ? 'Register' : 'Login'}
				</button>
				<div className="text-center mt-2">
					{isLoggedInOrRegistered === 'register' && (
						<div className="">
							Already a member?
							<button className="ml-1 underline" 
									onClick={() => setIsLoggedInOrRegistered('login')}>
								Login here
							</button>
						</div>
					)}
					{isLoggedInOrRegistered === 'login' && (
						<div className="">
							Don't have an account?
							<button className="ml-1 underline" 
									onClick={() => setIsLoggedInOrRegistered('register')}>
								Register here
							</button>
						</div>
					)}
				</div>
			</form>
		</div>
	)
}