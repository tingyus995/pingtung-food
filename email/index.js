var nodemailer = require('nodemailer');

module.exports = function() {
  var mailTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });
  var from = '"Pingtung food account service" <ptfood@gmail.com>';
  return {
    send: function(to, subj, body, cb) {
      mailTransport.sendMail({
        from: from,
        to: to,
        subject: subj,
        html: body
      }, cb);
    }
  }
};