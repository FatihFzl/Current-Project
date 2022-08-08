const express = require('express')
const app = express()
const fileUpload = require('express-fileupload');
const routes = require("./routes/api")
const mongoose = require('mongoose');
const response = require("./utils/response")
app.use(express.json())

mongoose.connect(process.env.MONGODB_URL).catch(err => {
    console.error(err);
})

app.use(fileUpload({
    createParentPath: true
}));


app.set('port', process.env.PORT || 3000);

app.use(logger('dev'));

app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit: 5000}));
app.use(bodyParser.json({limit: '50mb'}));

//Graphql server

app.use('/graphql', jwt({
    secret: process.env.JWT_SECRET_KEY,
    requestProperty: 'auth',
    credentialsRequired: false,
}));

//graphql setting

app.use('/graphql', async (req, res, done) => {
    var userId = (req.auth && req.auth.id ) ? req.auth.id : undefined;
    const user = ( userId ) ? await User.findById(userId): undefined;
    req.context = {
        user: user,
    }
    done();
});
app.use('/graphql', UploadProfilePicture);
app.use('/graphql', expressGraphQL(req => ({
        schema: GraphQLSchema,
        context: req.context,
        graphiql: process.env.NODE_ENV === 'development',
    })
));

app.listen(app.get('port'), function () {
    console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});

module.exports = app;