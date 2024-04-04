import ejs from 'ejs';
import sgMail from '@sendgrid/mail';

const sendEmail = async (email, ticketNumber, code) => {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    return new Promise((resolve, reject) => {
        ejs.renderFile('./email.html', { code: code }, function (err, data) {
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
