const admin = require('firebase-admin');
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true })

function appendKey(dic, value) {
	var lengthh = Object.keys(dic).length
	var size = lengthh + 50
	dic[size] = value
}
//============================================================================================
exports.appendImage = async function f(documentt, imagename) {
	const cityRef = db.collection("PDUsers").doc(documentt);
	const doc = await cityRef.get();		
	var attendees = doc.data().images;
	appendKey(attendees, imagename);
	await cityRef.update({
		images: attendees
	})
}
async function setData(collectionn, document, object) {
	const docRef = db.collection(collectionn).doc(document);
	await docRef.set({
		object
	});
}
exports.retrieveImages = async function getCVV(documenT) {
	const snapshot = await db.collection('PDUsers').doc(documenT)
	const doc = await snapshot.get();
	return doc.data().images
}

const FieldValue = admin.firestore.FieldValue;
exports.deleteImage = async function findNumber(documenT, image) {
  var ref = db.collection('PDUsers').doc(documenT);
	const doc = await ref.get();
	for (var i=0; i < 10000; i++) {
		  var images = doc.data().images
			var poop = images[i]
			var update = ('images.' + i)
			console.log(images)
			console.log(poop + " Is being checked")
			console.log(i + " Times attempted")
			console.log(image + " Is User input")
			if (poop == image) {
				await ref.update({
					[update]: FieldValue.delete()
				})
				console.log("Image Deleted Successfully!")
				break;
			}
			else if (images.i == undefined) {
				console.log('Checking...')
				continue;
			}
			else {
				console.log('Checking...')
				continue;
			}
		}
	}
exports.renameImage = async function findNumberR(documenT, imageName, newName) {
  var ref = db.collection('PDUsers').doc(documenT);
	const doc = await ref.get();
	for (var i=0; i < 10; i++) {
		  var images = doc.data().images
			var poop = images[i]
			var update = ('images.' + i)
      console.log(update)
			if (poop == imageName) {
				await ref.update({
					[update]: newName
				})
				console.log("Image renamed Successfully!")
				break;
			}
			else if (images.i == undefined) {
				continue;
			}
			else {
				continue;
			}
		}
	}

exports.randint = function(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}