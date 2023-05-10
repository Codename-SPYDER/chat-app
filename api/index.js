// Express & Dotenv Setup
const express = require('express');
//const PORT = 4000
//const path = require('path');
const { createServer } = require('http');
const app = express();
require('dotenv').config();
const _ = require("lodash"); 

// Dependencies
const fs = require('fs');
const ws = require('ws');
const cors = require('cors');

// Token & Cookie Setup
const bcrypt = require('bcryptjs');
const bcryptSalt = bcrypt.genSaltSync(10);
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;
const cookieParser = require('cookie-parser');

// Model Imports & Mongoose
const mongoose = require('mongoose');
const UserModel = require('./models/User');
const MessageModel = require('./models/Message');

// Parse incoming string to json format
app.use(express.json());
app.use(cookieParser());
app.use(cors({
	credentials:true,
	origin:process.env.CLIENT_URL,
}));

app.use('/uploads', express.static(__dirname + '/uploads'));


mongoose.connect(process.env.MONGO_URL);


async function getUserDataFromReq(req) {
	return new Promise((resolve, reject) => {
		const token = req.cookies?.token;
		if (token) {
		 jwt.verify(token, jwtSecret, {}, (err, tokenData) => {
			if (err) throw err;
			resolve(tokenData);
			})
		} else {
			reject('no token');
		}
	}); 
}

app.post('/api/register', async (req, res) => {
	mongoose.connect(process.env.MONGO_URL);
	const {username, password} = req.body;
	const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
	{/* createdUser = {
  _id: new ObjectId(""),
  username: '',
  password: '',
  createdAt: 2023-03-07T21:56:07.194Z,
  updatedAt: 2023-03-07T21:56:07.194Z,
  __v: 0
	} */}
	const createdUser = await UserModel.create({
		username: username, 
		password: hashedPassword,});
	jwt.sign({userId:createdUser._id, username}, jwtSecret, {},(err, token) => {
		if (err) throw err;
		res.cookie('token', token, {sameSite:'none', secure:true}).status(201).json({
			id: createdUser._id,
			
		});
	});
})

app.post('/api/login', async (req, res) => {
	mongoose.connect(process.env.MONGO_URL);
	const {username, password} = req.body;
	{/* createdUser = {
  _id: new ObjectId(""),
  username: '',
  password: '',
  createdAt: 2023-03-07T21:56:07.194Z,
  updatedAt: 2023-03-07T21:56:07.194Z,
  __v: 0
	} */}
	const foundUser = await UserModel.findOne({username});
	if (foundUser) {
		const passOk = bcrypt.compareSync(password, foundUser.password);
		if (passOk) {
			jwt.sign({userId:foundUser._id, username}, jwtSecret, {}, (err, token) => {
				res.cookie('token', token, {sameSite: 'none', secure: true}).json({
					id: foundUser._id,  
				});
			})
		} else {
			// any response with a status code other than 200-299 will trigger catch block.
			// make sure and include json payload so axios.post catch block is triggered
			res.status(422).json('pass not ok');
		}
	}
})

app.post('/api/logout', (req, res) => {
	res.cookie('token', '').json('ok');
})

app.get('/api/messages/:userId', async (req, res) => {
	mongoose.connect(process.env.MONGO_URL);
	const {userId} = req.params;
	const userData = await getUserDataFromReq(req);
	const ourUserId = userData.userId;
	const messages = await MessageModel.find({
		sender:{$in:[userId, ourUserId]},
		recipient:{$in:[userId, ourUserId]},
	}).sort({createdAt: 1});
	res.json(messages);
})

app.get('/api/people', async (req, res) => {
	mongoose.connect(process.env.MONGO_URL);
	// projection just _id and username returned for each user
	const users = await UserModel.find({}, {'_id':1, username:1});
	res.json(users);
})

app.get('/api/profile', (req, res) => {
	mongoose.connect(process.env.MONGO_URL);
  const token = req.cookies?.token;
   if (token) {
	jwt.verify(token, jwtSecret, {}, (err, tokenData) => {
		if (err) throw err;
		res.json(tokenData);
	   })
   } else {
	res.status(401).json('no token');
   }
})

const server = createServer(app);
//server.listen(4000);

const wss = new ws.WebSocketServer({server});
let onlineUsers = [];

//(connection) parameter represents the unique connection object that was just established between the client and server
wss.on('connection', (connection, req) => {
		
	//store user credentials in connection
		const cookies = req.headers.cookie;
		if (cookies) {
			const tokenCookieString = cookies.split(';').find(str => str.startsWith('token='));
			if (tokenCookieString) {
				const token = tokenCookieString.split('=')[1];
				if (token) {
					jwt.verify(token, jwtSecret, {}, (err, token) => {
						if (err) throw err;
						const {userId, username} = token;
						connection.userId = userId;
						connection.username = username;
					})
				}
			}
		}
	
	console.log(`${connection.username} connected...`);
	//push new connection to array
	onlineUsers.push(connection);

	function notifyAboutOnlinePeople() {
		const onlineArr = onlineUsers.map(c => ({userId:c.userId, username:c.username}));
		const uniqueArr = _.uniqBy(onlineArr, (obj) => obj.userId + obj.username);
		[...wss.clients].forEach(client => {
			client.send(JSON.stringify({
				online: uniqueArr.map(info => (info))
			}));
		});
	}

	//user logs out
	connection.on('close', () => {
    console.log(`${connection.username} disconnected...`);
		onlineUsers = onlineUsers.filter((user) => user.username !== connection.username);
		notifyAboutOnlinePeople();
  });

	connection.on('message', async (message) => { 
		// Parse JSON string
		const messageData = JSON.parse(message); 
		const {recipient, text, file} = messageData;
		let filename = null;
		if (file) {
			//console.log('size', file.data);
			const parts = file.name.split('.');
			const ext = parts[parts.length - 1];
			filename = Date.now() + '.' + ext;
			// save to local uploads folder
			const path = __dirname + '/uploads/' + filename;
			const bufferData = new Buffer.from(file.data.split(',')[1], 'base64');
			fs.writeFile(path, bufferData, () => {
				console.log('file saved: ' + path);
			});
			
		}
		if (recipient && (text || file)) {
			mongoose.connect(process.env.MONGO_URL);
			const messageDoc = await MessageModel.create({
				sender: connection.userId,
				recipient,
				text,
				file: file ? filename : null,
			});
			console.log('created message');
			[...wss.clients]
			.filter(c => c.userId === recipient)
			.forEach(c => c.send(JSON.stringify({
				text, 
				sender: connection.userId,
				recipient,
				file: file ? filename : null,
				_id: messageDoc._id,
			}))); 
		}
	  });

	//notify everyone about online connected users (when someone connects)
	notifyAboutOnlinePeople();
});

server.listen(8080, function () {
  console.log('Listening on http://0.0.0.0:8080');
});

