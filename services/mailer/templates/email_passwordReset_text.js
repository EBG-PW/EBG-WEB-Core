module.exports = {
  generate: generate = (t, data) => {
    return `${t('greeting', { username: data.username })},
      
${t('emails.passwordReset.text', { companyName: process.env.COMPANYNAME })}
${t('emails.passwordReset.linkText', { regUrl: data.regUrl })}

${t('companyContact', { companyEmail: process.env.COMPANYEMAIL })}
      `
  }
}