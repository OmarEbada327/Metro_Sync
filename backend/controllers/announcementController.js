const { validationResult } = require("express-validatior");
const { getAnnouncementsByStation, createAnnouncement } = require("../services/announcementService");

const getAnnouncements = async (req, res, next) => {
    try{
        const { stationId } = req.params;
        const result = await getAnnouncementsByStation(stationId, req.query);

        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        return next(error);
    }
};

const createAnnouncements = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array()})
    }
  
    try{
        const { stationId } = req.params;
        const { text } = req.body;

        const announcement = await createAnnouncement({
            text,
            stationId,
            createdBy: req.admin?.id
        });

        const io = req.app.get("io");
        if(io) {
            io.to(stationId).emit("newAnnouncement", announcement);
        }

        return res.status(201).json({ success: true, data: announcemen });
    } catch (error) {
        return next(error);
    }
};

module.exports = { getAnnouncements, createAnnouncements };