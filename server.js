'use strict';
const express = require('express');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
const app = express();

const {PORT, DATABASE_URL} = require('./config');
const {Place} = require('./models');

app.use(express.json());

app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Header', 'Content-Type');
	res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');

	if(req.method === 'OPTIONS') {
		return res.send(204);
	}
	next();
});

app.get('/', (req, res) => {
	Place.find()
			.then((places) => {
				res.json(places.map((place) => place.serialize()));
			})
			.catch((err) => {
				console.error(err);
				res.status(500).json({error: 'something went wrong'});
			});
});

app.post('/', (req, res) => {
	const fields = ['location', 'memory', 'pet'];
	for(let i=0; i<fields.length;i++) {
		if(!(fields[i] in req.body)) {
			const message = `Missing ${fields[i]} in req body`;
			console.error(message);
			return res.status(400).send(message);
		}
	}

	Place.create({
		location: req.body.location,
		memory: req.body.memory,
		pet: req.body.pet
	})
	.then((place) => {res.status(201).json(place.serialize())})
	.catch((err) => {
		console.error(err);
		res.status(500).json({error: 'something went wrong'});
	});

});

app.put('/:id', (req, res) => {
	if(!(req.params.id && req.body.id && req.params.id === req.body.id)) {
		console.log(req.params.id, req.body.id);
		res.status(400).json({
			error: 'request path id and request body id values must match'
		});
	}

	const toUpdateFields = {};
	const fields = ['location', 'memory', 'pet'];

	fields.forEach((field) => {
		if(field in req.body) {
			toUpdateFields[field] = req.body[field];
		}
	});

	Place.findByIdAndUpdate(req.params.id, {$set:toUpdateFields}, {new:true})
			.then((updated) => res.status(204).end())
			.catch((err) => {res.status(500).json({message: 'something went wrong'});});
});

app.delete('/:id', (req, res) => {
	Place.findByIdAndDelete(req.params.id)
			.then(() => {
				res.status(204).end();
			});
});

let server;

function runServer(db) {
	return new Promise((resolve, reject) => {
		mongoose.connect(db, (err) => {
			if(err) {
				return reject(err);
			}

			server = app.listen(PORT, () => {
				console.log(`App is listening on port ${PORT}`);
				resolve();
			})
			.on('error', (err) => {
				if(err) {
					return reject(err);
				}
				resolve();
			});
		});
	});
}

function closeServer() {
	return mongoose.disconnect()
					.then(() => {
						return new Promise((resolve, reject) => {
							console.log('Closing server');
							server.close((err) => {
								if(err) {
									return reject(err);
								}
								resolve();
							});
						});
					});
}

if(require.main === module) {
	runServer(DATABASE_URL).catch((err) => {
		console.log(err);
	});
}

module.exports = {app, runServer, closeServer};