import ejs from 'ejs';
import sgMail from '@sendgrid/mail';
import path from 'path';

const sendEmail = async (email: string, ticketNumber: string, code: string) => {
    const apiKey = process.env.SENDGRID_API_KEY || '';
    sgMail.setApiKey(apiKey);

    return new Promise((resolve, reject) => {
        ejs.renderFile(path.join(__dirname, '../templates/email.html'), { code: code }, function (err, data) {
            if (err) {
                console.error(err);
            } else {
                const msg = {
                    to: email,
                    from: {
                        name: 'Talabat X Insomnia',
                        email: 'events@thebmegroup.com',
                    },
                    subject: `[#${ticketNumber}] Talabat EGP 100 off promo`,
                    text: 'When you order from Talabat, use the code below to get EGP 100 off your order',
                    html: data,
                };

                sgMail
                    .send(msg)
                    .then((response) => {
                        resolve(response[0].statusCode);
                    })
                    .catch((error) => {
                        reject(error);
                    });
            }
        });
    });
};

export default sendEmail;
