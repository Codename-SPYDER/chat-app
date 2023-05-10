import { useContext, useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import Logo from "./Logo";
import { UserContext } from "./UserContext";
import {uniqBy} from "lodash";
import Contact from "./Contact";

export default function Chat() {
	const [ws, setWs] = useState(null);
	const [onlinePeople, setOnlinePeople] = useState({});
	const [selectedUserId, setSelectedUserId] = useState(null);
	const {username, id, setId, setUsername} = useContext(UserContext);
	const [newMessageText, setNewMessageText] = useState('');
	const [messages, setMessages] = useState([]);
	const [offlinePeople, setOfflinePeople] = useState({});
	const [redirect, setRedirect] = useState(false);
	const divUnderMessages = useRef();
	
	
	useEffect(() => {
			connectToWs();
	}, [])

	useEffect(() => {
		axios.get('/people').then(res => {
			const offlinePeople = [];
			const offlinePeopleArr = res.data
			.filter(obj => obj._id !== id)
			.filter(obj => !Object.keys(onlinePeople).includes(obj._id));
			offlinePeopleArr.forEach(obj => {
				offlinePeople[obj._id] = obj.username;
			});
			setOfflinePeople(offlinePeople);
		});

	}, [onlinePeople])

	useEffect(() => {
		const div = divUnderMessages.current;
		if (div) {
			div.scrollIntoView({behavior: 'smooth', block: 'end'});
		}
	}, [messages]);

	useEffect(() => {
		if (selectedUserId) {
			axios.get('/messages/' + selectedUserId).then(res => {
				setMessages(res.data);

			});
		}
	}, [selectedUserId]);

	const onlinePeopleExcludeOurUser = {...onlinePeople};
	delete onlinePeopleExcludeOurUser[id];

	const messagesWithoutDupes = uniqBy(messages, '_id');
	
	function handleClose() {
		setTimeout(() => {
			console.log('Disconnected. Trying to reconnect');
			connectToWs();
		}, 1000);
	}

	function logout() {
		axios.post('/logout').then( () => {
			ws.removeEventListener('close', handleClose);
			ws.close();
			setWs(null);
			setId(null);
			setUsername(null);
			setRedirect(true);
		});
	}

	// Console err: Rendered fewer hooks than expected. This may be caused by an accidental early return statement.
	// Problem: returned a value before executing all the hooks that were declared (useEffect)
	// Solution: Rearrange code so useEffects() precede return statement
	if (redirect) {
		return <Navigate to={'/'} />
	}

	function connectToWs() {
		const ws_obj = new WebSocket(import.meta.env.VITE_WS_URL);
		setWs(ws_obj);
		// new Websocket(ws://localhost:) used on client side - object that can establish a connection to a WebSocket server
		// new ws.WebSocketServer({server}) used on server side - object that can listen for and handle incoming WebSocket connections from clients
		ws.addEventListener('message', handleMessage);
		ws.addEventListener('close', handleClose);
		}


	// Takes in array of clients from WebSocket
	function showOnlinePeople(peopleArray) {
		const people = []
		const filterUndefinedPeople = peopleArray
			.filter((obj) => {
				// return number of keys in obj
				if (Object.keys(obj).length === 0) {
					return false;
				}
				// iterate over key values to see if any are funny lookin
				for (let key in obj) {
					if (obj[key] === undefined || obj[key] === null) {
						return false;
					}
				}
				return true;
			});
		filterUndefinedPeople.forEach(obj => {people[obj.userId] = obj.username});
		setOnlinePeople(people);
	}

	function handleMessage(ev) {
		const messageData = JSON.parse(ev.data);
		if ('online' in messageData) {
			// Problem: seeing duplicates in messageData.online
			// Solution: Remove dups upstream in server
			showOnlinePeople(messageData.online);
		} else if ('text' in messageData) {
			
			setMessages(prev => ([...prev, {...messageData}]));
			
		}
	}

	

	// Executed on Form onSubmit={}
	function sendMessage(ev, file = null) {
		ev.preventDefault();
		// .send() will set off 'message' event listener on WebSocketServer
		if (!newMessageText) {
			alert('Please fill out field to send');
			return;
		}
		else {
			ws.send(JSON.stringify({
				recipient: selectedUserId, 
				text: newMessageText,
				file,
			}));
			setNewMessageText('');
			// Add new message to messages array
			setMessages(prev => ([...prev, {
				text: newMessageText,
				sender: id,
				recipient: selectedUserId,
				_id: Date.now(),
			}]));
		}
		//if (file) {
		//	axios.get('/messages/' + selectedUserId).then(res => {
		//		setMessages(res.data);
		//	});
		//} else {
		//	// Clear input on Form
		//	setNewMessageText('');
		//	// Add new message to messages array
		//	setMessages(prev => ([...prev, {
		//		text: newMessageText,
		//		sender: id,
		//		recipient: selectedUserId,
		//		_id: Date.now(),
		//	}]))
		//}
	}

	function sendFile(ev) {
		const reader = new FileReader();
		reader.readAsDataURL(ev.target.files[0]);
		reader.onload = () => {
			sendMessage(null, {
				name: ev.target.files[0].name,
				data: reader.result,
			});
		};
	}

	return (
		<div className="flex h-screen">
			<div className="bg-white w-1/3 flex flex-col ">
				{/* Left side of screen */}
				<div className="flex-grow">
					<Logo />
					{// Object.keys returns an array of keys
					Object.keys(onlinePeopleExcludeOurUser).map(userId => (
						<Contact 
							key={userId}
							id={userId} 
							username={onlinePeopleExcludeOurUser[userId]} 
							selectContact={() => setSelectedUserId(userId)}
							// change to true for contact that matches userId 
							selected={userId === selectedUserId}
							online={true} />
					))}
					{Object.keys(offlinePeople).map(userId => (
						<Contact
						  key={userId}
						  id={userId}
						  online={false}
						  username={offlinePeople[userId]}
						  selectContact={() => setSelectedUserId(userId)}
						  selected={userId === selectedUserId} />
					))}
				</div>
				<div className="p-2 text-center">
					<div className="mx-auto mb-2 bg-gray-400 border text-white py-2 rounded-full w-2/3">
						<span className="flex justify-center gap-2 px-2" >
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
								<path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
							</svg>
							{username} 
						</span>
					</div>
					<button 
					onClick={logout}
					className="text-md text-white w-2/3 bg-green-500 py-2 border rounded-full">Logout</button>
				</div>
			</div>
			{/* Right side of screen */}
			<div className=" flex flex-col bg-green-50 w-2/3 p-2">
				<div className="flex-grow">
					{!selectedUserId && (
						<div className="flex items-center justify-center h-full">
							<div className="text-gray-500 text-lg">
								&larr; Select a person to chat with
							</div> 
						</div>
					)}
					{/* Below object renders messages when user selected*/}
					{!!selectedUserId && (
						<div className="relative h-full">
							{/*FIND OUT HOW RELATIVE, H-FULL, ABSOLUTE, INSET-0 WORK TO CREATE AN IMBEDDED SCROLL SCREEN*/}
							<div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-2">
							{messagesWithoutDupes.map(message => (
								//below <div> aligns user texts to the right and recipient texts to left
								<div key={message._id} className={message.sender === id ? 'text-right' : 'text-left'}>
									{/*below <div> colours recipient and user messages differently*/}   
									<div className={"text-left inline-block p-2 my-2 rounded-md text-sm" + (message.sender === id ? ' bg-blue-500 text-white' : ' bg-white text-gray-500')}>
										{message.text}
										{message.file && (
											<a target="_blank" className="flex items-center gap-1 underline" href={axios.defaults.baseURL + '/uploads/' + message.file}>
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
													<path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 00-3.182 0l-10.94 10.94a3.75 3.75 0 105.304 5.303l7.693-7.693a.75.75 0 011.06 1.06l-7.693 7.693a5.25 5.25 0 11-7.424-7.424l10.939-10.94a3.75 3.75 0 115.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 015.91 15.66l7.81-7.81a.75.75 0 011.061 1.06l-7.81 7.81a.75.75 0 001.054 1.068L18.97 6.84a2.25 2.25 0 000-3.182z" clipRule="evenodd" />
												</svg>
													{message.file}
											</a>
										)}
									</div>
								</div>
							))}
							<div ref={divUnderMessages} className="h-4"></div>
							</div>
						</div> 
					)}
				</div>
				{!!selectedUserId && (
					// Below object renders input and chat options
					<form onSubmit={sendMessage} className="flex gap-2">
						<input type="text" 
							   value={newMessageText}
							   onChange={ev => setNewMessageText(ev.target.value)}
							   className="bg-white border p-2 flex-grow rounded-sm" 
							   placeholder="Type your message here"/>
				 {/*
				 		--Focus on text chat functionality for deployment--
				 		<label className="bg-gray-200 p-2 rounded-sm border border-gray-300 cursor-pointer">
							<input type="file" className="hidden" onChange={sendFile}/>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
								<path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 00-3.182 0l-10.94 10.94a3.75 3.75 0 105.304 5.303l7.693-7.693a.75.75 0 011.06 1.06l-7.693 7.693a5.25 5.25 0 11-7.424-7.424l10.939-10.94a3.75 3.75 0 115.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 015.91 15.66l7.81-7.81a.75.75 0 011.061 1.06l-7.81 7.81a.75.75 0 001.054 1.068L18.97 6.84a2.25 2.25 0 000-3.182z" clipRule="evenodd" />
							</svg>
						</label>
						*/}
						<button type='submit' 
										className=" bg-green-500 p-2 text-white rounded-sm">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
								<path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
							</svg>
						</button>
					</form>
				)}
			</div>
		</div>
	)
}