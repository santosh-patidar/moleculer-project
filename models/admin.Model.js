"use strict";
const Sequelize = require("sequelize");
const Admin = {
    name: "admin",
    define: {
        id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        admin_name: {
            type: Sequelize.STRING,
            allowNull: true
        },
        email: {
            type: Sequelize.STRING,
            // unique: true,
            allowNull: true
        },
        password: {
            type: Sequelize.STRING,
        },
        phone: {
            type: Sequelize.STRING,
            defaultValue: null
        },
        otp: {
            type: Sequelize.INTEGER,
            defaultValue: null
        },
        role: {
            type: Sequelize.STRING,
            defaultValue: "admin"
        },

        status: {
            type: Sequelize.ENUM("active", "inactive", "suspended"),
            defaultValue: "active"
        },
        deleted_at: {
            type: Sequelize.DATE(6),
            allowNull: true,
            defaultValue: null
        }
    },
    options: {}
};
module.exports = Admin;