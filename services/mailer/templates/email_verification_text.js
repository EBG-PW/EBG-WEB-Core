module.exports = {
  generate: generate = (t, data) => {
    return `${t('greeting', { username: data.username })},

${t('emails.registerMail.text', { companyName: process.env.COMPANYNAME })}
${t('emails.registerMail.linkText', { regUrl: data.regUrl })}

${t('companyContact', { companyEmail: process.env.COMPANYEMAIL })}
        `
  }
}