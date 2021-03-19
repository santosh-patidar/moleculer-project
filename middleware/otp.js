var nodemailer = require('nodemailer');
const { sequelize } = require('sequelize');



const OTP = function (ctx) {
    return new Promise(async () => {
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
                html: "<h2>  Hello, " + ctx.admin_name + " Your Email is , " + ctx.otp + "</h2><p>otp send successfully....</p>",
                text: " otp send succesfully....,"
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
    OTP
}