var nodemailer = require('nodemailer');
const { sequelize } = require('sequelize');

const mailerFun = function (ctx) {
    return new Promise(async (resolve, reject) => {
        try {

            var transporter = nodemailer.createTransport(({
                service: 'gmail',
                auth: {
                    user: 'santoshpatidar.idealittechno@gmail.com',
                    pass: 'IdealIndore'
                }
            }));
            var mailOptions = {
                from: 'santoshpatidar.idealittechno@gmail.com',
                to: ctx.email,
                subject: 'Sending Email Registration..',
                html: "<h2>  Hello, " + ctx.user_name + " Your Email is , " + ctx.email + "</h2><p>Register successfully....</p>",
                text: " Email Register succesfully....,"
            };

            const sendmail = await transporter.sendMail(mailOptions, function (err, info) {
                if (sendmail) {

                    return { message: 'Email sent: ' + info.response + " " + ctx.email }

                } else {
                    console.log('Email sent: ' + info.response + " " + ctx.email);

                }
            });

        }
        catch (err) {
            console.log(err);
        }
    });
}
module.exports = {
    mailerFun
}

const mailerFun1 = function (ctx) {
    return new Promise(async (resolve, reject) => {
        try {

            var transporter = nodemailer.createTransport(({
                service: 'gmail',
                auth: {
                    user: 'santoshpatidar.idealittechno@gmail.com',
                    pass: 'IdealIndore'
                }
            }));
            var mailOptions = {
                from: 'santoshpatidar.idealittechno@gmail.com',
                to: ctx.email,
                subject: 'Sending Email Registration..',
                html: "<h2>  Hello, " + ctx.admin_name + " Your Email is , " + ctx.email + "</h2><p>Register successfully....</p>",
                text: " Email Register succesfully....,"
            };

            await transporter.sendMail(mailOptions, function (err, info) {
                if (err) {

                    console.log(err);

                } else {
                    console.log('Email sent: ' + info.response + " " + ctx.email);

                }
            });

        }
        catch (err) {
            console.log(err);
        }
    });
}
module.exports = {
    mailerFun1
}