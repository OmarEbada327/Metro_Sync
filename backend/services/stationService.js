const Station = require("../models/stationModel");

const getStations = async (query = {}) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (query.line) {
        filter.line = query.line;
    }

    const [stations, total] = await Promise.all([
        Station.find(filter).sort({ line: 1, order: 1 }).skip(skip).limit(limit),
        Station.countDocuments(filter),
    ]);

    return {
        data: stations,
        pagination: { total, page, limit, pages: Math.ceil(total / limit)},
    };
};

const createStation = async ({ name, line, order }) => {
    const station = await Station.create({ name, line, order });
    
    return station;
};

module.exports = { getStations, createStation };