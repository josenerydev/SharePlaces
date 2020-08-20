const express = require('express');
const { check } = require('express-validator');

const placesController = require('../controllers/places-controller');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

router.get('/:pid', placesController.getPlaceById);

router.get('/user/:uid', placesController.getPlacesByUserId);

router.post(
  '/',
  checkAuth,
  [
    check('title').not().isEmpty(),
    check('description').isLength({ min: 5 }),
    check('address').not().isEmpty(),
  ],
  placesController.createPlace
);

router.patch(
  '/:pid',
  checkAuth,
  [check('title').not().isEmail(), check('description').isLength({ min: 5 })],
  placesController.updatePlace
);

router.delete('/:pid', checkAuth, placesController.deletePlace);

module.exports = router;
