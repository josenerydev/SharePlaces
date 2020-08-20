const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const Place = require('../models/place');
const User = require('../models/user');
const HttpError = require('../utils/http-error');
const getCoordsForAddress = require('../utils/location');

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
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  const { title, description, address, userId } = req.body;
  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }
  const createdPlace = new Place({
    title: title,
    description: description,
    address: address,
    location: coordinates,
    image: 'image path',
    creator: req.userData.userId,
  });
  let user;
  try {
    user = await User.findById(req.userData.userId);
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

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  const { title, description } = req.body;
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (error) {
    return next(
      new HttpError('Something went wrong, could not update place.', 500)
    );
  }
  if (place.creator.toString() !== req.userData.userId) {
    return next(new HttpError('You are not allowed to edit this place.', 401));
  }
  place.title = title;
  place.description = description;
  try {
    await place.save();
  } catch (error) {
    return next(
      new HttpError('Something went wrong, could not update place.', 500)
    );
  }
  res.status(200).json({
    place: place.toObject({ getters: true }),
  });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId).populate('creator');
  } catch (error) {
    return next(
      new HttpError('Something went wrong, could not delete place.', 500)
    );
  }
  if (!place)
    return next(new HttpError('Could not find place for this id.', 404));
  if (place.creator.id !== req.userData.userId)
    return next(
      new HttpError('You are not allowed to delete this place.', 401)
    );
  try {
    const _session = await mongoose.startSession();
    _session.startTransaction();
    await place.remove({ session: _session });
    place.creator.places.pull(place);
    await place.creator.save({ session: _session });
    await _session.commitTransaction();
  } catch (error) {
    return next(
      new HttpError('Something went wrong, could not delete place.', 500)
    );
  }
  res.status(200).json({ message: 'Deleted Place.' });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
