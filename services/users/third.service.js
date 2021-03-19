"use strict";
const DbConnect = require("../../mixins/db.mixin");
const DbService = require("moleculer-db");
const { MoleculerClientError } = require("moleculer").Errors;
require("dotenv").config();
const Sequelize = require("sequelize");
const thirdmodel = require("../../models/third.Model");


module.exports = {
    name: "thirdparty",
    mixins: [DbService],
    adapter: DbConnect(),
    model: thirdmodel,


    settings: {
        /** Secret for JWT */

        fields: [
            "id",
            "tech_id",
            "name",
            "age",
            "locality",
            "description",
            "status",
            "createdAt",
            "updatedAt",
        ],
    },
    actions: {
        //====================================CREATE DATA==========================================//

        creating: {
            auth: "required",
            params: {},

            async handler(ctx) {
                let entity = ctx.meta.user;
                let tempdata = ctx.params;
                const data = {
                    tech_id: entity.id,
                    name: tempdata.name,
                    age: tempdata.age,
                    locality: tempdata.locality,
                    description: tempdata.description
                }
                const insert = await this.adapter.insert(data);
                if (insert) {
                    const user = await this.transformDocuments(ctx, {}, insert);

                    return { message: "Insert Successfully..", user }
                } else {
                    return Promise.reject(new MoleculerClientError(
                        "Something Went Wrong..!", 422, "Create", [{ fields: "register", message: "Api not working at the time" }]
                    ))
                }
            }
        },


        //===================================HASH METHODE=========================================//

        connects: {
            params: {},
            async handler(ctx) {
                let entity = ctx.params;
                var flw = [];
                const UserData = await this.adapter.find({
                    query: {
                        deleted_at: null,
                        tech_id: entity.tech_id
                    },
                    attributes: [
                        "id",
                        "tech_id",
                        "name",
                        "age",
                        "locality",
                        "description",
                        "status",

                    ],
                });
                for (let list of UserData) {
                    const data = {
                        id: list.id,
                        tech_id: list.tech_id,
                        name: list.name,
                        age: list.age,
                        locality: list.locality,
                        description: list.description,
                        status: list.status,
                        createdAt: list.createdAt,
                        updatedAt: list.updatedAt
                    }

                    flw.push(data)
                }
                return flw;

            }
        },

        //===============================================TOken ID HASH=============================//

        con: {
            params: {},
            async handler(ctx) {
                let entity = ctx.meta.user;
                const flw = [];
                const UserData = await this.adapter.find({
                    query: {
                        deleted_at: null,
                        tech_id: entity.id
                    },
                    attributes: ["id", "tech_id", "name", "age", "locality", "description", "status",],
                });
                for (let list of UserData) {
                    const data = {
                        id: list.id,
                        tech_id: list.tech_id,
                        name: list.name,
                        age: list.age,
                        locality: list.locality,
                        description: list.description,
                        status: list.status,
                        createdAt: list.createdAt,
                        updatedAt: list.updatedAt
                    }

                    flw.push(data)
                }
                return flw;
            }
        },


        //================================ADMIN DELETE THIRD TABLE DETAILS==========================//

        THIrd_Delete: {
            auth: "required",
            params: {
                id: { type: "string" }
            },
            async handler(ctx) {
                let entity = ctx.params;

                return this.Promise.resolve().then(() => this.adapter.findOne({
                    where: {
                        id: entity.id, deleted_at: null
                    }
                }),
                    this.adapter.updateById(entity.id, {
                        $set: {
                            status: "0",
                            deleted_at: new Date(),
                        }
                    })).then((getdata) => {
                        if (!getdata)
                            return this.Promise.reject(new MoleculerClientError(
                                "user_id not found", 422, "Id Not found...",
                                [{ fields: "Id==> " + entity.id, message: "Is not found" },]
                            )
                            );
                        return {
                            message: "Data deleted succesfully...!"
                        }
                    })
            }
        },

        //===================================ADMIN GET DATA===========================================//

        Get_data: {
            auth: "required",
            params: {},
            async handler(ctx) {
                let entity = ctx.params;
                const getdata = await this.adapter.find({
                    query: {}
                });
                if (!getdata) {
                    return Promise.reject(new MoleculerClientError("something went wrong..!", 404, "user data not exist", [
                        {
                            fields: "second service", message: "invalide"
                        }
                    ]));
                } else {
                    return { message: "data get successfully...||", getdata }
                }
            }
        },
    }
}