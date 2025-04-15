import ejs from 'ejs';
import sgMail from '@sendgrid/mail';
import path from 'path';

const sendEmail = async (email: string, code: string) => {
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
            name: 'Talabat X Insomnia Egypt',
            email: 'events@thebmegroup.com',
          },
          subject: `Talabat 50 EGP off Voucher`,
          text: 'Enjoy 50 EGP off your next Talabat order courtesy of Talabat x Insomnia Egypt Gaming Festival.',
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
