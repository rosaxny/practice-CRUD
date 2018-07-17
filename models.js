'use strict';
const mongoose = require('mongoose');

const PlaceSchema = mongoose.Schema({
	location: String,
	memory: String,
	pet: String
});

PlaceSchema.methods.serialize = function() {
	return {
		id: this._id,
		location: this.location,
		memory: this.memory,
		pet: this.pet
	};
};

const Place = mongoose.model('Place', PlaceSchema);

module.exports = {Place};