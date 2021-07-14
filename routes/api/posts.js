const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const User = require('../../models/User');
const Profile = require('../../models/Profile');
const Post = require('../../models/Post');

// @route    POST api/posts
// @desc     Create a post
// @access   Private
router.post(
  '/',
  [auth, [check('text', 'Text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      const post = await newPost.save();
      return res.json(post);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send('Server Error');
    }
  }
);

// @route    GET api/posts
// @desc     Get all posts
// @access   Private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route    GET api/posts/:id
// @desc     Get post by id
// @access   Private
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });
    res.json(post);
  } catch (err) {
    if (err.kind === 'ObjectId')
      return res.status(404).json({ msg: 'Post not found' });
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route    DELETE api/posts/:id
// @desc     Delete a post post by id
// @access   Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if the post exists
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    // Check if user deleting post is the owner of the post
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    } else {
      await post.remove();
      res.json({ msg: 'Post removed' });
    }
  } catch (err) {
    if (err.kind === 'ObjectId')
      return res.status(404).json({ msg: 'Post not found' });
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route    PUT api/posts/like/:id
// @desc     Like a post
// @access   Private
router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    // Check if post already liked
    let alreadyLiked = false;
    post.likes.map((like) => {
      if (like.user.toString() === req.user.id) alreadyLiked = true;
      return;
    });

    if (alreadyLiked) {
      return res.status(403).json({ msg: 'Post already liked' });
    } else {
      post.likes.push({ user: req.user.id });
    }

    await post.save();
    res.json(post.likes);
  } catch (err) {
    if (err.kind === 'ObjectId')
      return res.status(404).json({ msg: 'Post Not Found' });
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route    PUT api/posts/unlike/:id
// @desc     Unlike a post
// @access   Private
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    // Check if post already liked
    let alreadyLiked = false;
    let removingLikeIndex = -1;
    post.likes.map((like, index) => {
      if (like.user.toString() === req.user.id) {
        alreadyLiked = true;
        removingLikeIndex = index;
      }
      return;
    });

    if (alreadyLiked) {
      post.likes.splice(removingLikeIndex, 1);
    } else {
      return res.status(403).json({ msg: 'Post not yet liked' });
    }

    await post.save();
    res.json(post.likes);
  } catch (err) {
    if (err.kind === 'ObjectId')
      return res.status(404).json({ msg: 'Post Not Found' });
    console.error(err.message);
    return res.status(500).send('Server Error');
  }
});

// @route    PUT api/posts/comment/:id
// @desc     Create a comment on a post
// @access   Private
router.put('/comment/:id', [
  auth,
  [
    check('text', 'Text is required').not().isEmpty()
  ]
], async(req,res) => {

  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {

    const post = await Post.findById(req.params.id);
    if(!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    const user = await User.findById(req.user.id).select('-password');

    const newComment = {
      user: req.user.id,
      text: req.body.text,
      name: user.name,
      avatar: user.avatar,
    };

    post.comments.unshift(newComment);

    await post.save();
    res.json(post.comments);

  } catch (err) {
    if(err.kind === "ObjectId") {
      res.status(404).json({ msg: "Post not found" });
    }
    console.error(err.message);
    res.status(50).json({ msg: "Server Error" })
  }
})

// @route    DELETE api/posts/comment/:id
// @desc     Delete a comment on a post
// @access   Private
router.delete('/comment/:id/:comment_id', auth, async(req,res) => {
  try {

    const post = await Post.findById(req.params.id);

    // Check if the post exists - else give the post not found error
    if(!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Check if comment exists
    let removingComment = {};
    let removingCommentIndex = -1;
    post.comments.map((comment,index) => {
      if(comment._id.toString() === req.params.comment_id) {
        removingCommentIndex = index;
        removingComment = comment;
      }
    });

    if(removingCommentIndex === -1) {
      return res.status(404).json({ msg: "Comment not found" });
    } else {
      // Check if the user is authorized to delete the comment he is trying to delete
      if(removingComment.user.toString() === req.user.id) {
        post.comments.splice(removingCommentIndex, 1);
      } else {
        res.status(401).json({ msg: "You are not authorized to delete other person's comments" })
      }
    }
    await post.save();
    res.json(post.comments);

  } catch (err) {
    if(err.kind === "ObjectId") {
      res.status(404).json({ msg: "Post not found" });
    }
    console.error(err.message);
    res.status(50).json({ msg: "Server Error" })
  }
})

module.exports = router;
