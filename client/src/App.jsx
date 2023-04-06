import axios from "axios"
import {Route, Routes} from 'react-router-dom';
import Chat from "./Chat";
import RegisterAndLoginForm from "./RegisterAndLoginForm";
import { UserContextProvider } from "./UserContext";


function App() {

  axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
  axios.defaults.withCredentials = true;


  return (
    <UserContextProvider>
      <Routes>
        <Route path="/" element={<RegisterAndLoginForm/>}/>
        <Route path="/chat" element={<Chat/>} />
      </Routes>
    </UserContextProvider>
  )
}

export default App
