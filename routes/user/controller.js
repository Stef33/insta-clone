const model = require('./model')
const postModel = require('../post/model')
const jwt = require('jsonwebtoken')
const config = require('../../config')

module.exports = {
  login: (req, res) => {
    model.findOne({ email: req.body.email }, (err, user) => {
      if (err) {
        res.status(50).send({auth: false, msg: err})
        return
      }

      if (!user) {
        res.send({auth: false, mailError: true, msg: 'Email not found'})
        return
      }

      user.comparePassword(req.body.password, (err, isMatch) => {
        if (err) throw err

        if (isMatch) {
          let token = jwt.sign({id: user._id}, config.secret, { expiresIn: 86400 })
          res.status(200).send({ auth: true, token })
          return
        } else {
          res.send({auth: false, passError: true, msg: 'Password is incorrect'})
        }
      })
    })
    
  },
  register: (req, res) => {
    let newUser = new model({
      forename: req.body.forename,
      surname: req.body.surname,
      email: req.body.email,
      password: req.body.password
    })

    newUser.save()
      .then(result => {
        let token = jwt.sign({id: result._id}, config.secret, { expiresIn: 86400 })
        res.status(200).send({ auth: true, token })
      })
      .catch(err => {
        if (err.code == 11000) {
          res.send({ auth: false, msg: 'Email already exist...' })
          return
        }
        res.send({auth: false, msg: 'An Internal Server error occured.'})
      })
  },
  getProfile: (req, res) => {
    let user_id = jwt.decode(req.body.auth_token).id
    model.findById(user_id)
      .then(user => {
        if (!user) {
          res.send({success: false, msg: 'User not found'})
        }
        postModel.find({user_id: user_id})
          .then(posts => {
            res.send({
              success: true, 
              details: {
                display_name: user.forename + ' ' + user.surname,
                posts: posts
              }
            })
          })
      })
  }
}