const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route    GET api/profile/me
// @desc     Get current users profile
// @access   Private
router.get('/me', auth, async (req,res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user',['name', 'avatar']);

        if(!profile) {
            return res.status(400).json({ msg: "There is no profile for this user" });
        }

        return res.json(profile);

    } catch(err) {
        console.error(err.message);
        res.status(500).send("Server Error")
    }
});

// @route    POST api/profile
// @desc     Create or update a user profile
// @access   Private
router.post('/', [
    auth,
    [
        check('status', 'Status is required').not().isEmpty(),
        check('skills', 'Skills is required').not().isEmpty(),
    ]
], async (req,res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const {
        company,
        location,
        website,
        bio,
        status,
        githubUserName,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin
    } = req.body;

    // Build Profile Object
    const profileFields = {};
    profileFields.user = req.user.id;
    if(company) profileFields.company = company;
    if(location) profileFields.location = location;
    if(website) profileFields.website = website;
    if(bio) profileFields.bio = bio;
    if(status) profileFields.status = status;
    if(githubUserName) profileFields.githubUserName = githubUserName;
    if(skills) {
        profileFields.skills = skills.split(",").map((skill) => skill.trim());
    }

    // Build Social Object Inside Profile Object
    profileFields.social = {};
    if(youtube) profileFields.social.youtube = youtube;
    if(twitter) profileFields.social.twitter = twitter;
    if(facebook) profileFields.social.facebook = facebook;
    if(instagram) profileFields.social.instagram = instagram;
    if(linkedin) profileFields.social.linkedin = linkedin;

    try {
        let profile =  await Profile.findOne({ user: req.user.id });

        if(profile) {
            // Update the profile if already there
            profile = await Profile.findOneAndUpdate(
                { user: req.user.id },
                { $set: profileFields },
                { new: true }
            );
            return res.json(profile);
        }

        // If no profile , create a profile
        profile = new Profile(profileFields);

        // Saving the data to DB 
        await profile.save();

        return res.json(profile);

    } catch (err) {
        console.log(err.message);
        res.ststus(500).send("Server Error");
    }

});

// @route    GET api/profile
// @desc     Get all profiles
// @access   Public
router.get('/', async (req,res) => {
    try{

        const profiles = await Profile.find().populate('user',['name','avatar']);
        
        return res.json(profiles);

    } catch(err) {
        console.error(err.message);
        return res.status(500).send("Server Error")
    }
})

// @route    GET api/profile/user/:user_id
// @desc     Get profile with id as user:_id
// @access   Public
router.get('/user/:user_id', async (req,res) => {
    try{

        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user',['name','avatar']);

        if(!profile) return res.json({ msg: "User Doesn't Exists" })
        
        return res.json(profile);

    } catch(err) {
        console.error(err.message);
        if(err.kind === "ObjectId") return res.status(400).json({ msg: "User Doesn't Exists" })
        return res.status(500).send("Server Error")
    }
})

module.exports = router;