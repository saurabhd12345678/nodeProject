
var jwt = require("jsonwebtoken");

module.exports = {
  verifyToken: (req, res, next) => {
    const bearerHeader = req.headers["authorization"];
   
    if (typeof bearerHeader !== "undefined") {
     
      req.token = bearerHeader;
   


      jwt.verify(req.token, process.env.SECRET_KEY, async (err, authData) => {
        if (err) {
       
          res.status(403).send({
            status: "Access Denied",
          });
        } else {
          next();
        }
      });
    } else {
        
      res.status(403).send({
        status: "Access Denied",
      });
    }
  },
  decodeToken:(req,res,next) => {
    if (req.token) {
     var claims = jwt.decode(req.token);
     req.req_user_email = claims.User;
     
    }
    next();
  }
};
