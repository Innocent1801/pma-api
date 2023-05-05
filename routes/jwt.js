const jwt = require("jsonwebtoken")

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.token
    if (authHeader) {
      const token = authHeader.split(' ')[1]
      jwt.verify(token, process.env.JWT_SEC, (err, user) => {
        if (err) {
          return res.status(403).json('Token is not valid!')
        }
        req.user = user
        next()
      })
    } else {
      res.status(401).json('You are not authenticated!')
    }
  }

//   verify token and authorize
  const verifyTokenAndAuthorization = (req, res, next) => {
    verifyToken(req, res, () => {
      if (req.user) {
        next()
      } else {
        res.status(403).json('You are not allowed to perform this operation!')
      }
    })
  }

  // an admin
const verifyTokenAndAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.aai === "pma/20-22/admin") {
      next()
    } else {
      res.status(403).json('You are not allowed to perform this operation!')
    }
  })
}

module.exports = {jwt, verifyToken, verifyTokenAndAuthorization, verifyTokenAndAdmin};