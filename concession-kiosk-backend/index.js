const express = require('express');
const app = express();
const host = process.env.IP  || '0.0.0.0';
const port = process.env.PORT || 8080;
const mongo = require('mongodb').MongoClient;

const mongoUri = process.env.uri;
const mongoUsername = process.env.username;
const mongoPassword = process.env.password;
const dbName = process.env.database_name || process.env.MONGODB_DBNAME || 'sampledb';

var dbConnectionUrl;

// If the monogo secret has been attached, modify the provided URI to include
// authentication credentials
if (mongoUri) {
	var auth = mongoUsername + ':' + mongoPassword + '@'
	var pieces = mongoUri.split('//');
	dbConnectionUrl = pieces[0] + '//' + auth + pieces[1] + '/' + dbName;
}
else {
	dbConnectionUrl  = process.env.MONGODB_URL || 'mongodb://localhost:27017/sampledb';
}

app.get('/userNumber', function(req, res, next) {
	let newUserNumber = 100;
	mongo.connect(dbConnectionUrl, (err, client) => {
		if (err) {
		  console.error(err);
		  res.send({success: false, result: 9999});
		} else {
			const db = client.db(dbName);
			const collection = db.collection('users');
			collection.find({}).count().then((n) => {
				if (n > 0) {
					collection.find().sort({userNumber:-1}).limit(1).toArray((err, items) => {
						let highestuser = items[0].userNumber;
						newUserNumber = highestuser + 1;
						collection.insertOne({userNumber: newUserNumber, user: req.query}, (err, result) => {
							console.log('err:' + err, ' result: ' + result);
						});
						res.send({success: true, result: newUserNumber, user: req.query});
					});
				} else {
					collection.insertOne({userNumber: newUserNumber, user: req.query}, (err, result) => {
						console.log('err:' + err, ' result: ' + result);
					});
					res.send({success: true, result: newUserNumber, user: req.query});
				}
			}).catch((err) => {
				console.log(err);
				res.send({success: false, result: 999});
			});
		}
	});
});

/* for debugging purposes */
app.get('/allusers', function (req, res, next) {
	var usersList;

	mongo.connect(dbConnectionUrl, (err, client) => {
		if (err) {
		  console.error(err)
		  return
		}
		console.log(dbConnectionUrl);
		const db = client.db(dbName);
		const collection = db.collection('users');
		collection.find().toArray((err, items) => {
			usersList = items;
			console.log(usersList);
			res.send({success: true, result: usersList});
		});
	});
});

app.get('/debug', function(req, res, next) {

	var details = {
		"mongo_url": dbConnectionUrl,
		"connected": false
	};

	mongo.connect(dbConnectionUrl, (err, client) => {
		if (err) {
			console.error(err)
		} else {
			console.log('Connected to Mongo')
			details["connected"] = true;
			console.log("Updated details")
		}
		res.send(details);
	});
});

app.use(function(err, req, res, next) {
	console.error(err.stack);
	res.status(500).send('Something went wrong.')
});


app.listen(port, host);
console.log('Webapp Backend started on: ' + host + ':' + port);