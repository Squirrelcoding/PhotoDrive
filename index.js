const {Storage} = require('@google-cloud/storage');
const express = require("express");
const app = new express();
const fileUpload = require('express-fileupload');
const cors = require('cors');
const morgan = require('morgan');
const _ = require('lodash');
var admin = require("firebase-admin");
var fs = require('fs');
var serviceAccount = require("./key.json");
const bodyParser = require('body-parser');
var functions = require('./functions')
//Requiring Modules Above

//Initalizing server and Firebase app below
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://poopnet-4fb22.appspot.com",
	databaseURL: "https://poopnet-4fb22.firebaseio.com"
});
var bucket = admin.storage().bucket();
const db = admin.firestore();
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
	res.render('index', {message:""})
})
app.get('/seeImages', function(req, res) {
	res.render('see', {imageLink:"https://breakthrough.org/wp-content/uploads/2018/10/default-placeholder-image.png"})
})
app.get('/createAccount', function(req, res) {
	res.render('create', {message:""})
})
app.get('/signIn', function(req, res) {
	res.render('log', {message:""})
})
const storage = new Storage({
  keyFilename: './key.json',
});
const port = process.env.PORT || 3000;
app.listen(port, () => 
  console.log(`App is listening on port ${port}.`)
);

//Download below


/*
=======================================================================================================
=======================================================================================================
=======================================================================================================
*/
/*=======================================Post requests=============================================*/ 
app.post('/upload-avatar', async (req, res) => {
    try {
        if(!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        }
				else {
					  const options = {
							destination: bucket.file("poop/caca.png"),
							resumable: false
						}
            let avatar = req.files.avatar;
            avatar.mv('./uploads/' + avatar.name);	
						async function e() {
						console.log((avatar.size / 1e+6) + " MB is the size of the file uploaded")
						var path = 'uploads/' + avatar.name
						await bucket.upload(path, options, function(err, file) {console.log("File uploaded")})

						fs.unlink('uploads/' + avatar.name, function (err) {if (err) throw err; console.log('File deleted!');});
						}
						e();	
						res.render('index', {message:"File uploaded successfuly!"})
        }
    } catch (err) {
        res.status(500).send(err);
				console.log("Error status 500")
				if (avatar.size < (2e+6)) {
					res.render('index', {message: "The file size is over 2MB! Please choose an image that is less than 2 Megabytes."})
				} 
    }

});
app.post('/image', async (req, res) => {
	var imageName = req.body.imageName
let bucketName = 'gs://poopnet-4fb22.appspot.com'
let filename = imageName
const downloadFile = async() => {
    let destFilename = './views/images/image.png';
    const options = {
			destination: destFilename
		};
    await storage.bucket(bucketName).file(filename).download(options);
    res.render('see', {imageLink:'images/image.png'})
  } 
downloadFile();
})
//hi
app.post('/create', async (req, res) => {
	var userData = {
		username: req.body.username,
		password: req.body.password,
		confirmPassword: req.body.confirmPassword
	}
	if (userData.password == userData.confirmPassword) {
	var savedData = {
		username: req.body.username,
		password: req.body.password,
		images: {
			0:""
		}
	}
	db.collection('PDUsers').doc(userData.username).set(savedData);
	res.writeHead(301, { Location: '/' });
	res.end("");	
	}
	else {
		res.render('create', {message:"The password's do not match! Pleaase try again."})
	}
})

app.post('/logIn', async (req, res) => {
	var username = req.body.username;
	
});