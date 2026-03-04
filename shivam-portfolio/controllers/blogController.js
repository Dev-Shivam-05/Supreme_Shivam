const Blog = require("../models/Blog");

const getBlogs = async (req, res) => {
  const blogs = await Blog.find({ published: true }).sort({ createdAt: -1 });
  res.render("blog/index", { blogs });
};

const getBlog = async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) {
    return res.status(404).send("Not Found");
  }
  return res.render("blog/show", { blog });
};

const createBlog = async (req, res) => {
  const payload = {
    ...req.body,
    image: req.file ? `/uploads/blogs/${req.file.filename}` : undefined
  };
  await Blog.create(payload);
  res.redirect("/admin/dashboard");
};

const updateBlog = async (req, res) => {
  const payload = {
    ...req.body
  };
  if (req.file) {
    payload.image = `/uploads/blogs/${req.file.filename}`;
  }
  await Blog.findByIdAndUpdate(req.params.id, payload);
  res.redirect("/admin/dashboard");
};

const deleteBlog = async (req, res) => {
  await Blog.findByIdAndDelete(req.params.id);
  res.redirect("/admin/dashboard");
};

module.exports = {
  getBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog
};
