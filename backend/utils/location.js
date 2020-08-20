const axios = require('axios');
const HttpError = require('./http-error');

const ZERO_RESULTS = 'ZERO_RESULTS';
const API_KEY = process.env.GOOGLE_API_KEY;

const getCoordsForAddress = async (address) => {
  return {
    lat: 40.7484474,
    lng: -73.9871516,
  };
  const response = await axios.get(
    `https://maps.googleapis=${encodeURIComponent(address)}=${API_KEY}`
  );
  const data = response.data;
  if (!data || data.status === ZERO_RESULTS) {
    throw new HttpError(
      'Could not find location for the specified address',
      422
    );
  }
  const coordinates = data.results[0].geometry.location;
  return coordinates;
};

module.exports = getCoordsForAddress;
