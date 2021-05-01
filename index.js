const {Storage} = require('@google-cloud/storage');
const express = require("express");
const app = new express();
app.locals.data = '';
const fileUpload = require('express-fileupload');
const cors = require('cors');
const morgan = require('morgan');
const _ = require('lodash');
var admin = require("firebase-admin");
var fs = require('fs');
var serviceAccount = require("./key.json");
const bodyParser = require('body-parser');

//Requiring Modules Above
//Initalizing server and Firebase app below
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://poopnet-4fb22.appspot.com",
	databaseURL: "https://poopnet-4fb22.firebaseio.com"
});
var bucket = admin.storage().bucket();
const db = admin.firestore();
var functions = require('./functions')
app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(express.static('views'));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(fileUpload({
  createParentPath: true
}));
app.get('/', function(req, res) {
	res.render('index', {imageMessage:""})
})
app.get('/faq', function(req, res) {
	res.render('faq', {imageMessage:""})
})
app.get('/join', function(req, res) {
	res.render('join', {imageMessage:""})
})
app.get('/seeImages', function(req, res) {
	res.render('see', {images:"", imageLink:"/images/pixel.png"});
})
app.get('/createAccount', function(req, res) {
	res.render('create', {message:""})
})
app.get('/signIn', function(req, res) {
	res.render('log', {message:""})
})
app.get('/delete', function(req, res) {
res.render('delete', {message:"", images:""})
})
app.get('/accounts', function(req, res) {
	res.render('other', {message:""})
})
app.get('/rename', function(req, res) {
	res.render('rename', {message:"", images:""})
});
const storage = new Storage({
  keyFilename: './key.json',
});
var port = process.env.PORT || functions.randint(1000, 9999);
app.listen(port, () => 
  console.log(`App is listening on port ${port}.`)
);

/*
=======================================================================================================
=======================================================================================================
=======================================================================================================
*/
/*=======================================Post requests=============================================*/ 
app.post('/create', async (req, res) => {
	var userData = {
		username: req.body.username,
		password: req.body.password,
		confirmPassword: req.body.confirmPassword
	}
	var uploadOptions = {
		destination: bucket.file(userData.username + "/" + 'start.png'),
		resumable: false		
	}
	await bucket.upload('./start.png', uploadOptions, function(err, file) {console.log('start.png uploaded')})
	if (userData.password != userData.confirmPassword) {
res.render('create', {message:"The password's do not match! Pleaase try again."})
	
	}
	else if (userData.password == userData.confirmPassword) {
	var object = {
		username: req.body.username,
		password: req.body.password,
		images: {
			0:""
		}
	}
	db.collection('PDUsers').doc(userData.username).set(object);
	res.redirect('/')
	}
})

app.post('/logIn', async (req, res) => {
	var username = req.body.username;
	var password = req.body.password;
 	var ref = await db.collection('PDUsers').doc(username);
 	var doc = await ref.get();
	console.log(doc.data().username + " Is the username")
	req.app.locals[doc.data().username] = req.body.username;
	console.log(req.app.locals[doc.data().username]  + " Has logged in.")  
	if (password == doc.data().password && doc.exists) {
		res.render('index', {imageMessage:""})
	}
	else {
		res.render('log', {message:"Incorrect username or password!"})
	}

	app.post('/image', async (req, res) => {
		var imageName = req.body.imageName
		console.log([doc.data().username]+ " Is viewing images")  
		let bucketName = 'gs://poopnet-4fb22.appspot.com'
		var filename = imageName;
		var downloadFile = async() => {
			let destFilename = './views/images/image.png';
			var options = {
				destination: destFilename
			};
			await storage.bucket(bucketName).file(doc.data().username + '/' + filename).download(options);
			var g = await functions.retrieveImages(doc.data().username)
			res.render('see', {images:Object.keys(g).map(k => g[k]).join('<br><br>'), imageLink:'images/image.png'});
		} 
	downloadFile();
	})


app.post('/upload-avatar', async (req, res) => {
    try {
        if(!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        }
				else {
					var avatar = req.files.avatar;
					  var options = {
							destination: bucket.file(req.app.locals.username + "/" + avatar.name),
							resumable: false
						}
            avatar.mv('./uploads/' + avatar.name);	
						async function e() {
						var path = 'uploads/' + avatar.name
						await bucket.upload(path, options, function(err, file) {console.log("File uploaded")});
						functions.appendImage(req.app.locals.username, avatar.name);
						fs.unlink('uploads/' + avatar.name, function (err) {if (err) throw err; console.log('File deleted!');});
						}
						e();	
						res.render('index', {imageMessage:"File uploaded successfuly!"})
        }
    } catch (err) {
        res.status(500).send(err);
				console.log("Error status 500")
				if (avatar.size < (2e+6)) {
					res.render('index', {imageMessage: "The file size is over 2MB! Please choose an image that is less than 2 Megabytes."})
				} 
    }

});
app.post('/renameImage', async(req, res) => {
  var renamed = req.body.renamedImage;
	var newName = req.body.newName;
	if (renamed == 'start.png' && newName == "") {
		var g = await functions.retrieveImages(req.app.locals.username)
		res.render('rename', {message:"", images:Object.keys(g).map(k => g[k]).join('<br><br>')});
	}
	else if (renamed == 'start.png' && newName != "") {
		res.render('rename', {message:"You may not rename start.png!", images:""});
	}
	else {
		var file = bucket.file(req.app.locals.username + '/' + renamed);
		file.rename(req.app.locals.username + '/' + newName, function(err, renamedFile, apiResponse) {});
		functions.renameImage(req.app.locals.username, renamed, newName)
		res.render('rename', {message:"Image renamed!", images:""});
	}
});
app.post('/deleteImage', async(req, res) => {
	var imageDeleted = req.body.imageDelete
	if (imageDeleted == 'start.png') {
		var g = await functions.retrieveImages(req.app.locals.username)
		res.render('delete', {message:"", images:Object.keys(g).map(k => g[k]).join('<br><br>')});
	}
	else {
	var file = bucket.file(req.app.locals.username + '/' + imageDeleted);
	file.delete(function(err, apiResponse) {});
	functions.deleteImage(req.app.locals.username, imageDeleted);
	res.render('delete', {message:"Image deleted successfuly!", images:""});
	}
});
});