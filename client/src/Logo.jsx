import { useState } from "react"

export default function Logo() {
	const [help,setHelp] = useState(false);

	function toggleHelp() {
		setHelp(!help);
	}

	return(
		<div className="text-green-600 font-bold text-2xl flex gap-1 p-4 justify-between">
			{help ? (
  			<div className="fixed w-full h-screen bg-green-300/60 flex flex-col justify-center items-center z-20 top-0 left-0 font-normal">
					<p className="overflow-y-auto bg-gray-100 mb-24 w-3/4 2xl:w-1/2 p-8 rounded-md xl:text-lg border-gray-400 border-2 max-[600px]:text-sm max-[600px]:p-3 max-[600px]:w-full max-[600px]:mb-10">
						Hi, welcome to my Chatapp! <br/><br/> Allow me to provide you with a short tutorial.
						To chat with a user please select a user on the left hand nav bar and enter a message in the chatbox on the bottom of your screen.
						To send simply click the green send icon to send your message. If you wish to test the chat app independently you can open two
						different browsers to communicate to each account. <br/><br/>
						Here is a test account that you can use in addition to your own | username: Test_1 | pass: Test_1 |<br/><br/> 
						Please feel free to communicate any issues you face when using the application or improvements you would like to see through the Contact Me portion of my profile website.
						Thanks again for stopping by!
					</p>
    			<button onClick={toggleHelp} className="text-lg w-1/2 bg-green-500 text-white py-2 rounded-full bg-primary border-white shadow-md hover:scale-95 ease-in-out duration-500">Back to Site</button>
  			</div>
			) : null}
			<div className="flex">
				iMessage
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mt-.5">
					<path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
				</svg>
			</div>
			<button onClick={toggleHelp}
			className="bg-gray-100 border-2 rounded-md border-gray-300 hover:scale-90 ease-in-out duration-300 p-0.5 mt-0.5">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
  				<path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
				</svg>
			</button>
		</div>
	)
}