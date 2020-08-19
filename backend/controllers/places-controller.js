const mongoose = require('mongoose');

const Place = require('../models/place');
const User = require('../models/user');
const HttpError = require('../utils/http-error');

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (error) {
    return next(
      new HttpError('Something went wrong, could not find a place', 500)
    );
  }

  if (!place) {
    return next(
      new HttpError('Could not find a place for the provided id.', 404)
    );
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate('places');
  } catch (error) {
    console.log(error);
    return next(
      new HttpError('Fetching places failed, please try again later.', 500)
    );
  }

  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(
      new HttpError('Could not find a places for the provided user id.', 404)
    );
  }

  res.status(200).json({
    places: userWithPlaces.places.map((place) =>
      place.toObject({ getters: true })
    ),
  });
};

const createPlace = async (req, res, next) => {
  const { title, description, address, userId } = req.body;

  const createdPlace = new Place({
    title: title,
    description: description,
    address: address,
    location: {
      lat: 100,
      lng: 100,
    },
    image: 'image path',
    creator: userId,
  });

  let user;
  try {
    user = await User.findById(userId);
  } catch (error) {
    return next(new HttpError('Creating place failed, please try again.', 500));
  }

  if (!user) {
    return next(new HttpError('Could not find user for provider id.', 500));
  }

  try {
    const _session = await mongoose.startSession();
    _session.startTransaction();
    await createdPlace.save({ session: _session });
    user.places.push(createdPlace);
    await user.save({ session: _session });
    await _session.commitTransaction();
  } catch (error) {
    console.log(error);
    return next(new HttpError('Creating place failed, please try again.', 500));
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlace = (req, res, next) => {};

const deletePlace = (req, res, next) => {};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
