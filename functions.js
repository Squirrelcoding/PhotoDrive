function appendKey(dic, value) {
	var lengthh = Object.keys(dic).length
	var size = lengthh + 1
	dic[size] = value
}//============================================================================================
exports.appendImage = async function f(collection, cardname) {
	const cityRef = db.collection(collection).doc("cards");
	const doc = await cityRef.get();		
	var attendees = doc.data().object;
	appendKey(attendees, cardname);
	setData(collection, "cards", attendees)
}