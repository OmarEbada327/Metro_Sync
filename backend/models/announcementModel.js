const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    stationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Station",
        required: true
    },
    createdBy: {
        type: String,
        default: "admin"
    }
}, { timestamps: true });

module.exports = mongoose.model("Announcement", announcementSchema);