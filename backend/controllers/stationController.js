const { validationResult } = require("express-validator");
const { getStations, createStation } = require("../services/stationService");

const getStationsController = async (req, res, next) => {
    try {
        const result = await getStations(req.query);

        return res.status(200).json({ success: true, ...result });
    }catch (error) {
        return next(error);
    }
};

const createStationController = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
    }

    try {
        const { name, line, order } = req.body;

        const station = await createStation({ name, line, order });

        return res.status(201).json({ success: true, data: station });
    }catch (error) {
        return next(error);
    }
};

module.exports = { getStationsController, createStationController };