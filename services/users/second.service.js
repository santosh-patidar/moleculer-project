"use strict";
const DbConnect = require("../../mixins/db.mixin");
const DbService = require("moleculer-db");
const { MoleculerClientError } = require("moleculer").Errors;
const Sequelize = require("sequelize");
const usermodel = require("../../models/test.Model");
require("dotenv").config();


module.exports = {
    name: "nextuser",
    mixins: [DbService],
    adapter: DbConnect(),
    model: usermodel,


    settings: {
        /** Secret for JWT */

        fields: [
            "id",
            "user_id",
            "location",
            "task",
            "createdAt",
            "updatedAt",
        ],
    },

    actions: {

        //=====================================Second Service=============================================//

        UserCreate: {
            auth: "required",
            params: {
                location: "string",
                task: "string"
            },
            async handler(ctx) {
                let tempdata = ctx.params
                let entity = ctx.meta.user.id;
                const data = {
                    user_id: entity,
                    location: tempdata.location,
                    task: tempdata.task
                }
                const insertdata = await this.adapter.insert(data);
                if (!insertdata) {
                    return Promise.reject(
                        new MoleculerClientError(
                            "Something Went Wrong...!!",
                            422, "Service Relation..!!",
                            [{ field: "Service", message: "Something Went Wrong...!!" }]
                        ));
                } else {
                    const user = await this.transformDocuments(ctx, {}, insertdata);
                    // return this.entityChanged("created", user, ctx).then(() => user);
                    return {
                        message: "Created Second Service..", user
                    }
                }
            },
        },

        //=======================================SEcond Table Find Service================================//

        finddetails: {
            auth: "required",
            params: {},

            async handler(ctx) {
                let entity = ctx.meta.user.id;
                const getdata = await this.adapter.find({
                    query: { user_id: entity, deleted_at: null }
                })
                if (getdata) {
                    const user = await this.transformDocuments(ctx, {}, getdata);
                    return { message: "Data found...!", user }
                } else {
                    return this.Promise.reject(
                        new MoleculerClientError(
                            "User Data Not found..!",
                            422,
                            "Id not found",
                            [{ field: "id=> " + entity.id, message: "is not found", },]
                        ));
                }
            }
        },

        //=============================================DELETE DATA========================================//

        delete_service_data: {
            auth: "required",
            cache: false,
            params: {
                id: { type: "string" }
            },

            async handler(ctx) {
                let entity = ctx.params;
                const data = await this.adapter.findOne({
                    where: {
                        id: entity.id, deleted_at: null
                    }
                });
                if (!data) {
                    return this.Promise.reject(
                        new MoleculerClientError(
                            "Data not found..!",
                            422,
                            "Login ID",
                            [{ field: "id=> " + entity.id, message: "is not found", },]
                        ));
                }
                else {
                    const update = await this.adapter.updateById(entity.id, {
                        $set: {
                            status: "0",
                            deleted_at: new Date(),
                        }
                    });
                    return {
                        message: "Data Deleted successfully...!", entity
                    }
                }
            }
        },

        //=============================================HASH METHOD========================================//

        load: {
            params: {},
            async handler(ctx) {
                let entity = ctx.params
                var ww = [];
                const getdata = await this.adapter.find({
                    query: {
                        deleted_at: null,
                        user_id: entity.user_id
                    },
                    attributes: ["id", "user_id", "location", "task", "createdAt", "updatedAt"],
                });
                for (let list of getdata) {
                    const data = {
                        id: list.id,
                        user_id: list.user_id,
                        location: list.location,
                        task: list.task,
                        status: list.status,
                        createdAt: list.createdAt,
                        updatedAt: list.updatedAt
                    }

                    ww.push(data)
                }
                return ww;



            },
        },

        //=========================================TOken ID HASH METHODE==================================//

        has: {
            params: {},
            async handler(ctx) {
                let entity = ctx.meta.user.id;
                var aw = [];
                const USER = await this.adapter.find({
                    query: {
                        deleted_at: null,
                        user_id: entity,
                    },
                    attributes: ["id", "user_id", "location", "task", "createdAt", "updatedAt"],

                });
                for (let list of USER) {
                    const data = {
                        id: list.id,
                        user_id: list.user_id,
                        location: list.location,
                        task: list.task,
                        status: list.status,
                        createdAt: list.createdAt,
                        updatedAt: list.updatedAt
                    }

                    aw.push(data)
                }
                return aw;
            },
        },


    },

}
