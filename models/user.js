
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

var addressSchema = new mongoose.Schema({
    street: [{type: String}],
    city: String,
    countryId: String,
    locality: String,
    landmark: String,
    addressType: {type: String, default: "home"},
    postcode: String
}, {timestamps: true});

var userSchema = new mongoose.Schema({
    email: {type: String, default: ''},
    isEmailVerified: Boolean,

    password: String,
    passwordResetToken: String,
    passwordResetExpires: Date,

    mobileNumber: {type: String, unique: true},
    mobileVerificationOTP: String,
    mobileVerificationExpires: Date,
    isMobileVerified: Boolean,

    deviceTokens: [{fcm: String, platform: String}],

    name: {type: String, default: ''},
    gender: {type: String, default: ''},
    dob: {type: Date},
    picture: {type: String, default: ''},

    status: {type: String, default: "active"},

    address: [addressSchema],

}, {timestamps: true, toObject: {virtuals: true}, toJSON: {virtuals: true}});

/**
 * Password hash middleware.
 */
userSchema.pre('save', function (next) {
    var user = this;
    if (!user.isModified('password')) {
        return next();
    }
    bcrypt.genSalt(10, function (err, salt) {
        if (err) {
            return next(err);
        }
        bcrypt.hash(user.password, salt, null, function (err, hash) {
            if (err) {
                return next(err);
            }
            user.password = hash;
            next();
        });
    });
});

userSchema.plugin(mongoosePaginate);

var User = mongoose.model('User', userSchema);

const express = require('express')
const app = express()
const fileUpload = require('express-fileupload');

const mongoose = require('mongoose');

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




module.exports = User;